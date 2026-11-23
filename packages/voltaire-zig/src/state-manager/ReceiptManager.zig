//! ReceiptManager - In-memory receipt store for the dev node (Tevm / ZEVM)
//!
//! Receipts are stored per block hash and indexed by transaction hash. Logs
//! are derived from stored receipts, so `deleteReceipts` drops a block's
//! receipts, logs and tx index entries together (reorg-safe).
//!
//! ## Ownership
//! - `saveReceipts` deep-copies its input into a per-block arena.
//! - Slices returned by `getReceipts`, `getReceiptByTxHash` and the
//!   `topics`/`data` of logs from `getLogs` borrow manager memory. They are
//!   valid until that block is deleted or replaced, `clear`, or `deinit`.
//! - The slice returned by `getLogs` is owned by the caller's allocator.
//!
//! ## Usage
//! ```zig
//! var manager = ReceiptManager.init(allocator);
//! defer manager.deinit();
//!
//! try manager.saveReceipts(block_hash, &receipts);
//! const found = manager.getReceiptByTxHash(tx_hash);
//! const logs = try manager.getLogs(allocator, .{ .addresses = &.{addr} });
//! defer allocator.free(logs);
//! ```

const std = @import("std");

/// Event log. `block_hash`, `tx_hash`, `tx_index` and `log_index` are
/// ignored on save and filled by `getLogs`.
pub const StoredLog = struct {
    address: [20]u8,
    topics: []const [32]u8 = &.{},
    data: []const u8 = &.{},
    block_hash: [32]u8 = [_]u8{0} ** 32,
    tx_hash: [32]u8 = [_]u8{0} ** 32,
    tx_index: u32 = 0,
    log_index: u32 = 0,
};

/// Transaction receipt as stored by the dev node.
pub const StoredReceipt = struct {
    tx_hash: [32]u8,
    block_number: u64 = 0,
    from: [20]u8 = [_]u8{0} ** 20,
    to: ?[20]u8 = null,
    contract_address: ?[20]u8 = null,
    /// true = success (post-Byzantium status 1)
    status: bool = true,
    cumulative_gas_used: u64 = 0,
    gas_used: u64 = 0,
    effective_gas_price: u256 = 0,
    tx_type: u8 = 0,
    logs_bloom: [256]u8 = [_]u8{0} ** 256,
    logs: []const StoredLog = &.{},
};

/// Result of a transaction hash lookup.
pub const ReceiptLookup = struct {
    receipt: StoredReceipt,
    block_hash: [32]u8,
    tx_index: u32,
};

/// eth_getLogs-style filter.
pub const LogFilter = struct {
    /// Only these blocks (null = all stored blocks, in insertion order).
    block_hashes: ?[]const [32]u8 = null,
    /// Address OR-list (null or empty = any address).
    addresses: ?[]const [20]u8 = null,
    /// Positional topics: null = wildcard, slice = OR-list (empty = wildcard).
    topics: []const ?[]const [32]u8 = &.{},
};

const Block = struct {
    arena: std.heap.ArenaAllocator,
    receipts: []const StoredReceipt,
    /// Neighbours in save order. The list is linked by block hash, not by
    /// pointer, so map growth never invalidates it and unlinking is O(1).
    prev: ?[32]u8 = null,
    next: ?[32]u8 = null,
};

const TxLocation = struct {
    block_hash: [32]u8,
    tx_index: u32,
};

/// Every stored location of one tx hash, in save order. The last entry is the
/// current one; earlier entries are shadowed and resurface when the blocks
/// stored after them are deleted (reorg A -> B -> delete B restores A).
const TxLocations = std.ArrayListUnmanaged(TxLocation);

