const std = @import("std");
const ecrecover = @import("ecrecover.zig");

// Fuzz test: arbitrary byte input
// Validates ecrecover never panics on any input
test "fuzz ecrecover arbitrary input" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Should never panic, only return error or valid result
    const result = ecrecover.execute(arena.allocator(), input, ecrecover.GAS * 2) catch |err| switch (err) {
        error.OutOfGas => return, // Expected if gas too low
        error.OutOfMemory => return, // Expected on allocation failure
    };
    defer result.deinit(arena.allocator());

    // Validate output invariants
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(ecrecover.GAS, result.gas_used);
}

// Fuzz test: structured signature input
// Tests with minimum required structure (128+ bytes)
test "fuzz ecrecover structured signature" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 128) return; // Need full signature data

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Use first 128 bytes as structured input
    const input = raw_input[0..128];

    const result = ecrecover.execute(arena.allocator(), input, ecrecover.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    // Valid execution always returns 32-byte output
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(ecrecover.GAS, result.gas_used);
}

// Fuzz test: v value variations
// Focus on v byte (byte 63 of input)
test "fuzz ecrecover v values" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = [_]u8{0} ** 128;

    // Set v to fuzzer byte
    const v_byte = raw_input[0];
    input[63] = v_byte;

    // Fill rest with fuzzer data if available
    const copy_len = @min(raw_input.len, 128);
    if (copy_len > 1) {
        @memcpy(input[0 .. copy_len - 1], raw_input[1..copy_len]);
    }

    const result = ecrecover.execute(arena.allocator(), &input, ecrecover.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: r value edge cases
// Focus on r bytes (64-95)
test "fuzz ecrecover r values" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 32) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = [_]u8{0} ** 128;

    // Set r to fuzzer bytes
    @memcpy(input[64..96], raw_input[0..32]);

    // Valid v value
    input[63] = 27;

    const result = ecrecover.execute(arena.allocator(), &input, ecrecover.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    // Should return zero address for invalid r
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: s value edge cases
// Focus on s bytes (96-127) with EIP-2 protection
test "fuzz ecrecover s values" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 32) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = [_]u8{0} ** 128;

    // Set s to fuzzer bytes
    @memcpy(input[96..128], raw_input[0..32]);

    // Valid v value
    input[63] = 27;

    const result = ecrecover.execute(arena.allocator(), &input, ecrecover.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    // Should handle all s values gracefully (EIP-2 rejects high s)
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: hash variations
// Focus on hash bytes (0-31)
test "fuzz ecrecover hash values" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 32) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = [_]u8{0} ** 128;

    // Set hash to fuzzer bytes
    @memcpy(input[0..32], raw_input[0..32]);

    // Valid v value
    input[63] = 27;

    const result = ecrecover.execute(arena.allocator(), &input, ecrecover.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: input length variations
// Test padding/truncation behavior
test "fuzz ecrecover input lengths" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // All input lengths should work (padded or truncated to 128)
    const result = ecrecover.execute(arena.allocator(), input, ecrecover.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(ecrecover.GAS, result.gas_used);
}

// Fuzz test: gas limit variations
// Test gas limit handling with fuzzer input
test "fuzz ecrecover gas limits" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 2) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Extract gas limit from first 2 bytes
    const gas_limit = std.mem.readInt(u16, raw_input[0..2], .little);

    // Use rest as signature data
    const sig_input = if (raw_input.len > 2) raw_input[2..] else &[_]u8{};

    const result = ecrecover.execute(arena.allocator(), sig_input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            // Should only error if gas_limit < GAS
            try std.testing.expect(gas_limit < ecrecover.GAS);
            return;
        },
        error.OutOfMemory => return,
    };
    defer result.deinit(arena.allocator());

    // Successful execution requires sufficient gas
    try std.testing.expect(gas_limit >= ecrecover.GAS);
    try std.testing.expectEqual(ecrecover.GAS, result.gas_used);
}

