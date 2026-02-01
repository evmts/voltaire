const std = @import("std");
const precompiles = @import("precompiles");
const primitives = @import("primitives");
const Hardfork = primitives.Hardfork;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== ModExp Precompile Basic Usage ===\n\n", .{});

    // Example 1: Simple modular exponentiation - 2^3 mod 5 = 3
    std.debug.print("=== Example 1: 2^3 mod 5 ===\n", .{});

    // Create input: baseLen(32) || expLen(32) || modLen(32) || base || exp || mod
    var input1: [99]u8 = [_]u8{0} ** 99;
    input1[31] = 1; // base_len = 1
    input1[63] = 1; // exp_len = 1
    input1[95] = 1; // mod_len = 1
    input1[96] = 2; // base = 2
    input1[97] = 3; // exp = 3
    input1[98] = 5; // mod = 5

    std.debug.print("Calculation: 2^3 mod 5\n", .{});
    std.debug.print("Expected: 3 (since 2^3 = 8, and 8 mod 5 = 3)\n", .{});
    std.debug.print("Input length: {} bytes\n", .{input1.len});

    const result1 = try precompiles.modexp.execute(allocator, &input1, 10000, Hardfork.CANCUN);
    defer result1.deinit(allocator);

    std.debug.print("Result: {}\n", .{result1.output[0]});
    std.debug.print("Correct: {s}\n", .{if (result1.output[0] == 3) "✓ Yes" else "✗ No"});
    std.debug.print("Gas used: {}\n", .{result1.gas_used});

    // Example 2: 5^0 mod 7 = 1 (zero exponent)
    std.debug.print("\n=== Example 2: 5^0 mod 7 (Zero Exponent) ===\n", .{});
    var input2: [99]u8 = [_]u8{0} ** 99;
    input2[31] = 1; // base_len = 1
    input2[63] = 1; // exp_len = 1
    input2[95] = 1; // mod_len = 1
    input2[96] = 5; // base = 5
    input2[97] = 0; // exp = 0
    input2[98] = 7; // mod = 7

    std.debug.print("Calculation: 5^0 mod 7\n", .{});
    std.debug.print("Expected: 1 (any number to power 0 is 1)\n", .{});

    const result2 = try precompiles.modexp.execute(allocator, &input2, 10000, Hardfork.CANCUN);
    defer result2.deinit(allocator);

    std.debug.print("Result: {}\n", .{result2.output[0]});
    std.debug.print("Correct: {s}\n", .{if (result2.output[0] == 1) "✓ Yes" else "✗ No"});
    std.debug.print("Gas used: {}\n", .{result2.gas_used});

    // Example 3: Multi-byte calculation - 10^5 mod 13 = 3
    std.debug.print("\n=== Example 3: 10^5 mod 13 ===\n", .{});
    var input3: [99]u8 = [_]u8{0} ** 99;
    input3[31] = 1; // base_len = 1
    input3[63] = 1; // exp_len = 1
    input3[95] = 1; // mod_len = 1
    input3[96] = 10; // base = 10
    input3[97] = 5; // exp = 5
    input3[98] = 13; // mod = 13

    std.debug.print("Calculation: 10^5 mod 13\n", .{});
    std.debug.print("Expected: 3 (since 10^5 = 100000, and 100000 mod 13 = 3)\n", .{});

    const result3 = try precompiles.modexp.execute(allocator, &input3, 10000, Hardfork.CANCUN);
    defer result3.deinit(allocator);

    std.debug.print("Result: {}\n", .{result3.output[0]});
    std.debug.print("Correct: {s}\n", .{if (result3.output[0] == 3) "✓ Yes" else "✗ No"});
    std.debug.print("Gas used: {}\n", .{result3.gas_used});

    // Example 4: Modulus = 1 (always returns 0)
    std.debug.print("\n=== Example 4: Any Number mod 1 ===\n", .{});
    var input4: [99]u8 = [_]u8{0} ** 99;
    input4[31] = 1; // base_len = 1
    input4[63] = 1; // exp_len = 1
    input4[95] = 1; // mod_len = 1
    input4[96] = 100; // base = 100
    input4[97] = 50; // exp = 50
    input4[98] = 1; // mod = 1

    std.debug.print("Calculation: 100^50 mod 1\n", .{});
    std.debug.print("Expected: 0 (anything mod 1 is 0)\n", .{});

    const result4 = try precompiles.modexp.execute(allocator, &input4, 10000, Hardfork.CANCUN);
    defer result4.deinit(allocator);

    std.debug.print("Result: {}\n", .{result4.output[0]});
    std.debug.print("Correct: {s}\n", .{if (result4.output[0] == 0) "✓ Yes" else "✗ No"});
    std.debug.print("Gas used: {}\n", .{result4.gas_used});

    // Example 5: Minimum gas cost
    std.debug.print("\n=== Example 5: Minimum Gas Cost ===\n", .{});
    std.debug.print("ModExp has a minimum gas cost of 200\n", .{});

    var min_input: [99]u8 = [_]u8{0} ** 99;
    min_input[31] = 1; // base_len = 1
    min_input[63] = 1; // exp_len = 1
    min_input[95] = 1; // mod_len = 1
    min_input[96] = 1; // base = 1
    min_input[97] = 1; // exp = 1
    min_input[98] = 2; // mod = 2

    const min_result = try precompiles.modexp.execute(allocator, &min_input, 1000, Hardfork.CANCUN);
    defer min_result.deinit(allocator);

    std.debug.print("Gas used for minimal input: {}\n", .{min_result.gas_used});
    std.debug.print("At least 200: {s}\n", .{if (min_result.gas_used >= 200) "✓ Yes" else "✗ No"});

    // Example 6: Zero modulus (returns empty output)
    std.debug.print("\n=== Example 6: Zero Modulus ===\n", .{});
    var zero_mod_input: [99]u8 = [_]u8{0} ** 99;
    zero_mod_input[31] = 1; // base_len = 1
    zero_mod_input[63] = 1; // exp_len = 1
    zero_mod_input[95] = 1; // mod_len = 1
    zero_mod_input[96] = 5; // base = 5
    zero_mod_input[97] = 3; // exp = 3
    zero_mod_input[98] = 0; // mod = 0 (invalid)

    const zero_result = try precompiles.modexp.execute(allocator, &zero_mod_input, 1000, Hardfork.CANCUN);
    defer zero_result.deinit(allocator);

    std.debug.print("Zero modulus returns empty output: {s}\n", .{if (zero_result.output.len == 0) "✓ Yes" else "✗ No"});

    std.debug.print("\n=== Summary ===\n", .{});
    std.debug.print("Formula: (base^exponent) mod modulus\n", .{});
    std.debug.print("Input format: baseLen(32) || expLen(32) || modLen(32) || base || exp || mod\n", .{});
    std.debug.print("Output length: Same as modulus length\n", .{});
    std.debug.print("Minimum gas: 200\n", .{});
    std.debug.print("Gas cost: Complex formula based on input sizes\n", .{});
    std.debug.print("Use cases: RSA verification, zkSNARKs, cryptographic protocols\n", .{});
}
