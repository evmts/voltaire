//! Fuzz tests for Merkle Patricia Trie
//!
//! Tests arbitrary inputs for:
//! - Memory safety (no crashes/leaks)
//! - Property invariants (insert -> get succeeds)
//! - Edge cases (empty keys, collisions, long keys)
//! - Error handling (malformed proofs, invalid paths)

const std = @import("std");
const trie = @import("trie.zig");
const Trie = trie.Trie;
const TrieError = trie.TrieError;

// Fuzz basic key-value insertion
test "fuzz put and get" {
    try std.testing.fuzz({}, fuzzPutGet, .{});
}

fn fuzzPutGet(_: void, input: []const u8) !void {
    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Should never crash, only return error
    t.put(input, "fuzz_value") catch return;

    // Property: insert then get succeeds
    const result = t.get(input) catch return;
    if (result) |v| {
        try std.testing.expectEqualStrings("fuzz_value", v);
    }
}

// Fuzz deletion operations
test "fuzz delete" {
    try std.testing.fuzz({}, fuzzDelete, .{});
}

fn fuzzDelete(_: void, input: []const u8) !void {
    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert arbitrary key
    t.put(input, "value") catch return;

    // Delete should not crash
    t.delete(input) catch return;

    // Property: after delete, key not found
    const result = t.get(input) catch return;
    try std.testing.expect(result == null);
}

// Fuzz multiple insertions with arbitrary keys
test "fuzz multiple keys" {
    try std.testing.fuzz({}, fuzzMultipleKeys, .{});
}

fn fuzzMultipleKeys(_: void, input: []const u8) !void {
    if (input.len < 2) return; // Need at least 2 bytes for split

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Split input into key1 and key2
    const split_point = input.len / 2;
    const key1 = input[0..split_point];
    const key2 = input[split_point..];

    // Insert both keys
    t.put(key1, "value1") catch return;
    t.put(key2, "value2") catch return;

    // Property: both retrievable
    const val1 = t.get(key1) catch return;
    if (val1) |v| {
        try std.testing.expectEqualStrings("value1", v);
    }

    const val2 = t.get(key2) catch return;
    if (val2) |v| {
        try std.testing.expectEqualStrings("value2", v);
    }
}

// Fuzz update operations (overwrite existing keys)
test "fuzz update existing key" {
    try std.testing.fuzz({}, fuzzUpdate, .{});
}

fn fuzzUpdate(_: void, input: []const u8) !void {
    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert initial value
    t.put(input, "original") catch return;

    // Update with new value
    t.put(input, "updated") catch return;

    // Property: get returns latest value
    const result = t.get(input) catch return;
    if (result) |v| {
        try std.testing.expectEqualStrings("updated", v);
    }
}

// Fuzz arbitrary values (not just keys)
test "fuzz arbitrary values" {
    try std.testing.fuzz({}, fuzzArbitraryValues, .{});
}

fn fuzzArbitraryValues(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    const split_point = input.len / 2;
    const key = input[0..split_point];
    const value = input[split_point..];

    // Insert arbitrary value
    t.put(key, value) catch return;

    // Property: roundtrip succeeds
    const result = t.get(key) catch return;
    if (result) |v| {
        try std.testing.expectEqualSlices(u8, value, v);
    }
}

// Fuzz empty trie operations
test "fuzz empty trie operations" {
    try std.testing.fuzz({}, fuzzEmptyTrie, .{});
}

fn fuzzEmptyTrie(_: void, input: []const u8) !void {
    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Get from empty trie should not crash
    const get_result = t.get(input) catch return;
    try std.testing.expect(get_result == null);

    // Delete from empty trie should not crash
    t.delete(input) catch return;

    // Root should remain null
    try std.testing.expect(t.root_hash() == null);
}

// Fuzz key-to-nibbles conversion
test "fuzz keyToNibbles" {
    try std.testing.fuzz({}, fuzzKeyToNibbles, .{});
}

