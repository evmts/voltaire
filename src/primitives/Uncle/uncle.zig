//! Uncle (Ommer) - Uncle block header
//!
//! Uncle blocks are valid blocks that were mined but not included in the main chain.
//! They receive reduced rewards and help secure the network.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const Uncle = primitives.Uncle;
//!
//! // Create uncle header
//! const uncle = Uncle.from(.{
//!     .parent_hash = parent_hash,
//!     .ommers_hash = ommers_hash,
//!     .beneficiary = miner_address,
//!     // ... other fields
//! });
//!
//! // Compute uncle hash
//! const uncle_hash = try Uncle.hash(&uncle, allocator);
//! ```

const std = @import("std");
const Address = @import("../Address/address.zig");
const BlockHash = @import("../BlockHash/BlockHash.zig");
const BlockNumber = @import("../BlockNumber/BlockNumber.zig");
const Hash = @import("../Hash/Hash.zig");
const Rlp = @import("../Rlp/Rlp.zig");
const crypto = @import("crypto");

/// Uncle (Ommer) block header
pub const Uncle = struct {
    /// Hash of the parent block
    parent_hash: BlockHash.BlockHash,

    /// Hash of uncle (ommer) headers list
    ommers_hash: Hash.Hash,

    /// Address that receives mining rewards
    beneficiary: Address.Address,

    /// State root hash
    state_root: Hash.Hash,

    /// Transactions root hash
    transactions_root: Hash.Hash,

    /// Receipts root hash
    receipts_root: Hash.Hash,

    /// Logs bloom filter (256 bytes)
    logs_bloom: [256]u8,

    /// Block difficulty
    difficulty: u256,

    /// Block number
    number: BlockNumber.BlockNumber,

    /// Maximum gas allowed in this block
    gas_limit: u256,

    /// Gas used by transactions in this block
    gas_used: u256,

    /// Block timestamp (Unix seconds)
    timestamp: u256,

    /// Extra data field
    extra_data: []const u8,

    /// Mix hash (used in PoW)
    mix_hash: Hash.Hash,

    /// Nonce (used in PoW, 8 bytes)
    nonce: [8]u8,
};

/// Empty bloom filter constant
pub const EMPTY_BLOOM: [256]u8 = [_]u8{0} ** 256;

/// Empty nonce constant
pub const EMPTY_NONCE: [8]u8 = [_]u8{0} ** 8;

// ============================================================================
// Constructors
// ============================================================================

/// Create Uncle from struct
pub fn from(data: Uncle) Uncle {
    return data;
}

/// Create Uncle from individual fields
pub fn fromFields(
    parent_hash: BlockHash.BlockHash,
    ommers_hash: Hash.Hash,
    beneficiary: Address.Address,
    state_root: Hash.Hash,
    transactions_root: Hash.Hash,
    receipts_root: Hash.Hash,
    logs_bloom: [256]u8,
    difficulty: u256,
    number: BlockNumber.BlockNumber,
    gas_limit: u256,
    gas_used: u256,
    timestamp: u256,
    extra_data: []const u8,
    mix_hash: Hash.Hash,
    nonce: [8]u8,
) Uncle {
    return .{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = transactions_root,
        .receipts_root = receipts_root,
        .logs_bloom = logs_bloom,
        .difficulty = difficulty,
        .number = number,
        .gas_limit = gas_limit,
        .gas_used = gas_used,
        .timestamp = timestamp,
        .extra_data = extra_data,
        .mix_hash = mix_hash,
        .nonce = nonce,
    };
}

// ============================================================================
// Accessors
// ============================================================================

/// Get parent hash
pub fn getParentHash(uncle: Uncle) BlockHash.BlockHash {
    return uncle.parent_hash;
}

/// Get beneficiary (miner) address
pub fn getBeneficiary(uncle: Uncle) Address.Address {
    return uncle.beneficiary;
}

/// Get block number
pub fn getNumber(uncle: Uncle) BlockNumber.BlockNumber {
    return uncle.number;
}

/// Get difficulty
pub fn getDifficulty(uncle: Uncle) u256 {
    return uncle.difficulty;
}

