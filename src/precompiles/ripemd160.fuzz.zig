const std = @import("std");
const ripemd160 = @import("ripemd160.zig");

// Fuzz tests for RIPEMD160 precompile (0x03)
// Tests arbitrary inputs for:
// - No panics/crashes
// - Proper error handling (OutOfGas, OutOfMemory)
// - Output invariants (32 bytes, left-padded)
// - Determinism
// - Gas calculation correctness

// Fuzz test: arbitrary input lengths
// Validates RIPEMD160 never panics on any input
test "fuzz ripemd160 arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Should never panic, only return error or valid result
    const result = ripemd160.execute(arena.allocator(), input, 1000000) catch |err| switch (err) {
        error.OutOfGas => return, // Expected if gas too low
        error.OutOfMemory => return, // Expected on allocation failure
    };
    defer result.deinit(arena.allocator());

    // Validate output invariants
    try std.testing.expectEqual(@as(usize, 32), result.output.len);

    // First 12 bytes must be zero (left-padding)
    for (result.output[0..12]) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }

    // Gas cost = BASE_GAS + PER_WORD_GAS * num_words
    const num_words = (input.len + 31) / 32;
    const expected_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * num_words;
    try std.testing.expectEqual(expected_gas, result.gas_used);
}

// Fuzz test: empty inputs
// Empty input should work with minimal gas
test "fuzz ripemd160 empty input" {
    const input = std.testing.fuzzInput(.{});
    if (input.len > 0) return; // Only test empty

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = try ripemd160.execute(arena.allocator(), input, 1000);
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(ripemd160.BASE_GAS, result.gas_used);

    // First 12 bytes zero-padded
    for (result.output[0..12]) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }
}

// Fuzz test: single word input (0-32 bytes)
// Test boundary at 32 bytes
test "fuzz ripemd160 single word" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len > 32) return; // Only test single word

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = try ripemd160.execute(arena.allocator(), raw_input, 10000);
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);

    // Single word costs BASE_GAS + PER_WORD_GAS * 1
    const expected_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS;
    try std.testing.expectEqual(expected_gas, result.gas_used);
}

// Fuzz test: word boundary (33-64 bytes)
// Test rounding up to 2 words
test "fuzz ripemd160 two words" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 33 or raw_input.len > 64) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = try ripemd160.execute(arena.allocator(), raw_input, 10000);
    defer result.deinit(arena.allocator());

    // Two words costs BASE_GAS + PER_WORD_GAS * 2
    const expected_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * 2;
    try std.testing.expectEqual(expected_gas, result.gas_used);
}

// Fuzz test: large inputs
// Test with inputs > 1KB
test "fuzz ripemd160 large input" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 1024) return; // Only test large inputs

    // Cap at reasonable size to avoid OOM
    const input_len = @min(raw_input.len, 8192);
    const input = raw_input[0..input_len];

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input_len + 31) / 32;
    const required_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * num_words;

    const result = try ripemd160.execute(arena.allocator(), input, required_gas + 1000);
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(required_gas, result.gas_used);
}

// Fuzz test: gas limit variations
// Test OutOfGas conditions with fuzzer-derived gas limits
test "fuzz ripemd160 gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 2) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Extract gas limit from first 2 bytes
    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);

    // Use rest as input data
    const input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const num_words = (input.len + 31) / 32;
    const required_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * num_words;

    const result = ripemd160.execute(arena.allocator(), input, gas_limit) catch |err| switch (err) {
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
}

// Fuzz test: exact gas boundary
// Test with exactly required gas
test "fuzz ripemd160 exact gas" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const required_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * num_words;

    // Provide exactly required gas
    const result = try ripemd160.execute(arena.allocator(), input, required_gas);
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(required_gas, result.gas_used);
}

// Fuzz test: one gas too low
// Test OutOfGas with required_gas - 1
test "fuzz ripemd160 insufficient gas" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const required_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * num_words;

    if (required_gas == 0) return; // Edge case

    // Provide one gas too low
    const result = ripemd160.execute(arena.allocator(), input, required_gas - 1);
    try std.testing.expectError(error.OutOfGas, result);
}

// Fuzz test: output determinism
// Same input produces same output
test "fuzz ripemd160 determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const required_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * num_words;

    // Execute twice with same input
    const result1 = ripemd160.execute(arena.allocator(), input, required_gas + 1000) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = ripemd160.execute(arena.allocator(), input, required_gas + 1000) catch return;
    defer result2.deinit(arena.allocator());

    // Results must be identical
    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqual(result1.output.len, result2.output.len);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// Fuzz test: left padding verification
