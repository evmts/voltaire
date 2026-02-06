const std = @import("std");
const identity = @import("identity.zig");

// Fuzz tests for IDENTITY precompile (0x04)
// Tests arbitrary inputs for:
// - No panics/crashes
// - Proper error handling (OutOfGas, OutOfMemory)
// - Output == input property (identity invariant)
// - Determinism
// - Gas calculation correctness

// Fuzz test: arbitrary input lengths
// Validates IDENTITY never panics on any input
test "fuzz identity arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Should never panic, only return error or valid result
    const result = identity.execute(arena.allocator(), input, 1000000) catch |err| switch (err) {
        error.OutOfGas => return, // Expected if gas too low
        error.OutOfMemory => return, // Expected on allocation failure
    };
    defer result.deinit(arena.allocator());

    // Core identity property: output must equal input
    try std.testing.expectEqualSlices(u8, input, result.output);

    // Validate gas calculation
    const num_words = (input.len + 31) / 32;
    const expected_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;
    try std.testing.expectEqual(expected_gas, result.gas_used);
}

// Fuzz test: empty inputs
// Empty input should return empty output
test "fuzz identity empty input" {
    const input = std.testing.fuzzInput(.{});
    if (input.len > 0) return; // Only test empty

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = try identity.execute(arena.allocator(), input, 1000);
    defer result.deinit(arena.allocator());

    // Empty input → empty output
    try std.testing.expectEqual(@as(usize, 0), result.output.len);
    try std.testing.expectEqual(identity.BASE_GAS, result.gas_used);
}

// Fuzz test: single byte inputs
// Test minimal non-empty input
test "fuzz identity single byte" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len != 1) return; // Only test single byte

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = try identity.execute(arena.allocator(), raw_input, 1000);
    defer result.deinit(arena.allocator());

    // Identity property
    try std.testing.expectEqualSlices(u8, raw_input, result.output);

    // 1 byte = 1 word (rounds up)
    const expected_gas = identity.BASE_GAS + identity.PER_WORD_GAS;
    try std.testing.expectEqual(expected_gas, result.gas_used);
}

// Fuzz test: single word input (1-32 bytes)
// Test boundary at 32 bytes
test "fuzz identity single word" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0 or raw_input.len > 32) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = try identity.execute(arena.allocator(), raw_input, 10000);
    defer result.deinit(arena.allocator());

    // Identity property
    try std.testing.expectEqualSlices(u8, raw_input, result.output);

    // Single word costs BASE_GAS + PER_WORD_GAS * 1
    const expected_gas = identity.BASE_GAS + identity.PER_WORD_GAS;
    try std.testing.expectEqual(expected_gas, result.gas_used);
}

// Fuzz test: word boundary (33-64 bytes)
// Test rounding up to 2 words
test "fuzz identity two words" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 33 or raw_input.len > 64) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = try identity.execute(arena.allocator(), raw_input, 10000);
    defer result.deinit(arena.allocator());

    // Identity property
    try std.testing.expectEqualSlices(u8, raw_input, result.output);

    // Two words costs BASE_GAS + PER_WORD_GAS * 2
    const expected_gas = identity.BASE_GAS + identity.PER_WORD_GAS * 2;
    try std.testing.expectEqual(expected_gas, result.gas_used);
}

// Fuzz test: large inputs
// Test with inputs > 1KB
test "fuzz identity large input" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 1024) return; // Only test large inputs

    // Cap at reasonable size to avoid OOM
    const input_len = @min(raw_input.len, 8192);
    const input = raw_input[0..input_len];

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input_len + 31) / 32;
    const required_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;

    const result = try identity.execute(arena.allocator(), input, required_gas + 1000);
    defer result.deinit(arena.allocator());

    // Identity property holds for large inputs
    try std.testing.expectEqualSlices(u8, input, result.output);
    try std.testing.expectEqual(required_gas, result.gas_used);
}

// Fuzz test: gas limit variations
// Test OutOfGas conditions with fuzzer-derived gas limits
test "fuzz identity gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 2) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Extract gas limit from first 2 bytes
    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);

    // Use rest as input data
    const input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const num_words = (input.len + 31) / 32;
    const required_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;

    const result = identity.execute(arena.allocator(), input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            // Should only error if gas_limit < required_gas
            try std.testing.expect(gas_limit < required_gas);
            return;
        },
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    // Successful execution requires sufficient gas
    try std.testing.expect(gas_limit >= required_gas);
    try std.testing.expectEqual(required_gas, result.gas_used);

    // Identity property
    try std.testing.expectEqualSlices(u8, input, result.output);
}

// Fuzz test: exact gas boundary
// Test with exactly required gas
test "fuzz identity exact gas" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const required_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;

    // Provide exactly required gas
    const result = try identity.execute(arena.allocator(), input, required_gas);
    defer result.deinit(arena.allocator());

    // Identity property
    try std.testing.expectEqualSlices(u8, input, result.output);
    try std.testing.expectEqual(required_gas, result.gas_used);
}