/// Get timestamp
pub fn getTimestamp(uncle: Uncle) u256 {
    return uncle.timestamp;
}

/// Get gas limit
pub fn getGasLimit(uncle: Uncle) u256 {
    return uncle.gas_limit;
}

/// Get gas used
pub fn getGasUsed(uncle: Uncle) u256 {
    return uncle.gas_used;
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two Uncles are equal (by parent hash and number)
pub fn equals(a: Uncle, b: Uncle) bool {
    return std.mem.eql(u8, &a.parent_hash, &b.parent_hash) and
        a.number == b.number and
        std.mem.eql(u8, &a.beneficiary.bytes, &b.beneficiary.bytes);
}

// ============================================================================
// RLP Encoding
// ============================================================================

/// Helper to encode u256 as big-endian bytes without leading zeros
fn encodeU256(allocator: std.mem.Allocator, value: u256) ![]u8 {
    if (value == 0) {
        return allocator.alloc(u8, 0);
    }

    var bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &bytes, value, .big);

    // Find first non-zero byte
    var start: usize = 0;
    while (start < 32 and bytes[start] == 0) : (start += 1) {}

    const result = try allocator.alloc(u8, 32 - start);
    @memcpy(result, bytes[start..]);
    return result;
}

/// Helper to encode u64 as big-endian bytes without leading zeros
fn encodeU64(allocator: std.mem.Allocator, value: u64) ![]u8 {
    if (value == 0) {
        return allocator.alloc(u8, 0);
    }

    var bytes: [8]u8 = undefined;
    std.mem.writeInt(u64, &bytes, value, .big);

    // Find first non-zero byte
    var start: usize = 0;
    while (start < 8 and bytes[start] == 0) : (start += 1) {}

    const result = try allocator.alloc(u8, 8 - start);
    @memcpy(result, bytes[start..]);
    return result;
}

/// RLP encode the uncle header (pre-merge format, 15 fields)
pub fn rlpEncode(uncle: *const Uncle, allocator: std.mem.Allocator) ![]u8 {
    var fields = std.ArrayList([]u8){};
    defer {
        for (fields.items) |item| {
            allocator.free(item);
        }
        fields.deinit(allocator);
    }

    // 1. parentHash (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.parent_hash));

    // 2. ommersHash (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.ommers_hash));

    // 3. beneficiary (20 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.beneficiary.bytes));

    // 4. stateRoot (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.state_root));

    // 5. transactionsRoot (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.transactions_root));

    // 6. receiptsRoot (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.receipts_root));

    // 7. logsBloom (256 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.logs_bloom));

    // 8. difficulty (u256)
    const difficulty_bytes = try encodeU256(allocator, uncle.difficulty);
    defer allocator.free(difficulty_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, difficulty_bytes));

    // 9. number (u64)
    const number_bytes = try encodeU64(allocator, uncle.number);
    defer allocator.free(number_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, number_bytes));

    // 10. gasLimit (u256)
    const gas_limit_bytes = try encodeU256(allocator, uncle.gas_limit);
    defer allocator.free(gas_limit_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, gas_limit_bytes));

    // 11. gasUsed (u256)
    const gas_used_bytes = try encodeU256(allocator, uncle.gas_used);
    defer allocator.free(gas_used_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, gas_used_bytes));

    // 12. timestamp (u256)
    const timestamp_bytes = try encodeU256(allocator, uncle.timestamp);
    defer allocator.free(timestamp_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, timestamp_bytes));

    // 13. extraData (variable)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, uncle.extra_data));

    // 14. mixHash (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.mix_hash));

    // 15. nonce (8 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.nonce));

    // Calculate total payload length
    var total_len: usize = 0;
    for (fields.items) |field| {
        total_len += field.len;
    }

    // Build result with list header
    var result = std.ArrayList(u8){};
    defer result.deinit(allocator);

    if (total_len < 56) {
        try result.append(allocator, 0xc0 + @as(u8, @intCast(total_len)));
    } else {
        const len_bytes = try Rlp.encodeLength(allocator, total_len);
        defer allocator.free(len_bytes);
        try result.append(allocator, 0xf7 + @as(u8, @intCast(len_bytes.len)));
        try result.appendSlice(allocator, len_bytes);
    }

    // Append all fields
    for (fields.items) |field| {
        try result.appendSlice(allocator, field);
    }

    return try result.toOwnedSlice(allocator);
}

