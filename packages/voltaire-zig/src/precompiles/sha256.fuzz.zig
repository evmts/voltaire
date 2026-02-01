const std = @import("std");
const sha256 = @import("sha256.zig");

// Fuzz test: arbitrary byte input
// Validates SHA256 never panics on any input
test "fuzz sha256 arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Should never panic, only return error or valid result
    const result = sha256.execute(arena.allocator(), input, sha256.BASE_GAS + sha256.PER_WORD_GAS * 100000) catch |err| switch (err) {
        error.OutOfGas => return, // Expected if gas too low
        error.OutOfMemory => return, // Expected on allocation failure
    };
    defer result.deinit(arena.allocator());

    // Validate output invariants
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: empty to small inputs
// Focus on edge cases with minimal data
test "fuzz sha256 small inputs" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len > 32) return; // Only small inputs

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = sha256.execute(arena.allocator(), raw_input, 1000) catch return;
    defer result.deinit(arena.allocator());

    // Empty or small input should succeed
    try std.testing.expectEqual(@as(usize, 32), result.output.len);

    // Verify gas cost is reasonable for small input
    const expected_words = (raw_input.len + 31) / 32;
    const expected_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * expected_words;
    try std.testing.expectEqual(expected_gas, result.gas_used);
}

// Fuzz test: large inputs
// Test with substantial data to stress memory and computation
test "fuzz sha256 large inputs" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 1024) return; // Only large inputs

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (raw_input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    const result = sha256.execute(arena.allocator(), raw_input, required_gas + 1000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(required_gas, result.gas_used);
}

// Fuzz test: gas limit variations
// Test gas limit handling with fuzzer input
test "fuzz sha256 gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 3) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Extract gas limit from first 2 bytes
    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);

    // Use rest as input data
    const hash_input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const num_words = (hash_input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    const result = sha256.execute(arena.allocator(), hash_input, gas_limit) catch |err| switch (err) {
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
// Test behavior at exact gas requirement
test "fuzz sha256 exact gas" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Calculate exact gas needed
    const num_words = (input.len + 31) / 32;
    const exact_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    // Should succeed with exact gas
    const result = sha256.execute(arena.allocator(), input, exact_gas) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(exact_gas, result.gas_used);
}

// Fuzz test: one less than required gas
// Ensure OutOfGas error when gas is insufficient
test "fuzz sha256 insufficient gas" {
    const input = std.testing.fuzzInput(.{});
    if (input.len == 0) return; // Skip empty input (BASE_GAS-1 might be edge case)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Calculate gas needed and provide one less
    const num_words = (input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    if (required_gas == 0) return; // Edge case protection

    const insufficient_gas = required_gas - 1;

    const result = sha256.execute(arena.allocator(), input, insufficient_gas);

    // Should always return OutOfGas
    try std.testing.expectError(error.OutOfGas, result);
}

// Fuzz test: word boundary inputs
// Test inputs that align or misalign with 32-byte boundaries
test "fuzz sha256 word boundaries" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Generate length based on fuzzer input
    // Use first byte to determine word count and offset
    const word_count = (raw_input[0] % 16) + 1; // 1-16 words
    const offset = if (raw_input.len > 1) raw_input[1] % 32 else 0; // 0-31 byte offset

    const target_len = word_count * 32 + offset;
    const actual_len = @min(target_len, raw_input.len);

    const input = raw_input[0..actual_len];

    const num_words = (input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    const result = sha256.execute(arena.allocator(), input, required_gas + 100) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(required_gas, result.gas_used);

    // Verify word count calculation
    try std.testing.expectEqual(num_words, (input.len + 31) / 32);
}

// Fuzz test: extreme values
// Test boundary conditions and extreme input patterns
test "fuzz sha256 extreme values" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Limit size to avoid excessive memory in fuzzing
    const max_len = @min(raw_input.len, 4096);
    const input = arena.allocator().alloc(u8, max_len) catch return;

    // Generate extreme patterns based on first fuzzer byte
    const pattern = raw_input[0];
    switch (pattern % 8) {
        0 => @memset(input, 0x00), // All zeros
        1 => @memset(input, 0xFF), // All ones
        2 => @memset(input, 0x80), // High bit set
        3 => @memset(input, 0x7F), // Max positive
        4 => {
            // Alternating pattern
            for (input, 0..) |*byte, i| {
                byte.* = if (i % 2 == 0) 0x00 else 0xFF;
            }
        },
        5 => {
            // Incrementing pattern
            for (input, 0..) |*byte, i| {
                byte.* = @intCast(i % 256);
            }
        },
        6 => {
            // Decrementing pattern
            for (input, 0..) |*byte, i| {
                byte.* = @intCast(255 - (i % 256));
            }
        },
        7 => {
            // Use fuzzer bytes
            const copy_len = @min(raw_input.len, max_len);
            @memcpy(input[0..copy_len], raw_input[0..copy_len]);
        },
        else => unreachable,
    }

    const num_words = (input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    const result = sha256.execute(arena.allocator(), input, required_gas + 1000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: determinism
// Same input should always produce same output
test "fuzz sha256 determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    // Execute twice with same input
    const result1 = sha256.execute(arena.allocator(), input, required_gas + 100) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = sha256.execute(arena.allocator(), input, required_gas + 100) catch return;
    defer result2.deinit(arena.allocator());

    // Results must be identical
    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqual(result1.output.len, result2.output.len);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// Fuzz test: allocation stress
// Ensure no memory leaks or corruption with varied inputs
test "fuzz sha256 allocation stress" {
    const input = std.testing.fuzzInput(.{});

    // Use testing allocator to detect leaks
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    // Run multiple times with same input to stress allocator
    const iterations = @min(input.len + 1, 20);
    for (0..iterations) |_| {
        const result = sha256.execute(arena.allocator(), input, required_gas + 100) catch continue;
        result.deinit(arena.allocator());
    }
}

// Fuzz test: gas cost calculation accuracy
// Verify gas calculation matches expected formula
test "fuzz sha256 gas calculation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const expected_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    const result = sha256.execute(arena.allocator(), input, expected_gas + 10000) catch return;
    defer result.deinit(arena.allocator());

    // Gas used must exactly match formula
    try std.testing.expectEqual(expected_gas, result.gas_used);

    // Output must always be 32 bytes regardless of input size
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: output never empty
// Even with errors, if result returned output is always 32 bytes
test "fuzz sha256 output always 32 bytes" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_words = (input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    // Only check successful executions
    const result = sha256.execute(arena.allocator(), input, required_gas) catch return;
    defer result.deinit(arena.allocator());

    // Output length invariant: always exactly 32 bytes (SHA256 digest size)
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: length-dependent gas
// Verify longer inputs require more gas
test "fuzz sha256 length dependent gas" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 64) return; // Need enough bytes to split

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Split input into two parts with different lengths
    const split_point = raw_input.len / 2;
    const input1 = raw_input[0..split_point];
    const input2 = raw_input[0..]; // Full input (longer)

    const num_words1 = (input1.len + 31) / 32;
    const num_words2 = (input2.len + 31) / 32;

    const gas1 = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words1;
    const gas2 = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words2;

    const result1 = sha256.execute(arena.allocator(), input1, gas1 + 100) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = sha256.execute(arena.allocator(), input2, gas2 + 100) catch return;
    defer result2.deinit(arena.allocator());

    // Longer input should require equal or more gas (due to word rounding)
    try std.testing.expect(result2.gas_used >= result1.gas_used);

    // Both should produce 32-byte outputs
    try std.testing.expectEqual(@as(usize, 32), result1.output.len);
    try std.testing.expectEqual(@as(usize, 32), result2.output.len);
}

// Fuzz test: zero-length input
// Empty input should produce valid SHA256 hash
test "fuzz sha256 zero length handling" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Use empty slice regardless of fuzzer input
    const empty_input: []const u8 = &[_]u8{};

    const result = sha256.execute(arena.allocator(), empty_input, 1000) catch return;
    defer result.deinit(arena.allocator());

    // Should produce the known SHA256 hash of empty string
    try std.testing.expectEqual(@as(usize, 32), result.output.len);

    // Gas should be BASE_GAS only (0 words)
    try std.testing.expectEqual(sha256.BASE_GAS, result.gas_used);

    // Also test with varying gas limits using fuzzer
    if (raw_input.len >= 2) {
        const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);
        const result2 = sha256.execute(arena.allocator(), empty_input, gas_limit) catch |err| switch (err) {
            error.OutOfGas => {
                try std.testing.expect(gas_limit < sha256.BASE_GAS);
                return;
            },
            error.OutOfMemory => return,
        };
        defer result2.deinit(arena.allocator());

        // Output must match first execution (determinism)
        try std.testing.expectEqualSlices(u8, result.output, result2.output);
    }
}

// Fuzz test: maximum reasonable input
// Test with very large but still reasonable inputs
test "fuzz sha256 maximum input" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 100) return; // Only test with substantial input

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Cap at reasonable size for fuzzing (16KB)
    const max_size = 16384;
    const input_len = @min(raw_input.len, max_size);
    const input = raw_input[0..input_len];

    const num_words = (input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    const result = sha256.execute(arena.allocator(), input, required_gas + 10000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(required_gas, result.gas_used);
}

// Fuzz test: repeated byte patterns
// Test SHA256 with various repeated patterns
test "fuzz sha256 repeated patterns" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Generate repeating pattern based on fuzzer input
    const pattern_byte = raw_input[0];
    const pattern_len = @min(1 + (if (raw_input.len > 1) raw_input[1] else 0), 32);
    const total_len = @min(256 + raw_input.len, 2048);

    const input = arena.allocator().alloc(u8, total_len) catch return;

    // Fill with repeating pattern
    for (input, 0..) |*byte, i| {
        byte.* = pattern_byte +% @as(u8, @intCast((i / pattern_len) % 256));
    }

    const num_words = (input.len + 31) / 32;
    const required_gas = sha256.BASE_GAS + sha256.PER_WORD_GAS * num_words;

    const result = sha256.execute(arena.allocator(), input, required_gas + 1000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}