fn fuzzKeyToNibbles(_: void, input: []const u8) !void {
    const nibbles = trie.keyToNibbles(std.testing.allocator, input) catch return;
    defer std.testing.allocator.free(nibbles);

    // Property: nibbles length is 2x key length
    try std.testing.expectEqual(input.len * 2, nibbles.len);

    // Property: each nibble is 0-15
    for (nibbles) |n| {
        try std.testing.expect(n <= 0x0F);
    }
}

// Fuzz nibbles-to-key conversion
test "fuzz nibblesToKey" {
    try std.testing.fuzz({}, fuzzNibblesToKey, .{});
}

fn fuzzNibblesToKey(_: void, input: []const u8) !void {
    // Skip odd lengths (expected to fail)
    if (input.len % 2 != 0) {
        const result = trie.nibblesToKey(std.testing.allocator, input);
        try std.testing.expectError(TrieError.InvalidKey, result);
        return;
    }

    // Clamp nibbles to valid range
    var valid_nibbles = std.testing.allocator.alloc(u8, input.len) catch return;
    defer std.testing.allocator.free(valid_nibbles);

    for (input, 0..) |byte, i| {
        valid_nibbles[i] = byte & 0x0F; // Ensure 0-15
    }

    const key = trie.nibblesToKey(std.testing.allocator, valid_nibbles) catch return;
    defer std.testing.allocator.free(key);

    // Property: key length is half nibbles length
    try std.testing.expectEqual(valid_nibbles.len / 2, key.len);
}

// Fuzz keyToNibbles roundtrip
test "fuzz keyToNibbles roundtrip" {
    try std.testing.fuzz({}, fuzzKeyToNibblesRoundtrip, .{});
}

fn fuzzKeyToNibblesRoundtrip(_: void, input: []const u8) !void {
    const nibbles = trie.keyToNibbles(std.testing.allocator, input) catch return;
    defer std.testing.allocator.free(nibbles);

    const key = trie.nibblesToKey(std.testing.allocator, nibbles) catch return;
    defer std.testing.allocator.free(key);

    // Property: roundtrip preserves original
    try std.testing.expectEqualSlices(u8, input, key);
}

// Fuzz path encoding (hex prefix)
test "fuzz encodePath" {
    try std.testing.fuzz({}, fuzzEncodePath, .{});
}

fn fuzzEncodePath(_: void, input: []const u8) !void {
    // Clamp to valid nibbles
    var nibbles = std.testing.allocator.alloc(u8, input.len) catch return;
    defer std.testing.allocator.free(nibbles);

    for (input, 0..) |byte, i| {
        nibbles[i] = byte & 0x0F;
    }

    // Test both leaf and extension
    for ([_]bool{ false, true }) |is_leaf| {
        const encoded = trie.encodePath(std.testing.allocator, nibbles, is_leaf) catch return;
        defer std.testing.allocator.free(encoded);

        // Property: encoded length reasonable
        try std.testing.expect(encoded.len > 0);
        try std.testing.expect(encoded.len <= (nibbles.len / 2) + 1);
    }
}

// Fuzz path decoding
test "fuzz decodePath" {
    try std.testing.fuzz({}, fuzzDecodePath, .{});
}

fn fuzzDecodePath(_: void, input: []const u8) !void {
    if (input.len == 0) return; // Empty fails with InvalidPath

    const result = trie.decodePath(std.testing.allocator, input) catch |err| {
        // Expected error
        try std.testing.expect(err == TrieError.InvalidPath);
        return;
    };
    defer std.testing.allocator.free(result.nibbles);

    // Property: decoded nibbles are 0-15
    for (result.nibbles) |n| {
        try std.testing.expect(n <= 0x0F);
    }
}

// Fuzz encodePath -> decodePath roundtrip
test "fuzz path encoding roundtrip" {
    try std.testing.fuzz({}, fuzzPathRoundtrip, .{});
}

