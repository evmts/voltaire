//! SyncStatus - Ethereum Sync Status
//!
//! Represents the synchronization status from eth_syncing RPC method.
//! - false/null = not syncing (node is fully synced)
//! - object = actively syncing with progress information
//!
//! ## Usage
//! ```zig
//! const status = SyncStatus.syncing(0, 1000, 2000);
//! if (status.isSyncing()) {
//!     const progress = status.getProgress();
//!     std.debug.print("Sync: {d:.2}%\n", .{progress});
//! }
//! ```

const std = @import("std");
const json = std.json;
const Allocator = std.mem.Allocator;

/// Sync progress information when actively syncing
pub const SyncProgress = struct {
    /// Block number where sync started
    starting_block: u64,
    /// Current block being processed
    current_block: u64,
    /// Highest known block
    highest_block: u64,
    /// Number of state entries pulled (optional)
    pulled_states: ?u256 = null,
    /// Number of known state entries (optional)
    known_states: ?u256 = null,
};

/// SyncStatus - either not syncing (null) or actively syncing with progress
pub const SyncStatus = union(enum) {
    /// Node is fully synced
    not_syncing,
    /// Node is actively syncing
    syncing: SyncProgress,

    const Self = @This();

    /// Check if node is actively syncing
    pub fn isSyncing(self: Self) bool {
        return self == .syncing;
    }

    /// Calculate sync progress as percentage (0-100)
    /// Returns 100 if not syncing or if sync range is 0
    pub fn getProgress(self: Self) f64 {
        switch (self) {
            .not_syncing => return 100.0,
            .syncing => |progress| {
                const total = progress.highest_block - progress.starting_block;
                if (total == 0) return 100.0;

                const current = progress.current_block - progress.starting_block;
                const percent = @as(f64, @floatFromInt(current)) / @as(f64, @floatFromInt(total)) * 100.0;

                // Clamp to 0-100
                return @max(0.0, @min(100.0, percent));
            },
        }
    }

    /// Get starting block number (only valid when syncing)
    pub fn getStartingBlock(self: Self) ?u64 {
        switch (self) {
            .not_syncing => return null,
            .syncing => |progress| return progress.starting_block,
        }
    }

    /// Get current block number (only valid when syncing)
    pub fn getCurrentBlock(self: Self) ?u64 {
        switch (self) {
            .not_syncing => return null,
            .syncing => |progress| return progress.current_block,
        }
    }

    /// Get highest known block number (only valid when syncing)
    pub fn getHighestBlock(self: Self) ?u64 {
        switch (self) {
            .not_syncing => return null,
            .syncing => |progress| return progress.highest_block,
        }
    }

    /// Get remaining blocks to sync (only valid when syncing)
    pub fn getRemainingBlocks(self: Self) ?u64 {
        switch (self) {
            .not_syncing => return null,
            .syncing => |progress| {
                if (progress.current_block >= progress.highest_block) return 0;
                return progress.highest_block - progress.current_block;
            },
        }
    }
};

/// Create SyncStatus indicating not syncing (fully synced)
pub fn notSyncing() SyncStatus {
    return .not_syncing;
}

/// Create SyncStatus indicating active sync
pub fn syncing(starting_block: u64, current_block: u64, highest_block: u64) SyncStatus {
    return .{ .syncing = .{
        .starting_block = starting_block,
        .current_block = current_block,
        .highest_block = highest_block,
    } };
}

/// Create SyncStatus with full sync progress including state sync info
pub fn syncingWithStates(
    starting_block: u64,
    current_block: u64,
    highest_block: u64,
    pulled_states: ?u256,
    known_states: ?u256,
) SyncStatus {
    return .{ .syncing = .{
        .starting_block = starting_block,
        .current_block = current_block,
        .highest_block = highest_block,
        .pulled_states = pulled_states,
        .known_states = known_states,
    } };
}

/// Create SyncStatus from RPC response
/// value: false means not syncing, object means syncing with progress
pub fn from(value: anytype) SyncStatus {
    const T = @TypeOf(value);
    if (T == bool) {
        return if (value) .not_syncing else .not_syncing;
    }
    // For struct/object types, extract fields
    if (@typeInfo(T) == .@"struct") {
        return syncing(
            value.starting_block,
            value.current_block,
            value.highest_block,
        );
    }
    return .not_syncing;
}

// ============================================================================
// JSON Serialization
// ============================================================================

