//! BlockAccessList - EIP-7928 Block-Level Access Lists (Amsterdam)
//!
//! A block access list records every account and storage slot a block touches,
//! with the post-execution values of each write. The header commits to it with
//! `block_access_list_hash = keccak256(rlp.encode(block_access_list))`, and the
//! Engine API carries the RLP bytes in `ExecutionPayloadV4.blockAccessList`.
//!
//! ## RLP layout
//! ```
//! BlockAccessList = List[AccountChanges]
//! AccountChanges  = [address, storage_changes, storage_reads,
//!                    balance_changes, nonce_changes, code_changes]
//! SlotChanges     = [StorageKey, List[StorageChange]]
//! StorageChange   = [BlockAccessIndex, StorageValue]
//! BalanceChange   = [BlockAccessIndex, Balance]
//! NonceChange     = [BlockAccessIndex, Nonce]
//! CodeChange      = [BlockAccessIndex, Bytecode]
//! ```
//! Storage keys, storage values, balances, nonces, and access indices are RLP
//! integers: minimal big-endian, zero as `0x80`, never padded to 32 bytes.
//!
//! ## Canonical order
//! Accounts ascend strictly by address. Slots, storage reads, and every change
//! list ascend strictly by their key, so each key is unique. A slot appears in
//! `storage_changes` or `storage_reads`, never both. Each `SlotChanges` holds
//! at least one change.
//!
//! ## Usage
//! ```zig
//! const BlockAccessList = @import("primitives").BlockAccessList;
//!
//! const list = BlockAccessList.BlockAccessList{ .accounts = &.{
//!     .{ .address = addr, .storage_reads = &.{ 0, 2 } },
//! } };
//! const encoded = try BlockAccessList.rlpEncode(&list, allocator);
//! defer allocator.free(encoded);
//! const commitment = try BlockAccessList.hash(&list, allocator);
//!
//! var decoded = try BlockAccessList.rlpDecode(allocator, encoded);
//! defer decoded.deinit();
//! ```
//!
//! See https://eips.ethereum.org/EIPS/eip-7928

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");
const Address = @import("../Address/address.zig");
const Rlp = @import("../Rlp/Rlp.zig");
const crypto = @import("crypto");

/// EIP-7928 block access index: 0 for pre-execution system calls, 1..n for
/// transactions in block order, n + 1 for post-execution system calls.
pub const BlockAccessIndex = u32;

/// EIP-7928 `ITEM_COST`. A list is valid for a block only when
/// `addresses + storage_keys <= block_gas_limit / ITEM_COST`.
pub const ITEM_COST: u64 = 2000;

/// `keccak256(rlp.encode([]))`, the `block_access_list_hash` of an empty list.
pub const EMPTY_BLOCK_ACCESS_LIST_HASH: Hash.Hash = .{
    0x1d, 0xcc, 0x4d, 0xe8, 0xde, 0xc7, 0x5d, 0x7a,
    0xab, 0x85, 0xb5, 0x67, 0xb6, 0xcc, 0xd4, 0x1a,
    0xd3, 0x12, 0x45, 0x1b, 0x94, 0x8a, 0x74, 0x13,
    0xf0, 0xa1, 0x42, 0xfd, 0x40, 0xd4, 0x93, 0x47,
};

/// `[BlockAccessIndex, StorageValue]`: slot value after the index executed.
pub const StorageChange = struct {
    block_access_index: BlockAccessIndex,
    new_value: u256,
};

/// `[BlockAccessIndex, Balance]`: balance in wei after the index executed.
pub const BalanceChange = struct {
    block_access_index: BlockAccessIndex,
    post_balance: u256,
};

/// `[BlockAccessIndex, Nonce]`: nonce after the index executed.
pub const NonceChange = struct {
    block_access_index: BlockAccessIndex,
    new_nonce: u64,
};

/// `[BlockAccessIndex, Bytecode]`: runtime code after the index executed.
pub const CodeChange = struct {
    block_access_index: BlockAccessIndex,
    new_code: []const u8,
};