// Fuzz test: one gas too low
// Test OutOfGas with required_gas - 1
test "fuzz identity insufficient gas" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const required_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;

    if (required_gas == 0) return; // Edge case

    // Provide one gas too low
    const result = identity.execute(arena.allocator(), input, required_gas - 1);
    try std.testing.expectError(error.OutOfGas, result);
}

// Fuzz test: output determinism
// Same input produces same output (identity always holds)
test "fuzz identity determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const required_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;

    // Execute twice with same input
    const result1 = identity.execute(arena.allocator(), input, required_gas + 1000) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = identity.execute(arena.allocator(), input, required_gas + 1000) catch return;
    defer result2.deinit(arena.allocator());

    // Results must be identical
    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqual(result1.output.len, result2.output.len);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);

    // Both must match input
    try std.testing.expectEqualSlices(u8, input, result1.output);
    try std.testing.expectEqualSlices(u8, input, result2.output);
}

// Fuzz test: output length equals input length
// Core identity property: |output| = |input|
test "fuzz identity length preservation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = identity.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // Length must be preserved
    try std.testing.expectEqual(input.len, result.output.len);

    // Full identity
    try std.testing.expectEqualSlices(u8, input, result.output);
}

// Fuzz test: gas calculation formula
// Verify gas formula: BASE_GAS + PER_WORD_GAS * ((len + 31) / 32)
test "fuzz identity gas formula" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = identity.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // Verify gas calculation
    const num_words = (input.len + 31) / 32;
    const expected_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;
    try std.testing.expectEqual(expected_gas, result.gas_used);

    // Verify constants
    try std.testing.expectEqual(@as(u64, 15), identity.BASE_GAS);
    try std.testing.expectEqual(@as(u64, 3), identity.PER_WORD_GAS);
}

// Fuzz test: word rounding
// Test input lengths near 32-byte boundaries
test "fuzz identity word rounding" {
    const raw_input = std.testing.fuzzInput(.{});

    // Focus on boundary cases
    const test_lengths = [_]usize{ 0, 1, 31, 32, 33, 63, 64, 65 };
    if (raw_input.len < 65) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    for (test_lengths) |len| {
        const input = raw_input[0..len];
        const num_words = (len + 31) / 32;
        const expected_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;

        const result = try identity.execute(arena.allocator(), input, expected_gas + 100);
        defer result.deinit(arena.allocator());

        try std.testing.expectEqual(expected_gas, result.gas_used);
        try std.testing.expectEqualSlices(u8, input, result.output);
    }
}

// Fuzz test: memory allocation stress
// Ensure no memory leaks with varied inputs
test "fuzz identity allocation stress" {
    const input = std.testing.fuzzInput(.{});

    // Use testing allocator to detect leaks
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Run multiple times with same input to stress allocator
    const iterations = @min(input.len + 1, 10);
    for (0..iterations) |_| {
        const result = identity.execute(arena.allocator(), input, 1000000) catch continue;
        result.deinit(arena.allocator());
    }
}

// Fuzz test: extreme input patterns
// Test with specific bit patterns
test "fuzz identity extreme patterns" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Use first byte to select pattern, rest for length
    const pattern = raw_input[0];
    const len = @min(if (raw_input.len > 1) raw_input[1] else 64, 200);

    var buffer: [200]u8 = undefined;
    const input = buffer[0..len];

    // Generate pattern
    switch (pattern % 6) {
        0 => @memset(input, 0x00), // All zeros
        1 => @memset(input, 0xFF), // All ones
        2 => @memset(input, 0x55), // Alternating bits 01010101
        3 => @memset(input, 0xAA), // Alternating bits 10101010
        4 => {
            // Incrementing bytes
            for (input, 0..) |*byte, i| {
                byte.* = @intCast(i % 256);
            }
        },
        5 => {
            // Use raw fuzzer bytes if available
            const copy_len = @min(raw_input.len, len);
            @memcpy(input[0..copy_len], raw_input[0..copy_len]);
            if (copy_len < len) {
                @memset(input[copy_len..len], 0);
            }
        },
        else => unreachable,
    }

    const result = identity.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // Identity property holds for all patterns
    try std.testing.expectEqualSlices(u8, input, result.output);
}

// Fuzz test: output buffer integrity
// Verify output buffer exactly matches input
test "fuzz identity output integrity" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = identity.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // Verify exact match byte-by-byte
    try std.testing.expectEqual(input.len, result.output.len);
    for (input, result.output) |in_byte, out_byte| {
        try std.testing.expectEqual(in_byte, out_byte);
    }
}

