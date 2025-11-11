const std = @import("std");
const bn254_add = @import("bn254_add.zig");
const bn254_mul = @import("bn254_mul.zig");
const bn254_pairing = @import("bn254_pairing.zig");

// Comprehensive fuzz tests for BN254 precompiles
// Tests for:
// - bn254Add: G1 point addition (0x06)
// - bn254Mul: Scalar multiplication (0x07)
// - bn254Pairing: Pairing check (0x08)
//
// Focus areas:
// - Invalid point encodings
// - Points not on curve
// - Invalid lengths
// - Gas limit handling
// - Edge cases (zero, infinity, field boundaries)
// - Output format validation
// - Determinism

// =============================================================================
// BN254 ADD (0x06) - G1 Point Addition
// =============================================================================

test "fuzz bn254Add arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Should never panic, only return error or valid result
    const result = bn254_add.execute(arena.allocator(), input, bn254_add.GAS * 2) catch |err| switch (err) {
        error.InvalidPoint => return, // Expected for invalid curve points
        error.OutOfGas => return, // Expected if gas too low
        error.OutOfMemory => return, // Expected on allocation failure
    };
    defer result.deinit(arena.allocator());

    // Validate output invariants
    try std.testing.expectEqual(@as(usize, 64), result.output.len);
    try std.testing.expectEqual(bn254_add.GAS, result.gas_used);
}

test "fuzz bn254Add structured points" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 128) return; // Need two G1 points (64 bytes each)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Use first 128 bytes as two G1 points
    const input = raw_input[0..128];

    const result = bn254_add.execute(arena.allocator(), input, bn254_add.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    // Valid execution always returns 64-byte point
    try std.testing.expectEqual(@as(usize, 64), result.output.len);
    try std.testing.expectEqual(bn254_add.GAS, result.gas_used);
}

test "fuzz bn254Add point at infinity" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 64) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = [_]u8{0} ** 128;

    // First point: infinity (0,0)
    // Second point: from fuzzer
    @memcpy(input[64..128], raw_input[0..64]);

    const result = bn254_add.execute(arena.allocator(), &input, bn254_add.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    // Adding infinity to any point should return that point (if valid)
    try std.testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz bn254Add gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 2) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Extract gas limit from first 2 bytes
    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);

    // Use rest as point data
    const point_input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const result = bn254_add.execute(arena.allocator(), point_input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            // Should only error if gas_limit < GAS
            try std.testing.expect(gas_limit < bn254_add.GAS);
            return;
        },
        error.InvalidPoint => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    // Successful execution requires sufficient gas
    try std.testing.expect(gas_limit >= bn254_add.GAS);
    try std.testing.expectEqual(bn254_add.GAS, result.gas_used);
}

test "fuzz bn254Add input length variations" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // All input lengths should work (padded or truncated to 128)
    const result = bn254_add.execute(arena.allocator(), input, bn254_add.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 64), result.output.len);
    try std.testing.expectEqual(bn254_add.GAS, result.gas_used);
}

test "fuzz bn254Add field boundary values" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = [_]u8{0} ** 128;

    // Generate boundary patterns based on first fuzzer byte
    const pattern = raw_input[0];
    switch (pattern % 5) {
        0 => {
            // All zeros (point at infinity)
            @memset(&input, 0x00);
        },
        1 => {
            // All ones (likely invalid)
            @memset(&input, 0xFF);
        },
        2 => {
            // Field modulus (invalid - at boundary)
            const field_mod_hex = "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47";
            var field_mod: [32]u8 = undefined;
            _ = std.fmt.hexToBytes(&field_mod, field_mod_hex) catch unreachable;
            @memcpy(input[0..32], &field_mod); // x1
            @memcpy(input[32..64], &field_mod); // y1
        },
        3 => {
            // Generator point (valid)
            input[31] = 1; // x = 1
            input[63] = 2; // y = 2
            // Second point from fuzzer if available
            if (raw_input.len >= 64) {
                @memcpy(input[64..128], raw_input[0..64]);
            }
        },
        4 => {
            // Use fuzzer data directly
            const copy_len = @min(raw_input.len, 128);
            @memcpy(input[0..copy_len], raw_input[0..copy_len]);
        },
        else => unreachable,
    }

    const result = bn254_add.execute(arena.allocator(), &input, bn254_add.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz bn254Add determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Execute twice with same input
    const result1 = bn254_add.execute(arena.allocator(), input, bn254_add.GAS * 2) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bn254_add.execute(arena.allocator(), input, bn254_add.GAS * 2) catch return;
    defer result2.deinit(arena.allocator());

    // Results must be identical (determinism)
    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// =============================================================================
// BN254 MUL (0x07) - Scalar Multiplication
// =============================================================================

test "fuzz bn254Mul arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bn254_mul.execute(arena.allocator(), input, bn254_mul.GAS * 2) catch |err| switch (err) {
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 64), result.output.len);
    try std.testing.expectEqual(bn254_mul.GAS, result.gas_used);
}

