/// Change-list journal with index-based snapshot/restore.
///
/// Implements Nethermind's change-list journaling pattern
/// (`PartialStorageProviderBase.cs` / `StateProvider.cs`): changes are appended
/// to a flat list, snapshots record a position, and restore truncates back.
///
/// This is a generic building block — concrete journals for accounts, storage,
/// and transient storage will be built on top of this.  The key/value type
/// parameters are comptime-generic so callers can instantiate with Voltaire
/// primitives (e.g. `Address`, `u256`, `AccountState`) or any other type.
///
/// ## Design
///
/// - **Change list** — An `ArrayListUnmanaged` of `Entry` structs, append-only
///   during normal operation.  Entries are never modified in place.
/// - **Snapshot** — An index into the change list (`usize`).
///   `take_snapshot()` returns the current tail position.
/// - **Restore** — Truncates the list back to a snapshot position, preserving
///   `just_cache` entries (Nethermind `_keptInCache` pattern).  Returns an error
///   if the snapshot is invalid (ahead of current position).
/// - **Commit** — Logically finalises changes up to the current position.
///   Invokes an optional callback for each committed entry so the caller can
///   flush side-effects (e.g. persist to trie).
///
/// ## Relationship to Nethermind
///
/// Nethermind's `PartialStorageProviderBase` uses `List<Change>` with
/// `CollectionsMarshal.SetCount()` for O(1) truncation.  This Zig
/// implementation mirrors that with `ArrayListUnmanaged` +
/// `shrinkRetainingCapacity`.
///
/// Nethermind's `_keptInCache` list is replicated here: during `restore()`,
/// entries tagged `just_cache` are collected, the list is truncated, and then
/// the kept entries are re-appended so caches stay warm.
///
/// Nethermind's `_intraBlockCache` (a `Dict<Key, StackList<int>>`) that maps
/// each key to a stack of change indices is *not* part of this generic journal;
/// it belongs to the concrete journal types that layer on top.
const std = @import("std");

/// A single entry in the change journal.
///
/// Mirrors Nethermind's `Change` readonly struct.
///
/// - `key`   — The entity that was changed (address, storage cell, …).
/// - `value` — The new state *after* the change (nullable for deletions).
/// - `tag`   — Classifies the change for commit/restore filtering.
pub fn Entry(comptime K: type, comptime V: type) type {
    return struct {
        key: K,
        value: ?V,
        tag: ChangeTag,
    };
}

/// Classification of a change entry.
///
/// Matches Nethermind's `ChangeType` enum, unified across account and storage
/// journals:
///
/// | Variant        | Nethermind equivalent     | Semantics                        |
/// |----------------|---------------------------|----------------------------------|
/// | `just_cache`   | `JustCache`               | Read-only; survives restore      |
/// | `update`       | `Update`                  | Value mutation                   |
/// | `create`       | `New`                     | New entity created               |
/// | `delete`       | `Delete`                  | Entity destroyed                 |
/// | `touch`        | `Touch`                   | EIP-158 empty-account touch      |
pub const ChangeTag = enum(u8) {
    /// Read-only cache population — not a mutation.
    /// Preserved across `restore()` so the cache stays warm.
    just_cache = 0,
    /// An existing value was modified.
    update = 1,
    /// A brand-new entity was created.
    create = 2,
    /// An entity was destroyed / deleted.
    delete = 3,
    /// An empty account was "touched" (EIP-158).
    touch = 4,
};

/// Errors that can occur during journal operations.
pub const JournalError = error{
    /// Returned by `restore()` when the snapshot position is ahead of (greater
    /// than) the current journal length.  Mirrors Nethermind's
    /// `InvalidOperationException("Cannot restore snapshot …")`.
    InvalidSnapshot,
    /// Allocation failure.
    OutOfMemory,
};

/// Shared sentinel value representing an empty journal snapshot.
/// Matches Nethermind's `Resettable.EmptyPosition` (= -1 as int).
pub const empty_snapshot_sentinel: usize = std.math.maxInt(usize);