/// `[StorageKey, List[StorageChange]]`: every write to one slot.
pub const SlotChanges = struct {
    slot: u256,
    /// At least one change, ascending by `block_access_index`.
    changes: []const StorageChange,
};

/// All accesses and changes for one account.
pub const AccountChanges = struct {
    address: Address.Address,
    /// Written slots, ascending by `slot`.
    storage_changes: []const SlotChanges = &.{},
    /// Slots read but never written, ascending.
    storage_reads: []const u256 = &.{},
    balance_changes: []const BalanceChange = &.{},
    nonce_changes: []const NonceChange = &.{},
    code_changes: []const CodeChange = &.{},
};

/// EIP-7928 block access list in canonical order.
pub const BlockAccessList = struct {
    /// Accounts, ascending by address.
    accounts: []const AccountChanges = &.{},

    /// Owns every slice of a list returned by `rlpDecode`. Null for lists the
    /// caller built, whose memory the caller owns.
    arena: ?std.heap.ArenaAllocator = null,

    /// Free a list returned by `rlpDecode`. No-op for caller-built lists.
    pub fn deinit(self: *BlockAccessList) void {
        if (self.arena) |arena| arena.deinit();
        self.* = .{};
    }
};

pub const Error = error{InvalidBlockAccessList};

/// Count the items the `ITEM_COST` size bound charges for:
/// addresses plus storage keys (written and read).
pub fn itemCount(list: *const BlockAccessList) u64 {
    var n: u64 = list.accounts.len;
    for (list.accounts) |account| {
        n += account.storage_changes.len + account.storage_reads.len;
    }
    return n;
}

/// Check every EIP-7928 rule that needs no block context: canonical ordering,
/// uniqueness, read/write disjointness, and non-empty slot changes.
///
/// It does not check that access indices stay within `len(transactions) + 1`
/// or the `ITEM_COST` bound; both need the block. Use `itemCount` for the bound.
pub fn validate(list: *const BlockAccessList) Error!void {
    for (list.accounts, 0..) |account, a| {
        if (a > 0 and std.mem.order(u8, &list.accounts[a - 1].address.bytes, &account.address.bytes) != .lt) {
            return error.InvalidBlockAccessList;
        }

        for (account.storage_changes, 0..) |slot_changes, s| {
            if (s > 0 and account.storage_changes[s - 1].slot >= slot_changes.slot) {
                return error.InvalidBlockAccessList;
            }
            if (slot_changes.changes.len == 0) return error.InvalidBlockAccessList;
            for (slot_changes.changes[1..], slot_changes.changes[0 .. slot_changes.changes.len - 1]) |next, prev| {
                if (prev.block_access_index >= next.block_access_index) return error.InvalidBlockAccessList;
            }
        }

        // Both lists ascend, so one merge pass finds a slot present in both.
        var w: usize = 0;
        for (account.storage_reads, 0..) |slot, r| {
            if (r > 0 and account.storage_reads[r - 1] >= slot) return error.InvalidBlockAccessList;
            while (w < account.storage_changes.len and account.storage_changes[w].slot < slot) : (w += 1) {}
            if (w < account.storage_changes.len and account.storage_changes[w].slot == slot) {
                return error.InvalidBlockAccessList;
            }
        }

        for (account.balance_changes, 0..) |change, i| {
            if (i > 0 and account.balance_changes[i - 1].block_access_index >= change.block_access_index) {
                return error.InvalidBlockAccessList;
            }
        }
        for (account.nonce_changes, 0..) |change, i| {
            if (i > 0 and account.nonce_changes[i - 1].block_access_index >= change.block_access_index) {
                return error.InvalidBlockAccessList;
            }
        }
        for (account.code_changes, 0..) |change, i| {
            if (i > 0 and account.code_changes[i - 1].block_access_index >= change.block_access_index) {
                return error.InvalidBlockAccessList;
            }
        }
    }
}

