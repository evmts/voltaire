const std = @import("std");
const bls12_g1_add = @import("bls12_g1_add.zig");
const bls12_g1_mul = @import("bls12_g1_mul.zig");
const bls12_g2_add = @import("bls12_g2_add.zig");
const bls12_g2_mul = @import("bls12_g2_mul.zig");
const bls12_pairing = @import("bls12_pairing.zig");
const bls12_map_fp_to_g1 = @import("bls12_map_fp_to_g1.zig");
const bls12_map_fp2_to_g2 = @import("bls12_map_fp2_to_g2.zig");

// Comprehensive fuzz tests for BLS12-381 precompiles (EIP-2537)
// Tests for:
// - bls12_g1_add: G1 point addition (0x0B)
// - bls12_g1_mul: G1 scalar multiplication (0x0C)
// - bls12_g2_add: G2 point addition (0x0E)
// - bls12_g2_mul: G2 scalar multiplication (0x0F)
// - bls12_pairing: Pairing check (0x11)
// - bls12_map_fp_to_g1: Map field element to G1 (0x12)
// - bls12_map_fp2_to_g2: Map Fp2 element to G2 (0x13)
//
// Focus areas:
// - Invalid point encodings
// - Points not on curve
// - Invalid field elements (>= modulus)
// - Invalid lengths
// - Gas limit handling
// - Edge cases (zero, infinity, field boundaries)
// - Output format validation
// - Determinism

// =============================================================================
// BLS12_G1_ADD (0x0B) - G1 Point Addition
// =============================================================================

test "fuzz bls12_g1_add arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_g1_add.execute(arena.allocator(), input, bls12_g1_add.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => return, // Expected for wrong length
        error.InvalidPoint => return, // Expected for invalid curve points
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    // Output is always 128 bytes (G1 point: 64 bytes x + 64 bytes y)
    try std.testing.expectEqual(@as(usize, 128), result.output.len);
    try std.testing.expectEqual(bls12_g1_add.GAS, result.gas_used);
}

test "fuzz bls12_g1_add structured points" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 256) return; // Need two G1 points (128 bytes each)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..256];

    const result = bls12_g1_add.execute(arena.allocator(), input, bls12_g1_add.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
    try std.testing.expectEqual(bls12_g1_add.GAS, result.gas_used);
}

test "fuzz bls12_g1_add point at infinity" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 128) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [256]u8 = [_]u8{0} ** 256;

    // First point: infinity (0,0)
    // Second point: from fuzzer
    @memcpy(input[128..256], raw_input[0..128]);

    const result = bls12_g1_add.execute(arena.allocator(), &input, bls12_g1_add.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
}

test "fuzz bls12_g1_add gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 2) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);
    const point_input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const result = bls12_g1_add.execute(arena.allocator(), point_input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            try std.testing.expect(gas_limit < bls12_g1_add.GAS);
            return;
        },
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expect(gas_limit >= bls12_g1_add.GAS);
    try std.testing.expectEqual(bls12_g1_add.GAS, result.gas_used);
}

test "fuzz bls12_g1_add input length validation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_g1_add.execute(arena.allocator(), input, bls12_g1_add.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => {
            // Must error if length != 256
            try std.testing.expect(input.len != 256);
            return;
        },
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    // If successful, length must be 256
    try std.testing.expectEqual(@as(usize, 256), input.len);
}

test "fuzz bls12_g1_add field boundary values" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [256]u8 = [_]u8{0} ** 256;

    const pattern = raw_input[0];
    switch (pattern % 4) {
        0 => {
            // All zeros (point at infinity)
            @memset(&input, 0x00);
        },
        1 => {
            // All ones (likely invalid)
            @memset(&input, 0xFF);
        },
        2 => {
            // Field modulus boundary
            const field_mod = [_]u8{
                0x1a, 0x01, 0x11, 0xea, 0x39, 0x7f, 0xe6, 0x9a,
                0x4b, 0x1b, 0xa7, 0xb6, 0x43, 0x4b, 0xac, 0xd7,
                0x64, 0x77, 0x4b, 0x84, 0xf3, 0x85, 0x12, 0xbf,
                0x67, 0x30, 0xd2, 0xa0, 0xf6, 0xb0, 0xf6, 0x24,
                0x1e, 0xab, 0xff, 0xfe, 0xb1, 0x53, 0xff, 0xff,
                0xb9, 0xfe, 0xff, 0xff, 0xff, 0xff, 0xaa, 0xab,
            };
            @memcpy(input[16..64], &field_mod);
            @memcpy(input[80..128], &field_mod);
        },
        3 => {
            // Use fuzzer data
            const copy_len = @min(raw_input.len, 256);
            @memcpy(input[0..copy_len], raw_input[0..copy_len]);
        },
        else => unreachable,
    }

    const result = bls12_g1_add.execute(arena.allocator(), &input, bls12_g1_add.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
}