pub const ReceiptManager = struct {
    allocator: std.mem.Allocator,
    /// Blocks by hash. Save order (for `getLogs`) lives in the prev/next
    /// links from `head` to `tail`, so deleting a block is O(1) rather than
    /// shifting every later entry.
    blocks: std.AutoHashMapUnmanaged([32]u8, Block) = .empty,
    /// Oldest stored block in save order.
    head: ?[32]u8 = null,
    /// Newest stored block in save order.
    tail: ?[32]u8 = null,
    /// Invariant: no list is empty once a public call returns.
    tx_index: std.AutoHashMapUnmanaged([32]u8, TxLocations) = .empty,

    pub fn init(allocator: std.mem.Allocator) ReceiptManager {
        return .{ .allocator = allocator };
    }

    pub fn deinit(self: *ReceiptManager) void {
        var blocks = self.blocks.valueIterator();
        while (blocks.next()) |block| block.arena.deinit();
        self.blocks.deinit(self.allocator);
        var it = self.tx_index.valueIterator();
        while (it.next()) |list| list.deinit(self.allocator);
        self.tx_index.deinit(self.allocator);
        self.* = undefined;
    }

    /// Store receipts for a block, replacing any already stored for it.
    /// On error the manager is unchanged.
    pub fn saveReceipts(self: *ReceiptManager, block_hash: [32]u8, receipts: []const StoredReceipt) !void {
        if (receipts.len > std.math.maxInt(u32)) return error.TooManyReceipts;

        var arena = std.heap.ArenaAllocator.init(self.allocator);
        errdefer arena.deinit();
        const a = arena.allocator();

        const copy = try a.alloc(StoredReceipt, receipts.len);
        for (receipts, copy) |src, *dst| {
            dst.* = src;
            const logs = try a.alloc(StoredLog, src.logs.len);
            for (src.logs, logs) |log, *out| {
                out.* = .{
                    .address = log.address,
                    .topics = try a.dupe([32]u8, log.topics),
                    .data = try a.dupe(u8, log.data),
                };
            }
            dst.logs = logs;
        }

        // Count occurrences per tx hash so each location list can be reserved
        // up front; everything after the reservation below cannot fail.
        var pending: std.AutoHashMapUnmanaged([32]u8, u32) = .empty;
        defer pending.deinit(self.allocator);
        try pending.ensureTotalCapacity(self.allocator, @intCast(receipts.len));
        for (copy) |receipt| {
            const gop = pending.getOrPutAssumeCapacity(receipt.tx_hash);
            gop.value_ptr.* = if (gop.found_existing) gop.value_ptr.* + 1 else 1;
        }

        try self.blocks.ensureUnusedCapacity(self.allocator, 1);
        try self.tx_index.ensureUnusedCapacity(self.allocator, pending.count());
        // Lists created here stay empty until the commit; on error drop them.
        errdefer self.dropEmptyLists(copy);
        var pending_it = pending.iterator();
        while (pending_it.next()) |entry| {
            const gop = self.tx_index.getOrPutAssumeCapacity(entry.key_ptr.*);
            if (!gop.found_existing) gop.value_ptr.* = .empty;
            try gop.value_ptr.ensureUnusedCapacity(self.allocator, entry.value_ptr.*);
        }

        // Commit. Removing the old entries for this block frees no list, so the
        // reserved capacity above stays valid. A replaced block moves to the
        // end of save order, as a fresh save would.
        const gop = self.blocks.getOrPutAssumeCapacity(block_hash);
        var old: ?Block = null;
        if (gop.found_existing) {
            self.unlink(gop.value_ptr);
            old = gop.value_ptr.*;
            self.removeLocations(block_hash, old.?.receipts);
        }
        gop.value_ptr.* = .{ .arena = arena, .receipts = copy };
        self.linkTail(block_hash, gop.value_ptr);
        for (copy, 0..) |receipt, i| {
            self.tx_index.getPtr(receipt.tx_hash).?.appendAssumeCapacity(.{
                .block_hash = block_hash,
                .tx_index = @intCast(i),
            });
        }
        if (old) |*o| {
            self.dropEmptyLists(o.receipts);
            o.arena.deinit();
        }
    }

    /// Detach `block` from the save-order list. O(1).
    fn unlink(self: *ReceiptManager, block: *Block) void {
        if (block.prev) |p| self.blocks.getPtr(p).?.next = block.next else self.head = block.next;
        if (block.next) |n| self.blocks.getPtr(n).?.prev = block.prev else self.tail = block.prev;
        block.prev = null;
        block.next = null;
    }

    /// Append `block` (stored under `hash`) to the end of save order. O(1).
    fn linkTail(self: *ReceiptManager, hash: [32]u8, block: *Block) void {
        block.prev = self.tail;
        block.next = null;
        if (self.tail) |t| self.blocks.getPtr(t).?.next = hash else self.head = hash;
        self.tail = hash;
    }

    /// Remove every location in `block_hash` for the tx hashes in `receipts`.
    /// Cost is O(receipts * blocks holding each tx), not O(all stored receipts).
    fn removeLocations(self: *ReceiptManager, block_hash: [32]u8, receipts: []const StoredReceipt) void {
        for (receipts) |receipt| {
            const list = self.tx_index.getPtr(receipt.tx_hash) orelse continue;
            var kept: usize = 0;
            for (list.items) |loc| {
                if (std.mem.eql(u8, &loc.block_hash, &block_hash)) continue;
                list.items[kept] = loc;
                kept += 1;
            }
            list.shrinkRetainingCapacity(kept);
        }
    }

    /// Free and unindex the location lists of `receipts` that are now empty.
    fn dropEmptyLists(self: *ReceiptManager, receipts: []const StoredReceipt) void {
        for (receipts) |receipt| {
            const list = self.tx_index.getPtr(receipt.tx_hash) orelse continue;
            if (list.items.len != 0) continue;
            list.deinit(self.allocator);
            _ = self.tx_index.remove(receipt.tx_hash);
        }
    }

    /// Receipts for a block, or null if unknown.
    pub fn getReceipts(self: *const ReceiptManager, block_hash: [32]u8) ?[]const StoredReceipt {
        const block = self.blocks.getPtr(block_hash) orelse return null;
        return block.receipts;
    }

    /// Receipt plus its block hash and index for a transaction hash.
    pub fn getReceiptByTxHash(self: *const ReceiptManager, tx_hash: [32]u8) ?ReceiptLookup {
        const list = self.tx_index.getPtr(tx_hash) orelse return null;
        const loc = list.getLastOrNull() orelse return null;
        const receipts = self.getReceipts(loc.block_hash) orelse return null;
        if (loc.tx_index >= receipts.len) return null;
        return .{
            .receipt = receipts[loc.tx_index],
            .block_hash = loc.block_hash,
            .tx_index = loc.tx_index,
        };
    }

    /// Logs matching `filter`, block order then log order. Caller frees the slice.
    pub fn getLogs(self: *const ReceiptManager, allocator: std.mem.Allocator, filter: LogFilter) ![]StoredLog {
        var out = std.ArrayList(StoredLog){};
        errdefer out.deinit(allocator);

        if (filter.block_hashes) |hashes| {
            for (hashes, 0..) |hash, i| {
                // Skip duplicates so each block is searched once.
                const seen = for (hashes[0..i]) |prev| {
                    if (std.mem.eql(u8, &prev, &hash)) break true;
                } else false;
                if (seen) continue;
                if (self.blocks.getPtr(hash)) |block| {
                    try collect(allocator, &out, hash, block.receipts, filter);
                }
            }
        } else {
            var cursor = self.head;
            while (cursor) |hash| {
                const block = self.blocks.getPtr(hash).?;
                try collect(allocator, &out, hash, block.receipts, filter);
                cursor = block.next;
            }
        }
        return out.toOwnedSlice(allocator);
    }

    /// Remove a block's receipts, logs and tx index entries. True if it existed.
    /// A tx also stored in another block falls back to the most recently
    /// stored surviving location. O(receipts in the block) in the common case;
    /// unlinking the block itself is O(1) regardless of how many are stored.
    pub fn deleteReceipts(self: *ReceiptManager, block_hash: [32]u8) bool {
        const entry = self.blocks.getPtr(block_hash) orelse return false;
        self.unlink(entry);
        var block = entry.*;
        _ = self.blocks.remove(block_hash);
        self.removeLocations(block_hash, block.receipts);
        self.dropEmptyLists(block.receipts);
        block.arena.deinit();
        return true;
    }

    pub fn hasReceipts(self: *const ReceiptManager, block_hash: [32]u8) bool {
        return self.blocks.contains(block_hash);
    }

    /// Remove everything, keeping map capacity.
    pub fn clear(self: *ReceiptManager) void {
        var blocks = self.blocks.valueIterator();
        while (blocks.next()) |block| block.arena.deinit();
        self.blocks.clearRetainingCapacity();
        self.head = null;
        self.tail = null;
        var it = self.tx_index.valueIterator();
        while (it.next()) |list| list.deinit(self.allocator);
        self.tx_index.clearRetainingCapacity();
    }

    fn collect(
        allocator: std.mem.Allocator,
        out: *std.ArrayList(StoredLog),
        block_hash: [32]u8,
        receipts: []const StoredReceipt,
        filter: LogFilter,
    ) !void {
        var log_index: u32 = 0;
        for (receipts, 0..) |receipt, tx_i| {
            for (receipt.logs) |log| {
                defer log_index += 1;
                if (!matches(log, filter)) continue;
                var found = log;
                found.block_hash = block_hash;
                found.tx_hash = receipt.tx_hash;
                found.tx_index = @intCast(tx_i);
                found.log_index = log_index;
                try out.append(allocator, found);
            }
        }
    }

    fn matches(log: StoredLog, filter: LogFilter) bool {
        if (filter.addresses) |addresses| {
            if (addresses.len > 0) {
                const hit = for (addresses) |addr| {
                    if (std.mem.eql(u8, &addr, &log.address)) break true;
                } else false;
                if (!hit) return false;
            }
        }
        if (filter.topics.len > log.topics.len) return false;
        for (filter.topics, 0..) |position, i| {
            const allowed = position orelse continue;
            if (allowed.len == 0) continue;
            const hit = for (allowed) |t| {
                if (std.mem.eql(u8, &t, &log.topics[i])) break true;
            } else false;
            if (!hit) return false;
        }
        return true;
    }
};