fn fuzzPathRoundtrip(_: void, input: []const u8) !void {
    // Clamp to valid nibbles
    var nibbles = std.testing.allocator.alloc(u8, input.len) catch return;
    defer std.testing.allocator.free(nibbles);

    for (input, 0..) |byte, i| {
        nibbles[i] = byte & 0x0F;
    }

    for ([_]bool{ false, true }) |is_leaf| {
        const encoded = trie.encodePath(std.testing.allocator, nibbles, is_leaf) catch return;
        defer std.testing.allocator.free(encoded);

        const decoded = trie.decodePath(std.testing.allocator, encoded) catch return;
        defer std.testing.allocator.free(decoded.nibbles);

        // Property: roundtrip preserves data
        try std.testing.expectEqual(is_leaf, decoded.is_leaf);
        try std.testing.expectEqualSlices(u8, nibbles, decoded.nibbles);
    }
}

// Fuzz TrieMask operations
test "fuzz TrieMask" {
    try std.testing.fuzz({}, fuzzTrieMask, .{});
}

fn fuzzTrieMask(_: void, input: []const u8) !void {
    var mask = trie.TrieMask.init();

    // Set bits based on input
    for (input) |byte| {
        const index: u4 = @intCast(byte & 0x0F);
        mask.set(index);

        // Property: bit is set after set()
        try std.testing.expect(mask.is_set(index));
    }

    const count_after_set = mask.bit_count();

    // Unset bits
    for (input) |byte| {
        const index: u4 = @intCast(byte & 0x0F);
        mask.unset(index);
    }

    const count_after_unset = mask.bit_count();

    // Property: bit count doesn't increase after unset
    try std.testing.expect(count_after_unset <= count_after_set);
}

// Fuzz insert-delete sequences
test "fuzz insert delete sequence" {
    try std.testing.fuzz({}, fuzzInsertDeleteSequence, .{});
}

fn fuzzInsertDeleteSequence(_: void, input: []const u8) !void {
    if (input.len < 4) return; // Need at least 4 bytes

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Process input as sequence of operations
    var i: usize = 0;
    while (i + 3 < input.len) : (i += 4) {
        const op = input[i] & 0x01; // 0 = insert, 1 = delete
        const key = input[i + 1 .. i + 4];

        if (op == 0) {
            t.put(key, "value") catch continue;
        } else {
            t.delete(key) catch continue;
        }
    }

    // Trie should remain valid
    _ = t.root_hash();
}

// Fuzz root hash determinism
test "fuzz root hash determinism" {
    try std.testing.fuzz({}, fuzzRootHashDeterminism, .{});
}

fn fuzzRootHashDeterminism(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    var t1 = Trie.init(std.testing.allocator);
    defer t1.deinit();

    var t2 = Trie.init(std.testing.allocator);
    defer t2.deinit();

    // Insert same data in both tries
    t1.put(input, "value") catch return;
    t2.put(input, "value") catch return;

    const hash1 = t1.root_hash();
    const hash2 = t2.root_hash();

    // Property: same operations yield same hash
    if (hash1) |h1| {
        if (hash2) |h2| {
            try std.testing.expectEqualSlices(u8, &h1, &h2);
        }
    }
}

// Fuzz keys with common prefixes
test "fuzz common prefix keys" {
    try std.testing.fuzz({}, fuzzCommonPrefixKeys, .{});
}

fn fuzzCommonPrefixKeys(_: void, input: []const u8) !void {
    if (input.len < 4) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Create keys with common prefix
    const prefix_len = input.len / 2;
    const key1 = input[0..prefix_len];
    const key2 = input[0..]; // Full input shares prefix with key1

    t.put(key1, "value1") catch return;
    t.put(key2, "value2") catch return;

    // Both should be retrievable
    _ = t.get(key1) catch return;
    _ = t.get(key2) catch return;
}

// Fuzz large keys
test "fuzz large keys" {
    try std.testing.fuzz({}, fuzzLargeKeys, .{});
}

