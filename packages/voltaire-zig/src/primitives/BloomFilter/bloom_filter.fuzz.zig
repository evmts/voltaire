const std = @import("std");
const testing = std.testing;
const BloomFilter = @import("bloom_filter.zig").BloomFilter;

// Fuzz tests for BloomFilter operations

fn fuzzAddAndContains(_: void, input: []const u8) !void {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    // Add element
    bf.add(input);

    // Element must be found (no false negatives)
    try testing.expect(bf.contains(input));
}

test "fuzz add and contains" {
    try testing.fuzz({}, fuzzAddAndContains, .{});
}

fn fuzzMultipleAddsSameElement(_: void, input: []const u8) !void {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    // Add same element multiple times
    bf.add(input);
    bf.add(input);
    bf.add(input);

    // Should still be found
    try testing.expect(bf.contains(input));
}

test "fuzz multiple adds same element" {
    try testing.fuzz({}, fuzzMultipleAddsSameElement, .{});
}

fn fuzzArbitraryDataTypes(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Split input into different "items"
    const mid = input.len / 2;
    bf.add(input[0..mid]);
    bf.add(input[mid..]);

    // Both should be found
    try testing.expect(bf.contains(input[0..mid]));
    try testing.expect(bf.contains(input[mid..]));
}

test "fuzz arbitrary data types" {
    try testing.fuzz({}, fuzzArbitraryDataTypes, .{});
}

fn fuzzEmptyInput(_: void, input: []const u8) !void {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    // Empty string should be addable and findable
    bf.add("");

    try testing.expect(bf.contains(""));

    // Also add and check fuzzer input
    bf.add(input);
    try testing.expect(bf.contains(input));
}

test "fuzz empty input" {
    try testing.fuzz({}, fuzzEmptyInput, .{});
}

fn fuzzSingleByteInputs(_: void, input: []const u8) !void {
    if (input.len == 0) return;

    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    // Add single byte
    bf.add(input[0..1]);

    // Should be found
    try testing.expect(bf.contains(input[0..1]));

    // Other single bytes probably not found (unless false positive)
    if (input.len > 1) {
        const contains_second = bf.contains(input[1..2]);
        // Can't assert false - might be false positive
        _ = contains_second;
    }
}

test "fuzz single byte inputs" {
    try testing.fuzz({}, fuzzSingleByteInputs, .{});
}

fn fuzzLargeInputs(_: void, input: []const u8) !void {
    if (input.len > 10000) return; // Skip oversized inputs

    var bf = try BloomFilter.init(testing.allocator, 100000, 7);
    defer bf.deinit(testing.allocator);

    bf.add(input);

    // Must be found (no false negatives)
    try testing.expect(bf.contains(input));
}

test "fuzz large inputs" {
    try testing.fuzz({}, fuzzLargeInputs, .{});
}

fn fuzzSmallFilterSize(_: void, input: []const u8) !void {
    // Very small filter - high collision rate
    var bf = try BloomFilter.init(testing.allocator, 8, 1);
    defer bf.deinit(testing.allocator);

    bf.add(input);

    // Still must be found
    try testing.expect(bf.contains(input));
}

test "fuzz small filter size" {
    try testing.fuzz({}, fuzzSmallFilterSize, .{});
}

fn fuzzLargeFilterSize(_: void, input: []const u8) !void {
    // Very large filter - low collision rate
    var bf = try BloomFilter.init(testing.allocator, 1000000, 10);
    defer bf.deinit(testing.allocator);

    bf.add(input);

    // Must be found
    try testing.expect(bf.contains(input));
}

test "fuzz large filter size" {
    try testing.fuzz({}, fuzzLargeFilterSize, .{});
}

fn fuzzVaryingKValues(_: void, input: []const u8) !void {
    if (input.len < 1) return;

    // Use first byte to determine k (1-16)
    const k = @as(usize, @intCast((input[0] % 16) + 1));

    var bf = try BloomFilter.init(testing.allocator, 10000, k);
    defer bf.deinit(testing.allocator);

    bf.add(input);

    // Must be found regardless of k
    try testing.expect(bf.contains(input));
}

test "fuzz varying k values" {
    try testing.fuzz({}, fuzzVaryingKValues, .{});
}

fn fuzzMultipleDistinctElements(_: void, input: []const u8) !void {
    if (input.len < 12) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Split input into 3 distinct elements
    const len = input.len / 3;
    const elem1 = input[0..len];
    const elem2 = input[len .. len * 2];
    const elem3 = input[len * 2 ..];

    bf.add(elem1);
    bf.add(elem2);
    bf.add(elem3);

    // All must be found
    try testing.expect(bf.contains(elem1));
    try testing.expect(bf.contains(elem2));
    try testing.expect(bf.contains(elem3));
}

test "fuzz multiple distinct elements" {
    try testing.fuzz({}, fuzzMultipleDistinctElements, .{});
}