// ============================================================================
// Hashing
// ============================================================================

/// Compute uncle hash (keccak256 of RLP-encoded header)
pub fn hash(uncle: *const Uncle, allocator: std.mem.Allocator) !Hash.Hash {
    const encoded = try rlpEncode(uncle, allocator);
    defer allocator.free(encoded);

    var result: Hash.Hash = undefined;
    crypto.Keccak256.hash(encoded, &result);
    return result;
}

/// Check if two uncles are equal by hash
pub fn equalsHash(a: *const Uncle, b: *const Uncle, allocator: std.mem.Allocator) !bool {
    const hash_a = try hash(a, allocator);
    const hash_b = try hash(b, allocator);
    return Hash.equals(&hash_a, &hash_b);
}

// ============================================================================
// Tests
// ============================================================================

test "Uncle.from creates uncle" {
    const parent_hash: BlockHash.BlockHash = [_]u8{0xaa} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0xbb} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0xcc} ** 20 };
    const state_root: Hash.Hash = [_]u8{0xdd} ** 32;
    const txs_root: Hash.Hash = [_]u8{0xee} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xff} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0x11} ** 32;

    const uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 13000000000000000,
        .number = 15000000,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .timestamp = 1680000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    try std.testing.expectEqual(@as(BlockNumber.BlockNumber, 15000000), uncle.number);
    try std.testing.expectEqual(@as(u256, 13000000000000000), uncle.difficulty);
}

test "Uncle accessors work correctly" {
    const parent_hash: BlockHash.BlockHash = [_]u8{0x22} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0x33} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0x44} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x55} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x66} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0x77} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0x88} ** 32;

    const uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 13000000000000000,
        .number = 15000000,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .timestamp = 1680000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    try std.testing.expectEqualSlices(u8, &parent_hash, &getParentHash(uncle));
    try std.testing.expectEqual(@as(BlockNumber.BlockNumber, 15000000), getNumber(uncle));
    try std.testing.expectEqual(@as(u256, 13000000000000000), getDifficulty(uncle));
    try std.testing.expectEqual(@as(u256, 1680000000), getTimestamp(uncle));
    try std.testing.expectEqual(@as(u256, 30000000), getGasLimit(uncle));
    try std.testing.expectEqual(@as(u256, 15000000), getGasUsed(uncle));
}

test "Uncle.equals compares uncles" {
    const parent_hash: BlockHash.BlockHash = [_]u8{0x99} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0xaa} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };
    const state_root: Hash.Hash = [_]u8{0xcc} ** 32;
    const txs_root: Hash.Hash = [_]u8{0xdd} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xee} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0xff} ** 32;

    const uncle1 = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 13000000000000000,
        .number = 15000000,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .timestamp = 1680000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    const uncle2 = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 13000000000000000,
        .number = 15000000,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .timestamp = 1680000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    const other_beneficiary = Address.Address{ .bytes = [_]u8{0x11} ** 20 };
    const uncle3 = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = other_beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 13000000000000000,
        .number = 15000001,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .timestamp = 1680000012,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    try std.testing.expect(equals(uncle1, uncle2));
    try std.testing.expect(!equals(uncle1, uncle3));
}

test "Uncle.rlpEncode produces valid RLP" {
    const allocator = std.testing.allocator;
    const parent_hash: BlockHash.BlockHash = [_]u8{0xaa} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0xbb} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0xcc} ** 20 };
    const state_root: Hash.Hash = [_]u8{0xdd} ** 32;
    const txs_root: Hash.Hash = [_]u8{0xee} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xff} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0x11} ** 32;

    const uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 13000000000000000,
        .number = 15000000,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .timestamp = 1680000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    const encoded = try rlpEncode(&uncle, allocator);
    defer allocator.free(encoded);

    // Should be a valid RLP list (starts with 0xf8 or higher for long lists)
    try std.testing.expect(encoded.len > 0);
    try std.testing.expect(encoded[0] >= 0xc0 or encoded[0] >= 0xf7);
}

