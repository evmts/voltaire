//! Block - Complete Ethereum block structure
//!
//! Combines header and body to form a complete block. Provides methods for
//! hash computation, RLP encoding/decoding, and validation.
//!
//! ## Components
//! - header: Block metadata (parent hash, state root, etc.)
//! - body: Block data (transactions, ommers, withdrawals)
//! - hash: Computed block hash (keccak256 of RLP-encoded header)
//! - size: Total RLP-encoded size in bytes
//!
//! ## Usage
//! ```zig
//! const Block = @import("primitives").Block;
//!
//! // Create block from header and body
//! const block = try Block.from(&header, &body, allocator);
//!
//! // Get block hash
//! const hash = block.hash;
//!
//! // Get block number
//! const number = block.header.number;
//!
//! // RLP encode
//! const encoded = try Block.rlpEncode(&block, allocator);
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");
const BlockHeader = @import("../BlockHeader/BlockHeader.zig");
const BlockBody = @import("../BlockBody/BlockBody.zig");
const Rlp = @import("../Rlp/Rlp.zig");
const TrieHash = @import("../TrieHash/TrieHash.zig");
const crypto = @import("crypto");

/// Block structure
pub const Block = struct {
    /// Block header (metadata + Merkle roots)
    header: BlockHeader.BlockHeader,

    /// Block body (transactions, ommers, withdrawals)
    body: BlockBody.BlockBody,

    /// Block hash (computed from RLP(header))
    hash: Hash.Hash,

    /// Block size in bytes (RLP-encoded)
    size: u64,

    /// Total difficulty (cumulative, pre-merge only)
    total_difficulty: ?u256 = null,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create a block from header and body, computing hash and size
pub fn from(
    header: *const BlockHeader.BlockHeader,
    body: *const BlockBody.BlockBody,
    allocator: std.mem.Allocator,
) !Block {
    const header_encoded = try BlockHeader.rlpEncode(header, allocator);
    defer allocator.free(header_encoded);
    const encoded = try BlockBody.rlpEncodeWithHeader(body, allocator, header_encoded);
    defer allocator.free(encoded);

    var block_hash: Hash.Hash = undefined;
    crypto.Keccak256.hash(header_encoded, &block_hash, .{});

    return Block{
        .header = header.*,
        .body = body.*,
        .hash = block_hash,
        .size = encoded.len,
    };
}

test "from - creates block with computed hash" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();

    const block = try from(&header, &body, allocator);

    try std.testing.expectEqual(@as(usize, 32), block.hash.len);
    try std.testing.expect(block.size > 0);
}

/// Create an empty genesis block
pub fn genesis(chain_id: u64, allocator: std.mem.Allocator) !Block {
    const header = BlockHeader.genesis(chain_id);
    const body = BlockBody.init();
    return try from(&header, &body, allocator);
}

test "genesis - creates genesis block" {
    const allocator = std.testing.allocator;
    const block = try genesis(1, allocator);
    try std.testing.expectEqual(@as(u64, 0), block.header.number);
}

/// Create a block with only header (for light clients)
pub fn fromHeader(header: *const BlockHeader.BlockHeader, allocator: std.mem.Allocator) !Block {
    const body = BlockBody.init();
    return try from(header, &body, allocator);
}

test "fromHeader - creates block with empty body" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.number = 12345;

    const block = try fromHeader(&header, allocator);
    try std.testing.expectEqual(@as(u64, 12345), block.header.number);
    try std.testing.expectEqual(@as(usize, 0), block.body.transactions.len);
}

// ============================================================================
// RLP Encoding
// ============================================================================

/// RLP encode the complete block
/// Format: [header, transactions, ommers, withdrawals?]
pub fn rlpEncode(block: *const Block, allocator: std.mem.Allocator) ![]u8 {
    const header = try BlockHeader.rlpEncode(&block.header, allocator);
    defer allocator.free(header);
    return BlockBody.rlpEncodeWithHeader(&block.body, allocator, header);
}

test "rlpEncode - basic block" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    const encoded = try rlpEncode(&block, allocator);
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
    // Should be a valid RLP list
    try std.testing.expect(encoded[0] >= 0xc0 or encoded[0] >= 0xf7);
}

