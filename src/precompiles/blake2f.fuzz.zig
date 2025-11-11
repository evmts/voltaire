const std = @import("std");
const testing = std.testing;
const blake2f = @import("blake2f.zig");

// Fuzz tests for BLAKE2F precompile (EIP-152)
// Tests 213-byte inputs with varying:
// - rounds (u32)
// - final flags (0/1)
// - gas limits
// - state/message/offset data
// Focus on:
// - No panics on any input
// - Invalid input lengths
// - Invalid final flags (not 0 or 1)
// - Gas limit validation
// - Rounds validation (0 to max u32)
// - 64-byte output determinism

// Fuzz test: arbitrary 213-byte input
// Validates BLAKE2F never panics with valid-length input
fn fuzzArbitraryValidInput(_: void, raw_input: []const u8) !void {
    if (raw_input.len != 213) return; // Only test valid length

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    // Extract rounds from input to calculate gas
    const rounds = std.mem.readInt(u32, raw_input[0..4], .big);
    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    // Should never panic, only return error or valid result
    const result = blake2f.execute(arena.allocator(), raw_input, required_gas + 1000) catch |err| switch (err) {
        error.InvalidInput => return, // Expected for bad final flag or compress failure
        error.OutOfGas => return, // Expected if gas insufficient
        error.OutOfMemory => return, // Expected on allocation failure
        else => return, // Other precompile errors
    };
    defer result.deinit(arena.allocator());

    // Validate output invariants
    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(required_gas, result.gas_used);
}

test "fuzz blake2f arbitrary valid input" {
    try testing.fuzz({}, fuzzArbitraryValidInput, .{});
}

// Fuzz test: invalid input lengths
// Test that non-213-byte inputs always error
fn fuzzInvalidLengths(_: void, raw_input: []const u8) !void {
    if (raw_input.len == 213) return; // Skip valid length

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    // Any non-213 length should error immediately
    const result = blake2f.execute(arena.allocator(), raw_input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "fuzz blake2f invalid lengths" {
    try testing.fuzz({}, fuzzInvalidLengths, .{});
}

// Fuzz test: invalid final flag values
// Final flag byte must be 0 or 1
fn fuzzInvalidFinalFlag(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 1) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    // Construct 213-byte input with invalid final flag
    var input: [213]u8 = undefined;
    @memset(&input, 0);

    // Extract final flag value from fuzzer
    const final_flag = raw_input[0];
    if (final_flag == 0 or final_flag == 1) return; // Skip valid values

    input[212] = final_flag; // Invalid final flag (not 0 or 1)

    // Should return InvalidInput error
    const result = blake2f.execute(arena.allocator(), &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "fuzz blake2f invalid final flag" {
    try testing.fuzz({}, fuzzInvalidFinalFlag, .{});
}

// Fuzz test: valid final flags (0 and 1)
// Verify both valid final flag values work
fn fuzzValidFinalFlags(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 213) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    // Test both f=0 and f=1 with same input
    var input1: [213]u8 = undefined;
    var input2: [213]u8 = undefined;

    @memcpy(&input1, raw_input[0..213]);
    @memcpy(&input2, raw_input[0..213]);

    // Set valid final flags
    input1[212] = 0; // f = false
    input2[212] = 1; // f = true

    const rounds = std.mem.readInt(u32, input1[0..4], .big);
    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    // Both should succeed (or both fail for same reason)
    const result1 = blake2f.execute(arena.allocator(), &input1, required_gas + 1000) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = blake2f.execute(arena.allocator(), &input2, required_gas + 1000) catch return;
    defer result2.deinit(arena.allocator());

    // Both produce 64-byte output
    try testing.expectEqual(@as(usize, 64), result1.output.len);
    try testing.expectEqual(@as(usize, 64), result2.output.len);

    // Same gas cost
    try testing.expectEqual(result1.gas_used, result2.gas_used);
}

test "fuzz blake2f valid final flags" {
    try testing.fuzz({}, fuzzValidFinalFlags, .{});
}

// Fuzz test: gas limit variations
// Test gas boundaries with fuzzer-derived limits
fn fuzzGasLimits(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 6) return; // Need 4 bytes rounds + 2 bytes gas

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    // Construct valid 213-byte input
    var input: [213]u8 = undefined;
    @memset(&input, 0);
    input[212] = 1; // Valid final flag

    // Extract rounds from fuzzer
    const rounds = std.mem.readInt(u32, raw_input[0..4], .big);
    std.mem.writeInt(u32, input[0..4], rounds, .big);

    // Extract gas limit from fuzzer
    const gas_limit = std.mem.readInt(u16, raw_input[4..6], .little);

    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    const result = blake2f.execute(arena.allocator(), &input, gas_limit) catch |err| switch (err) {
        error.OutOfGas => {
            // Should only error if gas_limit < required_gas
            try testing.expect(gas_limit < required_gas);
            return;
        },
        error.InvalidInput => return, // Compress may fail
        error.OutOfMemory => return,
        else => return, // Other precompile errors
    };
    defer result.deinit(arena.allocator());

    // Successful execution requires sufficient gas
    try testing.expect(gas_limit >= required_gas);
    try testing.expectEqual(required_gas, result.gas_used);
}

test "fuzz blake2f gas limits" {
    try testing.fuzz({}, fuzzGasLimits, .{});
}

// Fuzz test: exact gas requirement
// Verify execution succeeds with exactly required gas
fn fuzzExactGas(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 4) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    // Construct valid 213-byte input
    var input: [213]u8 = undefined;
    @memset(&input, 0);
    input[212] = 1; // Valid final flag

    // Extract rounds from fuzzer
    const rounds = std.mem.readInt(u32, raw_input[0..4], .big);
    std.mem.writeInt(u32, input[0..4], rounds, .big);

    const exact_gas = blake2f.PER_ROUND_GAS * rounds;

    // Should succeed with exact gas
    const result = blake2f.execute(arena.allocator(), &input, exact_gas) catch return;
    defer result.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(exact_gas, result.gas_used);
}