// ---------------------------------------------------------------- tests

const testing = std.testing;

fn h(n: u8) [32]u8 {
    return [_]u8{n} ** 32;
}

fn ad(n: u8) [20]u8 {
    return [_]u8{n} ** 20;
}

const t0 = h(0x40);
const t1 = h(0x41);
const t2 = h(0x42);

// block 1: tx0 -> [A(t0,t1)], tx1 -> [B(t0), A(t2)]
// block 2: tx2 -> [B(t1,t1)]
fn seed(m: *ReceiptManager) !void {
    const logs0 = [_]StoredLog{.{ .address = ad(0xa), .topics = &.{ t0, t1 }, .data = "x" }};
    const logs1 = [_]StoredLog{
        .{ .address = ad(0xb), .topics = &.{t0} },
        .{ .address = ad(0xa), .topics = &.{t2} },
    };
    const logs2 = [_]StoredLog{.{ .address = ad(0xb), .topics = &.{ t1, t1 } }};
    try m.saveReceipts(h(1), &.{
        .{ .tx_hash = h(0x80), .logs = &logs0 },
        .{ .tx_hash = h(0x81), .logs = &logs1 },
    });
    try m.saveReceipts(h(2), &.{.{ .tx_hash = h(0x82), .block_number = 2, .logs = &logs2 }});
}