// ============================================================================
// Hashing
// ============================================================================

/// Recompute block hash (useful after modifying header)
pub fn computeHash(block: *const Block, allocator: std.mem.Allocator) !Hash.Hash {
    return try BlockHeader.hash(&block.header, allocator);
}

test "computeHash - matches stored hash" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    const computed = try computeHash(&block, allocator);
    try std.testing.expect(Hash.equals(&block.hash, &computed));
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two blocks are equal (by hash)
pub fn equals(a: *const Block, b: *const Block) bool {
    return Hash.equals(&a.hash, &b.hash);
}

test "equals - same block" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(equals(&block, &block));
}

test "equals - different blocks" {
    const allocator = std.testing.allocator;

    var header1 = BlockHeader.init();
    header1.number = 1;
    const body1 = BlockBody.init();
    const block1 = try from(&header1, &body1, allocator);

    var header2 = BlockHeader.init();
    header2.number = 2;
    const body2 = BlockBody.init();
    const block2 = try from(&header2, &body2, allocator);

    try std.testing.expect(!equals(&block1, &block2));
}

// ============================================================================
// Accessors
// ============================================================================

/// Get block number
pub fn number(block: *const Block) u64 {
    return block.header.number;
}

test "number - returns header number" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.number = 12345;
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expectEqual(@as(u64, 12345), number(&block));
}

/// Get parent hash
pub fn parentHash(block: *const Block) Hash.Hash {
    return block.header.parent_hash;
}

test "parentHash - returns header parent hash" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.parent_hash = [_]u8{0xab} ** 32;
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expectEqual(@as(u8, 0xab), parentHash(&block)[0]);
}

/// Get timestamp
pub fn timestamp(block: *const Block) u64 {
    return block.header.timestamp;
}

test "timestamp - returns header timestamp" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.timestamp = 1640000000;
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expectEqual(@as(u64, 1640000000), timestamp(&block));
}

/// Get transaction count
pub fn transactionCount(block: *const Block) usize {
    return block.body.transactions.len;
}

test "transactionCount - returns body tx count" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expectEqual(@as(usize, 0), transactionCount(&block));
}

/// Get uncle/ommer count
pub fn ommerCount(block: *const Block) usize {
    return block.body.ommers.len;
}

test "ommerCount - returns body ommer count" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expectEqual(@as(usize, 0), ommerCount(&block));
}

/// Get withdrawal count (returns null if not post-Shanghai)
pub fn withdrawalCount(block: *const Block) ?usize {
    return BlockBody.withdrawalCount(&block.body);
}

test "withdrawalCount - pre-Shanghai" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(withdrawalCount(&block) == null);
}

// ============================================================================
// Validation
// ============================================================================

/// Check if block is post-merge (difficulty = 0)
pub fn isPostMerge(block: *const Block) bool {
    return BlockHeader.isPostMerge(&block.header);
}

test "isPostMerge - default header" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(isPostMerge(&block));
}

/// Check if block has EIP-1559 fields
pub fn hasEip1559(block: *const Block) bool {
    return BlockHeader.hasEip1559(&block.header);
}

test "hasEip1559 - without base fee" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(!hasEip1559(&block));
}

/// Check if block has EIP-4844 fields
pub fn hasEip4844(block: *const Block) bool {
    return BlockHeader.hasEip4844(&block.header);
}

test "hasEip4844 - without blob fields" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(!hasEip4844(&block));
}

/// Check if block has withdrawals (post-Shanghai)
pub fn hasWithdrawals(block: *const Block) bool {
    return BlockBody.hasWithdrawals(&block.body);
}

test "hasWithdrawals - pre-Shanghai" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(!hasWithdrawals(&block));
}

// ============================================================================
// Clone
// ============================================================================

/// Clone a block
pub fn clone(block: *const Block) Block {
    return block.*;
}

test "clone - creates copy" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.number = 12345;
    const body = BlockBody.init();
    const original = try from(&header, &body, allocator);

    const copy = clone(&original);
    try std.testing.expectEqual(original.header.number, copy.header.number);
    try std.testing.expect(equals(&original, &copy));
}

// ============================================================================
// From functions for different hardfork eras
// ============================================================================