test "fuzz bls12_g1_add determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result1 = bls12_g1_add.execute(arena.allocator(), input, bls12_g1_add.GAS * 2) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bls12_g1_add.execute(arena.allocator(), input, bls12_g1_add.GAS * 2) catch return;
    defer result2.deinit(arena.allocator());

    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// =============================================================================
// BLS12_G1_MUL (0x0C) - G1 Scalar Multiplication
// =============================================================================

test "fuzz bls12_g1_mul arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_g1_mul.execute(arena.allocator(), input, bls12_g1_mul.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
    try std.testing.expectEqual(bls12_g1_mul.GAS, result.gas_used);
}

test "fuzz bls12_g1_mul structured input" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 160) return; // Need point (128) + scalar (32)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..160];

    const result = bls12_g1_mul.execute(arena.allocator(), input, bls12_g1_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
    try std.testing.expectEqual(bls12_g1_mul.GAS, result.gas_used);
}

test "fuzz bls12_g1_mul scalar variations" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 32) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [160]u8 = [_]u8{0} ** 160;

    // Point at infinity
    @memset(input[0..128], 0);

    // Scalar from fuzzer
    @memcpy(input[128..160], raw_input[0..32]);

    const result = bls12_g1_mul.execute(arena.allocator(), &input, bls12_g1_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
}

test "fuzz bls12_g1_mul zero scalar" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 128) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [160]u8 = [_]u8{0} ** 160;

    // Point from fuzzer
    @memcpy(input[0..128], raw_input[0..128]);

    // Scalar = 0

    const result = bls12_g1_mul.execute(arena.allocator(), &input, bls12_g1_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
}

test "fuzz bls12_g1_mul large scalars" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 32) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [160]u8 = [_]u8{0} ** 160;

    // Point at infinity
    @memset(input[0..128], 0);

    // Large scalar (all 0xFF)
    @memset(input[128..160], 0xFF);
    const copy_len = @min(raw_input.len, 32);
    @memcpy(input[128 .. 128 + copy_len], raw_input[0..copy_len]);

    const result = bls12_g1_mul.execute(arena.allocator(), &input, bls12_g1_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
}

test "fuzz bls12_g1_mul gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 2) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);
    const point_input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const result = bls12_g1_mul.execute(arena.allocator(), point_input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            try std.testing.expect(gas_limit < bls12_g1_mul.GAS);
            return;
        },
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expect(gas_limit >= bls12_g1_mul.GAS);
    try std.testing.expectEqual(bls12_g1_mul.GAS, result.gas_used);
}

test "fuzz bls12_g1_mul input length validation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_g1_mul.execute(arena.allocator(), input, bls12_g1_mul.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => {
            try std.testing.expect(input.len != 160);
            return;
        },
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 160), input.len);
}

test "fuzz bls12_g1_mul determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result1 = bls12_g1_mul.execute(arena.allocator(), input, bls12_g1_mul.GAS * 2) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bls12_g1_mul.execute(arena.allocator(), input, bls12_g1_mul.GAS * 2) catch return;
    defer result2.deinit(arena.allocator());

    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// =============================================================================
// BLS12_G2_ADD (0x0E) - G2 Point Addition
// =============================================================================

test "fuzz bls12_g2_add arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_g2_add.execute(arena.allocator(), input, bls12_g2_add.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    // Output is 256 bytes (G2 point: 128 bytes x + 128 bytes y)
    try std.testing.expectEqual(@as(usize, 256), result.output.len);
    try std.testing.expectEqual(bls12_g2_add.GAS, result.gas_used);
}

test "fuzz bls12_g2_add structured points" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 512) return; // Two G2 points (256 bytes each)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..512];

    const result = bls12_g2_add.execute(arena.allocator(), input, bls12_g2_add.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 256), result.output.len);
}

test "fuzz bls12_g2_add input length validation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_g2_add.execute(arena.allocator(), input, bls12_g2_add.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => {
            try std.testing.expect(input.len != 512);
            return;
        },
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 512), input.len);
}

