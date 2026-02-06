//! AccountState - Represents the state of an Ethereum account
//!
//! Each account in Ethereum has four fields as defined in the Yellow Paper (section 4.1):
//! - nonce: Number of transactions sent from this address (EOA) or contracts created (contract)
//! - balance: Amount of Wei owned by this account
//! - storageRoot: Root hash of the account's storage trie
//! - codeHash: Hash of the account's EVM bytecode
//!
//! ## Design
//! - Balance stored as u256 (Wei)
//! - Nonce stored as u64 (sufficient for practical use)
//! - storageRoot and codeHash are 32-byte hashes
//! - Provides RLP encoding/decoding for state serialization
//!
//! ## Usage
//! ```zig
//! const AccountState = @import("primitives").AccountState;
//!
//! // Create empty EOA
//! const empty = AccountState.createEmpty();
//!
//! // Create custom account state
//! const state = AccountState.from(.{
//!     .nonce = 5,
//!     .balance = 1000000000000000000, // 1 ETH in Wei
//!     .storage_root = AccountState.EMPTY_TRIE_ROOT,
//!     .code_hash = AccountState.EMPTY_CODE_HASH,
//! });
//!
//! // Check account type
//! if (state.isEOA()) { ... }
//! if (state.isContract()) { ... }
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");
const StateRoot = @import("../StateRoot/StateRoot.zig");
const Nonce = @import("../Nonce/Nonce.zig");
const Rlp = @import("../Rlp/Rlp.zig");
const State = @import("../State/state.zig");

/// Hash of empty EVM bytecode (Keccak256 of empty bytes).
/// Used to identify EOAs (externally owned accounts) which have no code.
/// Value: Keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
pub const EMPTY_CODE_HASH: Hash.Hash = State.EMPTY_CODE_HASH;

/// Root hash of an empty Merkle Patricia Trie.
/// Used as the initial storage root for accounts with no storage.
/// Value: 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
pub const EMPTY_TRIE_ROOT: StateRoot.StateRoot = State.EMPTY_TRIE_ROOT;

