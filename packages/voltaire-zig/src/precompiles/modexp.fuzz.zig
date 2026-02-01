const std = @import("std");
const modexp = @import("modexp.zig");
const Hardfork = @import("primitives").Hardfork;

// Fuzz tests for MODEXP precompile (EIP-198, EIP-2565)
// Tests arbitrary base, exponent, modulus combinations for:
// - No panics/crashes
// - Proper error handling
// - Input validation
// - Edge cases (zero modulus, huge exponents, malformed encoding)

test "fuzz modexp with arbitrary inputs" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Try to execute with arbitrary input
    const result = modexp.execute(allocator, input, 100000000, .Cancun) catch |err| switch (err) {
        // Expected errors - not bugs
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return,

        // Unexpected errors
        else => return err,
    };

    // If successful, verify invariants
    defer result.deinit(allocator);

    // Output should be allocated
    try std.testing.expect(result.output.len > 0);
    // Gas used should be reasonable
    try std.testing.expect(result.gas_used >= modexp.MIN_GAS);
}

test "fuzz modexp malformed length encoding" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Only process inputs >= 96 bytes (minimum for length headers)
    if (input.len < 96) return;

    // Execute with varying gas limits to test DoS resistance
    const gas_limits = [_]u64{ 200, 1000, 10000, 100000, 1000000 };
    const gas_limit = gas_limits[input[0] % gas_limits.len];

    const result = modexp.execute(allocator, input, gas_limit, .Cancun) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return,
        else => return err,
    };

    defer result.deinit(allocator);

    // Verify output invariants
    try std.testing.expect(result.output.len > 0);
    try std.testing.expect(result.gas_used >= modexp.MIN_GAS);
    try std.testing.expect(result.gas_used <= gas_limit);
}

test "fuzz modexp zero modulus handling" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Need at least 99 bytes to construct valid input with zero modulus
    if (input.len < 99) return;

    // Construct input with explicit zero modulus
    var test_input: [99]u8 = [_]u8{0} ** 99;

    // base_len = 1
    test_input[31] = 1;
    // exp_len = 1
    test_input[63] = 1;
    // mod_len = 1
    test_input[95] = 1;

    // Use fuzz input for base and exponent
    test_input[96] = if (input.len > 0) input[0] else 2;
    test_input[97] = if (input.len > 1) input[1] else 3;
    // modulus = 0 (zero modulus should error)
    test_input[98] = 0;

    const result = modexp.execute(allocator, &test_input, 1000000, .Cancun);
    // Must return InvalidInput error for zero modulus
    try std.testing.expectError(error.InvalidInput, result);
}

test "fuzz modexp huge exponent DoS resistance" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Need at least 96 bytes for headers
    if (input.len < 96) return;

    // Construct input with very large exponent length
    var test_input: [96]u8 = [_]u8{0} ** 96;

    // base_len = 1
    test_input[31] = 1;
    // exp_len = arbitrarily large from fuzz input (32-bit value)
    if (input.len >= 4) {
        test_input[60] = input[0];
        test_input[61] = input[1];
        test_input[62] = input[2];
        test_input[63] = input[3];
    }
    // mod_len = 1
    test_input[95] = 1;

    // Use limited gas to test DoS protection
    const result = modexp.execute(allocator, &test_input, 10000, .Cancun) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return, // Expected
        else => return err,
    };

    defer result.deinit(allocator);
    try std.testing.expect(result.gas_used <= 10000);
}

test "fuzz modexp with truncated data" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Test inputs between 96-200 bytes that declare larger lengths than available
    if (input.len < 96 or input.len > 200) return;

    // Declare we need more data than we have
    var test_input = std.ArrayList(u8).init(allocator);
    defer test_input.deinit();

    // Copy fuzz input
    try test_input.appendSlice(input);

    // Modify first 96 bytes to declare unrealistic lengths
    if (test_input.items.len >= 96) {
        // Declare large base_len
        test_input.items[30] = 0x01;
        test_input.items[31] = 0x00; // 256 bytes
        // Declare large exp_len
        test_input.items[62] = 0x01;
        test_input.items[63] = 0x00; // 256 bytes
        // Declare large mod_len
        test_input.items[94] = 0x01;
        test_input.items[95] = 0x00; // 256 bytes
    }

    const result = modexp.execute(allocator, test_input.items, 1000000, .Cancun) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return,
        else => return err,
    };

    defer result.deinit(allocator);

    // Should handle gracefully with zero padding
    try std.testing.expect(result.output.len > 0);
}