fn countLogs(m: *const ReceiptManager, filter: LogFilter) !usize {
    const logs = try m.getLogs(testing.allocator, filter);
    defer testing.allocator.free(logs);
    return logs.len;
}

test "ReceiptManager save, get, has" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try seed(&m);

    try testing.expect(m.hasReceipts(h(1)));
    try testing.expect(!m.hasReceipts(h(9)));
    try testing.expectEqual(@as(usize, 2), m.getReceipts(h(1)).?.len);
    try testing.expectEqual(@as(u64, 2), m.getReceipts(h(2)).?[0].block_number);
    try testing.expect(m.getReceipts(h(9)) == null);
}

test "ReceiptManager deep-copies input" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();

    var topics = [_][32]u8{t0};
    var data = [_]u8{ 1, 2 };
    const logs = [_]StoredLog{.{ .address = ad(1), .topics = &topics, .data = &data }};
    try m.saveReceipts(h(1), &.{.{ .tx_hash = h(0x80), .logs = &logs }});
    topics[0] = t1;
    data[0] = 9;

    const stored = m.getReceipts(h(1)).?[0].logs[0];
    try testing.expectEqualSlices(u8, &t0, &stored.topics[0]);
    try testing.expectEqualSlices(u8, &.{ 1, 2 }, stored.data);
}

test "ReceiptManager getReceiptByTxHash" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try seed(&m);

    const found = m.getReceiptByTxHash(h(0x81)).?;
    try testing.expectEqual(@as(u32, 1), found.tx_index);
    try testing.expectEqualSlices(u8, &h(1), &found.block_hash);
    try testing.expectEqualSlices(u8, &h(0x81), &found.receipt.tx_hash);
    try testing.expect(m.getReceiptByTxHash(h(0x99)) == null);
}

test "ReceiptManager deleteReceipts removes receipts, logs, tx index" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try seed(&m);

    try testing.expect(m.deleteReceipts(h(1)));
    try testing.expect(!m.hasReceipts(h(1)));
    try testing.expect(m.getReceiptByTxHash(h(0x80)) == null);
    try testing.expect(m.getReceiptByTxHash(h(0x81)) == null);
    try testing.expectEqual(@as(u32, 0), m.getReceiptByTxHash(h(0x82)).?.tx_index);
    try testing.expectEqual(@as(usize, 1), try countLogs(&m, .{}));
    try testing.expect(!m.deleteReceipts(h(1)));
}

test "ReceiptManager reorg keeps re-included tx entry" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();

    try m.saveReceipts(h(1), &.{.{ .tx_hash = h(0x80) }});
    try m.saveReceipts(h(2), &.{ .{ .tx_hash = h(0x85) }, .{ .tx_hash = h(0x80) } });
    _ = m.deleteReceipts(h(1));

    const found = m.getReceiptByTxHash(h(0x80)).?;
    try testing.expectEqualSlices(u8, &h(2), &found.block_hash);
    try testing.expectEqual(@as(u32, 1), found.tx_index);
}