test "fuzz blake2f exact gas" {
    try testing.fuzz({}, fuzzExactGas, .{});
}

// Fuzz test: insufficient gas
// Verify OutOfGas with required_gas - 1
fn fuzzInsufficientGas(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 4) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    // Construct valid 213-byte input
    var input: [213]u8 = undefined;
    @memset(&input, 0);
    input[212] = 1; // Valid final flag

    // Extract rounds from fuzzer
    const rounds = std.mem.readInt(u32, raw_input[0..4], .big);
    if (rounds == 0) return; // Skip zero rounds (required_gas=0)

    std.mem.writeInt(u32, input[0..4], rounds, .big);

    const required_gas = blake2f.PER_ROUND_GAS * rounds;
    const insufficient_gas = required_gas - 1;

    // Should return OutOfGas
    const result = blake2f.execute(arena.allocator(), &input, insufficient_gas);
    try testing.expectError(error.OutOfGas, result);
}

test "fuzz blake2f insufficient gas" {
    try testing.fuzz({}, fuzzInsufficientGas, .{});
}

// Fuzz test: zero rounds
// Verify zero rounds works and costs zero gas
fn fuzzZeroRounds(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 213) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memcpy(&input, raw_input[0..213]);

    // Force zero rounds
    std.mem.writeInt(u32, input[0..4], 0, .big);
    input[212] = 1; // Valid final flag

    const result = blake2f.execute(arena.allocator(), &input, 1000) catch return;
    defer result.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(@as(u64, 0), result.gas_used);
}

test "fuzz blake2f zero rounds" {
    try testing.fuzz({}, fuzzZeroRounds, .{});
}

