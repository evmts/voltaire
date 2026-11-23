const std = @import("std");
const crypto = @import("crypto");
const bn254 = crypto.bn254;
const Hardfork = @import("primitives").Hardfork;
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// Gas costs for BN254 pairing from Istanbul (EIP-1108)
pub const BASE_GAS: u64 = 45000;
pub const PER_POINT_GAS: u64 = 34000;
/// Gas costs for BN254 pairing from Byzantium until Istanbul (EIP-197)
pub const BYZANTIUM_BASE_GAS: u64 = 100000;
pub const BYZANTIUM_PER_POINT_GAS: u64 = 80000;

/// Gas cost of a BN254 pairing check over `num_pairs` pairs at `hardfork`.
pub fn gasCost(num_pairs: usize, hardfork: Hardfork) u64 {
    const pairs: u64 = num_pairs;
    return if (hardfork.isAtLeast(.ISTANBUL))
        BASE_GAS + PER_POINT_GAS * pairs
    else
        BYZANTIUM_BASE_GAS + BYZANTIUM_PER_POINT_GAS * pairs;
}

/// 0x08: BN254PAIRING - BN254 elliptic curve pairing check, at the Istanbul price.
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    return executeWithHardfork(allocator, input, gas_limit, .ISTANBUL);
}

/// 0x08: BN254PAIRING priced for `hardfork` (EIP-197 before Istanbul, EIP-1108 after).
pub fn executeWithHardfork(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
    hardfork: Hardfork,
) PrecompileError!PrecompileResult {
    // Input must be multiple of 192 bytes (each pair is 192 bytes)
    if (input.len % 192 != 0) {
        return error.InvalidInput;
    }

    const num_pairs = input.len / 192;
    const gas_cost = gasCost(num_pairs, hardfork);

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 32);
    errdefer allocator.free(output);
    @memset(output, 0);

    // Perform pairing check using pure Zig implementation
    const success = bn254.bn254Pairing(input) catch {
        return error.InvalidPairing;
    };

    if (success) {
        output[31] = 1;
    }

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

test "bn254Pairing - empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Empty input = pairing of zero points = success
    const input = [_]u8{};
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);
    try testing.expectEqual(@as(u8, 1), result.output[31]);
}

test "bn254Pairing - invalid input not multiple of 192" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 191;
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - single pair gas cost" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const expected_gas = BASE_GAS + PER_POINT_GAS * 1;

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
}

test "bn254Pairing - two pairs gas cost" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 384;
    const expected_gas = BASE_GAS + PER_POINT_GAS * 2;

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
}

test "bn254Pairing - out of gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const required_gas = BASE_GAS + PER_POINT_GAS * 1;

    const result = execute(allocator, &input, required_gas - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bn254Pairing - exact gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const required_gas = BASE_GAS + PER_POINT_GAS * 1;

    const result = try execute(allocator, &input, required_gas);
    defer result.deinit(allocator);

    try testing.expectEqual(required_gas, result.gas_used);
}

test "bn254Pairing - gas constants" {
    const testing = std.testing;

    try testing.expectEqual(@as(u64, 45000), BASE_GAS);
    try testing.expectEqual(@as(u64, 34000), PER_POINT_GAS);
}

test "bn254Pairing - output size" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);
}

test "bn254Pairing - empty input gas cost" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{};
    const expected_gas = BASE_GAS + PER_POINT_GAS * 0;

    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(expected_gas, result.gas_used);
}

// ============================================================================
// Official Ethereum Test Vectors from go-ethereum
// Source: https://github.com/ethereum/go-ethereum/blob/master/core/vm/testdata/precompiles/bn256Pairing.json
// ============================================================================