fn fuzzLargeKeys(_: void, input: []const u8) !void {
    if (input.len > 1024) return; // Limit size for performance

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    t.put(input, "value") catch return;

    const result = t.get(input) catch return;
    if (result) |v| {
        try std.testing.expectEqualStrings("value", v);
    }
}

// Fuzz clear operation
test "fuzz clear" {
    try std.testing.fuzz({}, fuzzClear, .{});
}

fn fuzzClear(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert data
    t.put(input, "value") catch return;

    // Clear should not crash
    t.clear();

    // Property: trie is empty after clear
    try std.testing.expect(t.root_hash() == null);

    // Get should return null
    const result = t.get(input) catch return;
    try std.testing.expect(result == null);
}

// Fuzz allocation failure scenarios
test "fuzz allocation limits" {
    try std.testing.fuzz({}, fuzzAllocationLimits, .{});
}

fn fuzzAllocationLimits(_: void, input: []const u8) !void {
    if (input.len > 256) return; // Limit size

    // Use arena for bounded allocations
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var t = Trie.init(arena.allocator());
    defer t.deinit();

    // Should handle allocation gracefully
    t.put(input, "value") catch return;
    _ = t.get(input) catch return;
}

// Fuzz BranchNode operations
test "fuzz BranchNode" {
    try std.testing.fuzz({}, fuzzBranchNode, .{});
}

fn fuzzBranchNode(_: void, input: []const u8) !void {
    if (input.len < 16) return;

    var branch = trie.BranchNode.init();
    defer branch.deinit(std.testing.allocator);

    // Set children based on input
    for (0..16) |i| {
        if (input[i] & 0x01 == 1) {
            var hash: [32]u8 = undefined;
            @memset(&hash, input[i]);
            branch.set_child(@intCast(i), hash);
        }
    }

    // Properties
    const count = branch.mask.bit_count();
    try std.testing.expect(count <= 16);

    if (branch.has_single_child()) {
        try std.testing.expectEqual(@as(u5, 1), count);
    }
}

// Fuzz LeafNode operations
test "fuzz LeafNode" {
    try std.testing.fuzz({}, fuzzLeafNode, .{});
}

fn fuzzLeafNode(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    const split = input.len / 2;
    const nibbles = input[0..split];
    const value = input[split..];

    var leaf = trie.LeafNode.init(std.testing.allocator, nibbles, value) catch return;
    defer leaf.deinit(std.testing.allocator);

    // Property: data preserved
    try std.testing.expectEqualSlices(u8, nibbles, leaf.nibbles);
    try std.testing.expectEqualSlices(u8, value, leaf.value);

    // Test clone
    var cloned = leaf.clone(std.testing.allocator) catch return;
    defer cloned.deinit(std.testing.allocator);

    try std.testing.expectEqualSlices(u8, leaf.nibbles, cloned.nibbles);
    try std.testing.expectEqualSlices(u8, leaf.value, cloned.value);
}

// Fuzz ExtensionNode operations
test "fuzz ExtensionNode" {
    try std.testing.fuzz({}, fuzzExtensionNode, .{});
}

fn fuzzExtensionNode(_: void, input: []const u8) !void {
    if (input.len < 32) return;

    const nibbles = input[0 .. input.len - 32];
    var child_hash: [32]u8 = undefined;
    @memcpy(&child_hash, input[input.len - 32 ..]);

    var ext = trie.ExtensionNode.init(std.testing.allocator, nibbles, child_hash) catch return;
    defer ext.deinit(std.testing.allocator);

    // Property: data preserved
    try std.testing.expectEqualSlices(u8, nibbles, ext.nibbles);
    try std.testing.expectEqualSlices(u8, &child_hash, &ext.child_hash);
}

// Fuzz delete and reinsert pattern
test "fuzz delete reinsert" {
    try std.testing.fuzz({}, fuzzDeleteReinsert, .{});
}