/// Generic change-list journal.
///
/// `K` is the key type (e.g. `Address` for accounts, `StorageCell` for slots).
/// `V` is the value type (e.g. `AccountState`, `u256`).
///
/// The journal itself is purely a change log.  Higher-level types add
/// per-key caches on top.
pub fn Journal(comptime K: type, comptime V: type) type {
    const E = Entry(K, V);

    return struct {
        const Self = @This();

        /// Ordered list of change entries.
        entries: std.ArrayListUnmanaged(E) = .empty,

        /// Backing allocator for the entry list.
        allocator: std.mem.Allocator,

        // -----------------------------------------------------------------
        // Lifecycle
        // -----------------------------------------------------------------

        /// Create a new, empty journal.
        pub fn init(allocator: std.mem.Allocator) Self {
            return .{ .allocator = allocator };
        }

        /// Release all memory owned by the journal.
        pub fn deinit(self: *Self) void {
            self.entries.deinit(self.allocator);
        }

        // -----------------------------------------------------------------
        // Append
        // -----------------------------------------------------------------

        /// Append a change entry.  Returns the index of the new entry.
        ///
        /// Errors:
        /// - `JournalError.OutOfMemory` when allocation fails.
        pub fn append(self: *Self, entry: E) JournalError!usize {
            const idx = self.entries.items.len;
            try self.entries.append(self.allocator, entry);
            return idx;
        }

        // -----------------------------------------------------------------
        // Snapshot / Restore
        // -----------------------------------------------------------------

        /// Sentinel value representing "no entries" (empty journal).
        /// Mirrors Nethermind's `Resettable.EmptyPosition` (= -1 as int).
        pub const empty_snapshot: usize = empty_snapshot_sentinel;

        /// Convert a snapshot value to the corresponding entry count
        /// (target length after restore/commit).
        fn snapshot_to_len(snapshot: usize) usize {
            return if (snapshot == empty_snapshot) 0 else snapshot + 1;
        }

        /// Capture the current journal position.
        ///
        /// Returns `empty_snapshot` if the journal is empty, otherwise the
        /// index of the last entry.
        pub fn take_snapshot(self: *const Self) usize {
            if (self.entries.items.len == 0) return empty_snapshot;
            return self.entries.items.len - 1;
        }

        /// Restore the journal to a previous snapshot.
        ///
        /// All entries *after* `snapshot` are removed, **except** entries
        /// tagged `just_cache` which are re-appended to keep caches warm
        /// (mirrors Nethermind's `_keptInCache` pattern).
        ///
        /// For each removed non-`just_cache` entry, `on_revert` is called
        /// (if non-null) so the caller can undo side-effects.
        ///
        /// If `snapshot` is `empty_snapshot`, the journal is cleared
        /// entirely (just_cache entries from the cleared range are still
        /// re-appended).
        ///
        /// Returns `JournalError.InvalidSnapshot` if `snapshot` is ahead
        /// of the current position (mirrors Nethermind's
        /// `InvalidOperationException`).
        pub fn restore(
            self: *Self,
            snapshot: usize,
            on_revert: ?*const fn (entry: *const E) void,
        ) JournalError!void {
            const current_len = self.entries.items.len;
            const target_len = snapshot_to_len(snapshot);

            // Nethermind: if snapshot > currentPosition → throw.
            if (snapshot != empty_snapshot and target_len > current_len) {
                return JournalError.InvalidSnapshot;
            }

            // No-op if already at target.
            if (target_len == current_len) return;

            // Collect just_cache entries that should survive the restore.
            // We walk backwards and collect them in reverse order, then
            // re-append in original order after truncation.
            var kept_count: usize = 0;

            // First pass: count kept entries so we can avoid extra allocs
            // when there are none (common case).
            {
                var i = current_len;
                while (i > target_len) {
                    i -= 1;
                    if (self.entries.items[i].tag == .just_cache) {
                        kept_count += 1;
                    }
                }
            }

            if (kept_count == 0) {
                // Fast path: no just_cache entries to preserve.
                if (on_revert) |cb| {
                    var i = current_len;
                    while (i > target_len) {
                        i -= 1;
                        cb(&self.entries.items[i]);
                    }
                }
                self.entries.shrinkRetainingCapacity(target_len);
            } else {
                // Slow path: collect just_cache entries, truncate, re-append.
                // We allocate a scratch buffer for the kept entries and
                // re-append them after truncation.

                // Allocate scratch for kept entries.
                const kept = self.allocator.alloc(E, kept_count) catch
                    return JournalError.OutOfMemory;
                defer self.allocator.free(kept);

                var ki: usize = 0;
                var i = current_len;
                while (i > target_len) {
                    i -= 1;
                    const entry = &self.entries.items[i];
                    if (entry.tag == .just_cache) {
                        // Preserve — do NOT call on_revert.
                        kept[ki] = entry.*;
                        ki += 1;
                    } else {
                        if (on_revert) |cb| {
                            cb(entry);
                        }
                    }
                }

                // Truncate.
                self.entries.shrinkRetainingCapacity(target_len);

                // Re-append kept entries in their original order
                // (they were collected in reverse).
                var j: usize = kept_count;
                while (j > 0) {
                    j -= 1;
                    self.entries.append(self.allocator, kept[j]) catch
                        return JournalError.OutOfMemory;
                }
            }
        }

        // -----------------------------------------------------------------
        // Commit
        // -----------------------------------------------------------------

        /// Commit all entries from `snapshot` to the current position.
        ///
        /// For each committed entry, `on_commit` is called (if non-null)
        /// so the caller can flush side-effects (e.g. write to trie).
        ///
        /// After the callback sweep, the committed entries are removed
        /// (the journal is truncated to `snapshot`).
        ///
        /// If `snapshot` is `empty_snapshot`, all entries are committed.
        ///
        /// Returns `JournalError.InvalidSnapshot` if `snapshot` is ahead
        /// of the current position (mirrors `restore()` behavior).
        pub fn commit(
            self: *Self,
            snapshot: usize,
            on_commit: ?*const fn (entry: *const E) void,
        ) JournalError!void {
            const target_len = snapshot_to_len(snapshot);
            if (snapshot != empty_snapshot and target_len > self.entries.items.len) {
                return JournalError.InvalidSnapshot;
            }
            if (target_len >= self.entries.items.len) return;

            // Walk forward through committed entries.
            if (on_commit) |cb| {
                var i: usize = target_len;
                while (i < self.entries.items.len) : (i += 1) {
                    cb(&self.entries.items[i]);
                }
            }

            // Truncate committed entries.
            self.entries.shrinkRetainingCapacity(target_len);
        }

        /// Discard all entries.
        ///
        /// Note: unlike `restore(empty_snapshot)`, this does NOT preserve
        /// `just_cache` entries.
        pub fn clear(self: *Self) void {
            self.entries.shrinkRetainingCapacity(0);
        }

        // -----------------------------------------------------------------
        // Read-only accessors
        // -----------------------------------------------------------------

        /// Number of entries currently in the journal.
        fn len(self: *const Self) usize {
            return self.entries.items.len;
        }

        /// Get a reference to an entry by index.
        fn get(self: *const Self, index: usize) *const E {
            return &self.entries.items[index];
        }

        /// Get a mutable reference to an entry by index.
        fn get_mut(self: *Self, index: usize) *E {
            return &self.entries.items[index];
        }

        /// Return a slice of all entries.
        fn items(self: *const Self) []const E {
            return self.entries.items;
        }
    };
}