// ============================================================================
// RLP Encoding
// ============================================================================

/// Append an RLP integer: minimal big-endian, zero as the empty string.
fn appendUint(out: *std.ArrayList(u8), allocator: std.mem.Allocator, value: u256) !void {
    var bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &bytes, value, .big);
    var start: usize = 0;
    while (start < 32 and bytes[start] == 0) : (start += 1) {}
    const encoded = try Rlp.encodeBytes(allocator, bytes[start..]);
    defer allocator.free(encoded);
    try out.appendSlice(allocator, encoded);
}

/// Append an RLP list whose concatenated item encodings are `payload`.
fn appendList(out: *std.ArrayList(u8), allocator: std.mem.Allocator, payload: []const u8) !void {
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

/// Append `[[index, value], ...]` for any change type whose second field is an integer.
fn appendUintChanges(
    out: *std.ArrayList(u8),
    allocator: std.mem.Allocator,
    changes: anytype,
    comptime field: []const u8,
) !void {
    var items = std.ArrayList(u8){};
    defer items.deinit(allocator);
    var pair = std.ArrayList(u8){};
    defer pair.deinit(allocator);
    for (changes) |change| {
        pair.clearRetainingCapacity();
        try appendUint(&pair, allocator, change.block_access_index);
        try appendUint(&pair, allocator, @field(change, field));
        try appendList(&items, allocator, pair.items);
    }
    try appendList(out, allocator, items.items);
}

/// RLP-encode a block access list per EIP-7928.
///
/// Returns `error.InvalidBlockAccessList` for a non-canonical list, so the
/// bytes and their hash are always the canonical commitment.
/// The caller owns the returned slice.
pub fn rlpEncode(list: *const BlockAccessList, allocator: std.mem.Allocator) ![]u8 {
    try validate(list);

    var accounts = std.ArrayList(u8){};
    defer accounts.deinit(allocator);
    var fields = std.ArrayList(u8){};
    defer fields.deinit(allocator);
    var items = std.ArrayList(u8){};
    defer items.deinit(allocator);
    var pair = std.ArrayList(u8){};
    defer pair.deinit(allocator);

    for (list.accounts) |account| {
        fields.clearRetainingCapacity();

        const address = try Rlp.encodeBytes(allocator, &account.address.bytes);
        defer allocator.free(address);
        try fields.appendSlice(allocator, address);

        items.clearRetainingCapacity();
        for (account.storage_changes) |slot_changes| {
            pair.clearRetainingCapacity();
            try appendUint(&pair, allocator, slot_changes.slot);
            try appendUintChanges(&pair, allocator, slot_changes.changes, "new_value");
            try appendList(&items, allocator, pair.items);
        }
        try appendList(&fields, allocator, items.items);

        items.clearRetainingCapacity();
        for (account.storage_reads) |slot| try appendUint(&items, allocator, slot);
        try appendList(&fields, allocator, items.items);

        try appendUintChanges(&fields, allocator, account.balance_changes, "post_balance");
        try appendUintChanges(&fields, allocator, account.nonce_changes, "new_nonce");

        items.clearRetainingCapacity();
        for (account.code_changes) |change| {
            pair.clearRetainingCapacity();
            try appendUint(&pair, allocator, change.block_access_index);
            const code = try Rlp.encodeBytes(allocator, change.new_code);
            defer allocator.free(code);
            try pair.appendSlice(allocator, code);
            try appendList(&items, allocator, pair.items);
        }
        try appendList(&fields, allocator, items.items);

        try appendList(&accounts, allocator, fields.items);
    }

    var result = std.ArrayList(u8){};
    errdefer result.deinit(allocator);
    try appendList(&result, allocator, accounts.items);
    return result.toOwnedSlice(allocator);
}

// ============================================================================
// RLP Decoding
// ============================================================================

fn asList(data: Rlp.Data, len: ?usize) Error![]Rlp.Data {
    if (data != .List) return error.InvalidBlockAccessList;
    if (len) |n| if (data.List.len != n) return error.InvalidBlockAccessList;
    return data.List;
}

/// Decode a canonical RLP integer of at most `@sizeOf(T)` bytes.
fn asUint(comptime T: type, data: Rlp.Data) Error!T {
    if (data != .String) return error.InvalidBlockAccessList;
    const bytes = data.String;
    if (bytes.len > @sizeOf(T)) return error.InvalidBlockAccessList;
    if (bytes.len > 0 and bytes[0] == 0) return error.InvalidBlockAccessList;
    var value: T = 0;
    for (bytes) |b| value = (value << 8) | b;
    return value;
}

/// Decode `[[index, value], ...]` into change structs whose second field is an integer.
fn decodeUintChanges(
    comptime Change: type,
    comptime field: []const u8,
    arena: std.mem.Allocator,
    data: Rlp.Data,
) ![]const Change {
    const items = try asList(data, null);
    const changes = try arena.alloc(Change, items.len);
    for (items, changes) |item, *change| {
        const pair = try asList(item, 2);
        change.block_access_index = try asUint(BlockAccessIndex, pair[0]);
        @field(change, field) = try asUint(@FieldType(Change, field), pair[1]);
    }
    return changes;
}

/// Decode an EIP-7928 RLP block access list, e.g. `ExecutionPayloadV4.blockAccessList`.
///
/// Strict: rejects trailing bytes, wrong shapes, padded integers, and any
/// ordering or uniqueness violation. A list that decodes re-encodes to the
/// same bytes, so its hash is safe to compare against the header.
///
/// The returned list owns its memory. Free it with `deinit`.
pub fn rlpDecode(allocator: std.mem.Allocator, data: []const u8) !BlockAccessList {
    const decoded = try Rlp.decode(allocator, data, false);
    defer decoded.data.deinit(allocator);
    return fromRlpData(allocator, decoded.data);
}

/// Build a validated list from decoded RLP. Copies everything it keeps.
fn fromRlpData(allocator: std.mem.Allocator, data: Rlp.Data) !BlockAccessList {
    var owner = std.heap.ArenaAllocator.init(allocator);
    errdefer owner.deinit();
    const arena = owner.allocator();

    const items = try asList(data, null);
    const accounts = try arena.alloc(AccountChanges, items.len);
    for (items, accounts) |item, *account| {
        const fields = try asList(item, 6);

        if (fields[0] != .String or fields[0].String.len != 20) return error.InvalidBlockAccessList;
        @memcpy(&account.address.bytes, fields[0].String);

        const slot_items = try asList(fields[1], null);
        const storage_changes = try arena.alloc(SlotChanges, slot_items.len);
        for (slot_items, storage_changes) |slot_item, *slot_changes| {
            const pair = try asList(slot_item, 2);
            slot_changes.slot = try asUint(u256, pair[0]);
            slot_changes.changes = try decodeUintChanges(StorageChange, "new_value", arena, pair[1]);
        }
        account.storage_changes = storage_changes;

        const read_items = try asList(fields[2], null);
        const storage_reads = try arena.alloc(u256, read_items.len);
        for (read_items, storage_reads) |read_item, *slot| slot.* = try asUint(u256, read_item);
        account.storage_reads = storage_reads;

        account.balance_changes = try decodeUintChanges(BalanceChange, "post_balance", arena, fields[3]);
        account.nonce_changes = try decodeUintChanges(NonceChange, "new_nonce", arena, fields[4]);

        const code_items = try asList(fields[5], null);
        const code_changes = try arena.alloc(CodeChange, code_items.len);
        for (code_items, code_changes) |code_item, *change| {
            const pair = try asList(code_item, 2);
            change.block_access_index = try asUint(BlockAccessIndex, pair[0]);
            if (pair[1] != .String) return error.InvalidBlockAccessList;
            change.new_code = try arena.dupe(u8, pair[1].String);
        }
        account.code_changes = code_changes;
    }

    const list = BlockAccessList{ .accounts = accounts };
    try validate(&list);
    return .{ .accounts = accounts, .arena = owner };
}

// ============================================================================
// Hashing
// ============================================================================

/// Compute the header commitment `keccak256(rlp.encode(block_access_list))`.
pub fn hash(list: *const BlockAccessList, allocator: std.mem.Allocator) !Hash.Hash {
    const encoded = try rlpEncode(list, allocator);
    defer allocator.free(encoded);

    var result: Hash.Hash = undefined;
    crypto.Keccak256.hash(encoded, &result, .{});
    return result;
}

// ============================================================================
// Tests
// ============================================================================

fn testAddress(last: u8) Address.Address {
    var address = Address.ZERO_ADDRESS;
    address.bytes[19] = last;
    return address;
}

// Hand-assembled from the EIP-7928 RLP rules. The TypeScript implementation
// asserts the same bytes and hash, so the two encoders cross-check each other.
const full_rlp_hex =
    "f877" ++
    // AccountChanges 0xaa
    "f85a94" ++ "00000000000000000000000000000000000000aa" ++
    // storage_changes: [[1, [[1, 42], [2, 0]]], [0x0100, [[3, 2^255]]]]
    "f1" ++ "c801c6c2012ac20280" ++ "e7820100e3e203a0" ++
    "8000000000000000000000000000000000000000000000000000000000000000" ++
    // storage_reads: [0, 2]
    "c28002" ++
    // balance_changes: [[1, 1000]]
    "c5c4018203e8" ++
    // nonce_changes: [[1, 1]]
    "c3c20101" ++
    // code_changes: [[2, 0x6000]]
    "c5c402826000" ++
    // AccountChanges 0xbb with every list empty
    "da94" ++ "00000000000000000000000000000000000000bb" ++ "c0c0c0c0c0";
const full_hash_hex = "7a6e55bde06c036cc607ef0262a5c3f46eba0d9a8a4a991334d72295a92696a2";

const full_list = BlockAccessList{ .accounts = &.{
    .{
        .address = .{ .bytes = [_]u8{0} ** 19 ++ [_]u8{0xaa} },
        .storage_changes = &.{
            .{ .slot = 1, .changes = &.{
                .{ .block_access_index = 1, .new_value = 42 },
                .{ .block_access_index = 2, .new_value = 0 },
            } },
            .{ .slot = 256, .changes = &.{
                .{ .block_access_index = 3, .new_value = 1 << 255 },
            } },
        },
        .storage_reads = &.{ 0, 2 },
        .balance_changes = &.{.{ .block_access_index = 1, .post_balance = 1000 }},
        .nonce_changes = &.{.{ .block_access_index = 1, .new_nonce = 1 }},
        .code_changes = &.{.{ .block_access_index = 2, .new_code = &.{ 0x60, 0x00 } }},
    },
    .{ .address = .{ .bytes = [_]u8{0} ** 19 ++ [_]u8{0xbb} } },
} };

test "rlpEncode - empty list is 0xc0 and hashes to the empty commitment" {
    const allocator = std.testing.allocator;
    const list = BlockAccessList{};
    const encoded = try rlpEncode(&list, allocator);
    defer allocator.free(encoded);
    try std.testing.expectEqualSlices(u8, &.{0xc0}, encoded);
    try std.testing.expectEqual(EMPTY_BLOCK_ACCESS_LIST_HASH, try hash(&list, allocator));
}

test "rlpEncode - integers are minimal: zero as 0x80, one as 0x01" {
    const allocator = std.testing.allocator;
    const list = BlockAccessList{ .accounts = &.{
        .{ .address = testAddress(1), .storage_reads = &.{ 0, 1 } },
    } };
    const encoded = try rlpEncode(&list, allocator);
    defer allocator.free(encoded);
    var expected: [30]u8 = undefined;
    _ = try std.fmt.hexToBytes(&expected, "dddc940000000000000000000000000000000000000001c0c28001c0c0c0");
    try std.testing.expectEqualSlices(u8, &expected, encoded);
}

test "rlpEncode and hash - match the vector shared with TypeScript" {
    const allocator = std.testing.allocator;
    var expected: [full_rlp_hex.len / 2]u8 = undefined;
    _ = try std.fmt.hexToBytes(&expected, full_rlp_hex);
    const encoded = try rlpEncode(&full_list, allocator);
    defer allocator.free(encoded);
    try std.testing.expectEqualSlices(u8, &expected, encoded);

    var expected_hash: Hash.Hash = undefined;
    _ = try std.fmt.hexToBytes(&expected_hash, full_hash_hex);
    try std.testing.expectEqual(expected_hash, try hash(&full_list, allocator));
}

test "rlpDecode - round trips every change kind" {
    const allocator = std.testing.allocator;
    var bytes: [full_rlp_hex.len / 2]u8 = undefined;
    _ = try std.fmt.hexToBytes(&bytes, full_rlp_hex);

    var decoded = try rlpDecode(allocator, &bytes);
    defer decoded.deinit();

    try std.testing.expectEqual(@as(usize, 2), decoded.accounts.len);
    const account = decoded.accounts[0];
    try std.testing.expectEqual(@as(u8, 0xaa), account.address.bytes[19]);
    try std.testing.expectEqual(@as(usize, 2), account.storage_changes.len);
    try std.testing.expectEqual(@as(u256, 256), account.storage_changes[1].slot);
    try std.testing.expectEqual(@as(u256, 1 << 255), account.storage_changes[1].changes[0].new_value);
    try std.testing.expectEqual(@as(u256, 0), account.storage_changes[0].changes[1].new_value);
    try std.testing.expectEqualSlices(u256, &.{ 0, 2 }, account.storage_reads);
    try std.testing.expectEqual(@as(u256, 1000), account.balance_changes[0].post_balance);
    try std.testing.expectEqual(@as(u64, 1), account.nonce_changes[0].new_nonce);
    try std.testing.expectEqual(@as(BlockAccessIndex, 2), account.code_changes[0].block_access_index);
    try std.testing.expectEqualSlices(u8, &.{ 0x60, 0x00 }, account.code_changes[0].new_code);
    try std.testing.expectEqual(@as(usize, 0), decoded.accounts[1].storage_reads.len);

    const reencoded = try rlpEncode(&decoded, allocator);
    defer allocator.free(reencoded);
    try std.testing.expectEqualSlices(u8, &bytes, reencoded);
}

test "rlpDecode - round trips max-width integers" {
    const allocator = std.testing.allocator;
    const max = std.math.maxInt(u256);
    const list = BlockAccessList{ .accounts = &.{.{
        .address = testAddress(1),
        .storage_changes = &.{.{ .slot = max, .changes = &.{
            .{ .block_access_index = std.math.maxInt(u32), .new_value = max },
        } }},
        .balance_changes = &.{.{ .block_access_index = 0, .post_balance = max }},
        .nonce_changes = &.{.{ .block_access_index = 0, .new_nonce = std.math.maxInt(u64) }},
    }} };
    const encoded = try rlpEncode(&list, allocator);
    defer allocator.free(encoded);
    var decoded = try rlpDecode(allocator, encoded);
    defer decoded.deinit();
    try std.testing.expectEqual(max, decoded.accounts[0].storage_changes[0].slot);
    try std.testing.expectEqual(@as(u32, std.math.maxInt(u32)), decoded.accounts[0].storage_changes[0].changes[0].block_access_index);
    try std.testing.expectEqual(@as(u64, std.math.maxInt(u64)), decoded.accounts[0].nonce_changes[0].new_nonce);
    try std.testing.expectEqual(max, decoded.accounts[0].balance_changes[0].post_balance);
}

test "rlpDecode - empty list" {
    var decoded = try rlpDecode(std.testing.allocator, &.{0xc0});
    defer decoded.deinit();
    try std.testing.expectEqual(@as(usize, 0), decoded.accounts.len);
}

fn expectDecodeRejects(comptime hex: []const u8) !void {
    var bytes: [hex.len / 2]u8 = undefined;
    _ = try std.fmt.hexToBytes(&bytes, hex);
    if (rlpDecode(std.testing.allocator, &bytes)) |list| {
        var owned = list;
        owned.deinit();
        return error.TestExpectedError;
    } else |_| {}
}

test "rlpDecode - rejects malformed and non-canonical lists" {
    const a1 = "940000000000000000000000000000000000000001";
    const a2 = "940000000000000000000000000000000000000002";
    // Not a list, trailing bytes, empty input.
    try expectDecodeRejects("80");
    try expectDecodeRejects("c000");
    try std.testing.expectError(error.InputTooShort, rlpDecode(std.testing.allocator, &.{}));
    // Account with five fields, then seven.
    try expectDecodeRejects("da" ++ "d9" ++ a1 ++ "c0c0c0c0");
    try expectDecodeRejects("dc" ++ "db" ++ a1 ++ "c0c0c0c0c0c0");
    // 19-byte address.
    try expectDecodeRejects("da" ++ "d9" ++ "9300000000000000000000000000000000000001" ++ "c0c0c0c0c0");
    // Accounts out of order, then duplicated.
    try expectDecodeRejects("f836" ++ "da" ++ a2 ++ "c0c0c0c0c0" ++ "da" ++ a1 ++ "c0c0c0c0c0");
    try expectDecodeRejects("f836" ++ "da" ++ a1 ++ "c0c0c0c0c0" ++ "da" ++ a1 ++ "c0c0c0c0c0");
    // storage_reads [2, 1], then [1, 1].
    try expectDecodeRejects("dd" ++ "dc" ++ a1 ++ "c0" ++ "c20201" ++ "c0c0c0");
    try expectDecodeRejects("dd" ++ "dc" ++ a1 ++ "c0" ++ "c20101" ++ "c0c0c0");
    // Slot 1 both written and read.
    try expectDecodeRejects("e2" ++ "e1" ++ a1 ++ "c5c401c2c101" ++ "c101" ++ "c0c0c0");
    // SlotChanges with no changes.
    try expectDecodeRejects("dd" ++ "dc" ++ a1 ++ "c3c201c0" ++ "c0c0c0c0");
    // balance_changes with a repeated access index.
    try expectDecodeRejects("e0" ++ "df" ++ a1 ++ "c0c0" ++ "c6c20101c20102" ++ "c0c0");
    // Nonce wider than uint64 (nine bytes).
    try expectDecodeRejects("e5" ++ "e4" ++ a1 ++ "c0c0c0" ++ "cbca0189010000000000000000" ++ "c0");
    // Access index wider than uint32 (five bytes).
    try expectDecodeRejects("e1" ++ "e0" ++ a1 ++ "c0c0c0" ++ "c7c685010000000001" ++ "c0");
    // Code change whose bytecode is a list.
    try expectDecodeRejects("dd" ++ "dc" ++ a1 ++ "c0c0c0c0" ++ "c3c201c0");
}

test "rlpDecode - rejects a storage key padded with a leading zero" {
    // storage_reads: [0x0001] is rejected by the RLP layer or by the integer check.
    try expectDecodeRejects("de" ++ "dd" ++ "940000000000000000000000000000000000000001" ++ "c0" ++ "c3820001" ++ "c0c0c0");
}

test "validate and rlpEncode - reject non-canonical lists" {
    const allocator = std.testing.allocator;
    const cases = [_]BlockAccessList{
        // Accounts out of order.
        .{ .accounts = &.{ .{ .address = testAddress(2) }, .{ .address = testAddress(1) } } },
        // Duplicate account.
        .{ .accounts = &.{ .{ .address = testAddress(1) }, .{ .address = testAddress(1) } } },
        // Slots out of order.
        .{ .accounts = &.{.{ .address = testAddress(1), .storage_changes = &.{
            .{ .slot = 2, .changes = &.{.{ .block_access_index = 1, .new_value = 1 }} },
            .{ .slot = 1, .changes = &.{.{ .block_access_index = 1, .new_value = 1 }} },
        } }} },
        // Slot with no changes.
        .{ .accounts = &.{.{ .address = testAddress(1), .storage_changes = &.{
            .{ .slot = 1, .changes = &.{} },
        } }} },
        // Storage changes with a repeated access index.
        .{ .accounts = &.{.{ .address = testAddress(1), .storage_changes = &.{
            .{ .slot = 1, .changes = &.{
                .{ .block_access_index = 1, .new_value = 1 },
                .{ .block_access_index = 1, .new_value = 2 },
            } },
        } }} },
        // Slot both written and read.
        .{ .accounts = &.{.{
            .address = testAddress(1),
            .storage_changes = &.{
                .{ .slot = 1, .changes = &.{.{ .block_access_index = 1, .new_value = 1 }} },
                .{ .slot = 5, .changes = &.{.{ .block_access_index = 1, .new_value = 1 }} },
            },
            .storage_reads = &.{ 0, 5 },
        }} },
        // Reads out of order.
        .{ .accounts = &.{.{ .address = testAddress(1), .storage_reads = &.{ 2, 1 } }} },
        // Change lists out of order.
        .{ .accounts = &.{.{ .address = testAddress(1), .balance_changes = &.{
            .{ .block_access_index = 2, .post_balance = 1 },
            .{ .block_access_index = 1, .post_balance = 1 },
        } }} },
        .{ .accounts = &.{.{ .address = testAddress(1), .nonce_changes = &.{
            .{ .block_access_index = 2, .new_nonce = 1 },
            .{ .block_access_index = 2, .new_nonce = 2 },
        } }} },
        .{ .accounts = &.{.{ .address = testAddress(1), .code_changes = &.{
            .{ .block_access_index = 3, .new_code = &.{} },
            .{ .block_access_index = 1, .new_code = &.{} },
        } }} },
    };
    for (&cases) |*list| {
        try std.testing.expectError(error.InvalidBlockAccessList, validate(list));
        try std.testing.expectError(error.InvalidBlockAccessList, rlpEncode(list, allocator));
        try std.testing.expectError(error.InvalidBlockAccessList, hash(list, allocator));
    }
    try validate(&full_list);
}

test "hash - changes when a committed value changes" {
    const allocator = std.testing.allocator;
    const a = BlockAccessList{ .accounts = &.{.{
        .address = testAddress(1),
        .balance_changes = &.{.{ .block_access_index = 1, .post_balance = 1 }},
    }} };
    const b = BlockAccessList{ .accounts = &.{.{
        .address = testAddress(1),
        .balance_changes = &.{.{ .block_access_index = 1, .post_balance = 2 }},
    }} };
    const ha = try hash(&a, allocator);
    const hb = try hash(&b, allocator);
    try std.testing.expect(!std.mem.eql(u8, &ha, &hb));
}

test "itemCount - counts addresses and storage keys" {
    try std.testing.expectEqual(@as(u64, 0), itemCount(&BlockAccessList{}));
    // 2 addresses + 2 written slots + 2 read slots.
    try std.testing.expectEqual(@as(u64, 6), itemCount(&full_list));
}

test "fromRlpData - frees everything when allocation fails" {
    var bytes: [full_rlp_hex.len / 2]u8 = undefined;
    _ = try std.fmt.hexToBytes(&bytes, full_rlp_hex);
    // Rlp.decode runs outside the failing allocator: this checks the list builder.
    const decoded = try Rlp.decode(std.testing.allocator, &bytes, false);
    defer decoded.data.deinit(std.testing.allocator);
    try std.testing.checkAllAllocationFailures(std.testing.allocator, struct {
        fn run(allocator: std.mem.Allocator, data: Rlp.Data) !void {
            var list = try fromRlpData(allocator, data);
            list.deinit();
        }
    }.run, .{decoded.data});
}