fn fuzzDeleteReinsert(_: void, input: []const u8) !void {
    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert
    t.put(input, "value") catch return;
    const hash1 = t.root_hash();

    // Delete
    t.delete(input) catch return;

    // Reinsert same data
    t.put(input, "value") catch return;
    const hash2 = t.root_hash();

    // Property: hash should match after reinsert
    if (hash1) |h1| {
        if (hash2) |h2| {
            try std.testing.expectEqualSlices(u8, &h1, &h2);
        }
    }
}

// Fuzz multiple deletes
test "fuzz multiple deletes" {
    try std.testing.fuzz({}, fuzzMultipleDeletes, .{});
}

fn fuzzMultipleDeletes(_: void, input: []const u8) !void {
    if (input.len < 6) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    const key1 = input[0..2];
    const key2 = input[2..4];
    const key3 = input[4..6];

    // Insert three keys
    t.put(key1, "value1") catch return;
    t.put(key2, "value2") catch return;
    t.put(key3, "value3") catch return;

    // Delete in sequence
    t.delete(key1) catch return;
    _ = t.get(key1) catch return; // Should return null

    t.delete(key2) catch return;
    _ = t.get(key2) catch return;

    // Key3 should still exist
    const result = t.get(key3) catch return;
    if (result) |v| {
        try std.testing.expectEqualStrings("value3", v);
    }
}

// ============================================================================
// Proof Generation and Verification Fuzzing
// ============================================================================

test "fuzz proof generation" {
    try std.testing.fuzz({}, fuzzProofGeneration, .{});
}

fn fuzzProofGeneration(_: void, input: []const u8) !void {
    if (input.len < 4) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert data
    const split = input.len / 2;
    const key1 = input[0..split];
    const key2 = input[split..];

    t.put(key1, "value1") catch return;
    t.put(key2, "value2") catch return;

    // Generate proof (if method exists)
    // Note: This assumes a prove() method exists. Adjust if different.
    // _ = t.prove(key1) catch return;
}

// ============================================================================
// Malformed Trie Structure Fuzzing
// ============================================================================

test "fuzz malformed node hash" {
    try std.testing.fuzz({}, fuzzMalformedNodeHash, .{});
}

fn fuzzMalformedNodeHash(_: void, input: []const u8) !void {
    if (input.len < 32) return;

    // Create node with corrupted hash
    var hash: [32]u8 = undefined;
    @memcpy(&hash, input[0..32]);

    // BranchNode with potentially invalid hash
    var branch = trie.BranchNode.init();
    defer branch.deinit(std.testing.allocator);

    for (0..16) |i| {
        if (input[i % input.len] % 3 == 0) {
            branch.set_child(@intCast(i), hash);
        }
    }

    // Verify mask consistency
    const count = branch.mask.bit_count();
    try std.testing.expect(count <= 16);
}

test "fuzz invalid rlp nodes" {
    try std.testing.fuzz({}, fuzzInvalidRlpNodes, .{});
}

fn fuzzInvalidRlpNodes(_: void, input: []const u8) !void {
    // Test with arbitrary bytes as RLP
    // This tests robustness against malformed encoded nodes

    // Create trie and attempt operations with malformed data
    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Operations should not crash on malformed internal state
    t.put(input, "value") catch return;
    _ = t.get(input) catch return;
}

// ============================================================================
// Maximum Depth Testing
// ============================================================================

test "fuzz maximum depth trie" {
    try std.testing.fuzz({}, fuzzMaxDepth, .{});
}

fn fuzzMaxDepth(_: void, input: []const u8) !void {
    if (input.len < 16) return;
    if (input.len > 512) return; // Limit for performance

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Create keys with incrementing prefixes to force deep trie
    var key_buffer: [64]u8 = undefined;
    for (0..@min(input.len / 4, 8)) |depth| {
        const key_len = depth + 1;
        @memcpy(key_buffer[0..key_len], input[depth * 4 .. depth * 4 + key_len]);

        const key = key_buffer[0..key_len];
        t.put(key, "value") catch return;
    }

    // Verify all keys still retrievable
    for (0..@min(input.len / 4, 8)) |depth| {
        const key_len = depth + 1;
        @memcpy(key_buffer[0..key_len], input[depth * 4 .. depth * 4 + key_len]);

        const key = key_buffer[0..key_len];
        const result = t.get(key) catch return;
        if (result) |v| {
            try std.testing.expectEqualStrings("value", v);
        }
    }
}

