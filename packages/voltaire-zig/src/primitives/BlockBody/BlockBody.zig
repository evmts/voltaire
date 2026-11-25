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
    logs_bloom: [256]u8 = @as([256]u8, @splat(0)),
    difficulty: u256 = 0,
    number: u64 = 0,
    gas_limit: u64 = 0,
    gas_used: u64 = 0,
    timestamp: u64 = 0,
    extra_data: []const u8 = &[_]u8{},
    mix_hash: Hash.Hash = Hash.ZERO,
    nonce: [8]u8 = @as([8]u8, @splat(0)),
    /// EIP-1559 base fee. Present on London-era PoW ommers, where it is the
    /// 16th RLP field of the header. `null` for pre-London ommers (15 fields).
    base_fee_per_gas: ?u256 = null,
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
    /// Serialized legacy RLP list or typed EIP-2718 envelope.
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
    var fields = std.ArrayList([]u8).empty;
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

    // London (EIP-1559): base fee is the 16th header field
    if (uncle.base_fee_per_gas) |base_fee| {
        const base_fee_bytes = try encodeU256(allocator, base_fee);
        defer allocator.free(base_fee_bytes);
        try fields.append(allocator, try Rlp.encodeBytes(allocator, base_fee_bytes));
    }

    var total_len: usize = 0;
    for (fields.items) |field| {
        total_len += field.len;
    }

    var result = std.ArrayList(u8).empty;
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
    var fields = std.ArrayList([]u8).empty;
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

    var result = std.ArrayList(u8).empty;
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
    return rlpEncodeWithHeader(body, allocator, null);
}

/// RLP encode a body with an optional, already-encoded header in the outer list.
pub fn rlpEncodeWithHeader(
    body: *const BlockBody,
    allocator: std.mem.Allocator,
    header: ?[]const u8,
) ![]u8 {
    var fields = std.ArrayList(u8).empty;
    defer fields.deinit(allocator);
    if (header) |encoded| try fields.appendSlice(allocator, encoded);

    var payload = std.ArrayList(u8).empty;
    defer payload.deinit(allocator);

    for (body.transactions) |tx| {
        if (tx.raw.len > 0 and tx.raw[0] >= 0xc0) {
            // Legacy transactions are already RLP list items.
            try payload.appendSlice(allocator, tx.raw);
        } else {
            const encoded = try Rlp.encodeBytes(allocator, tx.raw);
            defer allocator.free(encoded);
            try payload.appendSlice(allocator, encoded);
        }
    }
    try appendRlpList(allocator, &fields, payload.items);

    payload.clearRetainingCapacity();
    for (body.ommers) |*ommer| {
        const encoded = try rlpEncodeUncle(ommer, allocator);
        defer allocator.free(encoded);
        try payload.appendSlice(allocator, encoded);
    }
    try appendRlpList(allocator, &fields, payload.items);

    if (body.withdrawals) |withdrawals| {
        payload.clearRetainingCapacity();
        for (withdrawals) |*withdrawal| {
            const encoded = try rlpEncodeWithdrawal(withdrawal, allocator);
            defer allocator.free(encoded);
            try payload.appendSlice(allocator, encoded);
        }
        try appendRlpList(allocator, &fields, payload.items);
    }

    var result = std.ArrayList(u8).empty;
    defer result.deinit(allocator);
    try appendRlpList(allocator, &result, fields.items);
    return result.toOwnedSlice(allocator);
}