test "ReceiptManager reorg restores tx entry after deleting the newer block" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();

    try m.saveReceipts(h(1), &.{ .{ .tx_hash = h(0x85) }, .{ .tx_hash = h(0x80) } });
    try m.saveReceipts(h(2), &.{ .{ .tx_hash = h(0x80) }, .{ .tx_hash = h(0x86) } });
    try testing.expectEqual(h(2), m.getReceiptByTxHash(h(0x80)).?.block_hash);
    try testing.expect(m.deleteReceipts(h(2)));

    const found = m.getReceiptByTxHash(h(0x80)).?;
    try testing.expectEqual(h(1), found.block_hash);
    try testing.expectEqual(@as(u32, 1), found.tx_index);
    try testing.expect(m.getReceiptByTxHash(h(0x86)) == null);
}

test "ReceiptManager re-save drops stale tx entries" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();

    try m.saveReceipts(h(1), &.{ .{ .tx_hash = h(0x80) }, .{ .tx_hash = h(0x81) } });
    try m.saveReceipts(h(1), &.{.{ .tx_hash = h(0x81) }});
    try testing.expect(m.getReceiptByTxHash(h(0x80)) == null);
    try testing.expectEqual(@as(u32, 0), m.getReceiptByTxHash(h(0x81)).?.tx_index);
}

test "ReceiptManager clear" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try seed(&m);

    m.clear();
    try testing.expect(!m.hasReceipts(h(1)));
    try testing.expect(m.getReceiptByTxHash(h(0x82)) == null);
    try testing.expectEqual(@as(usize, 0), try countLogs(&m, .{}));
    try seed(&m);
    try testing.expect(m.hasReceipts(h(2)));
}

test "ReceiptManager getLogs fills block-wide positions" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try seed(&m);

    const logs = try m.getLogs(testing.allocator, .{});
    defer testing.allocator.free(logs);
    try testing.expectEqual(@as(usize, 4), logs.len);
    const want_log = [_]u32{ 0, 1, 2, 0 };
    const want_tx = [_]u32{ 0, 1, 1, 0 };
    for (logs, want_log, want_tx) |log, li, ti| {
        try testing.expectEqual(li, log.log_index);
        try testing.expectEqual(ti, log.tx_index);
    }
    try testing.expectEqualSlices(u8, &h(0x81), &logs[2].tx_hash);
    try testing.expectEqualSlices(u8, &h(2), &logs[3].block_hash);
    try testing.expectEqualSlices(u8, "x", logs[0].data);
}

test "ReceiptManager getLogs block_hashes filter" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try seed(&m);

    try testing.expectEqual(@as(usize, 1), try countLogs(&m, .{ .block_hashes = &.{h(2)} }));
    try testing.expectEqual(@as(usize, 1), try countLogs(&m, .{ .block_hashes = &.{ h(2), h(2) } }));
    try testing.expectEqual(@as(usize, 0), try countLogs(&m, .{ .block_hashes = &.{h(9)} }));
    try testing.expectEqual(@as(usize, 0), try countLogs(&m, .{ .block_hashes = &.{} }));
}

test "ReceiptManager getLogs address filter" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try seed(&m);

    try testing.expectEqual(@as(usize, 2), try countLogs(&m, .{ .addresses = &.{ad(0xa)} }));
    try testing.expectEqual(@as(usize, 4), try countLogs(&m, .{ .addresses = &.{ ad(0xa), ad(0xb) } }));
    try testing.expectEqual(@as(usize, 0), try countLogs(&m, .{ .addresses = &.{ad(0xc)} }));
    try testing.expectEqual(@as(usize, 4), try countLogs(&m, .{ .addresses = &.{} }));
}