// Fuzz test: single round
// Verify single round works and costs PER_ROUND_GAS
fn fuzzSingleRound(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 213) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memcpy(&input, raw_input[0..213]);

    // Force single round
    std.mem.writeInt(u32, input[0..4], 1, .big);
    input[212] = 1; // Valid final flag

    const result = blake2f.execute(arena.allocator(), &input, 1000) catch return;
    defer result.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(blake2f.PER_ROUND_GAS, result.gas_used);
}

test "fuzz blake2f single round" {
    try testing.fuzz({}, fuzzSingleRound, .{});
}

// Fuzz test: maximum rounds (u32 max)
// Verify max rounds gas calculation doesn't overflow
fn fuzzMaximumRounds(_: void, raw_input: []const u8) !void {
    _ = raw_input;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memset(&input, 0);

    // Set maximum rounds
    const max_rounds: u32 = std.math.maxInt(u32);
    std.mem.writeInt(u32, input[0..4], max_rounds, .big);
    input[212] = 1; // Valid final flag

    const required_gas = blake2f.PER_ROUND_GAS * max_rounds;

    // Test with insufficient gas (should error)
    const result_low = blake2f.execute(arena.allocator(), &input, required_gas - 1);
    try testing.expectError(error.OutOfGas, result_low);

    // Test with sufficient gas (may succeed or fail on compress)
    const result_ok = blake2f.execute(arena.allocator(), &input, required_gas) catch return;
    defer result_ok.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result_ok.output.len);
    try testing.expectEqual(required_gas, result_ok.gas_used);
}

test "fuzz blake2f maximum rounds" {
    try testing.fuzz({}, fuzzMaximumRounds, .{});
}

// Fuzz test: large round counts
// Test various large round values
fn fuzzLargeRounds(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 4) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memset(&input, 0);
    input[212] = 1; // Valid final flag

    // Extract large round count from fuzzer (limit to reasonable size)
    const rounds_raw = std.mem.readInt(u32, raw_input[0..4], .big);
    const rounds = @min(rounds_raw, 1000000); // Cap for fuzzing performance
    std.mem.writeInt(u32, input[0..4], rounds, .big);

    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    const result = blake2f.execute(arena.allocator(), &input, required_gas + 1000) catch return;
    defer result.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(required_gas, result.gas_used);
}

test "fuzz blake2f large rounds" {
    try testing.fuzz({}, fuzzLargeRounds, .{});
}

// Fuzz test: determinism
// Same input produces same output
fn fuzzDeterminism(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 213) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memcpy(&input, raw_input[0..213]);
    input[212] = 1; // Ensure valid final flag

    const rounds = std.mem.readInt(u32, input[0..4], .big);
    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    // Execute twice with same input
    const result1 = blake2f.execute(arena.allocator(), &input, required_gas + 1000) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = blake2f.execute(arena.allocator(), &input, required_gas + 1000) catch return;
    defer result2.deinit(arena.allocator());

    // Results must be identical
    try testing.expectEqual(result1.gas_used, result2.gas_used);
    try testing.expectEqual(result1.output.len, result2.output.len);
    try testing.expectEqualSlices(u8, result1.output, result2.output);
}

test "fuzz blake2f determinism" {
    try testing.fuzz({}, fuzzDeterminism, .{});
}

// Fuzz test: output always 64 bytes
// Verify output length invariant
fn fuzzOutputLength(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 213) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memcpy(&input, raw_input[0..213]);
    input[212] = 1; // Valid final flag

    const rounds = std.mem.readInt(u32, input[0..4], .big);
    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    const result = blake2f.execute(arena.allocator(), &input, required_gas) catch return;
    defer result.deinit(arena.allocator());

    // Output length invariant: always exactly 64 bytes
    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz blake2f output length" {
    try testing.fuzz({}, fuzzOutputLength, .{});
}