fn appendRlpList(allocator: std.mem.Allocator, out: *std.ArrayList(u8), payload: []const u8) !void {
    if (payload.len < 56) {
        try out.append(allocator, 0xc0 + @as(u8, @intCast(payload.len)));
    } else {
        const len_bytes = try Rlp.encodeLength(allocator, payload.len);
        defer allocator.free(len_bytes);
        try out.append(allocator, 0xf7 + @as(u8, @intCast(len_bytes.len)));
        try out.appendSlice(allocator, len_bytes);
    }
    try out.appendSlice(allocator, payload);
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

test "rlpEncode - legacy list and typed transaction envelope" {
    const allocator = std.testing.allocator;
    const body: BlockBody = .{ .transactions = &.{
        .{ .raw = "\xc1\x01" },
        .{ .raw = "\x02\xc1\x02" },
    } };
    const encoded = try rlpEncode(&body, allocator);
    defer allocator.free(encoded);
    try std.testing.expectEqualSlices(u8, "\xc8\xc6\xc1\x01\x83\x02\xc1\x02\xc0", encoded);
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
    var ommer_list = std.ArrayList(u8).empty;
    defer ommer_list.deinit(allocator);

    var ommer_total_len: usize = 0;
    var encoded_ommers = std.ArrayList([]u8).empty;
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
    crypto.Keccak256.hash(ommer_list.items, &result, .{});
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

fn londonTestOmmer() UncleHeader {
    return .{
        .parent_hash = @as([32]u8, @splat(0x11)),
        .ommers_hash = @as([32]u8, @splat(0x22)),
        .beneficiary = .{ .bytes = @as([20]u8, @splat(0x33)) },
        .state_root = @as([32]u8, @splat(0x44)),
        .transactions_root = @as([32]u8, @splat(0x55)),
        .receipts_root = @as([32]u8, @splat(0x66)),
        .logs_bloom = @as([256]u8, @splat(0x77)),
        .difficulty = 7742494561645080,
        .number = 12965001,
        .gas_limit = 30029122,
        .gas_used = 30025257,
        .timestamp = 1628166822,
        .extra_data = "voltaire",
        .mix_hash = @as([32]u8, @splat(0x88)),
        .nonce = .{ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08 },
        .base_fee_per_gas = 1_000_000_000,
    };
}

test "ommersHash - London ommer encodes base fee as the 16th field" {
    const allocator = std.testing.allocator;
    const ommer = londonTestOmmer();

    const encoded = try rlpEncodeUncle(&ommer, allocator);
    defer allocator.free(encoded);

    // Ends with the base fee item: 0x84 3b9aca00 (1 gwei)
    try std.testing.expectEqualSlices(u8, &.{ 0x84, 0x3b, 0x9a, 0xca, 0x00 }, encoded[encoded.len - 5 ..]);

    // Pre-London form of the same header is exactly 5 payload bytes shorter
    var legacy = ommer;
    legacy.base_fee_per_gas = null;
    const legacy_encoded = try rlpEncodeUncle(&legacy, allocator);
    defer allocator.free(legacy_encoded);
    try std.testing.expectEqual(legacy_encoded.len + 5, encoded.len);

    // ommersHash = keccak256(rlp([header])), pinned to a value computed by an
    // independent RLP + keccak256 implementation (@noble/hashes)
    const ommers = [_]UncleHeader{ommer};
    const body = BlockBody{ .ommers = &ommers };
    const got = try ommersHash(&body, allocator);
    const expected: Hash.Hash = .{ 0x23, 0x66, 0x0a, 0x76, 0xc9, 0x2f, 0x6c, 0x9e, 0xb1, 0x0f, 0x51, 0x73, 0x43, 0xfb, 0xf0, 0xa9, 0xc3, 0x35, 0xa9, 0x69, 0xac, 0x24, 0xb0, 0x4d, 0x75, 0x9b, 0xf0, 0x3e, 0x81, 0xaa, 0x1b, 0x3f };
    try std.testing.expectEqualSlices(u8, &expected, &got);

    // Dropping the base fee changes the hash
    const legacy_ommers = [_]UncleHeader{legacy};
    const legacy_body = BlockBody{ .ommers = &legacy_ommers };
    const legacy_hash = try ommersHash(&legacy_body, allocator);
    try std.testing.expect(!std.mem.eql(u8, &got, &legacy_hash));
}

test "ommersHash - London ommer matches BlockHeader consensus encoding" {
    const BlockHeader = @import("../BlockHeader/BlockHeader.zig");
    const allocator = std.testing.allocator;
    const ommer = londonTestOmmer();

    // The same header through the full BlockHeader encoder
    var header = BlockHeader.init();
    header.parent_hash = ommer.parent_hash;
    header.ommers_hash = ommer.ommers_hash;
    header.beneficiary = ommer.beneficiary;
    header.state_root = ommer.state_root;
    header.transactions_root = ommer.transactions_root;
    header.receipts_root = ommer.receipts_root;
    header.logs_bloom = ommer.logs_bloom;
    header.difficulty = ommer.difficulty;
    header.number = ommer.number;
    header.gas_limit = ommer.gas_limit;
    header.gas_used = ommer.gas_used;
    header.timestamp = ommer.timestamp;
    header.extra_data = ommer.extra_data;
    header.mix_hash = ommer.mix_hash;
    header.nonce = ommer.nonce;
    header.base_fee_per_gas = ommer.base_fee_per_gas;

    const header_rlp = try BlockHeader.rlpEncode(&header, allocator);
    defer allocator.free(header_rlp);
    const uncle_rlp = try rlpEncodeUncle(&ommer, allocator);
    defer allocator.free(uncle_rlp);
    try std.testing.expectEqualSlices(u8, header_rlp, uncle_rlp);

    // Zero base fee is still the 16th field (empty RLP string), not absent
    var zero_fee = ommer;
    zero_fee.base_fee_per_gas = 0;
    header.base_fee_per_gas = 0;
    const header_zero = try BlockHeader.rlpEncode(&header, allocator);
    defer allocator.free(header_zero);
    const uncle_zero = try rlpEncodeUncle(&zero_fee, allocator);
    defer allocator.free(uncle_zero);
    try std.testing.expectEqualSlices(u8, header_zero, uncle_zero);
    try std.testing.expectEqual(@as(u8, 0x80), uncle_zero[uncle_zero.len - 1]);
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