test "ReceiptManager getLogs topic filter semantics" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try seed(&m);

    // exact topic0
    try testing.expectEqual(@as(usize, 2), try countLogs(&m, .{ .topics = &.{&.{t0}} }));
    // null wildcard then t1: needs topic[1] == t1
    try testing.expectEqual(@as(usize, 2), try countLogs(&m, .{ .topics = &.{ null, &.{t1} } }));
    // All seeded logs have at least one topic.
    try testing.expectEqual(@as(usize, 4), try countLogs(&m, .{ .topics = &.{null} }));
    // OR-array in position 0
    try testing.expectEqual(@as(usize, 2), try countLogs(&m, .{ .topics = &.{&.{ t1, t2 }} }));
    // empty OR-array is a wildcard
    try testing.expectEqual(@as(usize, 2), try countLogs(&m, .{ .topics = &.{ &.{}, &.{t1} } }));
    // Every filter position must exist, including wildcards.
    try testing.expectEqual(@as(usize, 0), try countLogs(&m, .{ .topics = &.{ &.{t0}, &.{t1}, &.{t2} } }));
    try testing.expectEqual(@as(usize, 0), try countLogs(&m, .{ .topics = &.{ &.{t0}, &.{t1}, null } }));
    try testing.expectEqual(@as(usize, 0), try countLogs(&m, .{ .topics = &.{ &.{t0}, &.{t1}, &.{} } }));

    const logs = [_]StoredLog{.{ .address = ad(0xa) }};
    try m.saveReceipts(h(3), &.{.{ .tx_hash = h(0x83), .logs = &logs }});
    try testing.expectEqual(@as(usize, 5), try countLogs(&m, .{}));
    try testing.expectEqual(@as(usize, 4), try countLogs(&m, .{ .topics = &.{null} }));
    try testing.expectEqual(@as(usize, 4), try countLogs(&m, .{ .topics = &.{&.{}} }));
}

test "ReceiptManager getLogs combined filter" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try seed(&m);

    const logs = try m.getLogs(testing.allocator, .{
        .block_hashes = &.{h(1)},
        .addresses = &.{ad(0xb)},
        .topics = &.{&.{t0}},
    });
    defer testing.allocator.free(logs);
    try testing.expectEqual(@as(usize, 1), logs.len);
    try testing.expectEqual(@as(u32, 1), logs[0].log_index);
}

test "ReceiptManager saveReceipts is atomic under allocation failure" {
    var fail_index: usize = 0;
    while (true) : (fail_index += 1) {
        var failing = testing.FailingAllocator.init(testing.allocator, .{ .fail_index = fail_index });
        var m = ReceiptManager.init(failing.allocator());
        defer m.deinit();

        // Seed may itself fail; skip indices that hit the seed.
        seed(&m) catch continue;
        const before = try countLogs(&m, .{});

        const logs = [_]StoredLog{.{ .address = ad(1), .topics = &.{t0}, .data = "abc" }};
        m.saveReceipts(h(1), &.{.{ .tx_hash = h(0x90), .logs = &logs }}) catch |err| {
            try testing.expectEqual(error.OutOfMemory, err);
            // Original block 1 intact.
            try testing.expectEqual(before, try countLogs(&m, .{}));
            try testing.expectEqual(@as(u32, 1), m.getReceiptByTxHash(h(0x81)).?.tx_index);
            try testing.expect(m.getReceiptByTxHash(h(0x90)) == null);
            continue;
        };
        try testing.expect(m.getReceiptByTxHash(h(0x81)) == null);
        try testing.expectEqual(@as(u32, 0), m.getReceiptByTxHash(h(0x90)).?.tx_index);
        break;
    }
}

test "ReceiptManager multi-block reorg restores locations in reverse order" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();

    // tx 0x80 in A, B and C; tx 0x81 in A and C; tx 0x82 only in B.
    try m.saveReceipts(h(0xA), &.{ .{ .tx_hash = h(0x80) }, .{ .tx_hash = h(0x81) } });
    try m.saveReceipts(h(0xB), &.{ .{ .tx_hash = h(0x82) }, .{ .tx_hash = h(0x80) } });
    try m.saveReceipts(h(0xC), &.{ .{ .tx_hash = h(0x81) }, .{ .tx_hash = h(0x83) }, .{ .tx_hash = h(0x80) } });

    try testing.expectEqual(h(0xC), m.getReceiptByTxHash(h(0x80)).?.block_hash);
    try testing.expectEqual(@as(u32, 2), m.getReceiptByTxHash(h(0x80)).?.tx_index);

    // Deleting a shadowed middle block leaves the current location alone.
    try testing.expect(m.deleteReceipts(h(0xB)));
    try testing.expectEqual(h(0xC), m.getReceiptByTxHash(h(0x80)).?.block_hash);
    try testing.expect(m.getReceiptByTxHash(h(0x82)) == null);

    try testing.expect(m.deleteReceipts(h(0xC)));
    const back = m.getReceiptByTxHash(h(0x80)).?;
    try testing.expectEqual(h(0xA), back.block_hash);
    try testing.expectEqual(@as(u32, 0), back.tx_index);
    try testing.expectEqual(@as(u32, 1), m.getReceiptByTxHash(h(0x81)).?.tx_index);
    try testing.expect(m.getReceiptByTxHash(h(0x83)) == null);

    try testing.expect(m.deleteReceipts(h(0xA)));
    try testing.expectEqual(@as(u32, 0), m.tx_index.count());
}