/// AccountState represents the state of an Ethereum account.
/// Per Yellow Paper section 4.1, each account has:
/// - nonce: scalar equal to number of transactions sent from this address
/// - balance: scalar equal to Wei owned by this address
/// - storageRoot: 256-bit hash of root node of storage trie
/// - codeHash: hash of the EVM code of this account
pub const AccountState = struct {
    /// Transaction count (EOA) or number of contract creations (contract).
    /// Starts at 0 and increments with each transaction/creation.
    nonce: u64,

    /// Account balance in Wei (10^-18 ETH).
    /// Can be zero or any positive value up to 2^256-1.
    balance: u256,

    /// Root hash of the account's storage trie.
    /// For EOAs, this is EMPTY_TRIE_ROOT.
    /// For contracts, this is the root of their storage Merkle Patricia Trie.
    storage_root: StateRoot.StateRoot,

    /// Keccak256 hash of the account's EVM bytecode.
    /// For EOAs, this is EMPTY_CODE_HASH (keccak256 of empty bytes).
    /// For contracts, this is the hash of their deployed bytecode.
    code_hash: Hash.Hash,

    const Self = @This();

    /// Create AccountState from components
    pub fn from(opts: struct {
        nonce: u64 = 0,
        balance: u256 = 0,
        storage_root: StateRoot.StateRoot = EMPTY_TRIE_ROOT,
        code_hash: Hash.Hash = EMPTY_CODE_HASH,
    }) Self {
        return .{
            .nonce = opts.nonce,
            .balance = opts.balance,
            .storage_root = opts.storage_root,
            .code_hash = opts.code_hash,
        };
    }

    /// Create an empty AccountState representing a fresh EOA.
    /// Empty accounts have:
    /// - nonce: 0
    /// - balance: 0 Wei
    /// - storageRoot: empty trie hash
    /// - codeHash: empty code hash
    pub fn createEmpty() Self {
        return .{
            .nonce = 0,
            .balance = 0,
            .storage_root = EMPTY_TRIE_ROOT,
            .code_hash = EMPTY_CODE_HASH,
        };
    }

    /// Check if this account is an EOA (Externally Owned Account).
    /// An EOA is identified by having the empty code hash, meaning no bytecode.
    /// EOAs can only send transactions and cannot execute code.
    pub fn isEOA(self: *const Self) bool {
        return std.mem.eql(u8, &self.code_hash, &EMPTY_CODE_HASH);
    }

    /// Check if this account is a contract account.
    /// A contract is identified by having a non-empty code hash.
    /// Contracts have associated bytecode that can be executed.
    pub fn isContract(self: *const Self) bool {
        return !self.isEOA();
    }

    /// Compare two AccountStates for equality.
    /// All four fields must match for accounts to be considered equal.
    pub fn equals(self: *const Self, other: *const Self) bool {
        return self.nonce == other.nonce and
            self.balance == other.balance and
            std.mem.eql(u8, &self.storage_root, &other.storage_root) and
            std.mem.eql(u8, &self.code_hash, &other.code_hash);
    }

    /// RLP encode the account state.
    /// Encoding order: [nonce, balance, storageRoot, codeHash]
    /// This is the canonical encoding used in the state trie.
    pub fn rlpEncode(self: *const Self, allocator: std.mem.Allocator) ![]u8 {
        // Encode each field
        var encoded_fields: [4][]u8 = undefined;
        var field_count: usize = 0;

        errdefer {
            for (0..field_count) |i| {
                allocator.free(encoded_fields[i]);
            }
        }

        // Encode nonce (as minimal bytes, no leading zeros)
        encoded_fields[0] = try encodeU64(allocator, self.nonce);
        field_count = 1;

        // Encode balance (as minimal bytes)
        encoded_fields[1] = try encodeU256(allocator, self.balance);
        field_count = 2;

        // Encode storage_root (32 bytes)
        encoded_fields[2] = try Rlp.encodeBytes(allocator, &self.storage_root);
        field_count = 3;

        // Encode code_hash (32 bytes)
        encoded_fields[3] = try Rlp.encodeBytes(allocator, &self.code_hash);
        field_count = 4;

        // Calculate total payload length
        var payload_len: usize = 0;
        for (encoded_fields[0..4]) |f| {
            payload_len += f.len;
        }

        // Create list header + concatenate fields
        var result = std.ArrayList(u8){};
        errdefer result.deinit(allocator);

        // Add list header
        if (payload_len < 56) {
            try result.append(allocator, 0xc0 + @as(u8, @intCast(payload_len)));
        } else {
            const len_bytes = try encodeLength(allocator, payload_len);
            defer allocator.free(len_bytes);
            try result.append(allocator, 0xf7 + @as(u8, @intCast(len_bytes.len)));
            try result.appendSlice(allocator, len_bytes);
        }

        // Append all encoded fields
        for (encoded_fields[0..4]) |f| {
            try result.appendSlice(allocator, f);
            allocator.free(f);
        }

        return result.toOwnedSlice(allocator);
    }

    /// RLP decode an account state from bytes.
    pub fn rlpDecode(allocator: std.mem.Allocator, data: []const u8) !Self {
        const decoded = try Rlp.decode(allocator, data);
        defer decoded.data.deinit(allocator);

        if (decoded.data != .List) {
            return error.InvalidAccountState;
        }

        const items = decoded.data.List;
        if (items.len != 4) {
            return error.InvalidAccountState;
        }

        // Decode nonce
        const nonce = try decodeToU64(items[0]);

        // Decode balance
        const balance = try decodeToU256(items[1]);

        // Decode storage_root (must be 32 bytes)
        if (items[2] != .String or items[2].String.len != 32) {
            return error.InvalidAccountState;
        }
        var storage_root: StateRoot.StateRoot = undefined;
        @memcpy(&storage_root, items[2].String);

        // Decode code_hash (must be 32 bytes)
        if (items[3] != .String or items[3].String.len != 32) {
            return error.InvalidAccountState;
        }
        var code_hash: Hash.Hash = undefined;
        @memcpy(&code_hash, items[3].String);

        return Self{
            .nonce = nonce,
            .balance = balance,
            .storage_root = storage_root,
            .code_hash = code_hash,
        };
    }
};

// ============================================================================
// Helper Functions
// ============================================================================