test "fuzz bn254Mul structured input" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 96) return; // Need point (64) + scalar (32)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..96];

    const result = bn254_mul.execute(arena.allocator(), input, bn254_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 64), result.output.len);
    try std.testing.expectEqual(bn254_mul.GAS, result.gas_used);
}

test "fuzz bn254Mul scalar variations" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 32) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [96]u8 = [_]u8{0} ** 96;

    // Generator point (1, 2)
    input[31] = 1; // x = 1
    input[63] = 2; // y = 2

    // Scalar from fuzzer
    @memcpy(input[64..96], raw_input[0..32]);

    const result = bn254_mul.execute(arena.allocator(), &input, bn254_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz bn254Mul zero scalar" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 64) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [96]u8 = [_]u8{0} ** 96;

    // Point from fuzzer
    @memcpy(input[0..64], raw_input[0..64]);

    // Scalar = 0 (last 32 bytes are zero)

    const result = bn254_mul.execute(arena.allocator(), &input, bn254_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    // Multiplying by zero should give point at infinity (0,0)
    try std.testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz bn254Mul large scalars" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 32) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [96]u8 = [_]u8{0} ** 96;

    // Generator point
    input[31] = 1;
    input[63] = 2;

    // Large scalar from fuzzer (all bits set)
    @memset(input[64..96], 0xFF);
    // Mix in some fuzzer bytes
    const copy_len = @min(raw_input.len, 32);
    @memcpy(input[64 .. 64 + copy_len], raw_input[0..copy_len]);

    const result = bn254_mul.execute(arena.allocator(), &input, bn254_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz bn254Mul gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 2) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);
    const point_input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const result = bn254_mul.execute(arena.allocator(), point_input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            try std.testing.expect(gas_limit < bn254_mul.GAS);
            return;
        },
        error.InvalidPoint => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expect(gas_limit >= bn254_mul.GAS);
    try std.testing.expectEqual(bn254_mul.GAS, result.gas_used);
}