test "ReceiptManager reorg A -> B -> delete B -> B' with a deep chain" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();

    // 64 blocks each re-including tx 0x80; delete newest first.
    var i: u8 = 0;
    while (i < 64) : (i += 1) {
        try m.saveReceipts(h(i), &.{ .{ .tx_hash = h(0xF0) }, .{ .tx_hash = h(0x80) } });
    }
    i = 64;
    while (i > 1) {
        i -= 1;
        try testing.expect(m.deleteReceipts(h(i)));
        try testing.expectEqual(h(i - 1), m.getReceiptByTxHash(h(0x80)).?.block_hash);
    }
    // Re-saving a block moves it to newest.
    try m.saveReceipts(h(0x99), &.{.{ .tx_hash = h(0x80) }});
    try m.saveReceipts(h(0), &.{ .{ .tx_hash = h(0x81) }, .{ .tx_hash = h(0x80) } });
    try testing.expectEqual(h(0), m.getReceiptByTxHash(h(0x80)).?.block_hash);
    try testing.expectEqual(@as(u32, 1), m.getReceiptByTxHash(h(0x80)).?.tx_index);
    try testing.expect(m.getReceiptByTxHash(h(0xF0)) == null);
    try testing.expect(m.deleteReceipts(h(0)));
    try testing.expectEqual(h(0x99), m.getReceiptByTxHash(h(0x80)).?.block_hash);
}

test "ReceiptManager duplicate tx hash within a block resolves to the last index" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();
    try m.saveReceipts(h(1), &.{ .{ .tx_hash = h(0x80) }, .{ .tx_hash = h(0x81) }, .{ .tx_hash = h(0x80) } });
    try testing.expectEqual(@as(u32, 2), m.getReceiptByTxHash(h(0x80)).?.tx_index);
    try testing.expect(m.deleteReceipts(h(1)));
    try testing.expect(m.getReceiptByTxHash(h(0x80)) == null);
}

test "ReceiptManager saveReceipts over shared txs is atomic under allocation failure" {
    var fail_index: usize = 0;
    while (true) : (fail_index += 1) {
        var failing = testing.FailingAllocator.init(testing.allocator, .{ .fail_index = fail_index });
        var m = ReceiptManager.init(failing.allocator());
        defer m.deinit();

        m.saveReceipts(h(1), &.{ .{ .tx_hash = h(0x80) }, .{ .tx_hash = h(0x81) } }) catch continue;
        m.saveReceipts(h(2), &.{.{ .tx_hash = h(0x80) }}) catch continue;

        // Re-save block 1 with one shared, one dropped and two new tx hashes.
        m.saveReceipts(h(1), &.{ .{ .tx_hash = h(0x80) }, .{ .tx_hash = h(0x90) }, .{ .tx_hash = h(0x91) }, .{ .tx_hash = h(0x90) } }) catch |err| {
            try testing.expectEqual(error.OutOfMemory, err);
            try testing.expectEqual(h(2), m.getReceiptByTxHash(h(0x80)).?.block_hash);
            try testing.expectEqual(@as(u32, 1), m.getReceiptByTxHash(h(0x81)).?.tx_index);
            try testing.expect(m.getReceiptByTxHash(h(0x90)) == null);
            try testing.expect(m.getReceiptByTxHash(h(0x91)) == null);
            try testing.expectEqual(@as(u32, 2), m.tx_index.count());
            continue;
        };
        try testing.expectEqual(h(1), m.getReceiptByTxHash(h(0x80)).?.block_hash);
        try testing.expect(m.getReceiptByTxHash(h(0x81)) == null);
        try testing.expectEqual(@as(u32, 3), m.getReceiptByTxHash(h(0x90)).?.tx_index);
        try testing.expect(m.deleteReceipts(h(1)));
        try testing.expectEqual(h(2), m.getReceiptByTxHash(h(0x80)).?.block_hash);
        break;
    }
}

/// Walk save order from head and back from tail; both must list `expected`.
fn expectOrder(m: *const ReceiptManager, expected: []const u8) !void {
    var forward: [64][32]u8 = undefined;
    var n: usize = 0;
    var cursor = m.head;
    var prev: ?[32]u8 = null;
    while (cursor) |hash| : (n += 1) {
        const block = m.blocks.getPtr(hash).?;
        try testing.expectEqual(prev, block.prev);
        forward[n] = hash;
        prev = hash;
        cursor = block.next;
    }
    try testing.expectEqual(prev, m.tail);
    try testing.expectEqual(expected.len, n);
    try testing.expectEqual(@as(usize, m.blocks.count()), n);
    for (expected, 0..) |e, i| try testing.expectEqual(h(e), forward[i]);
}