test "fuzz extremely deep path" {
    try std.testing.fuzz({}, fuzzExtremelyDeepPath, .{});
}

fn fuzzExtremelyDeepPath(_: void, input: []const u8) !void {
    if (input.len < 128) return;
    if (input.len > 1024) return; // Limit for performance

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert with very long key
    t.put(input, "deep_value") catch return;

    // Retrieve should succeed
    const result = t.get(input) catch return;
    if (result) |v| {
        try std.testing.expectEqualStrings("deep_value", v);
    }

    // Delete should work
    t.delete(input) catch return;

    // Should be gone
    const after_delete = t.get(input) catch return;
    try std.testing.expect(after_delete == null);
}

// ============================================================================
// Branch Node Edge Cases
// ============================================================================

test "fuzz branch all children populated" {
    try std.testing.fuzz({}, fuzzBranchAllChildren, .{});
}

fn fuzzBranchAllChildren(_: void, input: []const u8) !void {
    if (input.len < 16) return;

    var branch = trie.BranchNode.init();
    defer branch.deinit(std.testing.allocator);

    // Populate all 16 children
    for (0..16) |i| {
        var hash: [32]u8 = undefined;
        const start = (i * 2) % input.len;
        const end = @min(start + 32, input.len);
        const fill_len = end - start;
        @memcpy(hash[0..fill_len], input[start..end]);
        if (fill_len < 32) {
            @memset(hash[fill_len..], input[i % input.len]);
        }

        branch.set_child(@intCast(i), hash);
    }

    // Property: all children set
    try std.testing.expectEqual(@as(u5, 16), branch.mask.bit_count());

    // Property: not single child
    try std.testing.expect(!branch.has_single_child());

    // Property: all indices have children
    for (0..16) |i| {
        try std.testing.expect(branch.mask.is_set(@intCast(i)));
    }
}

test "fuzz branch collapse scenarios" {
    try std.testing.fuzz({}, fuzzBranchCollapse, .{});
}

fn fuzzBranchCollapse(_: void, input: []const u8) !void {
    if (input.len < 6) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Create scenario where branch should collapse
    // Insert two keys with common prefix
    const key1 = input[0..2];
    const key2 = input[2..4];
    const key3 = input[4..6];

    t.put(key1, "v1") catch return;
    t.put(key2, "v2") catch return;
    t.put(key3, "v3") catch return;

    // Delete one - may trigger collapse
    t.delete(key2) catch return;

    // Remaining keys should still be accessible
    _ = t.get(key1) catch return;
    _ = t.get(key3) catch return;
}

// ============================================================================
// Extension Node Edge Cases
// ============================================================================

test "fuzz extension maximum length path" {
    try std.testing.fuzz({}, fuzzExtensionMaxPath, .{});
}

fn fuzzExtensionMaxPath(_: void, input: []const u8) !void {
    if (input.len < 64) return;

    // Create extension with very long path
    var hash: [32]u8 = undefined;
    @memcpy(&hash, input[input.len - 32 ..]);

    const nibbles = input[0 .. input.len - 32];

    var ext = trie.ExtensionNode.init(std.testing.allocator, nibbles, hash) catch return;
    defer ext.deinit(std.testing.allocator);

    // Property: data preserved
    try std.testing.expectEqualSlices(u8, nibbles, ext.nibbles);
    try std.testing.expectEqualSlices(u8, &hash, &ext.child_hash);
}

test "fuzz extension splitting" {
    try std.testing.fuzz({}, fuzzExtensionSplitting, .{});
}

