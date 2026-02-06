//! ChainHead - Current chain head information
//!
//! Two variants:
//! - ChainHead: Execution layer (eth_getBlockByNumber)
//! - BeaconChainHead: Consensus layer (beacon chain slot/roots)
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const ChainHead = primitives.ChainHead;
//!
//! // Execution layer head
//! const head = ChainHead.from(.{
//!     .number = 18000000,
//!     .hash = block_hash,
//!     .timestamp = 1699000000,
//! });
//!
//! // Beacon chain head
//! const beacon_head = ChainHead.beaconFrom(.{
//!     .slot = 7000000,
//!     .block = block_root,
//!     .state = state_root,
//! });
//! ```

const std = @import("std");
const json = std.json;
const Allocator = std.mem.Allocator;
const BlockHash = @import("../BlockHash/BlockHash.zig");
const BlockNumber = @import("../BlockNumber/BlockNumber.zig");
const Bytes32 = @import("../Bytes32/Bytes32.zig");
const Hex = @import("../Hex/Hex.zig");

/// ChainHead type - represents the current chain head
pub const ChainHead = struct {
    /// Block number
    number: BlockNumber.BlockNumber,

    /// Block hash
    hash: BlockHash.BlockHash,

    /// Block timestamp (Unix seconds)
    timestamp: u256,

    /// Block difficulty (0 post-merge)
    difficulty: ?u256 = null,

    /// Total difficulty from genesis to this block
    total_difficulty: ?u256 = null,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create ChainHead from struct
pub fn from(data: ChainHead) ChainHead {
    return data;
}

/// Create ChainHead from individual fields
pub fn fromFields(
    number: BlockNumber.BlockNumber,
    hash: BlockHash.BlockHash,
    timestamp: u256,
) ChainHead {
    return .{
        .number = number,
        .hash = hash,
        .timestamp = timestamp,
    };
}

/// Create ChainHead with difficulty fields
pub fn fromFieldsWithDifficulty(
    number: BlockNumber.BlockNumber,
    hash: BlockHash.BlockHash,
    timestamp: u256,
    difficulty: u256,
    total_difficulty: u256,
) ChainHead {
    return .{
        .number = number,
        .hash = hash,
        .timestamp = timestamp,
        .difficulty = difficulty,
        .total_difficulty = total_difficulty,
    };
}

// ============================================================================
// Accessors
// ============================================================================

/// Get block number
pub fn getNumber(head: ChainHead) BlockNumber.BlockNumber {
    return head.number;
}

/// Get block hash
pub fn getHash(head: ChainHead) BlockHash.BlockHash {
    return head.hash;
}

/// Get block timestamp
pub fn getTimestamp(head: ChainHead) u256 {
    return head.timestamp;
}

/// Get difficulty (null for post-merge blocks)
pub fn getDifficulty(head: ChainHead) ?u256 {
    return head.difficulty;
}

/// Get total difficulty (null if not set)
pub fn getTotalDifficulty(head: ChainHead) ?u256 {
    return head.total_difficulty;
}

// ============================================================================
// Predicates
// ============================================================================

/// Check if block is post-merge (PoS)
pub fn isPostMerge(head: ChainHead) bool {
    if (head.difficulty) |diff| {
        return diff == 0;
    }
    // If difficulty is not set, assume post-merge
    return true;
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two ChainHeads are equal
pub fn equals(a: ChainHead, b: ChainHead) bool {
    return a.number == b.number and
        std.mem.eql(u8, &a.hash, &b.hash) and
        a.timestamp == b.timestamp;
}

// ============================================================================
// JSON Serialization
// ============================================================================

/// Encode ChainHead to JSON
pub fn toJson(head: ChainHead, allocator: Allocator) ![]u8 {
    var buf = std.ArrayList(u8){};
    defer buf.deinit(allocator);

    try buf.appendSlice(allocator, "{\"number\":\"0x");
    var num_buf: [16]u8 = undefined;
    const num_len = std.fmt.formatIntBuf(&num_buf, head.number, 16, .lower, .{});
    try buf.appendSlice(allocator, num_buf[0..num_len]);

    try buf.appendSlice(allocator, "\",\"hash\":\"0x");
    var hash_hex: [64]u8 = undefined;
    _ = std.fmt.bufPrint(&hash_hex, "{s}", .{std.fmt.fmtSliceHexLower(&head.hash)}) catch unreachable;
    try buf.appendSlice(allocator, &hash_hex);

    try buf.appendSlice(allocator, "\",\"timestamp\":\"0x");
    // u256 timestamp - use Hex encoding
    const ts_low: u128 = @truncate(head.timestamp);
    const ts_high: u128 = @truncate(head.timestamp >> 128);
    if (ts_high > 0) {
        var ts_buf: [64]u8 = undefined;
        const ts_len = std.fmt.formatIntBuf(&ts_buf, ts_high, 16, .lower, .{});
        try buf.appendSlice(allocator, ts_buf[0..ts_len]);
        var ts_low_buf: [32]u8 = undefined;
        const ts_low_len = std.fmt.formatIntBuf(&ts_low_buf, ts_low, 16, .lower, .{ .fill = '0', .width = 32 });
        try buf.appendSlice(allocator, ts_low_buf[0..ts_low_len]);
    } else {
        var ts_buf: [32]u8 = undefined;
        const ts_len = std.fmt.formatIntBuf(&ts_buf, ts_low, 16, .lower, .{});
        try buf.appendSlice(allocator, ts_buf[0..ts_len]);
    }
    try buf.append(allocator, '"');

    if (head.difficulty) |diff| {
        try buf.appendSlice(allocator, ",\"difficulty\":\"0x");
        const diff_low: u128 = @truncate(diff);
        const diff_high: u128 = @truncate(diff >> 128);
        if (diff_high > 0) {
            var diff_buf: [64]u8 = undefined;
            const diff_len = std.fmt.formatIntBuf(&diff_buf, diff_high, 16, .lower, .{});
            try buf.appendSlice(allocator, diff_buf[0..diff_len]);
            var diff_low_buf: [32]u8 = undefined;
            const diff_low_len = std.fmt.formatIntBuf(&diff_low_buf, diff_low, 16, .lower, .{ .fill = '0', .width = 32 });
            try buf.appendSlice(allocator, diff_low_buf[0..diff_low_len]);
        } else {
            var diff_buf: [32]u8 = undefined;
            const diff_len = std.fmt.formatIntBuf(&diff_buf, diff_low, 16, .lower, .{});
            try buf.appendSlice(allocator, diff_buf[0..diff_len]);
        }
        try buf.append(allocator, '"');
    }

    if (head.total_difficulty) |td| {
        try buf.appendSlice(allocator, ",\"totalDifficulty\":\"0x");
        const td_low: u128 = @truncate(td);
        const td_high: u128 = @truncate(td >> 128);
        if (td_high > 0) {
            var td_buf: [64]u8 = undefined;
            const td_len = std.fmt.formatIntBuf(&td_buf, td_high, 16, .lower, .{});
            try buf.appendSlice(allocator, td_buf[0..td_len]);
            var td_low_buf: [32]u8 = undefined;
            const td_low_len = std.fmt.formatIntBuf(&td_low_buf, td_low, 16, .lower, .{ .fill = '0', .width = 32 });
            try buf.appendSlice(allocator, td_low_buf[0..td_low_len]);
        } else {
            var td_buf: [32]u8 = undefined;
            const td_len = std.fmt.formatIntBuf(&td_buf, td_low, 16, .lower, .{});
            try buf.appendSlice(allocator, td_buf[0..td_len]);
        }
        try buf.append(allocator, '"');
    }

    try buf.append(allocator, '}');

    return buf.toOwnedSlice(allocator);
}

/// Decode ChainHead from JSON RPC response
pub fn fromJson(allocator: Allocator, json_str: []const u8) !ChainHead {
    const parsed = try json.parseFromSlice(json.Value, allocator, json_str, .{});
    defer parsed.deinit();

    const obj = parsed.value.object;

    // Parse number (hex string)
    const number_str = obj.get("number").?.string;
    const number = try parseHexU64(number_str);

    // Parse hash (hex string)
    const hash_str = obj.get("hash").?.string;
    var hash: BlockHash.BlockHash = undefined;
    const hash_hex = if (std.mem.startsWith(u8, hash_str, "0x")) hash_str[2..] else hash_str;
    _ = try std.fmt.hexToBytes(&hash, hash_hex);

    // Parse timestamp (hex string)
    const ts_str = obj.get("timestamp").?.string;
    const timestamp = try parseHexU256(ts_str);

    var result = ChainHead{
        .number = number,
        .hash = hash,
        .timestamp = timestamp,
    };

    // Optional: difficulty
    if (obj.get("difficulty")) |diff_val| {
        if (diff_val == .string) {
            result.difficulty = try parseHexU256(diff_val.string);
        }
    }

    // Optional: totalDifficulty
    if (obj.get("totalDifficulty")) |td_val| {
        if (td_val == .string) {
            result.total_difficulty = try parseHexU256(td_val.string);
        }
    }

    return result;
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

// ============================================================================
// BeaconChainHead - Consensus Layer
// ============================================================================

/// BeaconChainHead - Beacon chain head (consensus layer)
/// Used with beacon node APIs (slot, block root, state root)
pub const BeaconChainHead = struct {
    /// Slot number
    slot: u64,

    /// Block root (32 bytes)
    block: [32]u8,

    /// State root (32 bytes)
    state: [32]u8,
};

/// Create BeaconChainHead from struct
pub fn beaconFrom(data: BeaconChainHead) BeaconChainHead {
    return data;
}

/// Create BeaconChainHead from individual fields
pub fn beaconFromFields(slot: u64, block: [32]u8, state: [32]u8) BeaconChainHead {
    return .{
        .slot = slot,
        .block = block,
        .state = state,
    };
}

/// Check if two BeaconChainHeads are equal
pub fn beaconEquals(a: BeaconChainHead, b: BeaconChainHead) bool {
    return a.slot == b.slot and
        std.mem.eql(u8, &a.block, &b.block) and
        std.mem.eql(u8, &a.state, &b.state);
}

/// Encode BeaconChainHead to JSON
pub fn beaconToJson(head: BeaconChainHead, allocator: Allocator) ![]u8 {
    var buf = std.ArrayList(u8){};
    defer buf.deinit(allocator);

    try buf.appendSlice(allocator, "{\"slot\":\"");
    var slot_buf: [20]u8 = undefined;
    const slot_len = std.fmt.formatIntBuf(&slot_buf, head.slot, 10, .lower, .{});
    try buf.appendSlice(allocator, slot_buf[0..slot_len]);

    try buf.appendSlice(allocator, "\",\"block\":\"0x");
    var block_hex: [64]u8 = undefined;
    _ = std.fmt.bufPrint(&block_hex, "{s}", .{std.fmt.fmtSliceHexLower(&head.block)}) catch unreachable;
    try buf.appendSlice(allocator, &block_hex);

    try buf.appendSlice(allocator, "\",\"state\":\"0x");
    var state_hex: [64]u8 = undefined;
    _ = std.fmt.bufPrint(&state_hex, "{s}", .{std.fmt.fmtSliceHexLower(&head.state)}) catch unreachable;
    try buf.appendSlice(allocator, &state_hex);

    try buf.appendSlice(allocator, "\"}");

    return buf.toOwnedSlice(allocator);
}

/// Decode BeaconChainHead from JSON
pub fn beaconFromJson(allocator: Allocator, json_str: []const u8) !BeaconChainHead {
    const parsed = try json.parseFromSlice(json.Value, allocator, json_str, .{});
    defer parsed.deinit();

    const obj = parsed.value.object;

    // Parse slot (decimal string in beacon APIs)
    const slot_str = obj.get("slot").?.string;
    const slot = try std.fmt.parseInt(u64, slot_str, 10);

    // Parse block root (hex string)
    const block_str = obj.get("block").?.string;
    var block: [32]u8 = undefined;
    const block_hex = if (std.mem.startsWith(u8, block_str, "0x")) block_str[2..] else block_str;
    _ = try std.fmt.hexToBytes(&block, block_hex);

    // Parse state root (hex string)
    const state_str = obj.get("state").?.string;
    var state: [32]u8 = undefined;
    const state_hex = if (std.mem.startsWith(u8, state_str, "0x")) state_str[2..] else state_str;
    _ = try std.fmt.hexToBytes(&state, state_hex);

    return .{
        .slot = slot,
        .block = block,
        .state = state,
    };
}

// ============================================================================
// Tests
// ============================================================================

test "ChainHead.from creates chain head" {
    const hash: BlockHash.BlockHash = [_]u8{0xab} ** 32;
    const head = from(.{
        .number = 18000000,
        .hash = hash,
        .timestamp = 1699000000,
    });

    try std.testing.expectEqual(@as(BlockNumber.BlockNumber, 18000000), head.number);
    try std.testing.expectEqual(@as(u256, 1699000000), head.timestamp);
}

test "ChainHead.fromFields creates chain head" {
    const hash: BlockHash.BlockHash = [_]u8{0xcd} ** 32;
    const head = fromFields(18000000, hash, 1699000000);

    try std.testing.expectEqual(@as(BlockNumber.BlockNumber, 18000000), head.number);
    try std.testing.expect(head.difficulty == null);
}

test "ChainHead.fromFieldsWithDifficulty creates chain head" {
    const hash: BlockHash.BlockHash = [_]u8{0xef} ** 32;
    const head = fromFieldsWithDifficulty(
        15000000,
        hash,
        1680000000,
        0, // post-merge
        58750003716598352816469,
    );

    try std.testing.expect(head.difficulty != null);
    try std.testing.expectEqual(@as(u256, 0), head.difficulty.?);
    try std.testing.expect(head.total_difficulty != null);
}

test "ChainHead.isPostMerge detects post-merge blocks" {
    const hash: BlockHash.BlockHash = [_]u8{0x11} ** 32;

    // Post-merge (difficulty = 0)
    const post_merge = from(.{
        .number = 18000000,
        .hash = hash,
        .timestamp = 1699000000,
        .difficulty = 0,
    });
    try std.testing.expect(isPostMerge(post_merge));

    // Pre-merge (difficulty > 0)
    const pre_merge = from(.{
        .number = 15000000,
        .hash = hash,
        .timestamp = 1680000000,
        .difficulty = 13000000000000000,
    });
    try std.testing.expect(!isPostMerge(pre_merge));

    // No difficulty set (assume post-merge)
    const no_difficulty = from(.{
        .number = 18000000,
        .hash = hash,
        .timestamp = 1699000000,
    });
    try std.testing.expect(isPostMerge(no_difficulty));
}

test "ChainHead.equals compares chain heads" {
    const hash1: BlockHash.BlockHash = [_]u8{0x22} ** 32;
    const hash2: BlockHash.BlockHash = [_]u8{0x33} ** 32;

    const head1 = from(.{
        .number = 18000000,
        .hash = hash1,
        .timestamp = 1699000000,
    });

    const head2 = from(.{
        .number = 18000000,
        .hash = hash1,
        .timestamp = 1699000000,
    });

    const head3 = from(.{
        .number = 18000001,
        .hash = hash2,
        .timestamp = 1699000012,
    });

    try std.testing.expect(equals(head1, head2));
    try std.testing.expect(!equals(head1, head3));
}

test "ChainHead accessors work correctly" {
    const hash: BlockHash.BlockHash = [_]u8{0x44} ** 32;
    const head = from(.{
        .number = 18000000,
        .hash = hash,
        .timestamp = 1699000000,
        .difficulty = 0,
        .total_difficulty = 58750003716598352816469,
    });

    try std.testing.expectEqual(@as(BlockNumber.BlockNumber, 18000000), getNumber(head));
    try std.testing.expectEqualSlices(u8, &hash, &getHash(head));
    try std.testing.expectEqual(@as(u256, 1699000000), getTimestamp(head));
    try std.testing.expect(getDifficulty(head) != null);
    try std.testing.expect(getTotalDifficulty(head) != null);
}

test "ChainHead.toJson encodes correctly" {
    const allocator = std.testing.allocator;
    const hash: BlockHash.BlockHash = [_]u8{0xab} ** 32;
    const head = from(.{
        .number = 18000000,
        .hash = hash,
        .timestamp = 1699000000,
    });

    const json_str = try toJson(head, allocator);
    defer allocator.free(json_str);

    try std.testing.expect(std.mem.indexOf(u8, json_str, "\"number\":\"0x") != null);
    try std.testing.expect(std.mem.indexOf(u8, json_str, "\"hash\":\"0x") != null);
    try std.testing.expect(std.mem.indexOf(u8, json_str, "\"timestamp\":\"0x") != null);
}

test "ChainHead.fromJson decodes correctly" {
    const allocator = std.testing.allocator;
    const json_str =
        \\{"number":"0x112a880","hash":"0xabababababababababababababababababababababababababababababababab","timestamp":"0x654d4740"}
    ;

    const head = try fromJson(allocator, json_str);

    try std.testing.expectEqual(@as(u64, 18000000), head.number);
    try std.testing.expectEqual(@as(u256, 1699000000), head.timestamp);
    try std.testing.expectEqual(@as(u8, 0xab), head.hash[0]);
}

test "ChainHead JSON roundtrip" {
    const allocator = std.testing.allocator;
    const hash: BlockHash.BlockHash = [_]u8{0xcd} ** 32;
    const original = from(.{
        .number = 15000000,
        .hash = hash,
        .timestamp = 1680000000,
        .difficulty = 0,
    });

    const json_str = try toJson(original, allocator);
    defer allocator.free(json_str);

    const decoded = try fromJson(allocator, json_str);

    try std.testing.expectEqual(original.number, decoded.number);
    try std.testing.expectEqual(original.timestamp, decoded.timestamp);
    try std.testing.expectEqualSlices(u8, &original.hash, &decoded.hash);
}

// ============================================================================
// BeaconChainHead Tests
// ============================================================================

test "BeaconChainHead.beaconFrom creates beacon head" {
    const block: [32]u8 = [_]u8{0xaa} ** 32;
    const state: [32]u8 = [_]u8{0xbb} ** 32;
    const head = beaconFrom(.{
        .slot = 7000000,
        .block = block,
        .state = state,
    });

    try std.testing.expectEqual(@as(u64, 7000000), head.slot);
    try std.testing.expectEqualSlices(u8, &block, &head.block);
    try std.testing.expectEqualSlices(u8, &state, &head.state);
}

test "BeaconChainHead.beaconFromFields creates beacon head" {
    const block: [32]u8 = [_]u8{0xcc} ** 32;
    const state: [32]u8 = [_]u8{0xdd} ** 32;
    const head = beaconFromFields(8000000, block, state);

    try std.testing.expectEqual(@as(u64, 8000000), head.slot);
}

test "BeaconChainHead.beaconEquals compares beacon heads" {
    const block1: [32]u8 = [_]u8{0x11} ** 32;
    const state1: [32]u8 = [_]u8{0x22} ** 32;
    const block2: [32]u8 = [_]u8{0x33} ** 32;
    const state2: [32]u8 = [_]u8{0x44} ** 32;

    const head1 = beaconFrom(.{ .slot = 7000000, .block = block1, .state = state1 });
    const head2 = beaconFrom(.{ .slot = 7000000, .block = block1, .state = state1 });
    const head3 = beaconFrom(.{ .slot = 7000001, .block = block2, .state = state2 });

    try std.testing.expect(beaconEquals(head1, head2));
    try std.testing.expect(!beaconEquals(head1, head3));
}

test "BeaconChainHead.beaconToJson encodes correctly" {
    const allocator = std.testing.allocator;
    const block: [32]u8 = [_]u8{0xab} ** 32;
    const state: [32]u8 = [_]u8{0xcd} ** 32;
    const head = beaconFrom(.{
        .slot = 7000000,
        .block = block,
        .state = state,
    });

    const json_str = try beaconToJson(head, allocator);
    defer allocator.free(json_str);

    try std.testing.expect(std.mem.indexOf(u8, json_str, "\"slot\":\"7000000\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json_str, "\"block\":\"0x") != null);
    try std.testing.expect(std.mem.indexOf(u8, json_str, "\"state\":\"0x") != null);
}

test "BeaconChainHead.beaconFromJson decodes correctly" {
    const allocator = std.testing.allocator;
    const json_str =
        \\{"slot":"7000000","block":"0xabababababababababababababababababababababababababababababababab","state":"0xcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd"}
    ;

    const head = try beaconFromJson(allocator, json_str);

    try std.testing.expectEqual(@as(u64, 7000000), head.slot);
    try std.testing.expectEqual(@as(u8, 0xab), head.block[0]);
    try std.testing.expectEqual(@as(u8, 0xcd), head.state[0]);
}

test "BeaconChainHead JSON roundtrip" {
    const allocator = std.testing.allocator;
    const block: [32]u8 = [_]u8{0xef} ** 32;
    const state: [32]u8 = [_]u8{0x12} ** 32;
    const original = beaconFrom(.{
        .slot = 9000000,
        .block = block,
        .state = state,
    });

    const json_str = try beaconToJson(original, allocator);
    defer allocator.free(json_str);

    const decoded = try beaconFromJson(allocator, json_str);

    try std.testing.expectEqual(original.slot, decoded.slot);
    try std.testing.expectEqualSlices(u8, &original.block, &decoded.block);
    try std.testing.expectEqualSlices(u8, &original.state, &decoded.state);
}
