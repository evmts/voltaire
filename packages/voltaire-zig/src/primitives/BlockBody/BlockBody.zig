//! BlockBody - Ethereum block body structure
//!
//! Contains the transactions, uncles/ommers, and withdrawals for a block.
//! The body combined with the header forms a complete block.
//!
//! ## Components
//! - transactions: List of transactions in execution order
//! - ommers: Uncle/ommer block headers (empty post-merge)
//! - withdrawals: Validator withdrawals (post-Shanghai, EIP-4895)
//!
//! ## Usage
//! ```zig
//! const BlockBody = @import("primitives").BlockBody;
//!
//! // Create empty body
//! var body = BlockBody.init();
//!
//! // Check if has transactions
//! const has_txs = body.transactions.len > 0;
//!
//! // RLP encode
//! const encoded = try BlockBody.rlpEncode(&body, allocator);
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");
const Address = @import("../Address/address.zig");
const Rlp = @import("../Rlp/Rlp.zig");
const crypto = @import("crypto");

// ============================================================================
// Uncle/Ommer Header (simplified for block body)
// ============================================================================

/// Uncle header - simplified block header for uncle references
pub const UncleHeader = struct {
    parent_hash: Hash.Hash = Hash.ZERO,
    ommers_hash: Hash.Hash = Hash.ZERO,
    beneficiary: Address.Address = Address.ZERO_ADDRESS,
    state_root: Hash.Hash = Hash.ZERO,
    transactions_root: Hash.Hash = Hash.ZERO,
    receipts_root: Hash.Hash = Hash.ZERO,
    logs_bloom: [256]u8 = [_]u8{0} ** 256,
    difficulty: u256 = 0,
    number: u64 = 0,
    gas_limit: u64 = 0,
    gas_used: u64 = 0,
    timestamp: u64 = 0,
    extra_data: []const u8 = &[_]u8{},
    mix_hash: Hash.Hash = Hash.ZERO,
    nonce: [8]u8 = [_]u8{0} ** 8,
};

// ============================================================================
// Withdrawal (EIP-4895)
// ============================================================================

/// Withdrawal - validator withdrawal from beacon chain
pub const Withdrawal = struct {
    /// Unique withdrawal index
    index: u64 = 0,
    /// Validator index on beacon chain
    validator_index: u64 = 0,
    /// Withdrawal recipient address
    address: Address.Address = Address.ZERO_ADDRESS,
    /// Amount in Gwei
    amount: u64 = 0,
};

// ============================================================================
// Transaction (simplified for block body - raw encoded bytes)
// ============================================================================

/// Transaction data - raw RLP-encoded transaction bytes
/// The actual transaction decoding is handled by Transaction module
pub const TransactionData = struct {
    /// Raw transaction bytes (type prefix + RLP encoded data)
    raw: []const u8,
};

// ============================================================================
// BlockBody
// ============================================================================