/// Create a pre-merge block (with difficulty)
pub fn preMerge(
    header: *const BlockHeader.BlockHeader,
    body: *const BlockBody.BlockBody,
    total_difficulty: u256,
    allocator: std.mem.Allocator,
) !Block {
    var block = try from(header, body, allocator);
    block.total_difficulty = total_difficulty;
    return block;
}

test "preMerge - creates block with total difficulty" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.difficulty = 17179869184; // Non-zero difficulty
    const body = BlockBody.init();

    const block = try preMerge(&header, &body, 1000000000000, allocator);

    try std.testing.expect(!isPostMerge(&block));
    try std.testing.expectEqual(@as(?u256, 1000000000000), block.total_difficulty);
}

/// Create a post-merge block (no difficulty)
pub fn postMerge(
    header: *const BlockHeader.BlockHeader,
    body: *const BlockBody.BlockBody,
    allocator: std.mem.Allocator,
) !Block {
    return try from(header, body, allocator);
}

test "postMerge - creates block without total difficulty" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.difficulty = 0;
    header.base_fee_per_gas = 1000000000;
    const body = BlockBody.init();

    const block = try postMerge(&header, &body, allocator);

    try std.testing.expect(isPostMerge(&block));
    try std.testing.expect(block.total_difficulty == null);
}

// ============================================================================
// Validation
// ============================================================================

/// Validate that the block hash matches the computed hash
pub fn validateHash(block: *const Block, allocator: std.mem.Allocator) !bool {
    const computed = try computeHash(block, allocator);
    return Hash.equals(&block.hash, &computed);
}

test "validateHash - valid block" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(try validateHash(&block, allocator));
}

/// Validate the ordered transaction trie commitment.
///
/// `allocator` backs the scratch trie; nothing allocated here outlives the
/// call. Computation failures (out of memory) are returned, not read as an
/// invalid root.
pub fn hasValidTransactionsRoot(block: *const Block, allocator: std.mem.Allocator) !bool {
    const root = try transactionsRoot(block.body.transactions, allocator);
    return Hash.equals(&root, &block.header.transactions_root);
}

fn transactionsRoot(transactions: []const BlockBody.TransactionData, allocator: std.mem.Allocator) !Hash.Hash {
    if (transactions.len == 0) return TrieHash.EMPTY_TRIE_ROOT;

    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();
    const scratch = arena.allocator();

    const keys = try scratch.alloc([]const u8, transactions.len);
    const values = try scratch.alloc([]const u8, transactions.len);
    for (transactions, 0..) |tx, index| {
        keys[index] = try Rlp.encode(scratch, index);
        values[index] = tx.raw;
    }
    return TrieHash.trie_root(scratch, keys, values);
}

test "hasValidTransactionsRoot - empty transactions" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.transactions_root = BlockHeader.EMPTY_TRANSACTIONS_ROOT;
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(try hasValidTransactionsRoot(&block, allocator));
}

test "hasValidTransactionsRoot - commits to transaction order and raw envelopes" {
    const allocator = std.testing.allocator;
    const legacy = "\xc9\x80\x80\x80\x80\x80\x80\x1b\x01\x01";
    const typed = "\x02\xcc\x01\x80\x80\x80\x80\x80\x80\x80\xc0\x80\x01\x01";

    // RLP indices 0 and 1 are 0x80 and 0x01. The root branch inlines
    // the leaf for index 1 in slot 0 and the leaf for index 0 in slot 8.
    const branch = "\xed\xd0\x31\x8e" ++ typed ++ ("\x80" ** 7) ++
        "\xcc\x30\x8a" ++ legacy ++ ("\x80" ** 8);
    var header = BlockHeader.init();
    crypto.Keccak256.hash(branch, &header.transactions_root, .{});

    const body: BlockBody.BlockBody = .{
        .transactions = &.{ .{ .raw = legacy }, .{ .raw = typed } },
        .withdrawals = &.{},
    };
    var block = try from(&header, &body, allocator);
    try std.testing.expect(try hasValidTransactionsRoot(&block, allocator));

    const encoded = try rlpEncode(&block, allocator);
    defer allocator.free(encoded);
    try std.testing.expectEqual(encoded.len, block.size);
    const decoded = try Rlp.decode(allocator, encoded, false);
    defer decoded.data.deinit(allocator);
    try std.testing.expectEqual(@as(usize, 4), decoded.data.List.len);
    const txs = decoded.data.List[1].List;
    try std.testing.expectEqual(@as(usize, 9), txs[0].List.len);
    try std.testing.expectEqualSlices(u8, typed, txs[1].String);

    block.body.transactions = &.{ .{ .raw = typed }, .{ .raw = legacy } };
    try std.testing.expect(!try hasValidTransactionsRoot(&block, allocator));
    const swapped_root = try transactionsRoot(block.body.transactions, allocator);
    try std.testing.expect(!Hash.equals(&header.transactions_root, &swapped_root));
    block.header.transactions_root = swapped_root;
    try std.testing.expect(try hasValidTransactionsRoot(&block, allocator));
}