/// Encode SyncStatus to JSON (eth_syncing RPC response format)
pub fn toJson(status: SyncStatus, allocator: Allocator) ![]u8 {
    var buf = std.ArrayList(u8){};
    defer buf.deinit(allocator);

    switch (status) {
        .not_syncing => {
            try buf.appendSlice(allocator, "false");
        },
        .syncing => |progress| {
            try buf.appendSlice(allocator, "{\"startingBlock\":\"0x");
            var start_buf: [16]u8 = undefined;
            const start_len = std.fmt.formatIntBuf(&start_buf, progress.starting_block, 16, .lower, .{});
            try buf.appendSlice(allocator, start_buf[0..start_len]);

            try buf.appendSlice(allocator, "\",\"currentBlock\":\"0x");
            var curr_buf: [16]u8 = undefined;
            const curr_len = std.fmt.formatIntBuf(&curr_buf, progress.current_block, 16, .lower, .{});
            try buf.appendSlice(allocator, curr_buf[0..curr_len]);

            try buf.appendSlice(allocator, "\",\"highestBlock\":\"0x");
            var high_buf: [16]u8 = undefined;
            const high_len = std.fmt.formatIntBuf(&high_buf, progress.highest_block, 16, .lower, .{});
            try buf.appendSlice(allocator, high_buf[0..high_len]);
            try buf.append(allocator, '"');

            if (progress.pulled_states) |ps| {
                try buf.appendSlice(allocator, ",\"pulledStates\":\"0x");
                const ps_low: u128 = @truncate(ps);
                const ps_high: u128 = @truncate(ps >> 128);
                if (ps_high > 0) {
                    var ps_buf: [64]u8 = undefined;
                    const ps_len = std.fmt.formatIntBuf(&ps_buf, ps_high, 16, .lower, .{});
                    try buf.appendSlice(allocator, ps_buf[0..ps_len]);
                    var ps_low_buf: [32]u8 = undefined;
                    const ps_low_len = std.fmt.formatIntBuf(&ps_low_buf, ps_low, 16, .lower, .{ .fill = '0', .width = 32 });
                    try buf.appendSlice(allocator, ps_low_buf[0..ps_low_len]);
                } else {
                    var ps_buf: [32]u8 = undefined;
                    const ps_len = std.fmt.formatIntBuf(&ps_buf, ps_low, 16, .lower, .{});
                    try buf.appendSlice(allocator, ps_buf[0..ps_len]);
                }
                try buf.append(allocator, '"');
            }

            if (progress.known_states) |ks| {
                try buf.appendSlice(allocator, ",\"knownStates\":\"0x");
                const ks_low: u128 = @truncate(ks);
                const ks_high: u128 = @truncate(ks >> 128);
                if (ks_high > 0) {
                    var ks_buf: [64]u8 = undefined;
                    const ks_len = std.fmt.formatIntBuf(&ks_buf, ks_high, 16, .lower, .{});
                    try buf.appendSlice(allocator, ks_buf[0..ks_len]);
                    var ks_low_buf: [32]u8 = undefined;
                    const ks_low_len = std.fmt.formatIntBuf(&ks_low_buf, ks_low, 16, .lower, .{ .fill = '0', .width = 32 });
                    try buf.appendSlice(allocator, ks_low_buf[0..ks_low_len]);
                } else {
                    var ks_buf: [32]u8 = undefined;
                    const ks_len = std.fmt.formatIntBuf(&ks_buf, ks_low, 16, .lower, .{});
                    try buf.appendSlice(allocator, ks_buf[0..ks_len]);
                }
                try buf.append(allocator, '"');
            }

            try buf.append(allocator, '}');
        },
    }

    return buf.toOwnedSlice(allocator);
}

/// Decode SyncStatus from JSON RPC response
/// Handles both "false" (not syncing) and object (syncing) formats
pub fn fromJson(allocator: Allocator, json_str: []const u8) !SyncStatus {
    // Check for literal false
    if (std.mem.eql(u8, json_str, "false")) {
        return .not_syncing;
    }

    const parsed = try json.parseFromSlice(json.Value, allocator, json_str, .{});
    defer parsed.deinit();

    // Handle boolean false
    if (parsed.value == .bool and !parsed.value.bool) {
        return .not_syncing;
    }

    // Handle object with sync progress
    if (parsed.value == .object) {
        const obj = parsed.value.object;

        const start_str = obj.get("startingBlock").?.string;
        const starting_block = try parseHexU64(start_str);

        const curr_str = obj.get("currentBlock").?.string;
        const current_block = try parseHexU64(curr_str);

        const high_str = obj.get("highestBlock").?.string;
        const highest_block = try parseHexU64(high_str);

        var pulled_states: ?u256 = null;
        var known_states: ?u256 = null;

        if (obj.get("pulledStates")) |ps_val| {
            if (ps_val == .string) {
                pulled_states = try parseHexU256(ps_val.string);
            }
        }

        if (obj.get("knownStates")) |ks_val| {
            if (ks_val == .string) {
                known_states = try parseHexU256(ks_val.string);
            }
        }

        return syncingWithStates(starting_block, current_block, highest_block, pulled_states, known_states);
    }

    return .not_syncing;
}

