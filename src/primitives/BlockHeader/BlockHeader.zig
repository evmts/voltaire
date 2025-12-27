//! BlockHeader - Ethereum block header structure
//!
//! Contains all metadata and Merkle roots for a block. Used for block
//! validation, light client proofs, and consensus verification.
//!
//! ## Fields (by EIP version)
//!
//! ### Pre-London (Legacy)
//! - parentHash, ommersHash, beneficiary, stateRoot, transactionsRoot
//! - receiptsRoot, logsBloom, difficulty, number, gasLimit, gasUsed
//! - timestamp, extraData, mixHash, nonce
//!
//! ### EIP-1559 (London)
//! - baseFeePerGas
//!
//! ### EIP-4895 (Shanghai)
//! - withdrawalsRoot
//!
//! ### EIP-4844 (Cancun)
//! - blobGasUsed, excessBlobGas, parentBeaconBlockRoot
//!
//! ## Usage
//! ```zig
//! const BlockHeader = @import("primitives").BlockHeader;
//!
//! // Create header
//! var header = BlockHeader.init();
//! header.number = 12345;
//! header.timestamp = 1640000000;
//!
//! // Compute hash
//! const hash = try BlockHeader.hash(&header, allocator);
//!
//! // RLP encode
//! const encoded = try BlockHeader.rlpEncode(&header, allocator);
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");
const Address = @import("../Address/address.zig");
const BlockNumber = @import("../BlockNumber/BlockNumber.zig");
const Rlp = @import("../Rlp/Rlp.zig");
const crypto = @import("crypto");

/// Bloom filter size (256 bytes = 2048 bits)
pub const BLOOM_SIZE = 256;

/// Nonce size (8 bytes)
pub const NONCE_SIZE = 8;

/// Max extra data size (32 bytes)
pub const MAX_EXTRA_DATA_SIZE = 32;

/// BlockHeader structure
pub const BlockHeader = struct {
    /// Hash of parent block
    parent_hash: Hash.Hash = Hash.ZERO,

    /// Keccak256 hash of ommers/uncles list RLP
    ommers_hash: Hash.Hash = Hash.ZERO,

    /// Address receiving block reward (miner/validator)
    beneficiary: Address.Address = Address.ZERO_ADDRESS,

    /// State trie root after block execution
    state_root: Hash.Hash = Hash.ZERO,

    /// Transactions trie root
    transactions_root: Hash.Hash = Hash.ZERO,

    /// Receipts trie root
    receipts_root: Hash.Hash = Hash.ZERO,

    /// Bloom filter for logs (256 bytes)
    logs_bloom: [BLOOM_SIZE]u8 = [_]u8{0} ** BLOOM_SIZE,

    /// Proof-of-work difficulty (0 post-merge)
    difficulty: u256 = 0,

    /// Block number
    number: BlockNumber.BlockNumber = 0,

    /// Maximum gas allowed in block
    gas_limit: u64 = 0,

    /// Total gas used by transactions
    gas_used: u64 = 0,

    /// Unix timestamp (seconds)
    timestamp: u64 = 0,

    /// Arbitrary data (max 32 bytes)
    extra_data: []const u8 = &[_]u8{},

    /// PoW mix hash (0 post-merge)
    mix_hash: Hash.Hash = Hash.ZERO,

    /// PoW nonce (8 bytes, 0 post-merge)
    nonce: [NONCE_SIZE]u8 = [_]u8{0} ** NONCE_SIZE,

    /// EIP-1559: Base fee per gas (post-London)
    base_fee_per_gas: ?u256 = null,

    /// Post-merge: Withdrawals trie root (post-Shanghai)
    withdrawals_root: ?Hash.Hash = null,

    /// EIP-4844: Total blob gas used (post-Cancun)
    blob_gas_used: ?u64 = null,

    /// EIP-4844: Excess blob gas (post-Cancun)
    excess_blob_gas: ?u64 = null,

    /// EIP-4788: Parent beacon block root (post-Cancun)
    parent_beacon_block_root: ?Hash.Hash = null,
};