// =========================================================================
// Tests
// =========================================================================

test "Journal: init and deinit (empty)" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    try std.testing.expectEqual(@as(usize, 0), j.len());
}

test "Journal: append increases length" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    const idx = try j.append(.{ .key = 1, .value = 100, .tag = .update });
    try std.testing.expectEqual(@as(usize, 0), idx);
    try std.testing.expectEqual(@as(usize, 1), j.len());
}

test "Journal: append returns sequential indices" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    const a = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    const b = try j.append(.{ .key = 2, .value = 20, .tag = .update });
    const c = try j.append(.{ .key = 3, .value = 30, .tag = .delete });

    try std.testing.expectEqual(@as(usize, 0), a);
    try std.testing.expectEqual(@as(usize, 1), b);
    try std.testing.expectEqual(@as(usize, 2), c);
    try std.testing.expectEqual(@as(usize, 3), j.len());
}

test "Journal: get returns correct entry" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 42, .value = 999, .tag = .update });

    const entry = j.get(0);
    try std.testing.expectEqual(@as(u32, 42), entry.key);
    try std.testing.expectEqual(@as(?u64, 999), entry.value);
    try std.testing.expectEqual(ChangeTag.update, entry.tag);
}

test "Journal: take_snapshot on empty returns sentinel" {
    const j = Journal(u32, u64).init(std.testing.allocator);
    // no deinit needed — nothing allocated

    try std.testing.expectEqual(Journal(u32, u64).empty_snapshot, j.take_snapshot());
}

test "Journal: take_snapshot returns last index" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });

    try std.testing.expectEqual(@as(usize, 1), j.take_snapshot());
}