test "fuzz bls12_g2_add gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 2) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);
    const point_input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const result = bls12_g2_add.execute(arena.allocator(), point_input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            try std.testing.expect(gas_limit < bls12_g2_add.GAS);
            return;
        },
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expect(gas_limit >= bls12_g2_add.GAS);
}

test "fuzz bls12_g2_add determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result1 = bls12_g2_add.execute(arena.allocator(), input, bls12_g2_add.GAS * 2) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bls12_g2_add.execute(arena.allocator(), input, bls12_g2_add.GAS * 2) catch return;
    defer result2.deinit(arena.allocator());

    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// =============================================================================
// BLS12_G2_MUL (0x0F) - G2 Scalar Multiplication
// =============================================================================

test "fuzz bls12_g2_mul arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_g2_mul.execute(arena.allocator(), input, bls12_g2_mul.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 256), result.output.len);
    try std.testing.expectEqual(bls12_g2_mul.GAS, result.gas_used);
}

test "fuzz bls12_g2_mul structured input" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 288) return; // Point (256) + scalar (32)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..288];

    const result = bls12_g2_mul.execute(arena.allocator(), input, bls12_g2_mul.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 256), result.output.len);
}

test "fuzz bls12_g2_mul input length validation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_g2_mul.execute(arena.allocator(), input, bls12_g2_mul.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => {
            try std.testing.expect(input.len != 288);
            return;
        },
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 288), input.len);
}

test "fuzz bls12_g2_mul gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 4) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const gas_limit = std.mem.readInt(u32, raw_input[0..4], .little);
    const point_input = if (raw_input.len > 4) raw_input[4..] else &[_]u8{};

    const result = bls12_g2_mul.execute(arena.allocator(), point_input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            try std.testing.expect(gas_limit < bls12_g2_mul.GAS);
            return;
        },
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expect(gas_limit >= bls12_g2_mul.GAS);
}

test "fuzz bls12_g2_mul determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result1 = bls12_g2_mul.execute(arena.allocator(), input, bls12_g2_mul.GAS * 2) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bls12_g2_mul.execute(arena.allocator(), input, bls12_g2_mul.GAS * 2) catch return;
    defer result2.deinit(arena.allocator());

    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// =============================================================================
// BLS12_PAIRING (0x11) - Pairing Check
// =============================================================================

test "fuzz bls12_pairing arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_pairing.execute(arena.allocator(), input, 10000000) catch |err| switch (err) {
        error.InvalidInput => return,
        error.InvalidPairing => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    // Output is 32 bytes (boolean result)
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expect(result.output[31] == 0 or result.output[31] == 1);
}

test "fuzz bls12_pairing length validation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_pairing.execute(arena.allocator(), input, 10000000) catch |err| switch (err) {
        error.InvalidInput => {
            // Must error if not multiple of 384
            try std.testing.expect(input.len % 384 != 0);
            return;
        },
        error.InvalidPairing => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 0), input.len % 384);
}

test "fuzz bls12_pairing single pair" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 384) return; // G1 (128) + G2 (256)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..384];

    const result = bls12_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "fuzz bls12_pairing multiple pairs" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 768) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const num_pairs = @min(raw_input.len / 384, 4);
    const input_len = num_pairs * 384;
    const input = raw_input[0..input_len];

    const result = bls12_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

test "fuzz bls12_pairing gas calculation" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const k = raw_input.len / 384;
    const input_len = k * 384;
    const input = raw_input[0..input_len];

    const expected_gas = bls12_pairing.BASE_GAS + bls12_pairing.PER_PAIR_GAS * k;

    const result = bls12_pairing.execute(arena.allocator(), input, expected_gas + 100000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(expected_gas, result.gas_used);
}

test "fuzz bls12_pairing gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 4) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const gas_limit = std.mem.readInt(u32, raw_input[0..4], .little);
    const pairing_data = if (raw_input.len > 4) raw_input[4..] else &[_]u8{};

    const k = pairing_data.len / 384;
    const input_len = k * 384;
    const input = pairing_data[0..input_len];

    const expected_gas = bls12_pairing.BASE_GAS + bls12_pairing.PER_PAIR_GAS * k;

    const result = bls12_pairing.execute(arena.allocator(), input, gas_limit) catch |err| switch (err) {
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
}