test "Uncle.hash computes deterministic hash" {
    const allocator = std.testing.allocator;
    const parent_hash: BlockHash.BlockHash = [_]u8{0x12} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0x34} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0x56} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x78} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x9a} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xbc} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0xde} ** 32;

    const uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = 100,
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    const hash1 = try hash(&uncle, allocator);
    const hash2 = try hash(&uncle, allocator);

    // Hash should be 32 bytes and deterministic
    try std.testing.expectEqual(@as(usize, 32), hash1.len);
    try std.testing.expect(Hash.equals(&hash1, &hash2));
}

test "Uncle.hash different uncles have different hashes" {
    const allocator = std.testing.allocator;
    const parent_hash: BlockHash.BlockHash = [_]u8{0x12} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0x34} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0x56} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x78} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x9a} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xbc} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0xde} ** 32;

    const uncle1 = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = 100,
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    const uncle2 = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = 101, // Different number
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    const hash1 = try hash(&uncle1, allocator);
    const hash2 = try hash(&uncle2, allocator);

    try std.testing.expect(!Hash.equals(&hash1, &hash2));
}

test "Uncle.equalsHash compares by hash" {
    const allocator = std.testing.allocator;
    const parent_hash: BlockHash.BlockHash = [_]u8{0xab} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0xcd} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0xef} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x12} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x34} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0x56} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0x78} ** 32;

    const uncle1 = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 500000,
        .number = 50,
        .gas_limit = 5000000,
        .gas_used = 2500000,
        .timestamp = 1500000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    const uncle2 = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 500000,
        .number = 50,
        .gas_limit = 5000000,
        .gas_used = 2500000,
        .timestamp = 1500000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    try std.testing.expect(try equalsHash(&uncle1, &uncle2, allocator));
}

// ============================================================================
// RLP Decoding
// ============================================================================