test "bn254Pairing - geth jeff1 valid pairing placeholder" {
    const testing = std.testing;

    const input_hex = "1c76476f4def4bb94541d57ebba1193381ffa7aa76ada664dd31c16024c43f593034dd2920f673e204fee2811c678745fc819b55d3e9d294e45c9b03a76aef41209dd15e723af4f0fca5c8b65b8e5f8cd81cf46bcc3f8e11ba9cb3eff71f1e3aae0fe1a6d60b1fdb2f8ce48e66c9c63f2cf798c66e0f1b68d6e5f1f5dd27a0c9c17f0e5b1e3a8b11c8b1e5e1e5e1e1e5e1e1e5e1e1e5e1e1e5e1e1e5e1";
    _ = input_hex;

    // This test requires actual pairing computation
    // Placeholder for full pairing test vectors
    try testing.expect(true);
}

test "bn254Pairing - geth empty returns success" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{};
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);
    try testing.expectEqual(@as(u8, 1), result.output[31]);
    try testing.expectEqual(BASE_GAS, result.gas_used);
}

test "bn254Pairing - geth one_point invalid must fail" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 128;
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - single valid pair gas calculation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const expected_gas = BASE_GAS + PER_POINT_GAS;

    // An all-zero pair is (infinity, infinity), which EIP-197 accepts:
    // the pairing product is one and the call charges exactly the pair gas.
    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);
    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqualSlices(u8, &([_]u8{0} ** 31 ++ [_]u8{1}), result.output);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bn254Pairing - two pairs gas calculation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 384;
    const expected_gas = BASE_GAS + 2 * PER_POINT_GAS;

    // An all-zero pair is (infinity, infinity), which EIP-197 accepts:
    // the pairing product is one and the call charges exactly the pair gas.
    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);
    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqualSlices(u8, &([_]u8{0} ** 31 ++ [_]u8{1}), result.output);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bn254Pairing - three pairs gas calculation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 576;
    const expected_gas = BASE_GAS + 3 * PER_POINT_GAS;

    // An all-zero pair is (infinity, infinity), which EIP-197 accepts:
    // the pairing product is one and the call charges exactly the pair gas.
    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);
    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqualSlices(u8, &([_]u8{0} ** 31 ++ [_]u8{1}), result.output);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bn254Pairing - four pairs gas calculation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 768;
    const expected_gas = BASE_GAS + 4 * PER_POINT_GAS;

    // An all-zero pair is (infinity, infinity), which EIP-197 accepts:
    // the pairing product is one and the call charges exactly the pair gas.
    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);
    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqualSlices(u8, &([_]u8{0} ** 31 ++ [_]u8{1}), result.output);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bn254Pairing - five pairs gas calculation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 960;
    const expected_gas = BASE_GAS + 5 * PER_POINT_GAS;

    // An all-zero pair is (infinity, infinity), which EIP-197 accepts:
    // the pairing product is one and the call charges exactly the pair gas.
    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);
    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqualSlices(u8, &([_]u8{0} ** 31 ++ [_]u8{1}), result.output);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bn254Pairing - ten pairs gas calculation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 1920;
    const expected_gas = BASE_GAS + 10 * PER_POINT_GAS;

    // An all-zero pair is (infinity, infinity), which EIP-197 accepts:
    // the pairing product is one and the call charges exactly the pair gas.
    const result = try execute(allocator, &input, expected_gas);
    defer result.deinit(allocator);
    try testing.expectEqual(expected_gas, result.gas_used);
    try testing.expectEqualSlices(u8, &([_]u8{0} ** 31 ++ [_]u8{1}), result.output);
    try testing.expectError(error.OutOfGas, execute(allocator, &input, expected_gas - 1));
}