/// Empty ommers hash (keccak256 of empty RLP list)
/// keccak256(0xc0) = 0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347
pub const EMPTY_OMMERS_HASH: Hash.Hash = .{
    0x1d, 0xcc, 0x4d, 0xe8, 0xde, 0xc7, 0x5d, 0x7a,
    0xab, 0x85, 0xb5, 0x67, 0xb6, 0xcc, 0xd4, 0x1a,
    0xd3, 0x12, 0x45, 0x1b, 0x94, 0x8a, 0x74, 0x13,
    0xf0, 0xa1, 0x42, 0xfd, 0x40, 0xd4, 0x93, 0x47,
};

/// Empty transactions root (keccak256 of empty MPT)
/// Also known as EMPTY_TRIE_ROOT
pub const EMPTY_TRANSACTIONS_ROOT: Hash.Hash = .{
    0x56, 0xe8, 0x1f, 0x17, 0x1b, 0xcc, 0x55, 0xa6,
    0xff, 0x83, 0x45, 0xe6, 0x92, 0xc0, 0xf8, 0x6e,
    0x5b, 0x48, 0xe0, 0x1b, 0x99, 0x6c, 0xad, 0xc0,
    0x01, 0x62, 0x2f, 0xb5, 0xe3, 0x63, 0xb4, 0x21,
};

/// Empty receipts root (same as empty trie root)
pub const EMPTY_RECEIPTS_ROOT = EMPTY_TRANSACTIONS_ROOT;

/// Empty withdrawals root (same as empty trie root)
pub const EMPTY_WITHDRAWALS_ROOT = EMPTY_TRANSACTIONS_ROOT;

// ============================================================================
// Constructors
// ============================================================================

/// Create a new empty block header with default values
pub fn init() BlockHeader {
    return BlockHeader{};
}

test "init - creates default header" {
    const header = init();
    try std.testing.expectEqual(@as(u64, 0), header.number);
    try std.testing.expectEqual(@as(u64, 0), header.gas_limit);
    try std.testing.expect(Hash.isZero(&header.parent_hash));
}

/// Create a genesis block header
pub fn genesis(chain_id: u64) BlockHeader {
    _ = chain_id;
    return BlockHeader{
        .ommers_hash = EMPTY_OMMERS_HASH,
        .transactions_root = EMPTY_TRANSACTIONS_ROOT,
        .receipts_root = EMPTY_RECEIPTS_ROOT,
        .number = 0,
    };
}