/// Encode u64 as RLP bytes (minimal encoding, no leading zeros)
fn encodeU64(allocator: std.mem.Allocator, value: u64) ![]u8 {
    if (value == 0) {
        // Encode 0 as empty string (0x80)
        const result = try allocator.alloc(u8, 1);
        result[0] = 0x80;
        return result;
    }

    // Find minimal byte length
    var temp = value;
    var byte_len: usize = 0;
    while (temp > 0) {
        byte_len += 1;
        temp >>= 8;
    }

    // Convert to big-endian bytes
    var bytes: [8]u8 = undefined;
    std.mem.writeInt(u64, &bytes, value, .big);
    const start = 8 - byte_len;

    // Single byte 0x00-0x7f encodes as itself
    if (byte_len == 1 and bytes[start] < 0x80) {
        const result = try allocator.alloc(u8, 1);
        result[0] = bytes[start];
        return result;
    }

    // Otherwise prefix with length
    const result = try allocator.alloc(u8, 1 + byte_len);
    result[0] = 0x80 + @as(u8, @intCast(byte_len));
    @memcpy(result[1..], bytes[start..]);
    return result;
}

/// Encode u256 as RLP bytes (minimal encoding, no leading zeros)
fn encodeU256(allocator: std.mem.Allocator, value: u256) ![]u8 {
    if (value == 0) {
        const result = try allocator.alloc(u8, 1);
        result[0] = 0x80;
        return result;
    }

    // Convert to big-endian bytes
    var bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &bytes, value, .big);

    // Find first non-zero byte
    var start: usize = 0;
    while (start < 32 and bytes[start] == 0) {
        start += 1;
    }

    const byte_len = 32 - start;

    // Single byte 0x00-0x7f encodes as itself
    if (byte_len == 1 and bytes[start] < 0x80) {
        const result = try allocator.alloc(u8, 1);
        result[0] = bytes[start];
        return result;
    }

    // Short string (1-55 bytes): 0x80 + len, then data
    if (byte_len <= 55) {
        const result = try allocator.alloc(u8, 1 + byte_len);
        result[0] = 0x80 + @as(u8, @intCast(byte_len));
        @memcpy(result[1..], bytes[start..]);
        return result;
    }

    // Long string (55+ bytes): 0xb7 + len_of_len, then len, then data
    // u256 max is 32 bytes so this won't happen, but include for completeness
    const len_bytes = try encodeLength(allocator, byte_len);
    defer allocator.free(len_bytes);
    const result = try allocator.alloc(u8, 1 + len_bytes.len + byte_len);
    result[0] = 0xb7 + @as(u8, @intCast(len_bytes.len));
    @memcpy(result[1 .. 1 + len_bytes.len], len_bytes);
    @memcpy(result[1 + len_bytes.len ..], bytes[start..]);
    return result;
}

/// Encode length as minimal big-endian bytes
fn encodeLength(allocator: std.mem.Allocator, length: usize) ![]u8 {
    var temp = length;
    var byte_len: usize = 0;
    while (temp > 0) {
        byte_len += 1;
        temp >>= 8;
    }

    if (byte_len == 0) byte_len = 1;

    var bytes: [8]u8 = undefined;
    std.mem.writeInt(u64, &bytes, @intCast(length), .big);
    const start = 8 - byte_len;

    const result = try allocator.alloc(u8, byte_len);
    @memcpy(result, bytes[start..]);
    return result;
}