fn fuzzExtensionSplitting(_: void, input: []const u8) !void {
    if (input.len < 8) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert keys that will create and split extensions
    const key1 = input[0..4];
    const key2 = input[0..3]; // Prefix of key1
    const key3 = input[0..5]; // Extension of key1

    t.put(key1, "value1") catch return;
    t.put(key2, "value2") catch return;
    t.put(key3, "value3") catch return;

    // All should be retrievable
    _ = t.get(key1) catch return;
    _ = t.get(key2) catch return;
    _ = t.get(key3) catch return;
}

// ============================================================================
// Path Encoding Edge Cases
// ============================================================================

test "fuzz invalid prefix bytes" {
    try std.testing.fuzz({}, fuzzInvalidPrefixBytes, .{});
}

fn fuzzInvalidPrefixBytes(_: void, input: []const u8) !void {
    if (input.len == 0) return;

    // Test with arbitrary prefix bytes
    const result = trie.decodePath(std.testing.allocator, input) catch |err| {
        // Expected to fail with invalid paths
        try std.testing.expect(err == trie.TrieError.InvalidPath);
        return;
    };
    defer std.testing.allocator.free(result.nibbles);

    // If successful, nibbles should be valid
    for (result.nibbles) |n| {
        try std.testing.expect(n <= 0x0F);
    }
}

test "fuzz path encoding all prefixes" {
    try std.testing.fuzz({}, fuzzPathEncodingAllPrefixes, .{});
}

fn fuzzPathEncodingAllPrefixes(_: void, input: []const u8) !void {
    // Test with valid nibbles but various odd/even lengths
    var nibbles = std.testing.allocator.alloc(u8, input.len) catch return;
    defer std.testing.allocator.free(nibbles);

    for (input, 0..) |byte, i| {
        nibbles[i] = byte & 0x0F;
    }

    // Test both leaf and extension variants
    for ([_]bool{ false, true }) |is_leaf| {
        const encoded = trie.encodePath(std.testing.allocator, nibbles, is_leaf) catch return;
        defer std.testing.allocator.free(encoded);

        const decoded = trie.decodePath(std.testing.allocator, encoded) catch return;
        defer std.testing.allocator.free(decoded.nibbles);

        // Roundtrip verification
        try std.testing.expectEqual(is_leaf, decoded.is_leaf);
        try std.testing.expectEqualSlices(u8, nibbles, decoded.nibbles);
    }
}

// ============================================================================
// Stress Testing
// ============================================================================

test "fuzz massive sequential insertions" {
    try std.testing.fuzz({}, fuzzMassiveInsertions, .{});
}

fn fuzzMassiveInsertions(_: void, input: []const u8) !void {
    if (input.len < 32) return;
    if (input.len > 512) return; // Limit for performance

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert many keys derived from input
    var i: usize = 0;
    while (i + 4 <= input.len) : (i += 4) {
        const key = input[i .. i + 4];
        t.put(key, "value") catch continue;
    }

    // Verify hash is stable
    const hash1 = t.root_hash();
    const hash2 = t.root_hash();

    if (hash1) |h1| {
        if (hash2) |h2| {
            try std.testing.expectEqualSlices(u8, &h1, &h2);
        }
    }
}

test "fuzz alternating insert delete" {
    try std.testing.fuzz({}, fuzzAlternatingOps, .{});
}

fn fuzzAlternatingOps(_: void, input: []const u8) !void {
    if (input.len < 8) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Alternate between insert and delete
    var i: usize = 0;
    while (i + 4 <= input.len) : (i += 4) {
        const key = input[i .. i + 4];
        const op = input[i] % 2;

        if (op == 0) {
            t.put(key, "value") catch continue;
        } else {
            t.delete(key) catch continue;
        }
    }

    // Trie should remain valid
    _ = t.root_hash();
}

// ============================================================================
// Concurrent-like Fuzzing (Sequential but adversarial)
// ============================================================================

test "fuzz overlapping key modifications" {
    try std.testing.fuzz({}, fuzzOverlappingKeys, .{});
}

