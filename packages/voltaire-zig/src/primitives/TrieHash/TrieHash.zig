//! MPT Root Hash Computation
//!
//! Implements the `patricialize()` algorithm from the Ethereum execution-specs
//! (`execution-specs/src/ethereum/forks/frontier/trie.py`). This computes a
//! Merkle Patricia Trie root hash from a flat key-value mapping, exactly
//! matching the spec behavior including node inlining (nodes whose RLP is
//! < 32 bytes are returned as raw RLP structures, not hashed).
//!
//! Uses Voltaire primitives for RLP encoding and keccak256 hashing.
//! Internal node encoding follows the spec's "extended" semantics: small nodes
//! are embedded as nested RLP lists, while large nodes are replaced by their
//! keccak256 hash.

const std = @import("std");
const Allocator = std.mem.Allocator;

pub const TrieError = error{
    InvalidNode,
    InvalidKey,
    EmptyInput,
};

const DefaultRlp = @import("../Rlp/Rlp.zig");
const DefaultHash = @import("crypto").Hash;

/// 32-byte hash type (canonical Keccak-256 digest).
pub const Hash32 = @import("../Hash/Hash.zig").Hash;

/// EMPTY_TRIE_ROOT = keccak256(RLP(b"")) = keccak256(0x80)
/// = 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
/// Used when the trie has no entries.
pub const EMPTY_TRIE_ROOT: Hash32 = .{
    0x56, 0xe8, 0x1f, 0x17, 0x1b, 0xcc, 0x55, 0xa6,
    0xff, 0x83, 0x45, 0xe6, 0x92, 0xc0, 0xf8, 0x6e,
    0x5b, 0x48, 0xe0, 0x1b, 0x99, 0x6c, 0xad, 0xc0,
    0x01, 0x62, 0x2f, 0xb5, 0xe3, 0x63, 0xb4, 0x21,
};

/// Compute the MPT root hash of a set of key-value pairs.
///
/// This is the top-level entry point matching the Python spec's `root()`.
/// Keys should already be in their final form (i.e., keccak256'd for secure
/// tries). Values should already be RLP-encoded where needed.
///
/// Algorithm:
/// 1. Convert each key to nibble-list form
/// 2. Call `patricialize()` to build the tree recursively
/// 3. RLP-encode the root node; if < 32 bytes, hash it; otherwise use as-is
pub fn trie_root(
    allocator: Allocator,
    keys: []const []const u8,
    values: []const []const u8,
) !Hash32 {
    return trie_root_with(DefaultRlp, DefaultHash, allocator, keys, values);
}

/// Compute the MPT root hash for a secure trie (keys hashed with keccak256).
///
/// This matches the `secured=True` behavior in the Python execution-specs.
/// Input keys are raw bytes; values should already be RLP-encoded where needed.
pub fn secure_trie_root(
    allocator: Allocator,
    keys: []const []const u8,
    values: []const []const u8,
) !Hash32 {
    return secure_trie_root_with(DefaultRlp, DefaultHash, allocator, keys, values);
}

fn trie_root_with(
    comptime RlpMod: type,
    comptime HashMod: type,
    allocator: Allocator,
    keys: []const []const u8,
    values: []const []const u8,
) !Hash32 {
    if (keys.len != values.len) {
        return TrieError.InvalidKey;
    }

    if (keys.len == 0) {
        return EMPTY_TRIE_ROOT;
    }

    for (values) |value| {
        if (value.len == 0) {
            return TrieError.EmptyInput;
        }
    }

    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();
    const arena_alloc = arena.allocator();

    // Convert keys to nibble form
    var nibble_keys = try arena_alloc.alloc([]u8, keys.len);
    for (keys, 0..) |key, i| {
        nibble_keys[i] = try key_to_nibbles(arena_alloc, key);
    }

    const root_node = try patricialize(RlpMod, HashMod, arena_alloc, nibble_keys, values, 0);
    const encoded_root = try encode_data(RlpMod, arena_alloc, root_node);

    if (encoded_root.len < 32) {
        return HashMod.keccak256(encoded_root);
    }

    return switch (root_node) {
        .String => |bytes| blk: {
            if (bytes.len != @sizeOf(Hash32)) {
                return TrieError.InvalidNode;
            }
            var out: Hash32 = undefined;
            @memcpy(out[0..], bytes);
            break :blk out;
        },
        .List => TrieError.InvalidNode,
    };
}