test "Journal: restore truncates entries" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    const snap = j.take_snapshot(); // position 0
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });
    _ = try j.append(.{ .key = 3, .value = 30, .tag = .update });

    try std.testing.expectEqual(@as(usize, 3), j.len());

    try j.restore(snap, null);

    try std.testing.expectEqual(@as(usize, 1), j.len());
    // Entry 0 is preserved.
    try std.testing.expectEqual(@as(u32, 1), j.get(0).key);
}

test "Journal: restore to empty_snapshot clears all" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });

    try j.restore(Journal(u32, u64).empty_snapshot, null);

    try std.testing.expectEqual(@as(usize, 0), j.len());
}

test "Journal: restore invokes callback for each reverted entry" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    const snap = j.take_snapshot();
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });
    _ = try j.append(.{ .key = 3, .value = 30, .tag = .delete });

    // Use a static variable to count callbacks (Zig test workaround).
    const Counter = struct {
        var count: usize = 0;
        fn cb(_: *const Entry(u32, u64)) void {
            count += 1;
        }
    };
    Counter.count = 0;

    try j.restore(snap, &Counter.cb);

    // Two entries reverted (indices 2 and 1).
    try std.testing.expectEqual(@as(usize, 2), Counter.count);
}

test "Journal: restore is no-op when snapshot is at current position" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    const snap = j.take_snapshot();

    try j.restore(snap, null); // should be a no-op

    try std.testing.expectEqual(@as(usize, 1), j.len());
}

test "Journal: restore beyond current position returns InvalidSnapshot" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });

    // Snapshot index 5 is way past the single entry — must error.
    const result = j.restore(5, null);
    try std.testing.expectError(JournalError.InvalidSnapshot, result);

    // Journal is unchanged.
    try std.testing.expectEqual(@as(usize, 1), j.len());
}

test "Journal: clear removes all entries" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });

    j.clear();

    try std.testing.expectEqual(@as(usize, 0), j.len());
    try std.testing.expectEqual(Journal(u32, u64).empty_snapshot, j.take_snapshot());
}

test "Journal: items returns full slice" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });

    const slice = j.items();
    try std.testing.expectEqual(@as(usize, 2), slice.len);
    try std.testing.expectEqual(@as(u32, 1), slice[0].key);
    try std.testing.expectEqual(@as(u32, 2), slice[1].key);
}

test "Journal: value can be null (deletion)" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 99, .value = null, .tag = .delete });

    try std.testing.expectEqual(@as(?u64, null), j.get(0).value);
    try std.testing.expectEqual(ChangeTag.delete, j.get(0).tag);
}

test "Journal: get_mut allows modification" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .update });

    j.get_mut(0).value = 42;

    try std.testing.expectEqual(@as(?u64, 42), j.get(0).value);
}

test "Journal: multiple snapshot/restore cycles" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    // Build up some state.
    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    const snap1 = j.take_snapshot(); // 0

    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });
    const snap2 = j.take_snapshot(); // 1

    _ = try j.append(.{ .key = 3, .value = 30, .tag = .update });
    try std.testing.expectEqual(@as(usize, 3), j.len());

    // Restore to snap2 — removes entry 2.
    try j.restore(snap2, null);
    try std.testing.expectEqual(@as(usize, 2), j.len());

    // Add new entry after restore.
    _ = try j.append(.{ .key = 4, .value = 40, .tag = .update });
    try std.testing.expectEqual(@as(usize, 3), j.len());

    // Restore to snap1 — removes entries 1 and 2.
    try j.restore(snap1, null);
    try std.testing.expectEqual(@as(usize, 1), j.len());
    try std.testing.expectEqual(@as(u32, 1), j.get(0).key);
}

test "ChangeTag: all variants accessible" {
    // Compile-time check that all tags are usable.
    const tags = [_]ChangeTag{
        .just_cache,
        .update,
        .create,
        .delete,
        .touch,
    };
    try std.testing.expectEqual(@as(usize, 5), tags.len);
}

// =========================================================================
// just_cache preservation across restore
// =========================================================================