test "fuzz bn254Mul input length variations" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bn254_mul.execute(arena.allocator(), input, bn254_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz bn254Mul field boundary points" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [96]u8 = [_]u8{0} ** 96;

    const pattern = raw_input[0];
    switch (pattern % 4) {
        0 => {
            // Point at infinity with random scalar
            @memset(input[0..64], 0);
            if (raw_input.len >= 32) {
                @memcpy(input[64..96], raw_input[0..32]);
            }
        },
        1 => {
            // Generator with scalar from fuzzer
            input[31] = 1;
            input[63] = 2;
            if (raw_input.len >= 32) {
                @memcpy(input[64..96], raw_input[0..32]);
            }
        },
        2 => {
            // Invalid point (field modulus)
            const field_mod_hex = "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47";
            var field_mod: [32]u8 = undefined;
            _ = std.fmt.hexToBytes(&field_mod, field_mod_hex) catch unreachable;
            @memcpy(input[0..32], &field_mod);
            @memcpy(input[32..64], &field_mod);
        },
        3 => {
            // Fuzzer data
            const copy_len = @min(raw_input.len, 96);
            @memcpy(input[0..copy_len], raw_input[0..copy_len]);
        },
        else => unreachable,
    }

    const result = bn254_mul.execute(arena.allocator(), &input, bn254_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz bn254Mul determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result1 = bn254_mul.execute(arena.allocator(), input, bn254_mul.GAS * 2) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bn254_mul.execute(arena.allocator(), input, bn254_mul.GAS * 2) catch return;
    defer result2.deinit(arena.allocator());

    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// =============================================================================
// BN254 PAIRING (0x08) - Pairing Check
// =============================================================================

test "fuzz bn254Pairing arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bn254_pairing.execute(arena.allocator(), input, 1000000) catch |err| switch (err) {
        error.InvalidInput => return, // Expected for non-192-byte multiple
        error.InvalidPairing => return, // Expected for invalid curve points
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    // Output is always 32 bytes (0 or 1)
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    // Last byte should be 0 or 1
    try std.testing.expect(result.output[31] == 0 or result.output[31] == 1);
}

test "fuzz bn254Pairing length validation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Input must be multiple of 192 bytes
    const result = bn254_pairing.execute(arena.allocator(), input, 1000000) catch |err| switch (err) {
        error.InvalidInput => {
            // Should error if not multiple of 192
            try std.testing.expect(input.len % 192 != 0);
            return;
        },
        error.InvalidPairing => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    // If successful, input must be multiple of 192
    try std.testing.expectEqual(@as(usize, 0), input.len % 192);
}

test "fuzz bn254Pairing single pair" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 192) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Use first 192 bytes as single pairing input
    const input = raw_input[0..192];

    const result = bn254_pairing.execute(arena.allocator(), input, 1000000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expect(result.output[31] == 0 or result.output[31] == 1);
}

test "fuzz bn254Pairing multiple pairs" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 384) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Calculate how many complete pairs we can make
    const num_pairs = @min(raw_input.len / 192, 4); // Cap at 4 pairs
    const input_len = num_pairs * 192;
    const input = raw_input[0..input_len];

    const result = bn254_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "fuzz bn254Pairing gas calculation" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Only process valid-length inputs
    const num_pairs = raw_input.len / 192;
    const input_len = num_pairs * 192;
    if (input_len == 0) {
        // Empty input is valid
        const result = bn254_pairing.execute(arena.allocator(), &[_]u8{}, 100000) catch return;
        defer result.deinit(arena.allocator());
        const expected_gas = bn254_pairing.BASE_GAS;
        try std.testing.expectEqual(expected_gas, result.gas_used);
        return;
    }

    if (input_len > raw_input.len) return;

    const input = raw_input[0..input_len];
    const expected_gas = bn254_pairing.BASE_GAS + bn254_pairing.PER_POINT_GAS * num_pairs;

    const result = bn254_pairing.execute(arena.allocator(), input, expected_gas + 10000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(expected_gas, result.gas_used);
}

test "fuzz bn254Pairing gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 4) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Extract gas limit from first 4 bytes
    const gas_limit = std.mem.readInt(u32, raw_input[0..4], .little);

    // Use remaining data for pairing input
    const pairing_data = if (raw_input.len > 4) raw_input[4..] else &[_]u8{};

    // Align to 192-byte boundary
    const num_pairs = pairing_data.len / 192;
    const input_len = num_pairs * 192;
    const input = if (input_len > 0) pairing_data[0..input_len] else &[_]u8{};

    const expected_gas = bn254_pairing.BASE_GAS + bn254_pairing.PER_POINT_GAS * num_pairs;

    const result = bn254_pairing.execute(arena.allocator(), input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            try std.testing.expect(gas_limit < expected_gas);
            return;
        },
        error.InvalidInput => return,
        error.InvalidPairing => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expect(gas_limit >= expected_gas);
    try std.testing.expectEqual(expected_gas, result.gas_used);
}