// Fuzz test: gas cost consistency
// Same input length should cost same gas regardless of content
test "fuzz identity gas consistency" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 64) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Create two different inputs of same length
    const len = @min(raw_input.len / 2, 100);
    const input1 = raw_input[0..len];
    const input2 = raw_input[len .. len * 2];

    const result1 = identity.execute(arena.allocator(), input1, 1000000) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = identity.execute(arena.allocator(), input2, 1000000) catch return;
    defer result2.deinit(arena.allocator());

    // Same length inputs should cost same gas
    try std.testing.expectEqual(result1.gas_used, result2.gas_used);

    // But outputs differ (identity property)
    try std.testing.expectEqualSlices(u8, input1, result1.output);
    try std.testing.expectEqualSlices(u8, input2, result2.output);
}

// Fuzz test: maximum reasonable input
// Test with very large but reasonable input
test "fuzz identity max input" {
    const raw_input = std.testing.fuzzInput(.{});

    // Cap at 16KB (reasonable max for fuzzing)
    const max_len = 16384;
    if (raw_input.len < max_len) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..max_len];
    const num_words = (max_len + 31) / 32;
    const required_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;

    const result = identity.execute(arena.allocator(), input, required_gas + 10000) catch |err| switch (err) {
        error.OutOfGas => return,
        error.OutOfMemory => return, // Expected for very large inputs
    };
    defer result.deinit(arena.allocator());

    // Identity property holds even for large inputs
    try std.testing.expectEqualSlices(u8, input, result.output);
}

// Fuzz test: zero vs non-zero bytes
// Identity should preserve all byte values
test "fuzz identity preserves all bytes" {
    const input = std.testing.fuzzInput(.{});
    if (input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = identity.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // Check each byte individually
    for (input, result.output, 0..) |in_byte, out_byte, i| {
        try std.testing.expectEqual(in_byte, out_byte);
        _ = i; // Could use for error messages
    }
}

// Fuzz test: no mutation
// Identity must not modify input buffer
test "fuzz identity no mutation" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Make a copy to verify input wasn't mutated
    const input_copy = arena.allocator().dupe(u8, raw_input) catch return;

    const result = identity.execute(arena.allocator(), raw_input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // Original input should be unchanged
    try std.testing.expectEqualSlices(u8, input_copy, raw_input);

    // Output should match input
    try std.testing.expectEqualSlices(u8, raw_input, result.output);
}

// Fuzz test: bijective property
// If identity(x) = y, then x = y (bijection)
test "fuzz identity bijection" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const output = identity.execute(arena.allocator(), input, 1000000) catch return;
    defer output.deinit(arena.allocator());

    // identity(x) = y implies x = y
    try std.testing.expectEqualSlices(u8, input, output.output);

    // Applying identity again should give same result (idempotent)
    const output2 = identity.execute(arena.allocator(), output.output, 1000000) catch return;
    defer output2.deinit(arena.allocator());

    try std.testing.expectEqualSlices(u8, output.output, output2.output);
    try std.testing.expectEqualSlices(u8, input, output2.output);
}

// Fuzz test: gas overflow protection
// Large inputs shouldn't cause gas calculation overflow
test "fuzz identity gas overflow" {
    const raw_input = std.testing.fuzzInput(.{});

    // Use maximum reasonable length
    const max_len = @min(raw_input.len, 65536);
    if (max_len < 1000) return;

    const input = raw_input[0..max_len];

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Calculate expected gas without overflow
    const num_words = (input.len + 31) / 32;
    const expected_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;

    // Should not overflow u64
    try std.testing.expect(expected_gas >= identity.BASE_GAS);
    try std.testing.expect(expected_gas >= identity.PER_WORD_GAS * num_words);

    const result = identity.execute(arena.allocator(), input, expected_gas + 1000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(expected_gas, result.gas_used);
    try std.testing.expectEqualSlices(u8, input, result.output);
}

// Fuzz test: empty to large progression
// Test transitioning from empty to large inputs
test "fuzz identity size progression" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 10) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Test progressively larger slices
    const step = @max(1, raw_input.len / 10);
    var len: usize = 0;
    while (len <= raw_input.len) : (len += step) {
        const input = raw_input[0..len];

        const num_words = (len + 31) / 32;
        const expected_gas = identity.BASE_GAS + identity.PER_WORD_GAS * num_words;

        const result = identity.execute(arena.allocator(), input, expected_gas + 100) catch continue;
        defer result.deinit(arena.allocator());

        // Identity holds at all sizes
        try std.testing.expectEqualSlices(u8, input, result.output);
        try std.testing.expectEqual(expected_gas, result.gas_used);
    }
}

// Run with: zig build test --fuzz
// Or with Docker on macOS:
// docker run --rm -it -v $(pwd):/workspace -w /workspace \
//   -p 6971:6971 ziglang/zig:0.15.1 \
//   zig build test --fuzz=300s --port=6971