/// Decode RLP data to u64
fn decodeToU64(data: Rlp.Data) !u64 {
    if (data != .String) return error.InvalidAccountState;
    const bytes = data.String;

    if (bytes.len == 0) return 0;
    if (bytes.len > 8) return error.InvalidAccountState;

    // Check for leading zeros (non-canonical)
    if (bytes.len > 1 and bytes[0] == 0) return error.InvalidAccountState;

    var result: u64 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

/// Decode RLP data to u256
fn decodeToU256(data: Rlp.Data) !u256 {
    if (data != .String) return error.InvalidAccountState;
    const bytes = data.String;

    if (bytes.len == 0) return 0;
    if (bytes.len > 32) return error.InvalidAccountState;

    // Check for leading zeros (non-canonical)
    if (bytes.len > 1 and bytes[0] == 0) return error.InvalidAccountState;

    var result: u256 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

// ============================================================================
// Tests
// ============================================================================

test "createEmpty - creates valid empty state" {
    const state = AccountState.createEmpty();

    try std.testing.expectEqual(@as(u64, 0), state.nonce);
    try std.testing.expectEqual(@as(u256, 0), state.balance);
    try std.testing.expectEqualSlices(u8, &EMPTY_TRIE_ROOT, &state.storage_root);
    try std.testing.expectEqualSlices(u8, &EMPTY_CODE_HASH, &state.code_hash);
}

test "createEmpty - is EOA" {
    const state = AccountState.createEmpty();
    try std.testing.expect(state.isEOA());
    try std.testing.expect(!state.isContract());
}

test "from - creates state with specified values" {
    const state = AccountState.from(.{
        .nonce = 5,
        .balance = 1000000000000000000, // 1 ETH
        .storage_root = EMPTY_TRIE_ROOT,
        .code_hash = EMPTY_CODE_HASH,
    });

    try std.testing.expectEqual(@as(u64, 5), state.nonce);
    try std.testing.expectEqual(@as(u256, 1000000000000000000), state.balance);
}

test "from - default values create empty state" {
    const state = AccountState.from(.{});
    const empty = AccountState.createEmpty();

    try std.testing.expect(state.equals(&empty));
}

test "isEOA - true for empty code hash" {
    const state = AccountState.from(.{
        .nonce = 10,
        .balance = 5000000000000000000,
        .code_hash = EMPTY_CODE_HASH,
    });

    try std.testing.expect(state.isEOA());
}

test "isEOA - false for non-empty code hash" {
    var custom_code_hash: Hash.Hash = undefined;
    @memset(&custom_code_hash, 0x12);

    const state = AccountState.from(.{
        .nonce = 1,
        .balance = 0,
        .code_hash = custom_code_hash,
    });

    try std.testing.expect(!state.isEOA());
}

test "isContract - true for non-empty code hash" {
    var custom_code_hash: Hash.Hash = undefined;
    @memset(&custom_code_hash, 0xab);

    const state = AccountState.from(.{
        .nonce = 1,
        .balance = 0,
        .code_hash = custom_code_hash,
    });

    try std.testing.expect(state.isContract());
}

test "isContract - false for empty code hash" {
    const state = AccountState.createEmpty();
    try std.testing.expect(!state.isContract());
}

test "equals - identical states are equal" {
    const state1 = AccountState.createEmpty();
    const state2 = AccountState.createEmpty();

    try std.testing.expect(state1.equals(&state2));
}

test "equals - same values are equal" {
    const state1 = AccountState.from(.{
        .nonce = 42,
        .balance = 100,
    });
    const state2 = AccountState.from(.{
        .nonce = 42,
        .balance = 100,
    });

    try std.testing.expect(state1.equals(&state2));
}

test "equals - different nonce not equal" {
    const state1 = AccountState.from(.{ .nonce = 1 });
    const state2 = AccountState.from(.{ .nonce = 2 });

    try std.testing.expect(!state1.equals(&state2));
}

test "equals - different balance not equal" {
    const state1 = AccountState.from(.{ .balance = 100 });
    const state2 = AccountState.from(.{ .balance = 200 });

    try std.testing.expect(!state1.equals(&state2));
}

test "equals - different storage_root not equal" {
    var custom_root: StateRoot.StateRoot = undefined;
    @memset(&custom_root, 0xff);

    const state1 = AccountState.from(.{});
    const state2 = AccountState.from(.{ .storage_root = custom_root });

    try std.testing.expect(!state1.equals(&state2));
}

test "equals - different code_hash not equal" {
    var custom_hash: Hash.Hash = undefined;
    @memset(&custom_hash, 0xee);

    const state1 = AccountState.from(.{});
    const state2 = AccountState.from(.{ .code_hash = custom_hash });

    try std.testing.expect(!state1.equals(&state2));
}

test "EMPTY_CODE_HASH is keccak256 of empty bytes" {
    const crypto = @import("crypto");
    var computed: [32]u8 = undefined;
    crypto.Keccak256.hash(&.{}, &computed);

    try std.testing.expectEqualSlices(u8, &EMPTY_CODE_HASH, &computed);
}

test "EMPTY_TRIE_ROOT is keccak256 of RLP null" {
    const crypto = @import("crypto");
    var computed: [32]u8 = undefined;
    crypto.Keccak256.hash(&[_]u8{0x80}, &computed);

    try std.testing.expectEqualSlices(u8, &EMPTY_TRIE_ROOT, &computed);
}

test "rlpEncode - empty state" {
    const state = AccountState.createEmpty();

    const encoded = try state.rlpEncode(std.testing.allocator);
    defer std.testing.allocator.free(encoded);

    // Should be a list: [nonce=0, balance=0, storageRoot, codeHash]
    // First byte should indicate a list
    try std.testing.expect(encoded[0] >= 0xc0);
}

test "rlpEncode and rlpDecode - round trip empty state" {
    const original = AccountState.createEmpty();

    const encoded = try original.rlpEncode(std.testing.allocator);
    defer std.testing.allocator.free(encoded);

    const decoded = try AccountState.rlpDecode(std.testing.allocator, encoded);

    try std.testing.expect(original.equals(&decoded));
}

test "rlpEncode and rlpDecode - round trip with values" {
    const original = AccountState.from(.{
        .nonce = 42,
        .balance = 1000000000000000000, // 1 ETH
    });

    const encoded = try original.rlpEncode(std.testing.allocator);
    defer std.testing.allocator.free(encoded);

    const decoded = try AccountState.rlpDecode(std.testing.allocator, encoded);

    try std.testing.expect(original.equals(&decoded));
}

test "rlpEncode and rlpDecode - round trip with large balance" {
    // Max u256
    const max_balance: u256 = std.math.maxInt(u256);
    const original = AccountState.from(.{
        .nonce = std.math.maxInt(u64),
        .balance = max_balance,
    });

    const encoded = try original.rlpEncode(std.testing.allocator);
    defer std.testing.allocator.free(encoded);

    const decoded = try AccountState.rlpDecode(std.testing.allocator, encoded);

    try std.testing.expect(original.equals(&decoded));
}

test "rlpEncode and rlpDecode - round trip contract state" {
    var custom_root: StateRoot.StateRoot = undefined;
    @memset(&custom_root, 0xaa);
    var custom_hash: Hash.Hash = undefined;
    @memset(&custom_hash, 0xbb);

    const original = AccountState.from(.{
        .nonce = 100,
        .balance = 500,
        .storage_root = custom_root,
        .code_hash = custom_hash,
    });

    const encoded = try original.rlpEncode(std.testing.allocator);
    defer std.testing.allocator.free(encoded);

    const decoded = try AccountState.rlpDecode(std.testing.allocator, encoded);

    try std.testing.expect(original.equals(&decoded));
}

test "encodeU64 - zero" {
    const encoded = try encodeU64(std.testing.allocator, 0);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 1), encoded.len);
    try std.testing.expectEqual(@as(u8, 0x80), encoded[0]);
}