/// BlockBody structure
pub const BlockBody = struct {
    /// Transactions in execution order
    transactions: []const TransactionData = &[_]TransactionData{},

    /// Uncle/ommer headers (empty post-merge)
    ommers: []const UncleHeader = &[_]UncleHeader{},

    /// Withdrawals (post-Shanghai, EIP-4895)
    withdrawals: ?[]const Withdrawal = null,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create a new empty block body
pub fn init() BlockBody {
    return BlockBody{};
}

test "init - creates empty body" {
    const body = init();
    try std.testing.expectEqual(@as(usize, 0), body.transactions.len);
    try std.testing.expectEqual(@as(usize, 0), body.ommers.len);
    try std.testing.expect(body.withdrawals == null);
}

/// Create a post-merge block body (no ommers)
pub fn postMerge() BlockBody {
    return BlockBody{
        .ommers = &[_]UncleHeader{},
    };
}

test "postMerge - creates body without ommers" {
    const body = postMerge();
    try std.testing.expectEqual(@as(usize, 0), body.ommers.len);
}

/// Create a post-Shanghai block body (with empty withdrawals)
pub fn postShanghai() BlockBody {
    return BlockBody{
        .ommers = &[_]UncleHeader{},
        .withdrawals = &[_]Withdrawal{},
    };
}

test "postShanghai - creates body with withdrawals field" {
    const body = postShanghai();
    try std.testing.expect(body.withdrawals != null);
    try std.testing.expectEqual(@as(usize, 0), body.withdrawals.?.len);
}

// ============================================================================
// Validation
// ============================================================================

/// Check if body is for a post-merge block (no ommers expected)
pub fn isPostMerge(body: *const BlockBody) bool {
    return body.ommers.len == 0;
}

test "isPostMerge - with ommers" {
    var body = init();
    const uncles = [_]UncleHeader{UncleHeader{}};
    body.ommers = &uncles;
    try std.testing.expect(!isPostMerge(&body));
}

test "isPostMerge - without ommers" {
    const body = init();
    try std.testing.expect(isPostMerge(&body));
}

/// Check if body has withdrawals (post-Shanghai)
pub fn hasWithdrawals(body: *const BlockBody) bool {
    return body.withdrawals != null;
}

test "hasWithdrawals - pre-Shanghai body" {
    const body = init();
    try std.testing.expect(!hasWithdrawals(&body));
}

test "hasWithdrawals - Shanghai body" {
    const body = postShanghai();
    try std.testing.expect(hasWithdrawals(&body));
}

/// Get transaction count
pub fn transactionCount(body: *const BlockBody) usize {
    return body.transactions.len;
}

test "transactionCount - empty body" {
    const body = init();
    try std.testing.expectEqual(@as(usize, 0), transactionCount(&body));
}

/// Get ommer/uncle count
pub fn ommerCount(body: *const BlockBody) usize {
    return body.ommers.len;
}

test "ommerCount - empty body" {
    const body = init();
    try std.testing.expectEqual(@as(usize, 0), ommerCount(&body));
}

/// Get withdrawal count (returns null if not post-Shanghai)
pub fn withdrawalCount(body: *const BlockBody) ?usize {
    if (body.withdrawals) |w| {
        return w.len;
    }
    return null;
}

test "withdrawalCount - pre-Shanghai" {
    const body = init();
    try std.testing.expect(withdrawalCount(&body) == null);
}

test "withdrawalCount - Shanghai empty" {
    const body = postShanghai();
    try std.testing.expectEqual(@as(usize, 0), withdrawalCount(&body).?);
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

    var start: usize = 0;
    while (start < 8 and bytes[start] == 0) : (start += 1) {}

    const result = try allocator.alloc(u8, 8 - start);
    @memcpy(result, bytes[start..]);
    return result;
}

/// RLP encode an uncle header
fn rlpEncodeUncle(uncle: *const UncleHeader, allocator: std.mem.Allocator) ![]u8 {
    var fields = std.ArrayList([]u8){};
    defer {
        for (fields.items) |item| {
            allocator.free(item);
        }
        fields.deinit(allocator);
    }

    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.parent_hash));
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.ommers_hash));
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.beneficiary.bytes));
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.state_root));
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.transactions_root));
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.receipts_root));
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.logs_bloom));

    const difficulty_bytes = try encodeU256(allocator, uncle.difficulty);
    defer allocator.free(difficulty_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, difficulty_bytes));

    const number_bytes = try encodeU64(allocator, uncle.number);
    defer allocator.free(number_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, number_bytes));

    const gas_limit_bytes = try encodeU64(allocator, uncle.gas_limit);
    defer allocator.free(gas_limit_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, gas_limit_bytes));

    const gas_used_bytes = try encodeU64(allocator, uncle.gas_used);
    defer allocator.free(gas_used_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, gas_used_bytes));

    const timestamp_bytes = try encodeU64(allocator, uncle.timestamp);
    defer allocator.free(timestamp_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, timestamp_bytes));

    try fields.append(allocator, try Rlp.encodeBytes(allocator, uncle.extra_data));
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.mix_hash));
    try fields.append(allocator, try Rlp.encodeBytes(allocator, &uncle.nonce));

    var total_len: usize = 0;
    for (fields.items) |field| {
        total_len += field.len;
    }

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

    for (fields.items) |field| {
        try result.appendSlice(allocator, field);
    }

    return try result.toOwnedSlice(allocator);
}

/// RLP encode a withdrawal
fn rlpEncodeWithdrawal(withdrawal: *const Withdrawal, allocator: std.mem.Allocator) ![]u8 {
    var fields = std.ArrayList([]u8){};
    defer {
        for (fields.items) |item| {
            allocator.free(item);
        }
        fields.deinit(allocator);
    }

    const index_bytes = try encodeU64(allocator, withdrawal.index);
    defer allocator.free(index_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, index_bytes));

    const validator_bytes = try encodeU64(allocator, withdrawal.validator_index);
    defer allocator.free(validator_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, validator_bytes));

    try fields.append(allocator, try Rlp.encodeBytes(allocator, &withdrawal.address.bytes));

    const amount_bytes = try encodeU64(allocator, withdrawal.amount);
    defer allocator.free(amount_bytes);
    try fields.append(allocator, try Rlp.encodeBytes(allocator, amount_bytes));

    var total_len: usize = 0;
    for (fields.items) |field| {
        total_len += field.len;
    }

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

    for (fields.items) |field| {
        try result.appendSlice(allocator, field);
    }

    return try result.toOwnedSlice(allocator);
}