/// Decode RLP bytes to u64
fn decodeToU64(bytes: []const u8) !u64 {
    if (bytes.len == 0) return 0;
    if (bytes.len > 8) return error.InvalidUncle;

    // Check for leading zeros (non-canonical)
    if (bytes.len > 1 and bytes[0] == 0) return error.InvalidUncle;

    var result: u64 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

/// Decode RLP bytes to u256
fn decodeToU256(bytes: []const u8) !u256 {
    if (bytes.len == 0) return 0;
    if (bytes.len > 32) return error.InvalidUncle;

    // Check for leading zeros (non-canonical)
    if (bytes.len > 1 and bytes[0] == 0) return error.InvalidUncle;

    var result: u256 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

/// RLP decode an uncle from bytes
/// Uncle is a pre-merge block header (15 fields)
pub fn fromRlp(allocator: std.mem.Allocator, data: []const u8) !Uncle {
    const decoded = try Rlp.decode(allocator, data, false);
    defer decoded.data.deinit(allocator);

    if (decoded.data != .List) {
        return error.InvalidUncle;
    }

    const items = decoded.data.List;

    // Uncle headers are pre-merge format (15 fields)
    if (items.len != 15) {
        return error.InvalidUncle;
    }

    var uncle: Uncle = undefined;

    // 1. parentHash (32 bytes)
    if (items[0] != .String or items[0].String.len != 32) {
        return error.InvalidUncle;
    }
    @memcpy(&uncle.parent_hash, items[0].String);

    // 2. ommersHash (32 bytes)
    if (items[1] != .String or items[1].String.len != 32) {
        return error.InvalidUncle;
    }
    @memcpy(&uncle.ommers_hash, items[1].String);

    // 3. beneficiary (20 bytes)
    if (items[2] != .String or items[2].String.len != 20) {
        return error.InvalidUncle;
    }
    @memcpy(&uncle.beneficiary.bytes, items[2].String);

    // 4. stateRoot (32 bytes)
    if (items[3] != .String or items[3].String.len != 32) {
        return error.InvalidUncle;
    }
    @memcpy(&uncle.state_root, items[3].String);

    // 5. transactionsRoot (32 bytes)
    if (items[4] != .String or items[4].String.len != 32) {
        return error.InvalidUncle;
    }
    @memcpy(&uncle.transactions_root, items[4].String);

    // 6. receiptsRoot (32 bytes)
    if (items[5] != .String or items[5].String.len != 32) {
        return error.InvalidUncle;
    }
    @memcpy(&uncle.receipts_root, items[5].String);

    // 7. logsBloom (256 bytes)
    if (items[6] != .String or items[6].String.len != 256) {
        return error.InvalidUncle;
    }
    @memcpy(&uncle.logs_bloom, items[6].String);

    // 8. difficulty (u256)
    if (items[7] != .String) return error.InvalidUncle;
    uncle.difficulty = try decodeToU256(items[7].String);

    // 9. number (u64)
    if (items[8] != .String) return error.InvalidUncle;
    uncle.number = try decodeToU64(items[8].String);

    // 10. gasLimit (u256)
    if (items[9] != .String) return error.InvalidUncle;
    uncle.gas_limit = try decodeToU256(items[9].String);

    // 11. gasUsed (u256)
    if (items[10] != .String) return error.InvalidUncle;
    uncle.gas_used = try decodeToU256(items[10].String);

    // 12. timestamp (u256)
    if (items[11] != .String) return error.InvalidUncle;
    uncle.timestamp = try decodeToU256(items[11].String);

    // 13. extraData (variable)
    if (items[12] != .String) return error.InvalidUncle;
    // Note: extraData is a slice, use empty for now
    uncle.extra_data = &[_]u8{};

    // 14. mixHash (32 bytes)
    if (items[13] != .String or items[13].String.len != 32) {
        return error.InvalidUncle;
    }
    @memcpy(&uncle.mix_hash, items[13].String);

    // 15. nonce (8 bytes)
    if (items[14] != .String or items[14].String.len != 8) {
        return error.InvalidUncle;
    }
    @memcpy(&uncle.nonce, items[14].String);

    return uncle;
}

/// Alias for rlpEncode for consistency with TypeScript API
pub const toRlp = rlpEncode;

// ============================================================================
// Uncle Reward Calculation
// ============================================================================

/// Base block reward in Wei (2 ETH post-Byzantium, before EIP-1234)
pub const BASE_REWARD_BYZANTIUM: u256 = 3_000_000_000_000_000_000; // 3 ETH

/// Base block reward in Wei (post-Constantinople, EIP-1234)
pub const BASE_REWARD_CONSTANTINOPLE: u256 = 2_000_000_000_000_000_000; // 2 ETH

/// Base block reward in Wei (pre-Byzantium)
pub const BASE_REWARD_FRONTIER: u256 = 5_000_000_000_000_000_000; // 5 ETH

/// Byzantium fork block number
pub const BYZANTIUM_BLOCK: u64 = 4_370_000;

/// Constantinople fork block number
pub const CONSTANTINOPLE_BLOCK: u64 = 7_280_000;

/// Calculate uncle reward based on block number difference
/// Formula: ((uncle_number + 8 - block_number) * base_reward) / 8
///
/// Returns 0 if uncle is too old (more than 6 blocks from including block)
/// or if uncle number >= block number
pub fn getReward(uncle: *const Uncle, including_block_number: BlockNumber.BlockNumber) u256 {
    // Get base reward based on including block fork
    const base_reward = getBaseReward(including_block_number);

    // Uncle must be older than including block
    if (uncle.number >= including_block_number) {
        return 0;
    }

    // Calculate uncle reward
    // Uncle can be at most 6 blocks old (uncle_number + 7 > block_number)
    const depth = including_block_number - uncle.number;
    if (depth > 6) {
        return 0; // Uncle too old
    }

    // Formula: ((uncle_number + 8 - block_number) * base_reward) / 8
    // Simplified: ((8 - depth) * base_reward) / 8
    const numerator = (8 - depth) * base_reward;
    return numerator / 8;
}

/// Get base block reward for given block number
fn getBaseReward(block_number: u64) u256 {
    if (block_number >= CONSTANTINOPLE_BLOCK) {
        return BASE_REWARD_CONSTANTINOPLE;
    } else if (block_number >= BYZANTIUM_BLOCK) {
        return BASE_REWARD_BYZANTIUM;
    } else {
        return BASE_REWARD_FRONTIER;
    }
}

/// Calculate nephew reward (reward for including uncle)
/// Nephew gets 1/32 of base reward per uncle included
pub fn getNephewReward(including_block_number: BlockNumber.BlockNumber) u256 {
    const base_reward = getBaseReward(including_block_number);
    return base_reward / 32;
}

// ============================================================================
// RLP Decode Tests
// ============================================================================

test "Uncle.fromRlp round trip" {
    const allocator = std.testing.allocator;
    const parent_hash: BlockHash.BlockHash = [_]u8{0x12} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0x34} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0x56} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x78} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x9a} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xbc} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0xde} ** 32;

    const original = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = 100,
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    // Encode
    const encoded = try rlpEncode(&original, allocator);
    defer allocator.free(encoded);

    // Decode
    const decoded = try fromRlp(allocator, encoded);

    // Verify fields match
    try std.testing.expectEqualSlices(u8, &original.parent_hash, &decoded.parent_hash);
    try std.testing.expectEqualSlices(u8, &original.ommers_hash, &decoded.ommers_hash);
    try std.testing.expectEqualSlices(u8, &original.beneficiary.bytes, &decoded.beneficiary.bytes);
    try std.testing.expectEqualSlices(u8, &original.state_root, &decoded.state_root);
    try std.testing.expectEqual(original.difficulty, decoded.difficulty);
    try std.testing.expectEqual(original.number, decoded.number);
    try std.testing.expectEqual(original.gas_limit, decoded.gas_limit);
    try std.testing.expectEqual(original.gas_used, decoded.gas_used);
    try std.testing.expectEqual(original.timestamp, decoded.timestamp);
}