test "fuzz bls12_pairing empty input" {
    const input = std.testing.fuzzInput(.{});
    if (input.len != 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_pairing.execute(arena.allocator(), input, 100000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(bls12_pairing.BASE_GAS, result.gas_used);
}

test "fuzz bls12_pairing output format" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const k = raw_input.len / 384;
    const input_len = k * 384;
    const input = raw_input[0..input_len];

    const result = bls12_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);

    // First 31 bytes should be zero
    for (result.output[0..31]) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }

    // Last byte is boolean
    try std.testing.expect(result.output[31] == 0 or result.output[31] == 1);
}

test "fuzz bls12_pairing determinism" {
    const raw_input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const k = raw_input.len / 384;
    const input_len = k * 384;
    const input = raw_input[0..input_len];

    const result1 = bls12_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bls12_pairing.execute(arena.allocator(), input, 10000000) catch return;
    defer result2.deinit(arena.allocator());

    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// =============================================================================
// BLS12_MAP_FP_TO_G1 (0x12) - Map Field Element to G1
// =============================================================================

test "fuzz bls12_map_fp_to_g1 arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_map_fp_to_g1.execute(arena.allocator(), input, bls12_map_fp_to_g1.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
    try std.testing.expectEqual(bls12_map_fp_to_g1.GAS, result.gas_used);
}

test "fuzz bls12_map_fp_to_g1 structured input" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 64) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..64];

    const result = bls12_map_fp_to_g1.execute(arena.allocator(), input, bls12_map_fp_to_g1.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
}

test "fuzz bls12_map_fp_to_g1 input length validation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_map_fp_to_g1.execute(arena.allocator(), input, bls12_map_fp_to_g1.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => {
            try std.testing.expect(input.len != 64);
            return;
        },
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 64), input.len);
}

test "fuzz bls12_map_fp_to_g1 field element boundaries" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [64]u8 = [_]u8{0} ** 64;

    const pattern = raw_input[0];
    switch (pattern % 4) {
        0 => {
            // Zero
            @memset(&input, 0);
        },
        1 => {
            // All ones (invalid - exceeds modulus)
            @memset(&input, 0xFF);
        },
        2 => {
            // Field modulus (invalid)
            const field_mod = [_]u8{
                0x1a, 0x01, 0x11, 0xea, 0x39, 0x7f, 0xe6, 0x9a,
                0x4b, 0x1b, 0xa7, 0xb6, 0x43, 0x4b, 0xac, 0xd7,
                0x64, 0x77, 0x4b, 0x84, 0xf3, 0x85, 0x12, 0xbf,
                0x67, 0x30, 0xd2, 0xa0, 0xf6, 0xb0, 0xf6, 0x24,
                0x1e, 0xab, 0xff, 0xfe, 0xb1, 0x53, 0xff, 0xff,
                0xb9, 0xfe, 0xff, 0xff, 0xff, 0xff, 0xaa, 0xaa,
            };
            @memcpy(input[16..64], &field_mod);
        },
        3 => {
            // Use fuzzer data
            const copy_len = @min(raw_input.len, 64);
            @memcpy(input[0..copy_len], raw_input[0..copy_len]);
        },
        else => unreachable,
    }

    const result = bls12_map_fp_to_g1.execute(arena.allocator(), &input, bls12_map_fp_to_g1.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), result.output.len);
}

test "fuzz bls12_map_fp_to_g1 gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 2) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);
    const field_input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const result = bls12_map_fp_to_g1.execute(arena.allocator(), field_input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            try std.testing.expect(gas_limit < bls12_map_fp_to_g1.GAS);
            return;
        },
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expect(gas_limit >= bls12_map_fp_to_g1.GAS);
}

test "fuzz bls12_map_fp_to_g1 determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result1 = bls12_map_fp_to_g1.execute(arena.allocator(), input, bls12_map_fp_to_g1.GAS * 2) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bls12_map_fp_to_g1.execute(arena.allocator(), input, bls12_map_fp_to_g1.GAS * 2) catch return;
    defer result2.deinit(arena.allocator());

    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// =============================================================================
// BLS12_MAP_FP2_TO_G2 (0x13) - Map Fp2 Element to G2
// =============================================================================

test "fuzz bls12_map_fp2_to_g2 arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_map_fp2_to_g2.execute(arena.allocator(), input, bls12_map_fp2_to_g2.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 256), result.output.len);
    try std.testing.expectEqual(bls12_map_fp2_to_g2.GAS, result.gas_used);
}