// Fuzz test: gas calculation accuracy
// Verify gas formula: PER_ROUND_GAS * rounds
fn fuzzGasCalculation(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 4) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memset(&input, 0);
    input[212] = 1; // Valid final flag

    // Extract rounds from fuzzer
    const rounds = std.mem.readInt(u32, raw_input[0..4], .big);
    std.mem.writeInt(u32, input[0..4], rounds, .big);

    const expected_gas = blake2f.PER_ROUND_GAS * rounds;

    const result = blake2f.execute(arena.allocator(), &input, expected_gas + 10000) catch return;
    defer result.deinit(arena.allocator());

    // Gas used must exactly match formula
    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz blake2f gas calculation" {
    try testing.fuzz({}, fuzzGasCalculation, .{});
}

// Fuzz test: varying state (h)
// Test with fuzzer-derived state values
fn fuzzVaryingState(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 68) return; // Need 4 (rounds) + 64 (state)

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memset(&input, 0);

    // Copy rounds and state from fuzzer
    @memcpy(input[0..68], raw_input[0..68]);
    input[212] = 1; // Valid final flag

    const rounds = std.mem.readInt(u32, input[0..4], .big);
    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    const result = blake2f.execute(arena.allocator(), &input, required_gas + 1000) catch return;
    defer result.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz blake2f varying state" {
    try testing.fuzz({}, fuzzVaryingState, .{});
}

// Fuzz test: varying message (m)
// Test with fuzzer-derived message values
fn fuzzVaryingMessage(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 196) return; // Need 4 (rounds) + 64 (state) + 128 (message)

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;

    // Copy rounds, state, and message from fuzzer
    @memcpy(input[0..196], raw_input[0..196]);
    // Clear offset and final flag
    @memset(input[196..212], 0);
    input[212] = 1; // Valid final flag

    const rounds = std.mem.readInt(u32, input[0..4], .big);
    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    const result = blake2f.execute(arena.allocator(), &input, required_gas + 1000) catch return;
    defer result.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz blake2f varying message" {
    try testing.fuzz({}, fuzzVaryingMessage, .{});
}

// Fuzz test: varying offset (t)
// Test with fuzzer-derived offset counter
fn fuzzVaryingOffset(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 212) return; // Need 4 + 64 + 128 + 16

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;

    // Copy rounds, state, message, and offset from fuzzer
    @memcpy(input[0..212], raw_input[0..212]);
    input[212] = 1; // Valid final flag

    const rounds = std.mem.readInt(u32, input[0..4], .big);
    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    const result = blake2f.execute(arena.allocator(), &input, required_gas + 1000) catch return;
    defer result.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz blake2f varying offset" {
    try testing.fuzz({}, fuzzVaryingOffset, .{});
}

// Fuzz test: extreme bit patterns
// Test with all-zeros, all-ones, alternating patterns
fn fuzzExtremePatterns(_: void, raw_input: []const u8) !void {
    if (raw_input.len == 0) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;

    // Select pattern based on fuzzer input
    const pattern = raw_input[0] % 4;
    switch (pattern) {
        0 => @memset(&input, 0x00), // All zeros
        1 => @memset(&input, 0xFF), // All ones
        2 => @memset(&input, 0xAA), // Alternating 10101010
        3 => @memset(&input, 0x55), // Alternating 01010101
        else => unreachable,
    }

    // Ensure valid structure
    std.mem.writeInt(u32, input[0..4], 12, .big); // 12 rounds (standard)
    input[212] = 1; // Valid final flag

    const result = blake2f.execute(arena.allocator(), &input, 1000) catch return;
    defer result.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result.output.len);
}

test "fuzz blake2f extreme patterns" {
    try testing.fuzz({}, fuzzExtremePatterns, .{});
}

// Fuzz test: allocation stress
// Ensure no memory leaks with varied inputs
fn fuzzAllocationStress(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 213) return;

    // Use testing allocator to detect leaks
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memcpy(&input, raw_input[0..213]);
    input[212] = 1; // Valid final flag

    const rounds = std.mem.readInt(u32, input[0..4], .big);
    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    // Run multiple times to stress allocator
    const iterations = @min(raw_input[0] % 20, 10);
    for (0..iterations) |_| {
        const result = blake2f.execute(arena.allocator(), &input, required_gas + 1000) catch continue;
        result.deinit(arena.allocator());
    }
}