/// RLP encode the block body
/// Format: [transactions, ommers, withdrawals?]
pub fn rlpEncode(body: *const BlockBody, allocator: std.mem.Allocator) ![]u8 {
    var outer_fields = std.ArrayList([]u8){};
    defer {
        for (outer_fields.items) |item| {
            allocator.free(item);
        }
        outer_fields.deinit(allocator);
    }

    // Encode transactions list
    {
        var tx_list = std.ArrayList(u8){};
        defer tx_list.deinit(allocator);

        var tx_total_len: usize = 0;
        var encoded_txs = std.ArrayList([]u8){};
        defer {
            for (encoded_txs.items) |item| {
                allocator.free(item);
            }
            encoded_txs.deinit(allocator);
        }

        for (body.transactions) |tx| {
            const encoded = try Rlp.encodeBytes(allocator, tx.raw);
            try encoded_txs.append(allocator, encoded);
            tx_total_len += encoded.len;
        }

        if (tx_total_len < 56) {
            try tx_list.append(allocator, 0xc0 + @as(u8, @intCast(tx_total_len)));
        } else {
            const len_bytes = try Rlp.encodeLength(allocator, tx_total_len);
            defer allocator.free(len_bytes);
            try tx_list.append(allocator, 0xf7 + @as(u8, @intCast(len_bytes.len)));
            try tx_list.appendSlice(allocator, len_bytes);
        }

        for (encoded_txs.items) |encoded| {
            try tx_list.appendSlice(allocator, encoded);
        }

        try outer_fields.append(allocator, try tx_list.toOwnedSlice(allocator));
    }

    // Encode ommers list
    {
        var ommer_list = std.ArrayList(u8){};
        defer ommer_list.deinit(allocator);

        var ommer_total_len: usize = 0;
        var encoded_ommers = std.ArrayList([]u8){};
        defer {
            for (encoded_ommers.items) |item| {
                allocator.free(item);
            }
            encoded_ommers.deinit(allocator);
        }

        for (body.ommers) |*ommer| {
            const encoded = try rlpEncodeUncle(ommer, allocator);
            try encoded_ommers.append(allocator, encoded);
            ommer_total_len += encoded.len;
        }

        if (ommer_total_len < 56) {
            try ommer_list.append(allocator, 0xc0 + @as(u8, @intCast(ommer_total_len)));
        } else {
            const len_bytes = try Rlp.encodeLength(allocator, ommer_total_len);
            defer allocator.free(len_bytes);
            try ommer_list.append(allocator, 0xf7 + @as(u8, @intCast(len_bytes.len)));
            try ommer_list.appendSlice(allocator, len_bytes);
        }

        for (encoded_ommers.items) |encoded| {
            try ommer_list.appendSlice(allocator, encoded);
        }

        try outer_fields.append(allocator, try ommer_list.toOwnedSlice(allocator));
    }

    // Encode withdrawals list (if present)
    if (body.withdrawals) |withdrawals| {
        var withdrawal_list = std.ArrayList(u8){};
        defer withdrawal_list.deinit(allocator);

        var withdrawal_total_len: usize = 0;
        var encoded_withdrawals = std.ArrayList([]u8){};
        defer {
            for (encoded_withdrawals.items) |item| {
                allocator.free(item);
            }
            encoded_withdrawals.deinit(allocator);
        }

        for (withdrawals) |*w| {
            const encoded = try rlpEncodeWithdrawal(w, allocator);
            try encoded_withdrawals.append(allocator, encoded);
            withdrawal_total_len += encoded.len;
        }

        if (withdrawal_total_len < 56) {
            try withdrawal_list.append(allocator, 0xc0 + @as(u8, @intCast(withdrawal_total_len)));
        } else {
            const len_bytes = try Rlp.encodeLength(allocator, withdrawal_total_len);
            defer allocator.free(len_bytes);
            try withdrawal_list.append(allocator, 0xf7 + @as(u8, @intCast(len_bytes.len)));
            try withdrawal_list.appendSlice(allocator, len_bytes);
        }

        for (encoded_withdrawals.items) |encoded| {
            try withdrawal_list.appendSlice(allocator, encoded);
        }

        try outer_fields.append(allocator, try withdrawal_list.toOwnedSlice(allocator));
    }

    // Build outer list
    var total_len: usize = 0;
    for (outer_fields.items) |field| {
        total_len += field.len;
    }

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

    for (outer_fields.items) |field| {
        try result.appendSlice(allocator, field);
    }

    return try result.toOwnedSlice(allocator);
}