fn secure_trie_root_with(
    comptime RlpMod: type,
    comptime HashMod: type,
    allocator: Allocator,
    keys: []const []const u8,
    values: []const []const u8,
) !Hash32 {
    if (keys.len != values.len) {
        return TrieError.InvalidKey;
    }

    if (keys.len == 0) {
        return EMPTY_TRIE_ROOT;
    }

    const hashed_keys = try allocator.alloc(Hash32, keys.len);
    defer allocator.free(hashed_keys);

    const hashed_slices = try allocator.alloc([]const u8, keys.len);
    defer allocator.free(hashed_slices);

    for (keys, 0..) |key, i| {
        hashed_keys[i] = HashMod.keccak256(key);
        hashed_slices[i] = hashed_keys[i][0..];
    }

    return trie_root_with(RlpMod, HashMod, allocator, hashed_slices, values);
}

/// Recursively build the MPT from key-value pairs.
///
/// Matches Python's `patricialize(obj, level)`. Instead of using a dict,
/// we pass parallel arrays of nibble-keys and values.
///
/// Returns the encoded node in the spec's "extended" form: either a nested
/// list (inline node) or a string containing a 32-byte hash.
fn patricialize(
    comptime RlpMod: type,
    comptime HashMod: type,
    allocator: Allocator,
    nibble_keys: []const []const u8,
    values: []const []const u8,
    level: usize,
) !RlpMod.Data {
    if (nibble_keys.len == 0) {
        return .{ .String = &[_]u8{} };
    }

    // Single entry -> leaf node
    if (nibble_keys.len == 1) {
        const rest_of_key = nibble_keys[0][level..];
        return encode_internal_leaf(RlpMod, HashMod, allocator, rest_of_key, values[0]);
    }

    // Find common prefix among all keys at current level
    const first_key = nibble_keys[0][level..];
    var prefix_length: usize = first_key.len;

    for (nibble_keys[1..]) |key| {
        const key_suffix = key[level..];
        const min_len = @min(prefix_length, key_suffix.len);
        var i: usize = 0;
        while (i < min_len and first_key[i] == key_suffix[i]) : (i += 1) {}
        prefix_length = i;
        if (prefix_length == 0) break;
    }

    // Extension node: shared prefix exists
    if (prefix_length > 0) {
        const prefix = nibble_keys[0][level .. level + prefix_length];
        const child = try patricialize(RlpMod, HashMod, allocator, nibble_keys, values, level + prefix_length);
        return encode_internal_extension(RlpMod, HashMod, allocator, prefix, child);
    }

    // Branch node: split into 16 buckets by nibble at current level.
    // Uses a two-pass approach with preallocated contiguous arrays to
    // minimize per-bucket allocation overhead.
    var bucket_counts: [16]usize = @as([16]usize, @splat(0));
    // Python spec uses b"" (empty bytes) as the "no value" sentinel for
    // branch nodes, not None/null. This matches the spec's BranchNode
    // constructor default: `value: Extended = b""`.
    var branch_value: []const u8 = &[_]u8{};

    // Count entries per bucket and find branch value.
    // NOTE: If multiple keys have the same nibble path (duplicate keys),
    // the last value wins, matching Python dict semantics where later
    // insertions overwrite earlier ones.
    for (nibble_keys, 0..) |key, idx| {
        if (key.len == level) {
            branch_value = values[idx];
        } else {
            const nibble = key[level];
            bucket_counts[nibble] += 1;
        }
    }

    // Calculate total non-branch entries for contiguous allocation
    var total_entries: usize = 0;
    var bucket_offsets: [16]usize = undefined;
    for (0..16) |bi| {
        bucket_offsets[bi] = total_entries;
        total_entries += bucket_counts[bi];
    }

    // Allocate contiguous arrays for all bucket entries
    const all_keys = try allocator.alloc([]const u8, total_entries);
    defer allocator.free(all_keys);
    const all_vals = try allocator.alloc([]const u8, total_entries);
    defer allocator.free(all_vals);

    // Fill bucket arrays using offsets into contiguous storage
    var fill_counts: [16]usize = @as([16]usize, @splat(0));
    for (nibble_keys, 0..) |key, idx| {
        if (key.len == level) continue;
        const nibble = key[level];
        const pos = bucket_offsets[nibble] + fill_counts[nibble];
        all_keys[pos] = key;
        all_vals[pos] = values[idx];
        fill_counts[nibble] += 1;
    }

    // Recursively patricialize each bucket
    var subnode_encodings: [16]RlpMod.Data = undefined;
    for (0..16) |bi| {
        const start = bucket_offsets[bi];
        const count = bucket_counts[bi];
        const bkeys = all_keys[start .. start + count];
        const bvals = all_vals[start .. start + count];
        subnode_encodings[bi] = try patricialize(RlpMod, HashMod, allocator, bkeys, bvals, level + 1);
    }

    return encode_internal_branch(RlpMod, HashMod, allocator, &subnode_encodings, branch_value);
}