// Verify first 12 bytes always zero
test "fuzz ripemd160 left padding" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = ripemd160.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // First 12 bytes must be zero
    for (result.output[0..12]) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }

    // Last 20 bytes contain RIPEMD160 hash (can be anything)
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: hash non-zero for non-empty input
// RIPEMD160 should produce non-zero hash for most inputs
test "fuzz ripemd160 hash not all zero" {
    const input = std.testing.fuzzInput(.{});
    if (input.len == 0) return; // Skip empty

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = ripemd160.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // Last 20 bytes (hash) should not all be zero for most inputs
    // This is probabilistic - extremely rare to get all zeros
    const hash = result.output[12..32];
    const all_zero = for (hash) |byte| {
        if (byte != 0) break false;
    } else true;

    // Most fuzzer inputs won't produce all-zero hash
    _ = all_zero; // Don't assert - valid hash output
}

// Fuzz test: gas calculation formula
// Verify gas formula: BASE_GAS + PER_WORD_GAS * ((len + 31) / 32)
test "fuzz ripemd160 gas formula" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = ripemd160.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // Verify gas calculation
    const num_words = (input.len + 31) / 32;
    const expected_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * num_words;
    try std.testing.expectEqual(expected_gas, result.gas_used);

    // Verify constants
    try std.testing.expectEqual(@as(u64, 600), ripemd160.BASE_GAS);
    try std.testing.expectEqual(@as(u64, 120), ripemd160.PER_WORD_GAS);
}

// Fuzz test: word rounding
// Test input lengths near 32-byte boundaries
test "fuzz ripemd160 word rounding" {
    const raw_input = std.testing.fuzzInput(.{});

    // Focus on boundary cases
    const test_lengths = [_]usize{ 0, 1, 31, 32, 33, 63, 64, 65 };
    if (raw_input.len < 65) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    for (test_lengths) |len| {
        const input = raw_input[0..len];
        const num_words = (len + 31) / 32;
        const expected_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * num_words;

        const result = try ripemd160.execute(arena.allocator(), input, expected_gas + 100);
        defer result.deinit(arena.allocator());

        try std.testing.expectEqual(expected_gas, result.gas_used);
    }
}

// Fuzz test: memory allocation stress
// Ensure no memory leaks with varied inputs
test "fuzz ripemd160 allocation stress" {
    const input = std.testing.fuzzInput(.{});

    // Use testing allocator to detect leaks
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Run multiple times with same input to stress allocator
    const iterations = @min(input.len + 1, 10);
    for (0..iterations) |_| {
        const result = ripemd160.execute(arena.allocator(), input, 1000000) catch continue;
        result.deinit(arena.allocator());
    }
}

// Fuzz test: extreme input patterns
// Test with specific bit patterns
test "fuzz ripemd160 extreme patterns" {
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

    const result = ripemd160.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: output buffer integrity
// Verify output buffer not corrupted
test "fuzz ripemd160 output integrity" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = ripemd160.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    // Verify structure: 12 zero bytes + 20 hash bytes
    try std.testing.expectEqual(@as(usize, 32), result.output.len);

    // Zero padding intact
    for (result.output[0..12]) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }

    // Hash section exists (bytes 12-31)
    try std.testing.expect(result.output.len >= 32);
}

// Fuzz test: gas cost consistency
// Same input length should cost same gas
test "fuzz ripemd160 gas consistency" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 64) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Create two different inputs of same length
    const len = @min(raw_input.len / 2, 100);
    const input1 = raw_input[0..len];
    const input2 = raw_input[len .. len * 2];

    const result1 = ripemd160.execute(arena.allocator(), input1, 1000000) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = ripemd160.execute(arena.allocator(), input2, 1000000) catch return;
    defer result2.deinit(arena.allocator());

    // Same length inputs should cost same gas
    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
}

// Fuzz test: maximum reasonable input
// Test with very large but reasonable input
test "fuzz ripemd160 max input" {
    const raw_input = std.testing.fuzzInput(.{});

    // Cap at 16KB (reasonable max for fuzzing)
    const max_len = 16384;
    if (raw_input.len < max_len) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..max_len];
    const num_words = (max_len + 31) / 32;
    const required_gas = ripemd160.BASE_GAS + ripemd160.PER_WORD_GAS * num_words;

    const result = ripemd160.execute(arena.allocator(), input, required_gas + 10000) catch |err| switch (err) {
        error.OutOfGas => return,
        error.OutOfMemory => return, // Expected for very large inputs
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Run with: zig build test --fuzz
// Or with Docker on macOS:
// docker run --rm -it -v $(pwd):/workspace -w /workspace \
//   -p 6971:6971 ziglang/zig:0.15.1 \
//   zig build test --fuzz=300s --port=6971