test "Journal: just_cache entries survive restore" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    const snap = j.take_snapshot(); // position 0

    // Add a just_cache entry and some mutations after the snapshot.
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .just_cache });
    _ = try j.append(.{ .key = 3, .value = 30, .tag = .update });
    _ = try j.append(.{ .key = 4, .value = 40, .tag = .just_cache });

    try std.testing.expectEqual(@as(usize, 4), j.len());

    // Restore — just_cache entries should be re-appended.
    try j.restore(snap, null);

    // snap kept entry 0 (create), plus 2 re-appended just_cache entries.
    try std.testing.expectEqual(@as(usize, 3), j.len());

    // Original entry preserved.
    try std.testing.expectEqual(@as(u32, 1), j.get(0).key);
    try std.testing.expectEqual(ChangeTag.create, j.get(0).tag);

    // Re-appended just_cache entries (in original order).
    try std.testing.expectEqual(@as(u32, 2), j.get(1).key);
    try std.testing.expectEqual(ChangeTag.just_cache, j.get(1).tag);

    try std.testing.expectEqual(@as(u32, 4), j.get(2).key);
    try std.testing.expectEqual(ChangeTag.just_cache, j.get(2).tag);
}

test "Journal: just_cache entries do not trigger on_revert callback" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    const snap = j.take_snapshot();

    _ = try j.append(.{ .key = 2, .value = 20, .tag = .just_cache });
    _ = try j.append(.{ .key = 3, .value = 30, .tag = .update });

    const Counter = struct {
        var count: usize = 0;
        fn cb(_: *const Entry(u32, u64)) void {
            count += 1;
        }
    };
    Counter.count = 0;

    try j.restore(snap, &Counter.cb);

    // Only the update entry triggers the callback, not the just_cache.
    try std.testing.expectEqual(@as(usize, 1), Counter.count);
}

test "Journal: just_cache preserved on restore to empty_snapshot" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .just_cache });
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });
    _ = try j.append(.{ .key = 3, .value = 30, .tag = .just_cache });

    try j.restore(Journal(u32, u64).empty_snapshot, null);

    // Only just_cache entries survive.
    try std.testing.expectEqual(@as(usize, 2), j.len());
    try std.testing.expectEqual(@as(u32, 1), j.get(0).key);
    try std.testing.expectEqual(@as(u32, 3), j.get(1).key);
}

// =========================================================================
// Invalid snapshot handling
// =========================================================================

test "Journal: restore with snapshot far beyond length returns error" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    // Empty journal, any non-sentinel snapshot is invalid.
    try std.testing.expectError(
        JournalError.InvalidSnapshot,
        j.restore(0, null),
    );
    try std.testing.expectEqual(@as(usize, 0), j.len());
}

test "Journal: restore with snapshot just past end returns error" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });

    // Current last index is 1, so snapshot 2 is just past the end.
    try std.testing.expectError(
        JournalError.InvalidSnapshot,
        j.restore(2, null),
    );
    // Journal untouched.
    try std.testing.expectEqual(@as(usize, 2), j.len());
}

test "Journal: commit with snapshot beyond current position returns error" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });

    const result = j.commit(5, null);
    try std.testing.expectError(JournalError.InvalidSnapshot, result);
    try std.testing.expectEqual(@as(usize, 1), j.len());
}

// =========================================================================
// Commit API
// =========================================================================

test "Journal: commit removes entries and calls callback" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    const snap = j.take_snapshot(); // 0
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });
    _ = try j.append(.{ .key = 3, .value = 30, .tag = .update });

    const Counter = struct {
        var count: usize = 0;
        fn cb(_: *const Entry(u32, u64)) void {
            count += 1;
        }
    };
    Counter.count = 0;

    try j.commit(snap, &Counter.cb);

    // Two entries committed (indices 1 and 2).
    try std.testing.expectEqual(@as(usize, 2), Counter.count);
    // Only entry 0 remains.
    try std.testing.expectEqual(@as(usize, 1), j.len());
    try std.testing.expectEqual(@as(u32, 1), j.get(0).key);
}

test "Journal: commit with empty_snapshot commits all" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    _ = try j.append(.{ .key = 2, .value = 20, .tag = .update });

    try j.commit(Journal(u32, u64).empty_snapshot, null);

    try std.testing.expectEqual(@as(usize, 0), j.len());
}

test "Journal: commit with no entries past snapshot is no-op" {
    var j = Journal(u32, u64).init(std.testing.allocator);
    defer j.deinit();

    _ = try j.append(.{ .key = 1, .value = 10, .tag = .create });
    const snap = j.take_snapshot(); // 0

    try j.commit(snap, null);

    // Nothing to commit — snap points at last entry.
    try std.testing.expectEqual(@as(usize, 1), j.len());
}