/// Encode a 2-item path node (leaf or extension) with a compact-encoded path.
fn encode_internal_path_node(
    comptime RlpMod: type,
    comptime HashMod: type,
    allocator: Allocator,
    path: []const u8,
    is_leaf: bool,
    second: RlpMod.Data,
) !RlpMod.Data {
    const compact_path = try encode_hex_path(allocator, path, is_leaf);
    const items = [_]RlpMod.Data{
        .{ .String = compact_path },
        second,
    };
    return encode_internal_from_items(RlpMod, HashMod, allocator, &items);
}

/// Encode a leaf node: `encode_internal_node(LeafNode(rest_of_key, value))`
///
/// The unencoded form is: `(encodePath(rest, True), value)`
/// RLP-encoded as a 2-element list.
fn encode_internal_leaf(
    comptime RlpMod: type,
    comptime HashMod: type,
    allocator: Allocator,
    rest_of_key: []const u8,
    value: []const u8,
) !RlpMod.Data {
    return encode_internal_path_node(RlpMod, HashMod, allocator, rest_of_key, true, .{ .String = value });
}

/// Encode an extension node: `encode_internal_node(ExtensionNode(prefix, subnode))`
///
/// The unencoded form is: `(encodePath(segment, False), subnode)`
/// where `subnode` is the result of `encode_internal_node()` on the child.
fn encode_internal_extension(
    comptime RlpMod: type,
    comptime HashMod: type,
    allocator: Allocator,
    prefix: []const u8,
    child: RlpMod.Data,
) !RlpMod.Data {
    return encode_internal_path_node(RlpMod, HashMod, allocator, prefix, false, child);
}

/// Encode a branch node: `encode_internal_node(BranchNode(subnodes, value))`
///
/// The unencoded form is: `list(subnodes) + [value]` (17 elements).
/// `value` is `b""` (empty bytes) when no value terminates at this branch,
/// matching the Python spec's sentinel convention.
fn encode_internal_branch(
    comptime RlpMod: type,
    comptime HashMod: type,
    allocator: Allocator,
    subnodes: *const [16]RlpMod.Data,
    value: []const u8,
) !RlpMod.Data {
    var items: [17]RlpMod.Data = undefined;

    for (0..16) |i| {
        items[i] = subnodes[i];
    }

    // Branch value: empty bytes means "no value" per spec
    items[16] = .{ .String = value };

    return encode_internal_from_items(RlpMod, HashMod, allocator, &items);
}

/// Encode items as an RLP list and apply the < 32 byte inlining rule.
///
/// This is the core of `encode_internal_node()`:
/// 1. RLP-encode the list of items
/// 2. If len < 32: return the raw list (inline)
/// 3. If len >= 32: return keccak256(RLP) as a 32-byte string
fn encode_internal_from_items(
    comptime RlpMod: type,
    comptime HashMod: type,
    allocator: Allocator,
    items: []const RlpMod.Data,
) !RlpMod.Data {
    const list_items = try allocator.alloc(RlpMod.Data, items.len);
    @memcpy(list_items, items);

    const list_data = RlpMod.Data{ .List = list_items };
    const encoded = try encode_data(RlpMod, allocator, list_data);
    defer allocator.free(encoded);

    if (encoded.len < 32) {
        return list_data;
    }

    const hashed = HashMod.keccak256(encoded);
    const hash_bytes = try allocator.alloc(u8, hashed.len);
    @memcpy(hash_bytes, hashed[0..]);
    // list_items is no longer needed when node is hashed; free to reduce arena bloat.
    allocator.free(list_items);

    return .{ .String = hash_bytes };
}