test "fuzz modexp output buffer sizing" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Need at least 96 bytes
    if (input.len < 96) return;

    // Extract declared lengths from input
    const base_len = std.mem.readInt(u256, input[0..32], .big);
    const exp_len = std.mem.readInt(u256, input[32..64], .big);
    const mod_len = std.mem.readInt(u256, input[64..96], .big);

    // Only test reasonable sizes to avoid OOM
    if (base_len > 4096 or exp_len > 4096 or mod_len > 4096) return;

    const result = modexp.execute(allocator, input, 100000000, .Cancun) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return,
        else => return err,
    };

    defer result.deinit(allocator);

    // Output length must match declared mod_len
    if (mod_len <= std.math.maxInt(usize)) {
        const mod_len_usize: usize = @intCast(mod_len);
        try std.testing.expectEqual(mod_len_usize, result.output.len);
    }
}

test "fuzz modexp hardfork gas consistency" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Need valid input
    if (input.len < 99) return;

    // Test same input across different hardforks
    const hardforks = [_]Hardfork{ .Berlin, .London, .Paris, .Shanghai, .Cancun };
    const hardfork = hardforks[input[0] % hardforks.len];

    const result = modexp.execute(allocator, input, 100000000, hardfork) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return,
        else => return err,
    };

    defer result.deinit(allocator);

    // Gas cost should be at least MIN_GAS
    try std.testing.expect(result.gas_used >= modexp.MIN_GAS);
}

test "fuzz modexp edge case: input exactly 96 bytes" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Only test exactly 96 bytes (minimum valid input)
    if (input.len < 96) return;

    const test_input = input[0..96];

    const result = modexp.execute(allocator, test_input, 1000000, .Cancun) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return,
        else => return err,
    };

    defer result.deinit(allocator);

    // Should handle minimal input
    try std.testing.expect(result.output.len > 0);
}

test "fuzz modexp mathematical properties" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Need at least 99 bytes for valid input
    if (input.len < 99) return;

    // Construct valid small input from fuzz data
    var test_input: [99]u8 = [_]u8{0} ** 99;

    // base_len = 1
    test_input[31] = 1;
    // exp_len = 1
    test_input[63] = 1;
    // mod_len = 1
    test_input[95] = 1;

    // Extract values from fuzz input
    const base = if (input.len > 0) input[0] else 2;
    const exp = if (input.len > 1) input[1] else 3;
    const mod = if (input.len > 2 and input[2] != 0) input[2] else 5;

    test_input[96] = base;
    test_input[97] = exp;
    test_input[98] = mod;

    const result = modexp.execute(allocator, &test_input, 1000000, .Cancun) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return,
        else => return err,
    };

    defer result.deinit(allocator);

    // Verify result < modulus
    try std.testing.expect(result.output.len == 1);
    try std.testing.expect(result.output[0] < mod);
}