/// Parse hex string to u64
fn parseHexU64(hex: []const u8) !u64 {
    const stripped = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
    return std.fmt.parseInt(u64, stripped, 16);
}

/// Parse hex string to u256
fn parseHexU256(hex: []const u8) !u256 {
    const stripped = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
    var result: u256 = 0;
    for (stripped) |c| {
        const digit: u256 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return error.InvalidHexCharacter,
        };
        result = result * 16 + digit;
    }
    return result;
}

/// Check equality between two SyncStatus values
pub fn equals(a: SyncStatus, b: SyncStatus) bool {
    switch (a) {
        .not_syncing => return b == .not_syncing,
        .syncing => |prog_a| {
            switch (b) {
                .not_syncing => return false,
                .syncing => |prog_b| {
                    return prog_a.starting_block == prog_b.starting_block and
                        prog_a.current_block == prog_b.current_block and
                        prog_a.highest_block == prog_b.highest_block;
                },
            }
        },
    }
}

// Tests

test "SyncStatus: notSyncing creates not syncing status" {
    const status = notSyncing();
    try std.testing.expect(!status.isSyncing());
}

test "SyncStatus: syncing creates syncing status" {
    const status = syncing(0, 1000, 2000);
    try std.testing.expect(status.isSyncing());
}

test "SyncStatus: isSyncing returns true when syncing" {
    const status = syncing(0, 500, 1000);
    try std.testing.expect(status.isSyncing());
}

test "SyncStatus: isSyncing returns false when not syncing" {
    const status = notSyncing();
    try std.testing.expect(!status.isSyncing());
}

test "SyncStatus: getProgress returns 100 when not syncing" {
    const status = notSyncing();
    try std.testing.expectApproxEqAbs(@as(f64, 100.0), status.getProgress(), 0.001);
}

test "SyncStatus: getProgress returns 50% at midpoint" {
    const status = syncing(0, 500, 1000);
    try std.testing.expectApproxEqAbs(@as(f64, 50.0), status.getProgress(), 0.001);
}

test "SyncStatus: getProgress returns 0% at start" {
    const status = syncing(0, 0, 1000);
    try std.testing.expectApproxEqAbs(@as(f64, 0.0), status.getProgress(), 0.001);
}

test "SyncStatus: getProgress returns 100% when complete" {
    const status = syncing(0, 1000, 1000);
    try std.testing.expectApproxEqAbs(@as(f64, 100.0), status.getProgress(), 0.001);
}

test "SyncStatus: getProgress handles non-zero starting block" {
    const status = syncing(1000, 1500, 2000);
    // Progress: (1500-1000)/(2000-1000) = 500/1000 = 50%
    try std.testing.expectApproxEqAbs(@as(f64, 50.0), status.getProgress(), 0.001);
}

test "SyncStatus: getProgress returns 100 when total is 0" {
    const status = syncing(1000, 1000, 1000);
    try std.testing.expectApproxEqAbs(@as(f64, 100.0), status.getProgress(), 0.001);
}

test "SyncStatus: getStartingBlock returns block when syncing" {
    const status = syncing(1000, 1500, 2000);
    try std.testing.expectEqual(@as(?u64, 1000), status.getStartingBlock());
}

test "SyncStatus: getStartingBlock returns null when not syncing" {
    const status = notSyncing();
    try std.testing.expectEqual(@as(?u64, null), status.getStartingBlock());
}

test "SyncStatus: getCurrentBlock returns block when syncing" {
    const status = syncing(0, 1500, 2000);
    try std.testing.expectEqual(@as(?u64, 1500), status.getCurrentBlock());
}

test "SyncStatus: getCurrentBlock returns null when not syncing" {
    const status = notSyncing();
    try std.testing.expectEqual(@as(?u64, null), status.getCurrentBlock());
}

test "SyncStatus: getHighestBlock returns block when syncing" {
    const status = syncing(0, 1000, 2000);
    try std.testing.expectEqual(@as(?u64, 2000), status.getHighestBlock());
}

test "SyncStatus: getHighestBlock returns null when not syncing" {
    const status = notSyncing();
    try std.testing.expectEqual(@as(?u64, null), status.getHighestBlock());
}

test "SyncStatus: getRemainingBlocks calculates correctly" {
    const status = syncing(0, 1500, 2000);
    try std.testing.expectEqual(@as(?u64, 500), status.getRemainingBlocks());
}

test "SyncStatus: getRemainingBlocks returns 0 when complete" {
    const status = syncing(0, 2000, 2000);
    try std.testing.expectEqual(@as(?u64, 0), status.getRemainingBlocks());
}