/// Validate that ommers hash matches computed hash
pub fn hasValidOmmersHash(block: *const Block, allocator: std.mem.Allocator) !bool {
    const computed = try BlockBody.ommersHash(&block.body, allocator);
    return Hash.equals(&block.header.ommers_hash, &computed);
}

test "hasValidTransactionsRoot - returns allocation failure instead of false" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body: BlockBody.BlockBody = .{
        .transactions = &.{.{ .raw = "\xc9\x80\x80\x80\x80\x80\x80\x1b\x01\x01" }},
        .withdrawals = &.{},
    };
    const block = try from(&header, &body, allocator);

    var failing = std.testing.FailingAllocator.init(allocator, .{ .fail_index = 0 });
    try std.testing.expectError(error.OutOfMemory, hasValidTransactionsRoot(&block, failing.allocator()));
}

test "hasValidOmmersHash - empty ommers" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.ommers_hash = BlockHeader.EMPTY_OMMERS_HASH;
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(try hasValidOmmersHash(&block, allocator));
}

// ============================================================================
// Block Info
// ============================================================================

/// Get gas utilization ratio (gas_used / gas_limit)
pub fn gasUtilization(block: *const Block) f64 {
    if (block.header.gas_limit == 0) return 0.0;
    return @as(f64, @floatFromInt(block.header.gas_used)) /
        @as(f64, @floatFromInt(block.header.gas_limit));
}

test "gasUtilization - calculates ratio" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.gas_limit = 30000000;
    header.gas_used = 15000000;
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    const util = gasUtilization(&block);
    try std.testing.expect(util > 0.49 and util < 0.51);
}

/// Check if block is empty (no transactions)
pub fn isEmpty(block: *const Block) bool {
    return block.body.transactions.len == 0;
}

test "isEmpty - empty block" {
    const allocator = std.testing.allocator;
    const header = BlockHeader.init();
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(isEmpty(&block));
}

/// Get base fee per gas (post-EIP-1559)
pub fn baseFeePerGas(block: *const Block) ?u256 {
    return block.header.base_fee_per_gas;
}

test "baseFeePerGas - EIP-1559 block" {
    const allocator = std.testing.allocator;
    var header = BlockHeader.init();
    header.base_fee_per_gas = 1000000000;
    const body = BlockBody.init();
    const block = try from(&header, &body, allocator);

    try std.testing.expectEqual(@as(?u256, 1000000000), baseFeePerGas(&block));
}

// ============================================================================
// Real Ethereum Block Test Vectors
// ============================================================================