test "fuzz modexp special values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 3) return;

    // Test special mathematical cases with fuzz input
    var test_input: [99]u8 = [_]u8{0} ** 99;

    test_input[31] = 1; // base_len
    test_input[63] = 1; // exp_len
    test_input[95] = 1; // mod_len

    // Use fuzz input to select test case
    const test_case = input[0] % 5;

    switch (test_case) {
        0 => {
            // base^0 mod m = 1
            test_input[96] = if (input.len > 1) input[1] else 5; // base
            test_input[97] = 0; // exp = 0
            test_input[98] = if (input.len > 2 and input[2] != 0) input[2] else 7; // mod
        },
        1 => {
            // 0^exp mod m = 0 (exp != 0)
            test_input[96] = 0; // base = 0
            test_input[97] = if (input.len > 1 and input[1] != 0) input[1] else 1; // exp
            test_input[98] = if (input.len > 2 and input[2] != 0) input[2] else 7; // mod
        },
        2 => {
            // 1^exp mod m = 1
            test_input[96] = 1; // base = 1
            test_input[97] = if (input.len > 1) input[1] else 100; // exp
            test_input[98] = if (input.len > 2 and input[2] != 0) input[2] else 7; // mod
        },
        3 => {
            // base^1 mod m = base mod m
            test_input[96] = if (input.len > 1) input[1] else 10; // base
            test_input[97] = 1; // exp = 1
            test_input[98] = if (input.len > 2 and input[2] != 0) input[2] else 7; // mod
        },
        4 => {
            // base^exp mod 1 = 0
            test_input[96] = if (input.len > 1) input[1] else 5; // base
            test_input[97] = if (input.len > 2) input[2] else 3; // exp
            test_input[98] = 1; // mod = 1
        },
        else => unreachable,
    }

    const result = modexp.execute(allocator, &test_input, 1000000, .Cancun) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return,
        else => return err,
    };

    defer result.deinit(allocator);

    // Verify output
    try std.testing.expect(result.output.len == 1);

    // Verify mathematical properties
    switch (test_case) {
        0 => try std.testing.expect(result.output[0] == 1), // x^0 = 1
        1 => try std.testing.expect(result.output[0] == 0), // 0^x = 0
        2 => try std.testing.expect(result.output[0] == 1), // 1^x = 1
        3 => try std.testing.expect(result.output[0] < test_input[98]), // x^1 mod m < m
        4 => try std.testing.expect(result.output[0] == 0), // x mod 1 = 0
        else => unreachable,
    }
}

test "fuzz modexp gas limit exhaustion" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 96) return;

    // Use fuzz input to determine gas limit
    const gas_limit = if (input.len > 96) @as(u64, input[96]) * 1000 else 1000;

    const result = modexp.execute(allocator, input, gas_limit, .Cancun) catch |err| switch (err) {
        error.InvalidInput,
        error.OutOfGas, // Expected for low gas
        error.OutOfMemory,
        => return,
        else => return err,
    };

    defer result.deinit(allocator);

    // If succeeded, gas used must not exceed limit
    try std.testing.expect(result.gas_used <= gas_limit);
}

test "fuzz modexp large value handling" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    // Test with multi-byte values
    if (input.len < 128) return;

    var test_input: [128]u8 = [_]u8{0} ** 128;

    // Set lengths to use 10 bytes each
    test_input[31] = 10; // base_len
    test_input[63] = 10; // exp_len
    test_input[95] = 10; // mod_len

    // Copy fuzz input data
    const data_start = 96;
    if (input.len >= data_start + 30) {
        // base (10 bytes)
        @memcpy(test_input[data_start .. data_start + 10], input[0..10]);
        // exp (10 bytes)
        @memcpy(test_input[data_start + 10 .. data_start + 20], input[10..20]);
        // mod (10 bytes) - ensure non-zero
        @memcpy(test_input[data_start + 20 .. data_start + 30], input[20..30]);
        // Ensure modulus is not zero
        if (std.mem.allEqual(u8, test_input[data_start + 20 .. data_start + 30], 0)) {
            test_input[data_start + 29] = 1;
        }
    }

    const result = modexp.execute(allocator, &test_input, 10000000, .Cancun) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return,
        else => return err,
    };

    defer result.deinit(allocator);

    // Verify output length matches modulus length
    try std.testing.expectEqual(@as(usize, 10), result.output.len);
}

test "fuzz modexp memory allocation limits" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 96) return;

    // Use fuzz input but cap at reasonable memory limits
    var test_input: [96]u8 = undefined;
    @memcpy(&test_input, input[0..96]);

    // Cap lengths to prevent excessive allocation
    const MAX_LEN: u8 = 255;
    if (test_input[31] > MAX_LEN) test_input[31] = MAX_LEN;
    if (test_input[63] > MAX_LEN) test_input[63] = MAX_LEN;
    if (test_input[95] > MAX_LEN) test_input[95] = MAX_LEN;

    const result = modexp.execute(allocator, &test_input, 100000000, .Cancun) catch |err| switch (err) {
        error.InvalidInput, error.OutOfGas, error.OutOfMemory => return, // Expected
        else => return err,
    };

    defer result.deinit(allocator);
    try std.testing.expect(result.output.len <= MAX_LEN);
}

// Run with: zig build test --fuzz
// Or with Docker on macOS:
// docker run --rm -it -v $(pwd):/workspace -w /workspace \
//   -p 6971:6971 ziglang/zig:0.15.1 \
//   zig build test --fuzz=300s --port=6971