// Fuzz test: complete signature fuzzing
// Test all signature components together
test "fuzz ecrecover complete signature" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 97) return; // Need hash(32) + v(1) + r(32) + s(32)

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = [_]u8{0} ** 128;

    // Extract structured components from fuzzer input
    @memcpy(input[0..32], raw_input[0..32]); // hash
    input[63] = raw_input[32]; // v (single byte from fuzzer)
    @memcpy(input[64..96], raw_input[33..65]); // r
    @memcpy(input[96..128], raw_input[65..97]); // s

    const result = ecrecover.execute(arena.allocator(), &input, ecrecover.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    // Verify result properties
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(ecrecover.GAS, result.gas_used);

    // Output is either valid address (non-zero) or zero address (invalid sig)
    // Both are valid responses - just ensure no panic
}

// Fuzz test: v padding variations
// Test different padding in v field (32 bytes total)
test "fuzz ecrecover v padding" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 32) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = [_]u8{0} ** 128;

    // Use fuzzer bytes for entire v field (32 bytes)
    // Only byte 63 (last byte) is used, but test various padding
    @memcpy(input[32..64], raw_input[0..32]);

    const result = ecrecover.execute(arena.allocator(), &input, ecrecover.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: extreme values
// Test boundary conditions and extreme values
test "fuzz ecrecover extreme values" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var input: [128]u8 = undefined;

    // Generate extreme patterns based on first fuzzer byte
    const pattern = raw_input[0];
    switch (pattern % 8) {
        0 => @memset(&input, 0x00), // All zeros
        1 => @memset(&input, 0xFF), // All ones
        2 => @memset(&input, 0x80), // High bit set
        3 => @memset(&input, 0x7F), // Max positive
        4 => {
            // Alternating pattern
            for (&input, 0..) |*byte, i| {
                byte.* = if (i % 2 == 0) 0x00 else 0xFF;
            }
        },
        5 => {
            // Incrementing pattern
            for (&input, 0..) |*byte, i| {
                byte.* = @intCast(i % 256);
            }
        },
        6 => {
            // Decrementing pattern
            for (&input, 0..) |*byte, i| {
                byte.* = @intCast(255 - (i % 256));
            }
        },
        7 => {
            // Use remaining fuzzer bytes if available
            const copy_len = @min(raw_input.len, 128);
            @memcpy(input[0..copy_len], raw_input[0..copy_len]);
            if (copy_len < 128) {
                @memset(input[copy_len..128], 0);
            }
        },
        else => unreachable,
    }

    const result = ecrecover.execute(arena.allocator(), &input, ecrecover.GAS * 2) catch return;
    defer result.deinit(arena.allocator());

    try std.testing.expectEqual(@as(usize, 32), result.output.len);
}

// Fuzz test: memory allocation stress
// Ensure no memory leaks or corruption with varied inputs
test "fuzz ecrecover allocation stress" {
    const input = std.testing.fuzzInput(.{});

    // Use testing allocator to detect leaks
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Run multiple times with same input to stress allocator
    const iterations = @min(input.len + 1, 10);
    for (0..iterations) |_| {
        const result = ecrecover.execute(arena.allocator(), input, ecrecover.GAS * 2) catch continue;
        result.deinit(arena.allocator());
    }
}

// Fuzz test: output consistency
// Same input should produce same output (determinism)
test "fuzz ecrecover determinism" {
    const input = std.testing.fuzzInput(.{});

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    // Execute twice with same input
    const result1 = ecrecover.execute(arena.allocator(), input, ecrecover.GAS * 2) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = ecrecover.execute(arena.allocator(), input, ecrecover.GAS * 2) catch return;
    defer result2.deinit(arena.allocator());

    // Results must be identical
    try std.testing.expectEqual(result1.gas_used, result2.gas_used);
    try std.testing.expectEqual(result1.output.len, result2.output.len);
    try std.testing.expectEqualSlices(u8, result1.output, result2.output);
}