fn fuzzSequentialAdds(_: void, input: []const u8) !void {
    if (input.len < 10) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Add elements one byte at a time (up to 100)
    const max_items = @min(input.len, 100);
    var i: usize = 0;
    while (i < max_items) : (i += 1) {
        bf.add(input[i .. i + 1]);
    }

    // All should be found
    i = 0;
    while (i < max_items) : (i += 1) {
        try testing.expect(bf.contains(input[i .. i + 1]));
    }
}

test "fuzz sequential adds" {
    try testing.fuzz({}, fuzzSequentialAdds, .{});
}

fn fuzzBitManipulationBoundaries(_: void, input: []const u8) !void {
    // Test various m values that hit byte boundaries
    const m_values = [_]usize{ 1, 7, 8, 9, 15, 16, 17, 255, 256, 257 };

    for (m_values) |m| {
        var bf = try BloomFilter.init(testing.allocator, m, 3);
        defer bf.deinit(testing.allocator);

        bf.add(input);

        // Must be found
        try testing.expect(bf.contains(input));
    }
}

test "fuzz bit manipulation boundaries" {
    try testing.fuzz({}, fuzzBitManipulationBoundaries, .{});
}

fn fuzzHashCollisionProperty(_: void, input: []const u8) !void {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    bf.add(input);

    // Added element must always be found
    try testing.expect(bf.contains(input));

    // Check determinism - same query gives same result
    const result1 = bf.contains(input);
    const result2 = bf.contains(input);
    try testing.expectEqual(result1, result2);
}

test "fuzz hash collision property" {
    try testing.fuzz({}, fuzzHashCollisionProperty, .{});
}

fn fuzzZeroBytes(_: void, input: []const u8) !void {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    // Create input with all zeros
    var zeros: [100]u8 = undefined;
    @memset(&zeros, 0);

    bf.add(&zeros);
    try testing.expect(bf.contains(&zeros));

    // Also add fuzzer input
    bf.add(input);
    try testing.expect(bf.contains(input));
}

test "fuzz zero bytes" {
    try testing.fuzz({}, fuzzZeroBytes, .{});
}

fn fuzzMaxBytes(_: void, input: []const u8) !void {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    // Create input with all 0xFF
    var max_bytes: [100]u8 = undefined;
    @memset(&max_bytes, 0xFF);

    bf.add(&max_bytes);
    try testing.expect(bf.contains(&max_bytes));

    // Also add fuzzer input
    bf.add(input);
    try testing.expect(bf.contains(input));
}

test "fuzz max bytes" {
    try testing.fuzz({}, fuzzMaxBytes, .{});
}

fn fuzzIdempotency(_: void, input: []const u8) !void {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    // Add element
    bf.add(input);

    // Capture state by checking several random items
    var test_items: [10]bool = undefined;
    for (&test_items, 0..) |*item, i| {
        var buf: [8]u8 = undefined;
        std.mem.writeInt(u64, &buf, i, .little);
        item.* = bf.contains(&buf);
    }

    // Add same element again
    bf.add(input);

    // State should be identical (idempotent)
    for (test_items, 0..) |expected, i| {
        var buf: [8]u8 = undefined;
        std.mem.writeInt(u64, &buf, i, .little);
        try testing.expectEqual(expected, bf.contains(&buf));
    }

    // Original element still found
    try testing.expect(bf.contains(input));
}

test "fuzz idempotency" {
    try testing.fuzz({}, fuzzIdempotency, .{});
}

fn fuzzMinimalFilter(_: void, input: []const u8) !void {
    // Minimal possible filter: 1 bit, 1 hash
    var bf = try BloomFilter.init(testing.allocator, 1, 1);
    defer bf.deinit(testing.allocator);

    bf.add(input);

    // Must be found
    try testing.expect(bf.contains(input));

    // Everything will be a false positive with 1 bit
    // Just verify no crash
    try testing.expect(bf.contains("anything"));
}

test "fuzz minimal filter" {
    try testing.fuzz({}, fuzzMinimalFilter, .{});
}

fn fuzzInterleavedOperations(_: void, input: []const u8) !void {
    if (input.len < 20) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Interleave adds and checks
    var i: usize = 0;
    const step = input.len / 10;
    if (step == 0) return;

    while (i < input.len - step) : (i += step) {
        const item = input[i .. i + step];
        bf.add(item);
        try testing.expect(bf.contains(item));

        // Previous items should still be found
        if (i >= step) {
            const prev_item = input[i - step .. i];
            try testing.expect(bf.contains(prev_item));
        }
    }
}

test "fuzz interleaved operations" {
    try testing.fuzz({}, fuzzInterleavedOperations, .{});
}

fn fuzzSimilarInputs(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Add original input
    bf.add(input);
    try testing.expect(bf.contains(input));

    // Create similar input with one byte changed
    if (input.len > 0) {
        var modified = testing.allocator.dupe(u8, input) catch return;
        defer testing.allocator.free(modified);

        modified[0] = ~modified[0]; // Flip all bits of first byte

        // Original still found
        try testing.expect(bf.contains(input));

        // Modified might or might not be found (could be false positive)
        _ = bf.contains(modified);
    }
}