fn logBlockOrder(m: *const ReceiptManager, buf: [][32]u8) ![]const [32]u8 {
    const logs = try m.getLogs(testing.allocator, .{});
    defer testing.allocator.free(logs);
    var n: usize = 0;
    for (logs) |log| {
        if (n > 0 and std.mem.eql(u8, &buf[n - 1], &log.block_hash)) continue;
        buf[n] = log.block_hash;
        n += 1;
    }
    return buf[0..n];
}

test "ReceiptManager getLogs keeps save order across O(1) deletes and re-saves" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();

    const log = [_]StoredLog{.{ .address = ad(1) }};
    var i: u8 = 1;
    while (i <= 6) : (i += 1) try m.saveReceipts(h(i), &.{.{ .tx_hash = h(0x80 + i), .logs = &log }});
    try expectOrder(&m, &.{ 1, 2, 3, 4, 5, 6 });

    // Delete middle, head and tail.
    try testing.expect(m.deleteReceipts(h(3)));
    try expectOrder(&m, &.{ 1, 2, 4, 5, 6 });
    try testing.expect(m.deleteReceipts(h(1)));
    try expectOrder(&m, &.{ 2, 4, 5, 6 });
    try testing.expect(m.deleteReceipts(h(6)));
    try expectOrder(&m, &.{ 2, 4, 5 });
    try testing.expect(!m.deleteReceipts(h(6)));

    // Re-saving an existing block moves it to the end; a new block appends.
    try m.saveReceipts(h(2), &.{.{ .tx_hash = h(0x92), .logs = &log }});
    try expectOrder(&m, &.{ 4, 5, 2 });
    try m.saveReceipts(h(3), &.{.{ .tx_hash = h(0x93), .logs = &log }});
    try expectOrder(&m, &.{ 4, 5, 2, 3 });

    var buf: [8][32]u8 = undefined;
    const order = try logBlockOrder(&m, &buf);
    try testing.expectEqual(@as(usize, 4), order.len);
    for ([_]u8{ 4, 5, 2, 3 }, order) |e, got| try testing.expectEqual(h(e), got);

    // Down to one, then empty, then refill.
    for ([_]u8{ 4, 5, 2 }) |b| try testing.expect(m.deleteReceipts(h(b)));
    try expectOrder(&m, &.{3});
    try testing.expect(m.deleteReceipts(h(3)));
    try expectOrder(&m, &.{});
    try testing.expect(m.head == null and m.tail == null);
    try m.saveReceipts(h(9), &.{});
    try expectOrder(&m, &.{9});

    m.clear();
    try expectOrder(&m, &.{});
    try m.saveReceipts(h(7), &.{});
    try m.saveReceipts(h(8), &.{});
    try expectOrder(&m, &.{ 7, 8 });
}

test "ReceiptManager failed re-save leaves save order untouched" {
    var fail_index: usize = 0;
    while (true) : (fail_index += 1) {
        var failing = testing.FailingAllocator.init(testing.allocator, .{ .fail_index = fail_index });
        var m = ReceiptManager.init(failing.allocator());
        defer m.deinit();

        m.saveReceipts(h(1), &.{.{ .tx_hash = h(0x81) }}) catch continue;
        m.saveReceipts(h(2), &.{.{ .tx_hash = h(0x82) }}) catch continue;
        m.saveReceipts(h(3), &.{.{ .tx_hash = h(0x83) }}) catch continue;

        m.saveReceipts(h(1), &.{.{ .tx_hash = h(0x91) }}) catch |err| {
            try testing.expectEqual(error.OutOfMemory, err);
            try expectOrder(&m, &.{ 1, 2, 3 });
            try testing.expect(m.getReceiptByTxHash(h(0x81)) != null);
            continue;
        };
        try expectOrder(&m, &.{ 2, 3, 1 });
        try testing.expect(m.getReceiptByTxHash(h(0x81)) == null);
        break;
    }
}

test "ReceiptManager deleting from many blocks stays consistent" {
    var m = ReceiptManager.init(testing.allocator);
    defer m.deinit();

    var i: u8 = 0;
    while (i < 50) : (i += 1) try m.saveReceipts(h(i), &.{.{ .tx_hash = h(0x80 +% i) }});
    // Delete every even block.
    i = 0;
    while (i < 50) : (i += 2) try testing.expect(m.deleteReceipts(h(i)));
    var expected: [25]u8 = undefined;
    for (&expected, 0..) |*e, k| e.* = @intCast(2 * k + 1);
    try expectOrder(&m, &expected);
}