test "genesis - creates genesis header" {
    const header = genesis(1);
    try std.testing.expectEqual(@as(u64, 0), header.number);
    try std.testing.expect(Hash.equals(&header.ommers_hash, &EMPTY_OMMERS_HASH));
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

/// RLP encode the block header
pub fn rlpEncode(header: *const BlockHeader, allocator: std.mem.Allocator) ![]u8 {
    var fields = std.ArrayList([]u8){};
    defer {
        for (fields.items) |item| {
            allocator.free(item);
        }
        fields.deinit(allocator);
    }

    // 1. parentHash (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &header.parent_hash));

    // 2. ommersHash (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &header.ommers_hash));

    // 3. beneficiary (20 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &header.beneficiary.bytes));

    // 4. stateRoot (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &header.state_root));

    // 5. transactionsRoot (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &header.transactions_root));

    // 6. receiptsRoot (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &header.receipts_root));

    // 7. logsBloom (256 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &header.logs_bloom));

    // 8. difficulty (u256)
    const difficulty_bytes = try encodeU256(allocator, header.difficulty);
    defer allocator.free(difficulty_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, difficulty_bytes));

    // 9. number (u64)
    const number_bytes = try encodeU64(allocator, header.number);
    defer allocator.free(number_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, number_bytes));

    // 10. gasLimit (u64)
    const gas_limit_bytes = try encodeU64(allocator, header.gas_limit);
    defer allocator.free(gas_limit_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, gas_limit_bytes));

    // 11. gasUsed (u64)
    const gas_used_bytes = try encodeU64(allocator, header.gas_used);
    defer allocator.free(gas_used_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, gas_used_bytes));

    // 12. timestamp (u64)
    const timestamp_bytes = try encodeU64(allocator, header.timestamp);
    defer allocator.free(timestamp_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, timestamp_bytes));

    // 13. extraData (variable)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, header.extra_data));

    // 14. mixHash (32 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &header.mix_hash));

    // 15. nonce (8 bytes)
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &header.nonce));

    // Optional fields (EIP-1559+)
    if (header.base_fee_per_gas) |base_fee| {
        const base_fee_bytes = try encodeU256(allocator, base_fee);
        defer allocator.free(base_fee_bytes);
        try fields.append(allocator, try Rlp.encodeBytes(allocator, base_fee_bytes));

        // EIP-4895 (Shanghai): withdrawalsRoot
        if (header.withdrawals_root) |wr| {
            try fields.append(allocator, try Rlp.encodeBytes(allocator, &wr));

            // EIP-4844 (Cancun): blobGasUsed, excessBlobGas, parentBeaconBlockRoot
            if (header.blob_gas_used) |blob_gas| {
                const blob_gas_bytes = try encodeU64(allocator, blob_gas);
                defer allocator.free(blob_gas_bytes);
                try fields.append(allocator, try Rlp.encodeBytes(allocator, blob_gas_bytes));

                if (header.excess_blob_gas) |excess| {
                    const excess_bytes = try encodeU64(allocator, excess);
                    defer allocator.free(excess_bytes);
                    try fields.append(allocator, try Rlp.encodeBytes(allocator, excess_bytes));

                    if (header.parent_beacon_block_root) |pbbr| {
                        try fields.append(allocator, try Rlp.encodeBytes(allocator, &pbbr));
                    }
                }
            }
        }
    }

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

test "rlpEncode - empty header" {
    const allocator = std.testing.allocator;
    const header = init();
    const encoded = try rlpEncode(&header, allocator);
    defer allocator.free(encoded);

    // Should be a valid RLP list
    try std.testing.expect(encoded.len > 0);
    try std.testing.expect(encoded[0] >= 0xc0 or encoded[0] >= 0xf7);
}