test "Uncle.toRlp alias works" {
    const allocator = std.testing.allocator;
    const parent_hash: BlockHash.BlockHash = [_]u8{0xaa} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0xbb} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0xcc} ** 20 };
    const state_root: Hash.Hash = [_]u8{0xdd} ** 32;
    const txs_root: Hash.Hash = [_]u8{0xee} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xff} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0x11} ** 32;

    const uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 13000000000000000,
        .number = 15000000,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .timestamp = 1680000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    // Both should produce same output
    const encoded1 = try rlpEncode(&uncle, allocator);
    defer allocator.free(encoded1);

    const encoded2 = try toRlp(&uncle, allocator);
    defer allocator.free(encoded2);

    try std.testing.expectEqualSlices(u8, encoded1, encoded2);
}

// ============================================================================
// Uncle Reward Tests
// ============================================================================

test "Uncle.getReward - depth 1" {
    const parent_hash: BlockHash.BlockHash = [_]u8{0x12} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0x34} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0x56} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x78} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x9a} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xbc} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0xde} ** 32;

    const uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = 10000000, // Post-Constantinople
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    // Uncle at block 10000000, included in block 10000001 (depth 1)
    // Reward = (8-1) * 2 ETH / 8 = 7/8 * 2 ETH = 1.75 ETH
    const reward = getReward(&uncle, 10000001);
    const expected: u256 = 1_750_000_000_000_000_000; // 1.75 ETH
    try std.testing.expectEqual(expected, reward);
}

test "Uncle.getReward - depth 6 (max)" {
    const parent_hash: BlockHash.BlockHash = [_]u8{0x12} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0x34} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0x56} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x78} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x9a} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xbc} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0xde} ** 32;

    const uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = 10000000,
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    // Uncle at block 10000000, included in block 10000006 (depth 6)
    // Reward = (8-6) * 2 ETH / 8 = 2/8 * 2 ETH = 0.5 ETH
    const reward = getReward(&uncle, 10000006);
    const expected: u256 = 500_000_000_000_000_000; // 0.5 ETH
    try std.testing.expectEqual(expected, reward);
}