/// Encode RLP `Data` into its canonical byte form.
fn encode_data(
    comptime RlpMod: type,
    allocator: Allocator,
    data: RlpMod.Data,
) RlpMod.EncodeError![]u8 {
    const total_len = try encoded_len(RlpMod, data);
    const out = try allocator.alloc(u8, total_len);
    errdefer allocator.free(out);

    const written = try encode_into(RlpMod, data, out);
    std.debug.assert(written == total_len);
    return out;
}

/// Convert a key (bytes) to nibbles (hex digits)
/// Convert a key (bytes) into its hex-nibble representation.
fn key_to_nibbles(allocator: Allocator, key: []const u8) ![]u8 {
    const nibbles = try allocator.alloc(u8, key.len * 2);
    errdefer allocator.free(nibbles);
    for (key, 0..) |byte, i| {
        nibbles[i * 2] = byte >> 4;
        nibbles[i * 2 + 1] = byte & 0x0F;
    }
    return nibbles;
}

/// Encode a nibble path for leaf or extension nodes (hex prefix encoding)
/// Encode a nibble slice using Ethereum's hex-prefix (HP) encoding.
fn encode_hex_path(allocator: Allocator, nibbles: []const u8, is_leaf: bool) ![]u8 {
    if (nibbles.len == 0) {
        const result = try allocator.alloc(u8, 1);
        result[0] = if (is_leaf) 0x20 else 0x00;
        return result;
    }
    const is_odd = nibbles.len % 2 == 1;
    const enc_len = if (is_odd) (nibbles.len + 1) / 2 else (nibbles.len / 2) + 1;
    const encoded = try allocator.alloc(u8, enc_len);
    errdefer allocator.free(encoded);
    if (is_odd) {
        const prefix: u8 = if (is_leaf) 0x30 else 0x10;
        encoded[0] = prefix | nibbles[0];
        for (1..enc_len) |i| {
            encoded[i] = (nibbles[i * 2 - 1] << 4) | nibbles[i * 2];
        }
    } else {
        encoded[0] = if (is_leaf) 0x20 else 0x00;
        for (1..enc_len) |i| {
            encoded[i] = (nibbles[(i - 1) * 2] << 4) | nibbles[(i - 1) * 2 + 1];
        }
    }
    return encoded;
}

fn checked_add(
    comptime RlpMod: type,
    left: usize,
    right: usize,
) RlpMod.EncodeError!usize {
    return std.math.add(usize, left, right) catch return error.OutOfMemory;
}

fn encoded_len(
    comptime RlpMod: type,
    data: RlpMod.Data,
) RlpMod.EncodeError!usize {
    return switch (data) {
        .String => |bytes| encoded_len_bytes(RlpMod, bytes),
        .List => |items| encoded_len_list(RlpMod, items),
    };
}

fn encoded_len_bytes(
    comptime RlpMod: type,
    bytes: []const u8,
) RlpMod.EncodeError!usize {
    if (bytes.len == 1 and bytes[0] < 0x80) {
        return 1;
    }

    var header_len: usize = 1;
    if (bytes.len >= 56) {
        header_len = try checked_add(RlpMod, header_len, length_of_length(bytes.len));
    }
    return checked_add(RlpMod, header_len, bytes.len);
}

fn encoded_len_list(
    comptime RlpMod: type,
    items: []const RlpMod.Data,
) RlpMod.EncodeError!usize {
    var payload_len: usize = 0;
    for (items) |item| {
        const item_len = try encoded_len(RlpMod, item);
        payload_len = try checked_add(RlpMod, payload_len, item_len);
    }

    var header_len: usize = 1;
    if (payload_len >= 56) {
        header_len = try checked_add(RlpMod, header_len, length_of_length(payload_len));
    }
    return checked_add(RlpMod, header_len, payload_len);
}