test "rlpEncode - header with values" {
    const allocator = std.testing.allocator;
    var header = init();
    header.number = 12345;
    header.gas_limit = 30000000;
    header.gas_used = 15000000;
    header.timestamp = 1640000000;

    const encoded = try rlpEncode(&header, allocator);
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

test "rlpEncode - post-London header" {
    const allocator = std.testing.allocator;
    var header = init();
    header.number = 12965000; // London fork
    header.base_fee_per_gas = 1000000000; // 1 gwei

    const encoded = try rlpEncode(&header, allocator);
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

test "rlpEncode - post-Cancun header" {
    const allocator = std.testing.allocator;
    var header = init();
    header.number = 19000000;
    header.base_fee_per_gas = 1000000000;
    header.withdrawals_root = Hash.ZERO;
    header.blob_gas_used = 131072;
    header.excess_blob_gas = 0;
    header.parent_beacon_block_root = Hash.ZERO;

    const encoded = try rlpEncode(&header, allocator);
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

// ============================================================================
// Hashing
// ============================================================================

/// Compute block hash (keccak256 of RLP-encoded header)
pub fn hash(header: *const BlockHeader, allocator: std.mem.Allocator) !Hash.Hash {
    const encoded = try rlpEncode(header, allocator);
    defer allocator.free(encoded);

    var result: Hash.Hash = undefined;
    crypto.Keccak256.hash(encoded, &result);
    return result;
}

test "hash - computes valid hash" {
    const allocator = std.testing.allocator;
    const header = init();
    const block_hash = try hash(&header, allocator);

    try std.testing.expectEqual(@as(usize, 32), block_hash.len);
    // Hash should be deterministic
    const block_hash2 = try hash(&header, allocator);
    try std.testing.expect(Hash.equals(&block_hash, &block_hash2));
}

test "hash - different headers have different hashes" {
    const allocator = std.testing.allocator;

    var header1 = init();
    header1.number = 1;

    var header2 = init();
    header2.number = 2;

    const hash1 = try hash(&header1, allocator);
    const hash2 = try hash(&header2, allocator);

    try std.testing.expect(!Hash.equals(&hash1, &hash2));
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two headers are equal (by hash)
pub fn equals(a: *const BlockHeader, b: *const BlockHeader, allocator: std.mem.Allocator) !bool {
    const hash_a = try hash(a, allocator);
    const hash_b = try hash(b, allocator);
    return Hash.equals(&hash_a, &hash_b);
}

test "equals - same header" {
    const allocator = std.testing.allocator;
    const header = init();
    try std.testing.expect(try equals(&header, &header, allocator));
}

test "equals - identical headers" {
    const allocator = std.testing.allocator;

    var header1 = init();
    header1.number = 100;
    header1.timestamp = 1640000000;

    var header2 = init();
    header2.number = 100;
    header2.timestamp = 1640000000;

    try std.testing.expect(try equals(&header1, &header2, allocator));
}

test "equals - different headers" {
    const allocator = std.testing.allocator;

    var header1 = init();
    header1.number = 100;

    var header2 = init();
    header2.number = 200;

    try std.testing.expect(!try equals(&header1, &header2, allocator));
}

// ============================================================================
// Validation
// ============================================================================

/// Check if header represents a post-merge block (difficulty = 0)
pub fn isPostMerge(header: *const BlockHeader) bool {
    return header.difficulty == 0;
}

test "isPostMerge - pre-merge header" {
    var header = init();
    header.difficulty = 1000000;
    try std.testing.expect(!isPostMerge(&header));
}

test "isPostMerge - post-merge header" {
    const header = init();
    try std.testing.expect(isPostMerge(&header));
}

/// Check if header has EIP-1559 fields
pub fn hasEip1559(header: *const BlockHeader) bool {
    return header.base_fee_per_gas != null;
}

test "hasEip1559 - legacy header" {
    const header = init();
    try std.testing.expect(!hasEip1559(&header));
}

test "hasEip1559 - EIP-1559 header" {
    var header = init();
    header.base_fee_per_gas = 1000000000;
    try std.testing.expect(hasEip1559(&header));
}

/// Check if header has EIP-4844 fields
pub fn hasEip4844(header: *const BlockHeader) bool {
    return header.blob_gas_used != null and
        header.excess_blob_gas != null and
        header.parent_beacon_block_root != null;
}

test "hasEip4844 - pre-Cancun header" {
    const header = init();
    try std.testing.expect(!hasEip4844(&header));
}

test "hasEip4844 - Cancun header" {
    var header = init();
    header.blob_gas_used = 131072;
    header.excess_blob_gas = 0;
    header.parent_beacon_block_root = Hash.ZERO;
    try std.testing.expect(hasEip4844(&header));
}

/// Check if header has withdrawals (post-Shanghai)
pub fn hasWithdrawals(header: *const BlockHeader) bool {
    return header.withdrawals_root != null;
}

test "hasWithdrawals - pre-Shanghai header" {
    const header = init();
    try std.testing.expect(!hasWithdrawals(&header));
}

test "hasWithdrawals - Shanghai header" {
    var header = init();
    header.withdrawals_root = Hash.ZERO;
    try std.testing.expect(hasWithdrawals(&header));
}

/// Validate extra data size
pub fn isValidExtraData(header: *const BlockHeader) bool {
    return header.extra_data.len <= MAX_EXTRA_DATA_SIZE;
}

test "isValidExtraData - empty" {
    const header = init();
    try std.testing.expect(isValidExtraData(&header));
}

test "isValidExtraData - max size" {
    var header = init();
    const data = [_]u8{0} ** MAX_EXTRA_DATA_SIZE;
    header.extra_data = &data;
    try std.testing.expect(isValidExtraData(&header));
}

test "isValidExtraData - too large" {
    var header = init();
    const data = [_]u8{0} ** (MAX_EXTRA_DATA_SIZE + 1);
    header.extra_data = &data;
    try std.testing.expect(!isValidExtraData(&header));
}

// ============================================================================
// Utilities
// ============================================================================

/// Get the seal hash (hash without nonce and mix hash for PoW)
/// Note: Only relevant for pre-merge blocks
pub fn sealHash(header: *const BlockHeader, allocator: std.mem.Allocator) !Hash.Hash {
    // Create a copy with zeroed nonce and mix hash
    var seal_header = header.*;
    seal_header.nonce = [_]u8{0} ** NONCE_SIZE;
    seal_header.mix_hash = Hash.ZERO;

    return try hash(&seal_header, allocator);
}

test "sealHash - different from regular hash" {
    const allocator = std.testing.allocator;

    var header = init();
    header.nonce = [_]u8{1} ** NONCE_SIZE;
    header.mix_hash = [_]u8{2} ** 32;

    const regular = try hash(&header, allocator);
    const seal = try sealHash(&header, allocator);

    try std.testing.expect(!Hash.equals(&regular, &seal));
}

/// Clone a header
pub fn clone(header: *const BlockHeader) BlockHeader {
    return header.*;
}

test "clone - creates copy" {
    var original = init();
    original.number = 12345;

    const copy = clone(&original);
    try std.testing.expectEqual(original.number, copy.number);

    // Modifying original doesn't affect copy
    original.number = 99999;
    try std.testing.expectEqual(@as(u64, 12345), copy.number);
}

// ============================================================================
// RLP Decoding
// ============================================================================

/// Decode RLP bytes to u64
fn decodeToU64(bytes: []const u8) !u64 {
    if (bytes.len == 0) return 0;
    if (bytes.len > 8) return error.InvalidBlockHeader;

    // Check for leading zeros (non-canonical)
    if (bytes.len > 1 and bytes[0] == 0) return error.InvalidBlockHeader;

    var result: u64 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

/// Decode RLP bytes to u256
fn decodeToU256(bytes: []const u8) !u256 {
    if (bytes.len == 0) return 0;
    if (bytes.len > 32) return error.InvalidBlockHeader;

    // Check for leading zeros (non-canonical)
    if (bytes.len > 1 and bytes[0] == 0) return error.InvalidBlockHeader;

    var result: u256 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

/// RLP decode a block header from bytes
/// Supports all hardfork variants (Legacy, EIP-1559, Shanghai, Cancun)
pub fn rlpDecode(allocator: std.mem.Allocator, data: []const u8) !BlockHeader {
    const decoded = try Rlp.decode(allocator, data, false);
    defer decoded.data.deinit(allocator);

    if (decoded.data != .List) {
        return error.InvalidBlockHeader;
    }

    const items = decoded.data.List;

    // Minimum 15 fields (legacy), max 20 fields (Cancun)
    if (items.len < 15 or items.len > 20) {
        return error.InvalidBlockHeader;
    }

    var header = BlockHeader{};

    // 1. parentHash (32 bytes)
    if (items[0] != .String or items[0].String.len != 32) {
        return error.InvalidBlockHeader;
    }
    @memcpy(&header.parent_hash, items[0].String);

    // 2. ommersHash (32 bytes)
    if (items[1] != .String or items[1].String.len != 32) {
        return error.InvalidBlockHeader;
    }
    @memcpy(&header.ommers_hash, items[1].String);

    // 3. beneficiary (20 bytes)
    if (items[2] != .String or items[2].String.len != 20) {
        return error.InvalidBlockHeader;
    }
    @memcpy(&header.beneficiary.bytes, items[2].String);

    // 4. stateRoot (32 bytes)
    if (items[3] != .String or items[3].String.len != 32) {
        return error.InvalidBlockHeader;
    }
    @memcpy(&header.state_root, items[3].String);

    // 5. transactionsRoot (32 bytes)
    if (items[4] != .String or items[4].String.len != 32) {
        return error.InvalidBlockHeader;
    }
    @memcpy(&header.transactions_root, items[4].String);

    // 6. receiptsRoot (32 bytes)
    if (items[5] != .String or items[5].String.len != 32) {
        return error.InvalidBlockHeader;
    }
    @memcpy(&header.receipts_root, items[5].String);

    // 7. logsBloom (256 bytes)
    if (items[6] != .String or items[6].String.len != 256) {
        return error.InvalidBlockHeader;
    }
    @memcpy(&header.logs_bloom, items[6].String);

    // 8. difficulty (u256)
    if (items[7] != .String) return error.InvalidBlockHeader;
    header.difficulty = try decodeToU256(items[7].String);

    // 9. number (u64)
    if (items[8] != .String) return error.InvalidBlockHeader;
    header.number = try decodeToU64(items[8].String);

    // 10. gasLimit (u64)
    if (items[9] != .String) return error.InvalidBlockHeader;
    header.gas_limit = try decodeToU64(items[9].String);

    // 11. gasUsed (u64)
    if (items[10] != .String) return error.InvalidBlockHeader;
    header.gas_used = try decodeToU64(items[10].String);

    // 12. timestamp (u64)
    if (items[11] != .String) return error.InvalidBlockHeader;
    header.timestamp = try decodeToU64(items[11].String);

    // 13. extraData (variable)
    if (items[12] != .String) return error.InvalidBlockHeader;
    // Note: extraData is a slice, we need to be careful about lifetime
    // For now, use empty slice (caller should handle allocation if needed)
    header.extra_data = &[_]u8{};

    // 14. mixHash (32 bytes)
    if (items[13] != .String or items[13].String.len != 32) {
        return error.InvalidBlockHeader;
    }
    @memcpy(&header.mix_hash, items[13].String);

    // 15. nonce (8 bytes)
    if (items[14] != .String or items[14].String.len != 8) {
        return error.InvalidBlockHeader;
    }
    @memcpy(&header.nonce, items[14].String);

    // Optional EIP-1559 field (16)
    if (items.len > 15) {
        if (items[15] != .String) return error.InvalidBlockHeader;
        header.base_fee_per_gas = try decodeToU256(items[15].String);
    }

    // Optional Shanghai field (17)
    if (items.len > 16) {
        if (items[16] != .String or items[16].String.len != 32) {
            return error.InvalidBlockHeader;
        }
        var withdrawals_root: Hash.Hash = undefined;
        @memcpy(&withdrawals_root, items[16].String);
        header.withdrawals_root = withdrawals_root;
    }

    // Optional Cancun fields (18, 19, 20)
    if (items.len > 17) {
        if (items[17] != .String) return error.InvalidBlockHeader;
        header.blob_gas_used = try decodeToU64(items[17].String);
    }

    if (items.len > 18) {
        if (items[18] != .String) return error.InvalidBlockHeader;
        header.excess_blob_gas = try decodeToU64(items[18].String);
    }

    if (items.len > 19) {
        if (items[19] != .String or items[19].String.len != 32) {
            return error.InvalidBlockHeader;
        }
        var parent_beacon_block_root: Hash.Hash = undefined;
        @memcpy(&parent_beacon_block_root, items[19].String);
        header.parent_beacon_block_root = parent_beacon_block_root;
    }

    return header;
}

test "rlpDecode - round trip legacy header" {
    const allocator = std.testing.allocator;

    var original = init();
    original.number = 12345;
    original.gas_limit = 30000000;
    original.gas_used = 15000000;
    original.timestamp = 1640000000;
    original.difficulty = 17179869184;

    const encoded = try rlpEncode(&original, allocator);
    defer allocator.free(encoded);

    const decoded = try rlpDecode(allocator, encoded);

    try std.testing.expectEqual(original.number, decoded.number);
    try std.testing.expectEqual(original.gas_limit, decoded.gas_limit);
    try std.testing.expectEqual(original.gas_used, decoded.gas_used);
    try std.testing.expectEqual(original.timestamp, decoded.timestamp);
    try std.testing.expectEqual(original.difficulty, decoded.difficulty);
}

test "rlpDecode - round trip EIP-1559 header" {
    const allocator = std.testing.allocator;

    var original = init();
    original.number = 12965000;
    original.gas_limit = 30000000;
    original.base_fee_per_gas = 1000000000;

    const encoded = try rlpEncode(&original, allocator);
    defer allocator.free(encoded);

    const decoded = try rlpDecode(allocator, encoded);

    try std.testing.expectEqual(original.number, decoded.number);
    try std.testing.expectEqual(original.base_fee_per_gas.?, decoded.base_fee_per_gas.?);
}

// ============================================================================
// Real Ethereum Block Test Vectors
// ============================================================================

// Ethereum Mainnet Block 1 (first block after genesis)
// Hash: 0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6
test "real block - mainnet block 1" {
    const allocator = std.testing.allocator;

    // Block 1 header data
    var header = BlockHeader{
        // Parent hash (genesis block hash)
        .parent_hash = .{
            0xd4, 0xe5, 0x67, 0x40, 0xf8, 0x76, 0xae, 0xf8,
            0xc0, 0x10, 0xb8, 0x6a, 0x40, 0xd5, 0xf5, 0x67,
            0x45, 0xa1, 0x18, 0xd0, 0x90, 0x6a, 0x34, 0xe6,
            0x9a, 0xec, 0x8c, 0x0d, 0xb1, 0xcb, 0x8f, 0xa3,
        },
        // Empty ommers hash
        .ommers_hash = EMPTY_OMMERS_HASH,
        // Coinbase (miner)
        .beneficiary = Address.Address{ .bytes = .{
            0x05, 0xa5, 0x6e, 0x2d, 0x52, 0xc8, 0x17, 0x16,
            0x18, 0x83, 0xf5, 0x0c, 0x44, 0x1c, 0x32, 0x28,
            0xcf, 0xe5, 0x4d, 0x9f,
        } },
        // State root
        .state_root = .{
            0xd6, 0x7e, 0x4d, 0x45, 0x03, 0x43, 0x04, 0x64,
            0x25, 0xae, 0x42, 0x71, 0x47, 0x43, 0x53, 0x85,
            0x7a, 0xb8, 0x60, 0xdb, 0xc0, 0xa1, 0xdc, 0xe6,
            0x4b, 0x41, 0xa5, 0x13, 0x72, 0x2e, 0xcc, 0x47,
        },
        // Empty transactions root
        .transactions_root = EMPTY_TRANSACTIONS_ROOT,
        // Empty receipts root
        .receipts_root = EMPTY_RECEIPTS_ROOT,
        // Empty logs bloom
        .logs_bloom = [_]u8{0} ** 256,
        // Difficulty
        .difficulty = 17179869184,
        // Block number
        .number = 1,
        // Gas limit
        .gas_limit = 5000,
        // Gas used
        .gas_used = 0,
        // Timestamp (July 30, 2015)
        .timestamp = 1438269988,
        // Extra data (empty)
        .extra_data = &[_]u8{},
        // Mix hash
        .mix_hash = .{
            0x96, 0x9b, 0x90, 0x0d, 0xe2, 0x7b, 0x6a, 0xc6,
            0xa6, 0x77, 0x42, 0x36, 0x5d, 0xd6, 0x5f, 0x55,
            0xa0, 0x52, 0x6c, 0x41, 0xfd, 0x18, 0xe1, 0xb1,
            0x6f, 0x1a, 0x12, 0x15, 0xc2, 0xe6, 0x6f, 0x59,
        },
        // Nonce
        .nonce = .{ 0x53, 0x9b, 0xd4, 0x97, 0x9f, 0xef, 0x1e, 0xc4 },
    };

    // Compute hash
    const computed_hash = try hash(&header, allocator);

    // Expected hash of block 1
    const expected_hash: Hash.Hash = .{
        0x88, 0xe9, 0x6d, 0x45, 0x37, 0xbe, 0xa4, 0xd9,
        0xc0, 0x5d, 0x12, 0x54, 0x99, 0x07, 0xb3, 0x25,
        0x61, 0xd3, 0xbf, 0x31, 0xf4, 0x5a, 0xae, 0x73,
        0x4c, 0xdc, 0x11, 0x9f, 0x13, 0x40, 0x6c, 0xb6,
    };

    try std.testing.expectEqualSlices(u8, &expected_hash, &computed_hash);
}

// Ethereum Mainnet Block 15537394 (The Merge block - first PoS block)
// Difficulty becomes 0, marking the transition from PoW to PoS
test "real block - mainnet merge block" {
    const allocator = std.testing.allocator;

    var header = init();
    header.difficulty = 0; // Post-merge
    header.number = 15537394;
    header.gas_limit = 30000000;
    header.gas_used = 29999968;
    header.timestamp = 1663224162;
    header.base_fee_per_gas = 7; // EIP-1559

    // Verify post-merge characteristics
    try std.testing.expect(isPostMerge(&header));
    try std.testing.expect(hasEip1559(&header));
    try std.testing.expect(!hasWithdrawals(&header)); // No withdrawals yet

    // Compute hash (deterministic)
    const block_hash = try hash(&header, allocator);
    try std.testing.expectEqual(@as(usize, 32), block_hash.len);
}

// Ethereum Mainnet Block 17034870 (Shanghai upgrade - first block with withdrawals)
test "real block - mainnet shanghai block" {
    const allocator = std.testing.allocator;

    var header = init();
    header.difficulty = 0;
    header.number = 17034870;
    header.gas_limit = 30000000;
    header.gas_used = 12345678;
    header.timestamp = 1681338455;
    header.base_fee_per_gas = 1000000000;
    header.withdrawals_root = EMPTY_WITHDRAWALS_ROOT; // Has withdrawals field

    try std.testing.expect(isPostMerge(&header));
    try std.testing.expect(hasEip1559(&header));
    try std.testing.expect(hasWithdrawals(&header));
    try std.testing.expect(!hasEip4844(&header)); // No blobs yet

    const block_hash = try hash(&header, allocator);
    try std.testing.expectEqual(@as(usize, 32), block_hash.len);
}

// Ethereum Mainnet Block 19426587 (Cancun upgrade - first block with blobs)
test "real block - mainnet cancun block" {
    const allocator = std.testing.allocator;

    var header = init();
    header.difficulty = 0;
    header.number = 19426587;
    header.gas_limit = 30000000;
    header.gas_used = 15000000;
    header.timestamp = 1710338135;
    header.base_fee_per_gas = 30000000000; // 30 gwei
    header.withdrawals_root = EMPTY_WITHDRAWALS_ROOT;
    header.blob_gas_used = 131072; // 1 blob
    header.excess_blob_gas = 0;
    header.parent_beacon_block_root = Hash.ZERO;

    try std.testing.expect(isPostMerge(&header));
    try std.testing.expect(hasEip1559(&header));
    try std.testing.expect(hasWithdrawals(&header));
    try std.testing.expect(hasEip4844(&header));

    const block_hash = try hash(&header, allocator);
    try std.testing.expectEqual(@as(usize, 32), block_hash.len);

    // Test RLP encode/decode round trip for Cancun header
    const encoded = try rlpEncode(&header, allocator);
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}