test "fuzz bn254Pairing empty input" {
    const input = std.testing.fuzzInput(.{});
    if (input.len != 0) return; // Only test truly empty input

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bn254_pairing.execute(arena.allocator(), input, 100000) catch return;
    defer result.deinit(arena.allocator());

    // Empty input should succeed and return 1 (valid pairing)
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(@as(u8, 1), result.output[31]);
    try std.testing.expectEqual(bn254_pairing.BASE_GAS, result.gas_used);
}

test "fuzz bn254Pairing invalid lengths" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Test various invalid lengths (not multiples of 192)
    const invalid_lengths = [_]usize{ 1, 64, 128, 191, 193, 256, 383, 385 };
    const len_idx = if (raw_input.len > 0) raw_input[0] % invalid_lengths.len else 0;
    const test_len = invalid_lengths[len_idx];

    if (raw_input.len < test_len) return;

    const input = raw_input[0..test_len];

    const result = bn254_pairing.execute(arena.allocator(), input, 1000000);
    try std.testing.expectError(error.InvalidInput, result);
}

test "fuzz bn254Pairing output format" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Align to 192-byte boundary
    const num_pairs = raw_input.len / 192;
    const input_len = num_pairs * 192;
    const input = raw_input[0..input_len];

    const result = bn254_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result.deinit(arena.allocator());

    // Output is always 32 bytes
    try std.testing.expectEqual(@as(usize, 32), result.output.len);

    // First 31 bytes should be zero
    for (result.output[0..31]) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }

    // Last byte is boolean (0 or 1)
    try std.testing.expect(result.output[31] == 0 or result.output[31] == 1);
}

test "fuzz bn254Pairing determinism" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Align to 192-byte boundary
    const num_pairs = raw_input.len / 192;
    const input_len = num_pairs * 192;
    const input = raw_input[0..input_len];

    const result1 = bn254_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bn254_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result2.deinit(arena.allocator());

    // Results must be identical
    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

test "fuzz bn254Pairing zero points" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Create input with all zeros
    const num_pairs = (raw_input[0] % 4) + 1; // 1-4 pairs
    const input_len = num_pairs * 192;

    const input = try arena.allocator().alloc(u8, input_len);
    @memset(input, 0);

    const result = bn254_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "fuzz bn254Pairing large pair count" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 1920) return; // Need at least 10 pairs

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Use up to 10 pairs
    const num_pairs = @min(raw_input.len / 192, 10);
    const input_len = num_pairs * 192;
    const input = raw_input[0..input_len];

    const expected_gas = bn254_pairing.BASE_GAS + bn254_pairing.PER_POINT_GAS * num_pairs;

    const result = bn254_pairing.execute(arena.allocator(), input, expected_gas + 100000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(expected_gas, result.gas_used);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "fuzz bn254Pairing gas scaling" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 576) return; // Need at least 3 pairs

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Test 1, 2, and 3 pairs to verify gas scaling
    const pair_counts = [_]usize{ 1, 2, 3 };
    for (pair_counts) |pairs| {
        const input_len = pairs * 192;
        const input = raw_input[0..input_len];
        const expected_gas = bn254_pairing.BASE_GAS + bn254_pairing.PER_POINT_GAS * pairs;

        const result = bn254_pairing.execute(arena.allocator(), input, expected_gas + 10000) catch continue;
        defer result.deinit(arena.allocator());

        try std.testing.expectEqual(expected_gas, result.gas_used);
    }
}

test "fuzz bn254Pairing memory stress" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Align to 192-byte boundary
    const num_pairs = raw_input.len / 192;
    const input_len = num_pairs * 192;
    const input = raw_input[0..input_len];

    // Run multiple times with same input to stress allocator
    const iterations = @min(3, num_pairs + 1);
    for (0..iterations) |_| {
        const result = bn254_pairing.execute(arena.allocator(), input, 10000000) catch continue;
        result.deinit(arena.allocator());
    }
}

// Run with: zig build test --fuzz
// Or with Docker on macOS:
// docker run --rm -it -v $(pwd):/workspace -w /workspace \
//   -p 6971:6971 ziglang/zig:0.15.1 \
//   zig build test --fuzz=300s --port=6971