test "fuzz bls12_map_fp2_to_g2 structured input" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 128) return; // Fp2 element (64 + 64)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const input = raw_input[0..128];

    const result = bls12_map_fp2_to_g2.execute(arena.allocator(), input, bls12_map_fp2_to_g2.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 256), result.output.len);
}

test "fuzz bls12_map_fp2_to_g2 input length validation" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result = bls12_map_fp2_to_g2.execute(arena.allocator(), input, bls12_map_fp2_to_g2.GAS * 2) catch |err| switch (err) {
        error.InvalidInput => {
            try std.testing.expect(input.len != 128);
            return;
        },
        error.InvalidPoint => return,
        error.OutOfGas => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 128), input.len);
}

test "fuzz bls12_map_fp2_to_g2 fp2 element boundaries" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = [_]u8{0} ** 128;

    const pattern = raw_input[0];
    switch (pattern % 5) {
        0 => {
            // Zero Fp2 element
            @memset(&input, 0);
        },
        1 => {
            // All ones (invalid)
            @memset(&input, 0xFF);
        },
        2 => {
            // Field modulus in c0, zero in c1
            const field_mod = [_]u8{
                0x1a, 0x01, 0x11, 0xea, 0x39, 0x7f, 0xe6, 0x9a,
                0x4b, 0x1b, 0xa7, 0xb6, 0x43, 0x4b, 0xac, 0xd7,
                0x64, 0x77, 0x4b, 0x84, 0xf3, 0x85, 0x12, 0xbf,
                0x67, 0x30, 0xd2, 0xa0, 0xf6, 0xb0, 0xf6, 0x24,
                0x1e, 0xab, 0xff, 0xfe, 0xb1, 0x53, 0xff, 0xff,
                0xb9, 0xfe, 0xff, 0xff, 0xff, 0xff, 0xaa, 0xaa,
            };
            @memcpy(input[16..64], &field_mod);
        },
        3 => {
            // Field modulus in c1, zero in c0
            const field_mod = [_]u8{
                0x1a, 0x01, 0x11, 0xea, 0x39, 0x7f, 0xe6, 0x9a,
                0x4b, 0x1b, 0xa7, 0xb6, 0x43, 0x4b, 0xac, 0xd7,
                0x64, 0x77, 0x4b, 0x84, 0xf3, 0x85, 0x12, 0xbf,
                0x67, 0x30, 0xd2, 0xa0, 0xf6, 0xb0, 0xf6, 0x24,
                0x1e, 0xab, 0xff, 0xfe, 0xb1, 0x53, 0xff, 0xff,
                0xb9, 0xfe, 0xff, 0xff, 0xff, 0xff, 0xaa, 0xaa,
            };
            @memcpy(input[80..128], &field_mod);
        },
        4 => {
            // Use fuzzer data
            const copy_len = @min(raw_input.len, 128);
            @memcpy(input[0..copy_len], raw_input[0..copy_len]);
        },
        else => unreachable,
    }

    const result = bls12_map_fp2_to_g2.execute(arena.allocator(), &input, bls12_map_fp2_to_g2.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 256), result.output.len);
}

test "fuzz bls12_map_fp2_to_g2 gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 4) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const gas_limit = std.mem.readInt(u32, raw_input[0..4], .little);
    const field_input = if (raw_input.len > 4) raw_input[4..] else &[_]u8{};

    const result = bls12_map_fp2_to_g2.execute(arena.allocator(), field_input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            try std.testing.expect(gas_limit < bls12_map_fp2_to_g2.GAS);
            return;
        },
        error.InvalidInput => return,
        error.InvalidPoint => return,
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    try std.testing.expect(gas_limit >= bls12_map_fp2_to_g2.GAS);
}

test "fuzz bls12_map_fp2_to_g2 determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const result1 = bls12_map_fp2_to_g2.execute(arena.allocator(), input, bls12_map_fp2_to_g2.GAS * 2) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = bls12_map_fp2_to_g2.execute(arena.allocator(), input, bls12_map_fp2_to_g2.GAS * 2) catch return;
    defer result2.deinit(arena.allocator());

    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}

// Run with: zig build test --fuzz
// Or with Docker on macOS:
// docker run --rm -it -v $(pwd):/workspace -w /workspace \
//   -p 6971:6971 ziglang/zig:0.15.1 \
//   zig build test --fuzz=300s --port=6971