fn encode_into(
    comptime RlpMod: type,
    data: RlpMod.Data,
    out: []u8,
) RlpMod.EncodeError!usize {
    return switch (data) {
        .String => |bytes| encode_bytes_into(bytes, out),
        .List => |items| encode_list_into(RlpMod, items, out),
    };
}

fn encode_bytes_into(bytes: []const u8, out: []u8) usize {
    if (bytes.len == 1 and bytes[0] < 0x80) {
        out[0] = bytes[0];
        return 1;
    }

    if (bytes.len < 56) {
        out[0] = 0x80 + @as(u8, @intCast(bytes.len));
        @memcpy(out[1 .. 1 + bytes.len], bytes);
        return 1 + bytes.len;
    }

    const len_len = length_of_length(bytes.len);
    out[0] = 0xb7 + @as(u8, @intCast(len_len));
    write_length(bytes.len, out[1 .. 1 + len_len]);
    @memcpy(out[1 + len_len .. 1 + len_len + bytes.len], bytes);
    return 1 + len_len + bytes.len;
}

fn encode_list_into(
    comptime RlpMod: type,
    items: []const RlpMod.Data,
    out: []u8,
) RlpMod.EncodeError!usize {
    var payload_len: usize = 0;
    for (items) |item| {
        const item_len = try encoded_len(RlpMod, item);
        payload_len = try checked_add(RlpMod, payload_len, item_len);
    }

    var offset: usize = 0;
    if (payload_len < 56) {
        out[0] = 0xc0 + @as(u8, @intCast(payload_len));
        offset = 1;
    } else {
        const len_len = length_of_length(payload_len);
        out[0] = 0xf7 + @as(u8, @intCast(len_len));
        write_length(payload_len, out[1 .. 1 + len_len]);
        offset = 1 + len_len;
    }

    for (items) |item| {
        const written = try encode_into(RlpMod, item, out[offset..]);
        offset += written;
    }

    return offset;
}

fn length_of_length(value: usize) usize {
    var tmp = value;
    var len: usize = 0;
    while (tmp > 0) : (tmp >>= 8) {
        len += 1;
    }
    return len;
}

fn write_length(value: usize, out: []u8) void {
    var tmp = value;
    var i: usize = out.len;
    while (i > 0) {
        i -= 1;
        out[i] = @as(u8, @intCast(tmp & 0xff));
        tmp >>= 8;
    }
}
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const testing = std.testing;
const Hex = @import("../Hex/Hex.zig");

test "EMPTY_TRIE_ROOT matches spec constant" {
    // keccak256(rlp(b'')) = keccak256(0x80) =
    // 56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
    const expected = try Hex.hexToBytesFixed(32, "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421");
    try testing.expectEqualSlices(u8, &expected, &EMPTY_TRIE_ROOT);
}

test "trie_root - empty trie returns EMPTY_TRIE_ROOT" {
    const allocator = testing.allocator;
    const root = try trie_root(allocator, &[_][]const u8{}, &[_][]const u8{});
    try testing.expectEqualSlices(u8, &EMPTY_TRIE_ROOT, &root);
}

test "trie_root - rejects mismatched key/value lengths" {
    const allocator = testing.allocator;
    const keys = [_][]const u8{"do"};
    const values = [_][]const u8{ "verb", "extra" };

    try testing.expectError(TrieError.InvalidKey, trie_root(allocator, &keys, &values));
}

test "trie_root - rejects empty value" {
    const allocator = testing.allocator;
    const keys = [_][]const u8{"do"};
    const values = [_][]const u8{""};

    try testing.expectError(TrieError.EmptyInput, trie_root(allocator, &keys, &values));
}

test "trie_root - single entry" {
    const allocator = testing.allocator;

    const keys = [_][]const u8{"do"};
    const values = [_][]const u8{"verb"};
    const root = try trie_root(allocator, &keys, &values);

    // The root should NOT be the empty root
    try testing.expect(!std.mem.eql(u8, &root, &EMPTY_TRIE_ROOT));
}