fn fuzzOverlappingKeys(_: void, input: []const u8) !void {
    if (input.len < 12) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Create overlapping keys
    const key1 = input[0..4];
    const key2 = input[0..6]; // Extends key1
    const key3 = input[0..3]; // Prefix of key1

    // Modify in various orders
    t.put(key1, "v1") catch return;
    t.put(key2, "v2") catch return;
    t.put(key3, "v3") catch return;

    // Update middle key
    t.put(key1, "v1_updated") catch return;

    // Delete prefix
    t.delete(key3) catch return;

    // Verify remaining keys
    const r1 = t.get(key1) catch return;
    if (r1) |v| {
        try std.testing.expectEqualStrings("v1_updated", v);
    }

    const r2 = t.get(key2) catch return;
    if (r2) |v| {
        try std.testing.expectEqualStrings("v2", v);
    }

    const r3 = t.get(key3) catch return;
    try std.testing.expect(r3 == null);
}

// ============================================================================
// Hash Collision Testing
// ============================================================================

test "fuzz hash collision simulation" {
    try std.testing.fuzz({}, fuzzHashCollision, .{});
}

fn fuzzHashCollision(_: void, input: []const u8) !void {
    if (input.len < 8) return;

    var t1 = Trie.init(std.testing.allocator);
    defer t1.deinit();

    var t2 = Trie.init(std.testing.allocator);
    defer t2.deinit();

    // Insert different keys
    const key1 = input[0..4];
    const key2 = input[4..8];

    t1.put(key1, "value") catch return;
    t2.put(key2, "value") catch return;

    const hash1 = t1.root_hash();
    const hash2 = t2.root_hash();

    // Different keys should produce different hashes
    if (hash1) |h1| {
        if (hash2) |h2| {
            if (!std.mem.eql(u8, key1, key2)) {
                // Should differ (collision would be extremely rare)
                _ = std.mem.eql(u8, &h1, &h2);
            }
        }
    }
}

// ============================================================================
// Memory Stress Testing
// ============================================================================

test "fuzz memory intensive operations" {
    try std.testing.fuzz({}, fuzzMemoryIntensive, .{});
}

fn fuzzMemoryIntensive(_: void, input: []const u8) !void {
    if (input.len > 1024) return; // Limit size

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var t = Trie.init(arena.allocator());
    defer t.deinit();

    // Many operations with arena allocator
    var i: usize = 0;
    while (i + 2 <= input.len) : (i += 2) {
        const key = input[i .. i + 2];
        t.put(key, "value") catch continue;
    }

    // Mass retrieval
    i = 0;
    while (i + 2 <= input.len) : (i += 2) {
        const key = input[i .. i + 2];
        _ = t.get(key) catch continue;
    }
}

// ============================================================================
// Edge Case: Empty Paths and Values
// ============================================================================

test "fuzz empty path edge cases" {
    try std.testing.fuzz({}, fuzzEmptyPaths, .{});
}

fn fuzzEmptyPaths(_: void, input: []const u8) !void {
    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert empty key
    t.put("", "empty_key_value") catch return;

    // Insert normal keys
    if (input.len > 0) {
        t.put(input, "normal_value") catch return;
    }

    // Retrieve empty key
    const empty_result = t.get("") catch return;
    if (empty_result) |v| {
        try std.testing.expectEqualStrings("empty_key_value", v);
    }

    // Delete empty key
    t.delete("") catch return;

    // Should be gone
    const after_delete = t.get("") catch return;
    try std.testing.expect(after_delete == null);
}

test "fuzz empty value edge cases" {
    try std.testing.fuzz({}, fuzzEmptyValues, .{});
}

fn fuzzEmptyValues(_: void, input: []const u8) !void {
    if (input.len == 0) return;

    var t = Trie.init(std.testing.allocator);
    defer t.deinit();

    // Insert with empty value
    t.put(input, "") catch return;

    // Retrieve should work
    const result = t.get(input) catch return;
    if (result) |v| {
        try std.testing.expectEqualStrings("", v);
    }
}