test "encodeU64 - single byte < 0x80" {
    const encoded = try encodeU64(std.testing.allocator, 0x7f);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 1), encoded.len);
    try std.testing.expectEqual(@as(u8, 0x7f), encoded[0]);
}

test "encodeU64 - single byte >= 0x80" {
    const encoded = try encodeU64(std.testing.allocator, 0x80);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 2), encoded.len);
    try std.testing.expectEqual(@as(u8, 0x81), encoded[0]);
    try std.testing.expectEqual(@as(u8, 0x80), encoded[1]);
}

test "encodeU64 - multi-byte value" {
    const encoded = try encodeU64(std.testing.allocator, 0x0400);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 3), encoded.len);
    try std.testing.expectEqual(@as(u8, 0x82), encoded[0]);
    try std.testing.expectEqual(@as(u8, 0x04), encoded[1]);
    try std.testing.expectEqual(@as(u8, 0x00), encoded[2]);
}

test "encodeU256 - zero" {
    const encoded = try encodeU256(std.testing.allocator, 0);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 1), encoded.len);
    try std.testing.expectEqual(@as(u8, 0x80), encoded[0]);
}

test "encodeU256 - small value" {
    const encoded = try encodeU256(std.testing.allocator, 42);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 1), encoded.len);
    try std.testing.expectEqual(@as(u8, 42), encoded[0]);
}

test "encodeU256 - 1 ETH in Wei" {
    const one_eth: u256 = 1000000000000000000;
    const encoded = try encodeU256(std.testing.allocator, one_eth);
    defer std.testing.allocator.free(encoded);

    // 1 ETH = 0x0de0b6b3a7640000 (8 bytes)
    try std.testing.expectEqual(@as(usize, 9), encoded.len); // 1 byte prefix + 8 bytes data
    try std.testing.expectEqual(@as(u8, 0x88), encoded[0]); // 0x80 + 8
}