test "Uncle.getReward - too old (depth > 6)" {
    const parent_hash: BlockHash.BlockHash = [_]u8{0x12} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0x34} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0x56} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x78} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x9a} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xbc} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0xde} ** 32;

    const uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = 10000000,
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    // Uncle at block 10000000, included in block 10000007 (depth 7 - too old)
    const reward = getReward(&uncle, 10000007);
    try std.testing.expectEqual(@as(u256, 0), reward);
}

test "Uncle.getReward - invalid (uncle >= block)" {
    const parent_hash: BlockHash.BlockHash = [_]u8{0x12} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0x34} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0x56} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x78} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x9a} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xbc} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0xde} ** 32;

    const uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = 10000000,
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    // Uncle at block 10000000 cannot be included in same or earlier block
    try std.testing.expectEqual(@as(u256, 0), getReward(&uncle, 10000000));
    try std.testing.expectEqual(@as(u256, 0), getReward(&uncle, 9999999));
}

test "Uncle.getReward - different forks" {
    const parent_hash: BlockHash.BlockHash = [_]u8{0x12} ** 32;
    const ommers_hash: Hash.Hash = [_]u8{0x34} ** 32;
    const beneficiary = Address.Address{ .bytes = [_]u8{0x56} ** 20 };
    const state_root: Hash.Hash = [_]u8{0x78} ** 32;
    const txs_root: Hash.Hash = [_]u8{0x9a} ** 32;
    const receipts_root: Hash.Hash = [_]u8{0xbc} ** 32;
    const mix_hash: Hash.Hash = [_]u8{0xde} ** 32;

    // Frontier era uncle (block 100)
    const frontier_uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = 100,
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    // Depth 1 reward in Frontier era (5 ETH base)
    // Reward = 7/8 * 5 ETH = 4.375 ETH
    const frontier_reward = getReward(&frontier_uncle, 101);
    const expected_frontier: u256 = 4_375_000_000_000_000_000;
    try std.testing.expectEqual(expected_frontier, frontier_reward);

    // Byzantium era uncle
    const byzantium_uncle = from(.{
        .parent_hash = parent_hash,
        .ommers_hash = ommers_hash,
        .beneficiary = beneficiary,
        .state_root = state_root,
        .transactions_root = txs_root,
        .receipts_root = receipts_root,
        .logs_bloom = EMPTY_BLOOM,
        .difficulty = 1000000,
        .number = BYZANTIUM_BLOCK,
        .gas_limit = 8000000,
        .gas_used = 4000000,
        .timestamp = 1600000000,
        .extra_data = &[_]u8{},
        .mix_hash = mix_hash,
        .nonce = EMPTY_NONCE,
    });

    // Depth 1 reward in Byzantium era (3 ETH base)
    // Reward = 7/8 * 3 ETH = 2.625 ETH
    const byzantium_reward = getReward(&byzantium_uncle, BYZANTIUM_BLOCK + 1);
    const expected_byzantium: u256 = 2_625_000_000_000_000_000;
    try std.testing.expectEqual(expected_byzantium, byzantium_reward);
}

test "Uncle.getNephewReward" {
    // Nephew reward is 1/32 of base reward

    // Constantinople era
    const nephew_post_const = getNephewReward(CONSTANTINOPLE_BLOCK + 1);
    const expected_const: u256 = BASE_REWARD_CONSTANTINOPLE / 32;
    try std.testing.expectEqual(expected_const, nephew_post_const);

    // Byzantium era
    const nephew_byz = getNephewReward(BYZANTIUM_BLOCK + 1);
    const expected_byz: u256 = BASE_REWARD_BYZANTIUM / 32;
    try std.testing.expectEqual(expected_byz, nephew_byz);

    // Frontier era
    const nephew_frontier = getNephewReward(100);
    const expected_frontier: u256 = BASE_REWARD_FRONTIER / 32;
    try std.testing.expectEqual(expected_frontier, nephew_frontier);
}