test "fuzz similar inputs" {
    try testing.fuzz({}, fuzzSimilarInputs, .{});
}

fn fuzzFilterStateConsistency(_: void, input: []const u8) !void {
    if (input.len < 8) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Add multiple items
    const count = @min(input.len / 4, 50);
    var i: usize = 0;
    while (i < count) : (i += 1) {
        bf.add(input[i * 4 .. (i + 1) * 4]);
    }

    // Verify all items are still found after all adds
    i = 0;
    while (i < count) : (i += 1) {
        try testing.expect(bf.contains(input[i * 4 .. (i + 1) * 4]));
    }
}

test "fuzz filter state consistency" {
    try testing.fuzz({}, fuzzFilterStateConsistency, .{});
}

fn fuzzExtremeKValues(_: void, input: []const u8) !void {
    // Test with extreme k values
    const k_values = [_]usize{ 1, 100, 1000 };

    for (k_values) |k| {
        var bf = try BloomFilter.init(testing.allocator, 100000, k);
        defer bf.deinit(testing.allocator);

        bf.add(input);

        // Must be found regardless of k
        try testing.expect(bf.contains(input));
    }
}

test "fuzz extreme k values" {
    try testing.fuzz({}, fuzzExtremeKValues, .{});
}

fn fuzzBytesSliceVariations(_: void, input: []const u8) !void {
    if (input.len < 10) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Add various slices of input
    bf.add(input);
    bf.add(input[0 .. input.len / 2]);
    bf.add(input[input.len / 2 ..]);

    // All slices should be found
    try testing.expect(bf.contains(input));
    try testing.expect(bf.contains(input[0 .. input.len / 2]));
    try testing.expect(bf.contains(input[input.len / 2 ..]));
}

test "fuzz bytes slice variations" {
    try testing.fuzz({}, fuzzBytesSliceVariations, .{});
}

fn fuzzRepeatedBytePatterns(_: void, input: []const u8) !void {
    if (input.len == 0) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Create repeated pattern from first byte
    var pattern: [100]u8 = undefined;
    @memset(&pattern, input[0]);

    bf.add(&pattern);
    try testing.expect(bf.contains(&pattern));

    // Also test original input
    bf.add(input);
    try testing.expect(bf.contains(input));
}

test "fuzz repeated byte patterns" {
    try testing.fuzz({}, fuzzRepeatedBytePatterns, .{});
}

fn fuzzAlternatingBytes(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Create alternating pattern
    var pattern: [100]u8 = undefined;
    for (&pattern, 0..) |*byte, i| {
        byte.* = if (i % 2 == 0) input[0] else input[1];
    }

    bf.add(&pattern);
    try testing.expect(bf.contains(&pattern));
}

test "fuzz alternating bytes" {
    try testing.fuzz({}, fuzzAlternatingBytes, .{});
}

fn fuzzOverlappingSlices(_: void, input: []const u8) !void {
    if (input.len < 6) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Add overlapping slices
    bf.add(input[0..3]);
    bf.add(input[2..5]);
    bf.add(input[4..]);

    // All should be found
    try testing.expect(bf.contains(input[0..3]));
    try testing.expect(bf.contains(input[2..5]));
    try testing.expect(bf.contains(input[4..]));
}

test "fuzz overlapping slices" {
    try testing.fuzz({}, fuzzOverlappingSlices, .{});
}

fn fuzzNoFalseNegativesProperty(_: void, input: []const u8) !void {
    var bf = try BloomFilter.init(testing.allocator, 10000, 7);
    defer bf.deinit(testing.allocator);

    // Core property: if we add an element, it must be found
    bf.add(input);

    // Check multiple times to ensure determinism
    try testing.expect(bf.contains(input));
    try testing.expect(bf.contains(input));
    try testing.expect(bf.contains(input));
}

test "fuzz no false negatives property" {
    try testing.fuzz({}, fuzzNoFalseNegativesProperty, .{});
}

fn fuzzDifferentSliceLengths(_: void, input: []const u8) !void {
    if (input.len < 10) return;

    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    // Add slices of various lengths
    var len: usize = 1;
    while (len <= input.len) : (len += 1) {
        if (len > 50) break; // Limit to avoid timeout
        bf.add(input[0..len]);
    }

    // All should be found
    len = 1;
    while (len <= input.len) : (len += 1) {
        if (len > 50) break;
        try testing.expect(bf.contains(input[0..len]));
    }
}

test "fuzz different slice lengths" {
    try testing.fuzz({}, fuzzDifferentSliceLengths, .{});
}

// Run fuzz tests with: zig build test --fuzz
// Or with Docker on macOS:
//   docker run --rm -it -v $(pwd):/workspace -w /workspace \
//     ziglang/zig:0.15.1 zig build test --fuzz=300s