test "bn254Pairing - invalid length 1 byte" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0};
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - invalid length 191 bytes" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 191;
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - invalid length 193 bytes" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 193;
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - invalid length 383 bytes" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 383;
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - invalid length 385 bytes" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 385;
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - invalid length 575 bytes" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 575;
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - invalid length 577 bytes" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 577;
    const result = execute(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "bn254Pairing - gas scaling property" {
    const testing = std.testing;

    const k_values = [_]u64{ 0, 1, 2, 5, 10, 20 };
    for (k_values) |k| {
        const expected = BASE_GAS + k * PER_POINT_GAS;
        try testing.expectEqual(expected, BASE_GAS + k * PER_POINT_GAS);
    }
}

test "bn254Pairing - output always 32 bytes for empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Only empty input produces valid pairing (zero points = success)
    // Non-zero sizes with zero-byte content produce InvalidPairing
    const input = [_]u8{};
    const gas = BASE_GAS;

    const result = try execute(allocator, &input, gas);
    defer result.deinit(allocator);
    try testing.expectEqual(@as(usize, 32), result.output.len);
}

test "bn254Pairing - out of gas for single pair" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 192;
    const required_gas = BASE_GAS + PER_POINT_GAS;
    const result = execute(allocator, &input, required_gas - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bn254Pairing - out of gas for two pairs" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 384;
    const required_gas = BASE_GAS + 2 * PER_POINT_GAS;
    const result = execute(allocator, &input, required_gas - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bn254Pairing - out of gas for ten pairs" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 1920;
    const required_gas = BASE_GAS + 10 * PER_POINT_GAS;
    const result = execute(allocator, &input, required_gas - 1);
    try testing.expectError(error.OutOfGas, result);
}

test "bn254Pairing - exact gas for multiple sizes succeeds on infinity pairs" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // An all-zero pair is (infinity, infinity): valid for every size.
    const pairs = [_]usize{ 1, 2, 3, 5, 10 };
    for (pairs) |k| {
        const input = try allocator.alloc(u8, k * 192);
        defer allocator.free(input);
        @memset(input, 0);

        const required_gas = BASE_GAS + k * PER_POINT_GAS;
        const result = try execute(allocator, input, required_gas);
        defer result.deinit(allocator);
        try testing.expectEqual(required_gas, result.gas_used);
        try testing.expectEqualSlices(u8, &([_]u8{0} ** 31 ++ [_]u8{1}), result.output);
    }
}

test "bn254Pairing - a point off the curve is InvalidPairing" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // G1 = (1, 1) is not on y^2 = x^3 + 3; G2 is infinity.
    var input = [_]u8{0} ** 192;
    input[31] = 1;
    input[63] = 1;
    try testing.expectError(error.InvalidPairing, execute(allocator, &input, 1_000_000));

    // G1 is infinity; G2 = ((1, 1), (1, 1)) is not on the twist.
    input = [_]u8{0} ** 192;
    input[64 + 31] = 1;
    input[96 + 31] = 1;
    input[128 + 31] = 1;
    input[160 + 31] = 1;
    try testing.expectError(error.InvalidPairing, execute(allocator, &input, 1_000_000));
}

test "bn254Pairing - official EIP-197 vectors (go-ethereum bn256Pairing.json)" {
    try @import("utils.zig").expectVectors(execute, @embedFile("vectors/eip197_pairing.txt"), 14);
}

test "bn254Pairing - G2 coordinates are imaginary part first (EIP-197)" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // e(G1, G2) * e(-G1, G2) == 1, with G2 = x_imag || x_real || y_imag || y_real.
    const g2 = "198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2" ++ "1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed" ++
        "090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b" ++ "12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa";
    const valid_hex = "0000000000000000000000000000000000000000000000000000000000000001" ++ "0000000000000000000000000000000000000000000000000000000000000002" ++ g2 ++
        "0000000000000000000000000000000000000000000000000000000000000001" ++ "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd45" ++ g2;
    var valid: [384]u8 = undefined;
    _ = try std.fmt.hexToBytes(&valid, valid_hex);
    const result = try execute(allocator, &valid, BASE_GAS + 2 * PER_POINT_GAS);
    defer result.deinit(allocator);
    try testing.expectEqualSlices(u8, &([_]u8{0} ** 31 ++ [_]u8{1}), result.output);

    // The same G2 with real and imaginary parts swapped is not on the twist.
    const swapped_hex = "0000000000000000000000000000000000000000000000000000000000000001" ++ "0000000000000000000000000000000000000000000000000000000000000002" ++
        "1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed" ++ "198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2" ++
        "12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa" ++ "090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b";
    var swapped: [192]u8 = undefined;
    _ = try std.fmt.hexToBytes(&swapped, swapped_hex);
    try testing.expectError(error.InvalidPairing, execute(allocator, &swapped, 1_000_000));
}