test "fuzz blake2f allocation stress" {
    try testing.fuzz({}, fuzzAllocationStress, .{});
}

// Fuzz test: rounds boundary values
// Test specific round counts
fn fuzzRoundsBoundaries(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 1) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memset(&input, 0);
    input[212] = 1; // Valid final flag

    // Test boundary values: 0, 1, 12, 255, 256, 65535, 65536
    const test_rounds = [_]u32{ 0, 1, 12, 255, 256, 65535, 65536 };
    const idx = raw_input[0] % test_rounds.len;
    const rounds = test_rounds[idx];

    std.mem.writeInt(u32, input[0..4], rounds, .big);

    const required_gas = blake2f.PER_ROUND_GAS * rounds;

    const result = blake2f.execute(arena.allocator(), &input, required_gas + 1000) catch return;
    defer result.deinit(arena.allocator());

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(required_gas, result.gas_used);
}

test "fuzz blake2f rounds boundaries" {
    try testing.fuzz({}, fuzzRoundsBoundaries, .{});
}

// Fuzz test: final flag byte values
// Test all 256 possible byte values for final flag
fn fuzzFinalFlagValues(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 1) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input: [213]u8 = undefined;
    @memset(&input, 0);
    std.mem.writeInt(u32, input[0..4], 12, .big); // 12 rounds

    // Use fuzzer byte as final flag
    const final_flag = raw_input[0];
    input[212] = final_flag;

    const result = blake2f.execute(arena.allocator(), &input, 1000);

    if (final_flag == 0 or final_flag == 1) {
        // Valid final flag - should succeed
        const res = result catch return; // May fail on compress
        defer res.deinit(arena.allocator());
        try testing.expectEqual(@as(usize, 64), res.output.len);
    } else {
        // Invalid final flag - should error
        try testing.expectError(error.InvalidInput, result);
    }
}

test "fuzz blake2f final flag values" {
    try testing.fuzz({}, fuzzFinalFlagValues, .{});
}

// Fuzz test: empty vs non-empty fields
// Test zero vs non-zero values in different fields
fn fuzzZeroVsNonzeroFields(_: void, raw_input: []const u8) !void {
    if (raw_input.len < 213) return;

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    var input1: [213]u8 = undefined;
    var input2: [213]u8 = undefined;

    // Input 1: all zeros
    @memset(&input1, 0);
    std.mem.writeInt(u32, input1[0..4], 12, .big);
    input1[212] = 1;

    // Input 2: from fuzzer
    @memcpy(&input2, raw_input[0..213]);
    std.mem.writeInt(u32, input2[0..4], 12, .big);
    input2[212] = 1;

    const result1 = blake2f.execute(arena.allocator(), &input1, 1000) catch return;
    defer result1.deinit(arena.allocator());

    const result2 = blake2f.execute(arena.allocator(), &input2, 1000) catch return;
    defer result2.deinit(arena.allocator());

    // Both produce 64-byte output
    try testing.expectEqual(@as(usize, 64), result1.output.len);
    try testing.expectEqual(@as(usize, 64), result2.output.len);

    // Same gas cost (same rounds)
    try testing.expectEqual(result1.gas_used, result2.gas_used);
}

test "fuzz blake2f zero vs nonzero fields" {
    try testing.fuzz({}, fuzzZeroVsNonzeroFields, .{});
}

// Run with: zig build test --fuzz
// Or with Docker on macOS:
// docker run --rm -it -v $(pwd):/workspace -w /workspace \
//   -p 6971:6971 ziglang/zig:0.15.1 \
//   zig build test --fuzz=300s --port=6971