test "rlpEncode - empty body" {
    const allocator = std.testing.allocator;
    const body = init();
    const encoded = try rlpEncode(&body, allocator);
    defer allocator.free(encoded);

    // Should encode as [[],[]] (empty tx list, empty ommer list)
    // 0xc2 0xc0 0xc0
    try std.testing.expectEqual(@as(usize, 3), encoded.len);
    try std.testing.expectEqual(@as(u8, 0xc2), encoded[0]);
    try std.testing.expectEqual(@as(u8, 0xc0), encoded[1]);
    try std.testing.expectEqual(@as(u8, 0xc0), encoded[2]);
}

test "rlpEncode - post-Shanghai empty body" {
    const allocator = std.testing.allocator;
    const body = postShanghai();
    const encoded = try rlpEncode(&body, allocator);
    defer allocator.free(encoded);

    // Should encode as [[],[],[]] (empty tx list, empty ommer list, empty withdrawals)
    // 0xc3 0xc0 0xc0 0xc0
    try std.testing.expectEqual(@as(usize, 4), encoded.len);
    try std.testing.expectEqual(@as(u8, 0xc3), encoded[0]);
}

// ============================================================================
// Hashing
// ============================================================================

/// Compute ommers hash (keccak256 of RLP-encoded ommers list)
pub fn ommersHash(body: *const BlockBody, allocator: std.mem.Allocator) !Hash.Hash {
    var ommer_list = std.ArrayList(u8){};
    defer ommer_list.deinit(allocator);

    var ommer_total_len: usize = 0;
    var encoded_ommers = std.ArrayList([]u8){};
    defer {
        for (encoded_ommers.items) |item| {
            allocator.free(item);
        }
        encoded_ommers.deinit(allocator);
    }

    for (body.ommers) |*ommer| {
        const encoded = try rlpEncodeUncle(ommer, allocator);
        try encoded_ommers.append(allocator, encoded);
        ommer_total_len += encoded.len;
    }

    if (ommer_total_len < 56) {
        try ommer_list.append(allocator, 0xc0 + @as(u8, @intCast(ommer_total_len)));
    } else {
        const len_bytes = try Rlp.encodeLength(allocator, ommer_total_len);
        defer allocator.free(len_bytes);
        try ommer_list.append(allocator, 0xf7 + @as(u8, @intCast(len_bytes.len)));
        try ommer_list.appendSlice(allocator, len_bytes);
    }

    for (encoded_ommers.items) |encoded| {
        try ommer_list.appendSlice(allocator, encoded);
    }

    var result: Hash.Hash = undefined;
    crypto.Keccak256.hash(ommer_list.items, &result);
    return result;
}

test "ommersHash - empty ommers" {
    const allocator = std.testing.allocator;
    const body = init();
    const hash_result = try ommersHash(&body, allocator);

    // Empty ommers hash: keccak256(0xc0) = 0x1dcc4de8...
    const expected: Hash.Hash = .{
        0x1d, 0xcc, 0x4d, 0xe8, 0xde, 0xc7, 0x5d, 0x7a,
        0xab, 0x85, 0xb5, 0x67, 0xb6, 0xcc, 0xd4, 0x1a,
        0xd3, 0x12, 0x45, 0x1b, 0x94, 0x8a, 0x74, 0x13,
        0xf0, 0xa1, 0x42, 0xfd, 0x40, 0xd4, 0x93, 0x47,
    };
    try std.testing.expectEqualSlices(u8, &expected, &hash_result);
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two bodies are equal
pub fn equals(a: *const BlockBody, b: *const BlockBody) bool {
    // Compare transaction count
    if (a.transactions.len != b.transactions.len) return false;

    // Compare ommer count
    if (a.ommers.len != b.ommers.len) return false;

    // Compare withdrawals presence
    if ((a.withdrawals == null) != (b.withdrawals == null)) return false;
    if (a.withdrawals != null and b.withdrawals != null) {
        if (a.withdrawals.?.len != b.withdrawals.?.len) return false;
    }

    return true;
}

test "equals - same body" {
    const body = init();
    try std.testing.expect(equals(&body, &body));
}

test "equals - different withdrawals presence" {
    const body1 = init();
    const body2 = postShanghai();
    try std.testing.expect(!equals(&body1, &body2));
}

// ============================================================================
// Clone
// ============================================================================

/// Clone a block body
pub fn clone(body: *const BlockBody) BlockBody {
    return body.*;
}

test "clone - creates copy" {
    const original = postShanghai();
    const copy = clone(&original);
    try std.testing.expect(copy.withdrawals != null);
}