test "SyncStatus: getRemainingBlocks returns null when not syncing" {
    const status = notSyncing();
    try std.testing.expectEqual(@as(?u64, null), status.getRemainingBlocks());
}

test "SyncStatus: syncingWithStates includes state info" {
    const status = syncingWithStates(0, 500, 1000, 1000000, 2000000);
    try std.testing.expect(status.isSyncing());

    switch (status) {
        .syncing => |progress| {
            try std.testing.expectEqual(@as(?u256, 1000000), progress.pulled_states);
            try std.testing.expectEqual(@as(?u256, 2000000), progress.known_states);
        },
        else => unreachable,
    }
}

test "SyncStatus: complete workflow" {
    // Node starts syncing
    var status = syncing(1000, 1000, 2000);
    try std.testing.expect(status.isSyncing());
    try std.testing.expectApproxEqAbs(@as(f64, 0.0), status.getProgress(), 0.001);
    try std.testing.expectEqual(@as(?u64, 1000), status.getRemainingBlocks());

    // Progress to 50%
    status = syncing(1000, 1500, 2000);
    try std.testing.expectApproxEqAbs(@as(f64, 50.0), status.getProgress(), 0.001);
    try std.testing.expectEqual(@as(?u64, 500), status.getRemainingBlocks());

    // Sync complete
    status = notSyncing();
    try std.testing.expect(!status.isSyncing());
    try std.testing.expectApproxEqAbs(@as(f64, 100.0), status.getProgress(), 0.001);
}

// ============================================================================
// JSON Tests
// ============================================================================

test "SyncStatus: toJson encodes not syncing" {
    const allocator = std.testing.allocator;
    const status = notSyncing();

    const json_str = try toJson(status, allocator);
    defer allocator.free(json_str);

    try std.testing.expectEqualStrings("false", json_str);
}

test "SyncStatus: toJson encodes syncing" {
    const allocator = std.testing.allocator;
    const status = syncing(0, 1000, 2000);

    const json_str = try toJson(status, allocator);
    defer allocator.free(json_str);

    try std.testing.expect(std.mem.indexOf(u8, json_str, "\"startingBlock\":\"0x0\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json_str, "\"currentBlock\":\"0x3e8\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json_str, "\"highestBlock\":\"0x7d0\"") != null);
}

test "SyncStatus: fromJson decodes false" {
    const allocator = std.testing.allocator;

    const status = try fromJson(allocator, "false");
    try std.testing.expect(!status.isSyncing());
}

test "SyncStatus: fromJson decodes syncing object" {
    const allocator = std.testing.allocator;
    const json_str =
        \\{"startingBlock":"0x0","currentBlock":"0x3e8","highestBlock":"0x7d0"}
    ;

    const status = try fromJson(allocator, json_str);
    try std.testing.expect(status.isSyncing());
    try std.testing.expectEqual(@as(?u64, 0), status.getStartingBlock());
    try std.testing.expectEqual(@as(?u64, 1000), status.getCurrentBlock());
    try std.testing.expectEqual(@as(?u64, 2000), status.getHighestBlock());
}

test "SyncStatus: fromJson decodes with state info" {
    const allocator = std.testing.allocator;
    const json_str =
        \\{"startingBlock":"0x0","currentBlock":"0x1f4","highestBlock":"0x3e8","pulledStates":"0xf4240","knownStates":"0x1e8480"}
    ;

    const status = try fromJson(allocator, json_str);
    try std.testing.expect(status.isSyncing());

    switch (status) {
        .syncing => |progress| {
            try std.testing.expectEqual(@as(?u256, 1000000), progress.pulled_states);
            try std.testing.expectEqual(@as(?u256, 2000000), progress.known_states);
        },
        else => unreachable,
    }
}

test "SyncStatus: JSON roundtrip not syncing" {
    const allocator = std.testing.allocator;
    const original = notSyncing();

    const json_str = try toJson(original, allocator);
    defer allocator.free(json_str);

    const decoded = try fromJson(allocator, json_str);
    try std.testing.expect(equals(original, decoded));
}

test "SyncStatus: JSON roundtrip syncing" {
    const allocator = std.testing.allocator;
    const original = syncing(1000, 1500, 2000);

    const json_str = try toJson(original, allocator);
    defer allocator.free(json_str);

    const decoded = try fromJson(allocator, json_str);
    try std.testing.expect(equals(original, decoded));
}

test "SyncStatus: equals compares correctly" {
    const status1 = syncing(0, 500, 1000);
    const status2 = syncing(0, 500, 1000);
    const status3 = syncing(0, 600, 1000);
    const status4 = notSyncing();

    try std.testing.expect(equals(status1, status2));
    try std.testing.expect(!equals(status1, status3));
    try std.testing.expect(!equals(status1, status4));
    try std.testing.expect(equals(status4, notSyncing()));
}