test "secure_trie_root - hex_encoded_securetrie_test test1" {
    const allocator = testing.allocator;
    const key_hexes = [_][]const u8{
        "0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b",
        "0x095e7baea6a6c7c4c2dfeb977efac326af552d87",
        "0xd2571607e241ecf590ed94b12d87c94babe36db6",
        "0x62c01474f089b07dae603491675dc5b5748f7049",
        "0x2adc25665018aa1fe0e6bc666dac8fc2697ff9ba",
    };

    const value_hexes = [_][]const u8{
        "0xf848018405f446a7a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
        "0xf8440101a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a004bccc5d94f4d1f99aab44369a910179931772f2a5c001c3229f57831c102769",
        "0xf8440180a0ba4b47865c55a341a4a78759bb913cd15c3ee8eaf30a62fa8d1c8863113d84e8a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
        "0xf8448080a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
        "0xf8478083019a59a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    };

    var key_bytes: [key_hexes.len][]u8 = undefined;
    var key_slices: [key_hexes.len][]const u8 = undefined;
    defer for (key_bytes) |bytes| allocator.free(bytes);

    for (key_hexes, 0..) |hex, i| {
        key_bytes[i] = try Hex.hexToBytes(allocator, hex);
        key_slices[i] = key_bytes[i];
    }

    var value_bytes: [value_hexes.len][]u8 = undefined;
    var value_slices: [value_hexes.len][]const u8 = undefined;
    defer for (value_bytes) |bytes| allocator.free(bytes);

    for (value_hexes, 0..) |hex, i| {
        value_bytes[i] = try Hex.hexToBytes(allocator, hex);
        value_slices[i] = value_bytes[i];
    }

    const root = try secure_trie_root(allocator, &key_slices, &value_slices);
    const expected = try Hex.hexToBytesFixed(32, "0x730a444e08ab4b8dee147c9b232fc52d34a223d600031c1e9d25bfc985cbd797");
    try testing.expectEqualSlices(u8, &expected, &root);
}

// ---------------------------------------------------------------------------
// trieanyorder.json spec tests (all 7 vectors)
// ---------------------------------------------------------------------------

test "trieanyorder - singleItem" {
    // A -> aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    const allocator = testing.allocator;
    const keys = [_][]const u8{"A"};
    const values = [_][]const u8{"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"};
    const root = try trie_root(allocator, &keys, &values);
    const expected = try Hex.hexToBytesFixed(32, "0xd23786fb4a010da3ce639d66d5e904a11dbc02746d1ce25029e53290cabf28ab");
    try testing.expectEqualSlices(u8, &expected, &root);
}

test "trieanyorder - dogs" {
    // doe -> reindeer, dog -> puppy, dogglesworth -> cat
    const allocator = testing.allocator;
    const keys = [_][]const u8{ "doe", "dog", "dogglesworth" };
    const values = [_][]const u8{ "reindeer", "puppy", "cat" };
    const root = try trie_root(allocator, &keys, &values);
    const expected = try Hex.hexToBytesFixed(32, "0x8aad789dff2f538bca5d8ea56e8abe10f4c7ba3a5dea95fea4cd6e7c3a1168d3");
    try testing.expectEqualSlices(u8, &expected, &root);
}

test "trieanyorder - puppy" {
    // do -> verb, horse -> stallion, doge -> coin, dog -> puppy
    const allocator = testing.allocator;
    const keys = [_][]const u8{ "do", "horse", "doge", "dog" };
    const values = [_][]const u8{ "verb", "stallion", "coin", "puppy" };
    const root = try trie_root(allocator, &keys, &values);
    const expected = try Hex.hexToBytesFixed(32, "0x5991bb8c6514148a29db676a14ac506cd2cd5775ace63c30a4fe457715e9ac84");
    try testing.expectEqualSlices(u8, &expected, &root);
}

test "trieanyorder - foo" {
    // foo -> bar, food -> bass
    const allocator = testing.allocator;
    const keys = [_][]const u8{ "foo", "food" };
    const values = [_][]const u8{ "bar", "bass" };
    const root = try trie_root(allocator, &keys, &values);
    const expected = try Hex.hexToBytesFixed(32, "0x17beaa1648bafa633cda809c90c04af50fc8aed3cb40d16efbddee6fdf63c4c3");
    try testing.expectEqualSlices(u8, &expected, &root);
}

test "trieanyorder - smallValues" {
    // be -> e, dog -> puppy, bed -> d
    const allocator = testing.allocator;
    const keys = [_][]const u8{ "be", "dog", "bed" };
    const values = [_][]const u8{ "e", "puppy", "d" };
    const root = try trie_root(allocator, &keys, &values);
    const expected = try Hex.hexToBytesFixed(32, "0x3f67c7a47520f79faa29255d2d3c084a7a6df0453116ed7232ff10277a8be68b");
    try testing.expectEqualSlices(u8, &expected, &root);
}

test "trieanyorder - testy" {
    // test -> test, te -> testy
    const allocator = testing.allocator;
    const keys = [_][]const u8{ "test", "te" };
    const values = [_][]const u8{ "test", "testy" };
    const root = try trie_root(allocator, &keys, &values);
    const expected = try Hex.hexToBytesFixed(32, "0x8452568af70d8d140f58d941338542f645fcca50094b20f3c3d8c3df49337928");
    try testing.expectEqualSlices(u8, &expected, &root);
}

test "trieanyorder - hex" {
    // 0x0045 -> 0x0123456789, 0x4500 -> 0x9876543210
    // Keys/values are hex-encoded byte strings
    const allocator = testing.allocator;
    const key_left = try Hex.hexToBytesFixed(2, "0x0045");
    const key_right = try Hex.hexToBytesFixed(2, "0x4500");
    const value_left = try Hex.hexToBytesFixed(5, "0x0123456789");
    const value_right = try Hex.hexToBytesFixed(5, "0x9876543210");
    const keys = [_][]const u8{
        key_left[0..],
        key_right[0..],
    };
    const values = [_][]const u8{
        value_left[0..],
        value_right[0..],
    };
    const root = try trie_root(allocator, &keys, &values);
    const expected = try Hex.hexToBytesFixed(32, "0x285505fcabe84badc8aa310e2aae17eddc7d120aabec8a476902c8184b3a3503");
    try testing.expectEqualSlices(u8, &expected, &root);
}

// ---------------------------------------------------------------------------
// trietest.json spec tests (ordered insertion with updates/deletes)
// ---------------------------------------------------------------------------

test "trietest - insert-middle-leaf" {
    // Ordered insertions:
    //   key1aa -> 0123456789012345678901234567890123456789xxx
    //   key1   -> 0123456789012345678901234567890123456789Very_Long
    //   key2bb -> aval3
    //   key2   -> short
    //   key3cc -> aval3
    //   key3   -> 1234567890123456789012345678901
    const allocator = testing.allocator;
    const keys = [_][]const u8{ "key1aa", "key1", "key2bb", "key2", "key3cc", "key3" };
    const values = [_][]const u8{
        "0123456789012345678901234567890123456789xxx",
        "0123456789012345678901234567890123456789Very_Long",
        "aval3",
        "short",
        "aval3",
        "1234567890123456789012345678901",
    };
    const root = try trie_root(allocator, &keys, &values);
    const expected = try Hex.hexToBytesFixed(32, "0xcb65032e2f76c48b82b5c24b3db8f670ce73982869d38cd39a624f23d62a9e89");
    try testing.expectEqualSlices(u8, &expected, &root);
}

test "trietest - branch-value-update" {
    // Ordered insertions where "abc" is set twice (last value wins):
    //   abc  -> 123
    //   abcd -> abcd
    //   abc  -> abc  (overwrites "123")
    // Our trie_root takes final state, so pass the final mapping:
    const allocator = testing.allocator;
    const keys = [_][]const u8{ "abc", "abcd" };
    const values = [_][]const u8{ "abc", "abcd" };
    const root = try trie_root(allocator, &keys, &values);
    const expected = try Hex.hexToBytesFixed(32, "0x7a320748f780ad9ad5b0837302075ce0eeba6c26e3d8562c67ccc0f1b273298a");
    try testing.expectEqualSlices(u8, &expected, &root);
}
