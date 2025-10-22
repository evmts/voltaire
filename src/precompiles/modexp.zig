const std = @import("std");
const primitives = @import("primitives");
const crypto = @import("crypto");
const ModExp = crypto.ModExp;
const Hardfork = primitives.Hardfork;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Minimum gas for MODEXP precompile
pub const MIN_GAS: u64 = 200;

/// 0x05: MODEXP - Modular exponentiation
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
    hardfork: Hardfork,
) PrecompileError!PrecompileResult {
    // Parse lengths
    if (input.len < 96) {
        return error.InvalidInput;
    }

    const base_len = std.mem.readInt(u256, input[0..32], .big);
    const exp_len = std.mem.readInt(u256, input[32..64], .big);
    const mod_len = std.mem.readInt(u256, input[64..96], .big);

    if (base_len > std.math.maxInt(usize) or
        exp_len > std.math.maxInt(usize) or
        mod_len > std.math.maxInt(usize)) {
        return error.InvalidInput;
    }

    const base_len_usize = @as(usize, @intCast(base_len));
    const exp_len_usize = @as(usize, @intCast(exp_len));
    const mod_len_usize = @as(usize, @intCast(mod_len));

    // Calculate gas cost
    const gas_cost = ModExp.calculateGas(
        base_len_usize,
        exp_len_usize,
        mod_len_usize,
        if (96 + base_len_usize + exp_len_usize <= input.len)
            input[96 + base_len_usize .. 96 + base_len_usize + exp_len_usize]
        else
            &[_]u8{},
        hardfork,
    );

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    // Extract base, exponent, and modulus
    const data_start = 96;
    const base_start = data_start;
    const exp_start = base_start + base_len_usize;
    const mod_start = exp_start + exp_len_usize;

    const base = if (base_start + base_len_usize <= input.len)
        input[base_start .. base_start + base_len_usize]
    else
        &[_]u8{};

    const exponent = if (exp_start + exp_len_usize <= input.len)
        input[exp_start .. exp_start + exp_len_usize]
    else
        &[_]u8{};

    const modulus = if (mod_start + mod_len_usize <= input.len)
        input[mod_start .. mod_start + mod_len_usize]
    else
        &[_]u8{};

    // Perform modular exponentiation
    const result = ModExp.modexp(allocator, base, exponent, modulus) catch |err| switch (err) {
        error.DivisionByZero => return error.InvalidInput,
        error.InvalidInput => return error.InvalidInput,
        error.InvalidBase => return error.InvalidInput,
        error.InvalidCharacter => return error.InvalidInput,
        error.InvalidLength => return error.InvalidInput,
        error.AllocationFailed => return error.OutOfMemory,
        error.OutOfMemory => return error.OutOfMemory,
        error.NoSpaceLeft => return error.OutOfMemory,
        error.NotImplemented => return error.NotImplemented,
    };
    defer allocator.free(result);

    // Pad output to mod_len
    const output = try allocator.alloc(u8, mod_len_usize);
    @memset(output, 0);

    if (result.len <= mod_len_usize) {
        const offset = mod_len_usize - result.len;
        @memcpy(output[offset..], result);
    } else {
        @memcpy(output, result[result.len - mod_len_usize ..]);
    }

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

test "modexp - simple case" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // 2^3 mod 5 = 3
    var input: [99]u8 = [_]u8{0} ** 99;

    // base_len = 1
    input[31] = 1;
    // exp_len = 1
    input[63] = 1;
    // mod_len = 1
    input[95] = 1;

    // base = 2
    input[96] = 2;
    // exp = 3
    input[97] = 3;
    // mod = 5
    input[98] = 5;

    const result = try execute(allocator, &input, 1000000, .Cancun);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 1), result.output.len);
    try testing.expectEqual(@as(u8, 3), result.output[0]);
}