// Test creating a block that represents Ethereum mainnet block 1
test "real block - mainnet block 1 structure" {
    const allocator = std.testing.allocator;

    // Block 1 header (first block after genesis)
    var header = BlockHeader.BlockHeader{
        .parent_hash = .{
            0xd4, 0xe5, 0x67, 0x40, 0xf8, 0x76, 0xae, 0xf8,
            0xc0, 0x10, 0xb8, 0x6a, 0x40, 0xd5, 0xf5, 0x67,
            0x45, 0xa1, 0x18, 0xd0, 0x90, 0x6a, 0x34, 0xe6,
            0x9a, 0xec, 0x8c, 0x0d, 0xb1, 0xcb, 0x8f, 0xa3,
        },
        .ommers_hash = BlockHeader.EMPTY_OMMERS_HASH,
        .state_root = .{
            0xd6, 0x7e, 0x4d, 0x45, 0x03, 0x43, 0x04, 0x64,
            0x25, 0xae, 0x42, 0x71, 0x47, 0x43, 0x53, 0x85,
            0x7a, 0xb8, 0x60, 0xdb, 0xc0, 0xa1, 0xdc, 0xe6,
            0x4b, 0x41, 0xa5, 0x13, 0x72, 0x2e, 0xcc, 0x47,
        },
        .transactions_root = BlockHeader.EMPTY_TRANSACTIONS_ROOT,
        .receipts_root = BlockHeader.EMPTY_RECEIPTS_ROOT,
        .difficulty = 17179869184,
        .number = 1,
        .gas_limit = 5000,
        .gas_used = 0,
        .timestamp = 1438269988,
        .mix_hash = .{
            0x96, 0x9b, 0x90, 0x0d, 0xe2, 0x7b, 0x6a, 0xc6,
            0xa6, 0x77, 0x42, 0x36, 0x5d, 0xd6, 0x5f, 0x55,
            0xa0, 0x52, 0x6c, 0x41, 0xfd, 0x18, 0xe1, 0xb1,
            0x6f, 0x1a, 0x12, 0x15, 0xc2, 0xe6, 0x6f, 0x59,
        },
        .nonce = .{ 0x53, 0x9b, 0xd4, 0x97, 0x9f, 0xef, 0x1e, 0xc4 },
    };

    const body = BlockBody.init();

    // Create block with total difficulty
    const block = try preMerge(&header, &body, 17179869184, allocator);

    try std.testing.expectEqual(@as(u64, 1), number(&block));
    try std.testing.expect(!isPostMerge(&block));
    try std.testing.expect(isEmpty(&block));
    try std.testing.expect(try hasValidOmmersHash(&block, allocator));
}

// Test creating a post-merge block
test "real block - post-merge structure" {
    const allocator = std.testing.allocator;

    var header = BlockHeader.init();
    header.difficulty = 0;
    header.number = 15537394;
    header.gas_limit = 30000000;
    header.gas_used = 29999968;
    header.timestamp = 1663224162;
    header.base_fee_per_gas = 7;
    header.ommers_hash = BlockHeader.EMPTY_OMMERS_HASH;
    header.transactions_root = BlockHeader.EMPTY_TRANSACTIONS_ROOT;
    header.receipts_root = BlockHeader.EMPTY_RECEIPTS_ROOT;

    const body = BlockBody.init();
    const block = try postMerge(&header, &body, allocator);

    try std.testing.expect(isPostMerge(&block));
    try std.testing.expect(hasEip1559(&block));
    try std.testing.expect(!hasWithdrawals(&block));

    // Check gas utilization (should be ~99.99%)
    const util = gasUtilization(&block);
    try std.testing.expect(util > 0.99);
}

// Test creating a Cancun block with blob fields
test "real block - cancun with blobs" {
    const allocator = std.testing.allocator;

    var header = BlockHeader.init();
    header.difficulty = 0;
    header.number = 19426587;
    header.gas_limit = 30000000;
    header.gas_used = 15000000;
    header.timestamp = 1710338135;
    header.base_fee_per_gas = 30000000000;
    header.withdrawals_root = BlockHeader.EMPTY_WITHDRAWALS_ROOT;
    header.blob_gas_used = 131072;
    header.excess_blob_gas = 0;
    header.parent_beacon_block_root = Hash.ZERO;
    header.ommers_hash = BlockHeader.EMPTY_OMMERS_HASH;
    header.transactions_root = BlockHeader.EMPTY_TRANSACTIONS_ROOT;
    header.receipts_root = BlockHeader.EMPTY_RECEIPTS_ROOT;

    const body = BlockBody.postShanghai();
    const block = try from(&header, &body, allocator);

    try std.testing.expect(isPostMerge(&block));
    try std.testing.expect(hasEip1559(&block));
    try std.testing.expect(hasWithdrawals(&block));
    try std.testing.expect(hasEip4844(&block));
    try std.testing.expectEqual(@as(?u256, 30000000000), baseFeePerGas(&block));
}