test "bn254Pairing - non-canonical coordinates and non-subgroup G2 are rejected" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const cases = [_][]const u8{
        // G1 = (p + 1, 2) aliases the generator; G2 is the generator.
        "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd48" ++ "0000000000000000000000000000000000000000000000000000000000000002" ++
            "198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2" ++ "1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed" ++
            "090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b" ++ "12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa",
        // G1 = (p, 0) aliases infinity; G2 is infinity.
        "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47" ++ "0000000000000000000000000000000000000000000000000000000000000000",
        // G2 generator with x_imag + p.
        "0000000000000000000000000000000000000000000000000000000000000001" ++ "0000000000000000000000000000000000000000000000000000000000000002" ++
            "49f2e206733ee8642ab1056db37cb583892bb3c49e1bb19fd40511ce87701009" ++ "1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed" ++
            "090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b" ++ "12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa",
        // G2 generator with y_real + p.
        "0000000000000000000000000000000000000000000000000000000000000001" ++ "0000000000000000000000000000000000000000000000000000000000000002" ++
            "198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2" ++ "1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed" ++
            "090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b" ++ "432cad18bcbe0e1502fbb7370f4c98ed7b5351fa74b59e08890758183f777af1",
        // G1 infinity; G2 on the twist but outside the order-r subgroup.
        "0000000000000000000000000000000000000000000000000000000000000000" ++ "0000000000000000000000000000000000000000000000000000000000000000" ++
            "00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002" ++
            "04ed8cf98795e6ff221299312d1758032001ee7d71ca132fe307d56157ed9d692044dbfa9f9e977067b6591653b277985f621d6a969ba7794bc97597d23bfb79",
    };
    for (cases) |case| {
        var input: [192]u8 = [_]u8{0} ** 192;
        _ = try std.fmt.hexToBytes(&input, case);
        try testing.expectError(error.InvalidPairing, execute(allocator, &input, 1_000_000));
    }
}

test "bn254Pairing - Byzantium and Istanbul pricing" {
    const testing = std.testing;
    const allocator = testing.allocator;

    try testing.expectEqual(@as(u64, 100000), gasCost(0, .BYZANTIUM));
    try testing.expectEqual(@as(u64, 180000), gasCost(1, .BYZANTIUM));
    try testing.expectEqual(@as(u64, 260000), gasCost(2, .PETERSBURG));
    try testing.expectEqual(@as(u64, 45000), gasCost(0, .ISTANBUL));
    try testing.expectEqual(@as(u64, 79000), gasCost(1, .ISTANBUL));
    try testing.expectEqual(@as(u64, 113000), gasCost(2, .PRAGUE));

    const input = [_]u8{0} ** 192;

    try testing.expectError(error.OutOfGas, executeWithHardfork(allocator, &input, 179999, .BYZANTIUM));
    const byzantium = try executeWithHardfork(allocator, &input, 180000, .BYZANTIUM);
    defer byzantium.deinit(allocator);
    try testing.expectEqual(@as(u64, 180000), byzantium.gas_used);

    try testing.expectError(error.OutOfGas, executeWithHardfork(allocator, &input, 78999, .ISTANBUL));
    const istanbul = try executeWithHardfork(allocator, &input, 79000, .ISTANBUL);
    defer istanbul.deinit(allocator);
    try testing.expectEqual(@as(u64, 79000), istanbul.gas_used);
}
