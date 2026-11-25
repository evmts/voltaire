const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;
const Hardfork = primitives.Hardfork;

// Common types
pub const common = @import("common.zig");
pub const PrecompileResult = common.PrecompileResult;
pub const PrecompileError = common.PrecompileError;

// Individual precompiles
pub const ecrecover = @import("ecrecover.zig");
pub const sha256 = @import("sha256.zig");
pub const ripemd160 = @import("ripemd160.zig");
pub const identity = @import("identity.zig");
pub const modexp = @import("modexp.zig");
pub const p256verify = @import("p256verify.zig");

pub const bn254_add = @import("bn254_add.zig");
pub const bn254_mul = @import("bn254_mul.zig");
pub const bn254_pairing = @import("bn254_pairing.zig");
pub const blake2f = @import("blake2f.zig");
pub const point_evaluation = @import("point_evaluation.zig");
pub const bls12_g1_add = @import("bls12_g1_add.zig");
pub const bls12_g1_mul = @import("bls12_g1_mul.zig");
pub const bls12_g1_msm = @import("bls12_g1_msm.zig");
pub const bls12_g2_add = @import("bls12_g2_add.zig");
pub const bls12_g2_mul = @import("bls12_g2_mul.zig");
pub const bls12_g2_msm = @import("bls12_g2_msm.zig");
pub const bls12_pairing = @import("bls12_pairing.zig");
pub const bls12_map_fp_to_g1 = @import("bls12_map_fp_to_g1.zig");
pub const bls12_map_fp2_to_g2 = @import("bls12_map_fp2_to_g2.zig");

// Utilities
pub const utils = @import("utils.zig");

test {
    _ = common;
    _ = ecrecover;
    _ = sha256;
    _ = ripemd160;
    _ = identity;
    _ = modexp;
    _ = p256verify;
    _ = bn254_add;
    _ = bn254_mul;
    _ = bn254_pairing;
    _ = blake2f;
    _ = point_evaluation;
    _ = bls12_g1_add;
    _ = bls12_g1_mul;
    _ = bls12_g1_msm;
    _ = bls12_g2_add;
    _ = bls12_g2_mul;
    _ = bls12_g2_msm;
    _ = bls12_pairing;
    _ = bls12_map_fp_to_g1;
    _ = bls12_map_fp2_to_g2;
    _ = utils;
}

/// Precompile contract addresses (0x01 through 0x11, and 0x0100).
/// 0x0B through 0x11 are the seven operations of the final EIP-2537.
/// EIP-2537 has no G1MUL or G2MUL precompile: a multiplication is a
/// one-pair MSM, and nothing is dispatched at 0x12 or 0x13.
pub const ECRECOVER_ADDRESS: Address = Address.fromU256(0x01);
pub const SHA256_ADDRESS: Address = Address.fromU256(0x02);
pub const RIPEMD160_ADDRESS: Address = Address.fromU256(0x03);
pub const IDENTITY_ADDRESS: Address = Address.fromU256(0x04);
pub const MODEXP_ADDRESS: Address = Address.fromU256(0x05);
pub const ECADD_ADDRESS: Address = Address.fromU256(0x06);
pub const ECMUL_ADDRESS: Address = Address.fromU256(0x07);
pub const ECPAIRING_ADDRESS: Address = Address.fromU256(0x08);
pub const BLAKE2F_ADDRESS: Address = Address.fromU256(0x09);
pub const POINT_EVALUATION_ADDRESS: Address = Address.fromU256(0x0A);
pub const BLS12_G1ADD_ADDRESS: Address = Address.fromU256(0x0B);
pub const BLS12_G1MSM_ADDRESS: Address = Address.fromU256(0x0C);
pub const BLS12_G2ADD_ADDRESS: Address = Address.fromU256(0x0D);
pub const BLS12_G2MSM_ADDRESS: Address = Address.fromU256(0x0E);
pub const BLS12_PAIRING_ADDRESS: Address = Address.fromU256(0x0F);
pub const BLS12_PAIRING_CHECK_ADDRESS: Address = BLS12_PAIRING_ADDRESS;
pub const BLS12_MAP_FP_TO_G1_ADDRESS: Address = Address.fromU256(0x10);
pub const BLS12_MAP_FP2_TO_G2_ADDRESS: Address = Address.fromU256(0x11);
pub const P256VERIFY_ADDRESS: Address = Address.fromU256(0x0100);
pub const P256_VERIFY_ADDRESS: Address = P256VERIFY_ADDRESS;

/// Check if an address is a precompile
pub fn isPrecompile(address: Address, hardfork: Hardfork) bool {
    const addr_int = address.toU256();
    if (addr_int == 0) return false;
    if (addr_int == 0x0100) return hardfork.isAtLeast(.OSAKA);

    if (hardfork.isAtLeast(.PRAGUE)) return addr_int <= 0x11;
    if (hardfork.isAtLeast(.CANCUN)) return addr_int <= 0x0A;
    if (hardfork.isAtLeast(.ISTANBUL)) return addr_int <= 0x09;
    if (hardfork.isAtLeast(.BYZANTIUM)) return addr_int <= 0x08;
    return addr_int <= 0x04;
}

/// Execute a precompile contract
pub fn execute(
    allocator: std.mem.Allocator,
    address: Address,
    input: []const u8,
    gas_limit: u64,
    hardfork: Hardfork,
) PrecompileError!PrecompileResult {
    if (!isPrecompile(address, hardfork)) {
        return error.NotImplemented;
    }

    const addr_int = address.toU256();
    return switch (addr_int) {
        0x01 => ecrecover.execute(allocator, input, gas_limit),
        0x02 => sha256.execute(allocator, input, gas_limit),
        0x03 => ripemd160.execute(allocator, input, gas_limit),
        0x04 => identity.execute(allocator, input, gas_limit),
        0x05 => modexp.execute(allocator, input, gas_limit, hardfork),
        0x06 => bn254_add.executeWithHardfork(allocator, input, gas_limit, hardfork),
        0x07 => bn254_mul.executeWithHardfork(allocator, input, gas_limit, hardfork),
        0x08 => bn254_pairing.executeWithHardfork(allocator, input, gas_limit, hardfork),
        0x09 => blake2f.execute(allocator, input, gas_limit),
        0x0A => point_evaluation.execute(allocator, input, gas_limit),
        0x0B => bls12_g1_add.execute(allocator, input, gas_limit),
        0x0C => bls12_g1_msm.execute(allocator, input, gas_limit),
        0x0D => bls12_g2_add.execute(allocator, input, gas_limit),
        0x0E => bls12_g2_msm.execute(allocator, input, gas_limit),
        0x0F => bls12_pairing.execute(allocator, input, gas_limit),
        0x10 => bls12_map_fp_to_g1.execute(allocator, input, gas_limit),
        0x11 => bls12_map_fp2_to_g2.execute(allocator, input, gas_limit),
        0x0100 => p256verify.execute(allocator, input, gas_limit),
        else => error.NotImplemented,
    };
}

test "isPrecompile - Frontier" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromU256(0x01), .FRONTIER));
    try testing.expect(isPrecompile(Address.fromU256(0x04), .FRONTIER));
    try testing.expect(!isPrecompile(Address.fromU256(0x05), .FRONTIER));
}

test "isPrecompile - Byzantium" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromU256(0x01), .BYZANTIUM));
    try testing.expect(isPrecompile(Address.fromU256(0x08), .BYZANTIUM));
    try testing.expect(!isPrecompile(Address.fromU256(0x09), .BYZANTIUM));
}

test "isPrecompile - hardfork continuity" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromU256(0x01), .DAO));
    try testing.expect(isPrecompile(Address.fromU256(0x04), .SPURIOUS_DRAGON));
    try testing.expect(isPrecompile(Address.fromU256(0x09), .MUIR_GLACIER));
    try testing.expect(isPrecompile(Address.fromU256(0x09), .BERLIN));
    try testing.expect(isPrecompile(Address.fromU256(0x09), .LONDON));
    try testing.expect(isPrecompile(Address.fromU256(0x09), .MERGE));
    try testing.expect(isPrecompile(Address.fromU256(0x09), .SHANGHAI));
    try testing.expect(!isPrecompile(Address.fromU256(0x0A), .SHANGHAI));
}

test "isPrecompile - Istanbul" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromU256(0x09), .ISTANBUL));
    try testing.expect(!isPrecompile(Address.fromU256(0x0A), .ISTANBUL));
}

test "isPrecompile - Cancun" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromU256(0x0A), .CANCUN));
    try testing.expect(!isPrecompile(Address.fromU256(0x0B), .CANCUN));
}

test "isPrecompile - Prague" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromU256(0x0B), .PRAGUE));
    try testing.expect(isPrecompile(Address.fromU256(0x11), .PRAGUE));
    // The final EIP-2537 has seven operations: 0x12 and 0x13 are not precompiles.
    try testing.expect(!isPrecompile(Address.fromU256(0x12), .PRAGUE));
    try testing.expect(!isPrecompile(Address.fromU256(0x13), .PRAGUE));
    try testing.expect(!isPrecompile(Address.fromU256(0x14), .PRAGUE));
}

test "isPrecompile - Osaka P256VERIFY (EIP-7951)" {
    const testing = std.testing;

    try testing.expectEqual(@as(u256, 0x0100), P256VERIFY_ADDRESS.toU256());
    try testing.expectEqual(P256VERIFY_ADDRESS, P256_VERIFY_ADDRESS);
    try testing.expect(isPrecompile(P256VERIFY_ADDRESS, .OSAKA));
    try testing.expect(!isPrecompile(P256VERIFY_ADDRESS, .PRAGUE));
    try testing.expect(!isPrecompile(P256VERIFY_ADDRESS, .CANCUN));
    try testing.expect(!isPrecompile(P256VERIFY_ADDRESS, .FRONTIER));

    // 0x0100 is isolated and does not activate intermediate or adjacent addresses
    try testing.expect(isPrecompile(Address.fromU256(0x11), .OSAKA));
    try testing.expect(!isPrecompile(Address.fromU256(0x12), .OSAKA));
    try testing.expect(!isPrecompile(Address.fromU256(0x13), .OSAKA));
    try testing.expect(!isPrecompile(Address.fromU256(0x14), .OSAKA));
    try testing.expect(!isPrecompile(Address.fromU256(0xFF), .OSAKA));
    try testing.expect(!isPrecompile(Address.fromU256(0x0101), .OSAKA));
    try testing.expect(!isPrecompile(Address.fromU256(0x0100 << 8), .OSAKA));
}

test "precompile - out of gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = @as([32]u8, @splat(0));
    const result = sha256.execute(allocator, &input, 10);
    try testing.expectError(error.OutOfGas, result);
}

/// First valid vector of the official P256VERIFY conformance file.
fn firstValidP256Vector() ![p256verify.INPUT_LENGTH]u8 {
    var lines = std.mem.splitScalar(u8, @embedFile("p256verify_vectors.txt"), '\n');
    while (lines.next()) |raw_line| {
        const line = std.mem.trim(u8, raw_line, " \t\r");
        if (line.len == 0 or line[0] == '#') continue;
        const sep = std.mem.indexOfScalar(u8, line, ' ') orelse return error.InvalidVectorFormat;
        if (!std.mem.eql(u8, line[sep + 1 ..], "1")) continue;
        if (sep != 2 * p256verify.INPUT_LENGTH) continue;
        var input: [p256verify.INPUT_LENGTH]u8 = undefined;
        _ = try std.fmt.hexToBytes(&input, line[0..sep]);
        return input;
    }
    return error.NoValidVector;
}

test "execute - P256VERIFY is not a precompile before Osaka" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = try firstValidP256Vector();
    try testing.expectError(error.NotImplemented, execute(allocator, P256VERIFY_ADDRESS, &input, 1_000_000, .PRAGUE));
    try testing.expectError(error.NotImplemented, execute(allocator, P256VERIFY_ADDRESS, &input, 1_000_000, .CANCUN));
    try testing.expectError(error.NotImplemented, execute(allocator, P256VERIFY_ADDRESS, &.{}, 1_000_000, .PRAGUE));
}

test "execute - P256VERIFY dispatches at 0x0100 from Osaka" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = try firstValidP256Vector();

    // A valid signature returns the 32-byte word 1 for exactly 6900 gas.
    const valid = try execute(allocator, P256VERIFY_ADDRESS, &input, p256verify.GAS, .OSAKA);
    defer valid.deinit(allocator);
    try testing.expectEqual(@as(u64, 6900), valid.gas_used);
    try testing.expectEqualSlices(u8, &(@as([31]u8, @splat(0)) ++ [_]u8{1}), valid.output);

    try testing.expectError(error.OutOfGas, execute(allocator, P256VERIFY_ADDRESS, &input, p256verify.GAS - 1, .OSAKA));

    // A corrupted signature succeeds with empty output and the same gas.
    var corrupted = input;
    corrupted[40] ^= 0x01;
    const invalid = try execute(allocator, P256VERIFY_ADDRESS, &corrupted, p256verify.GAS, .OSAKA);
    defer invalid.deinit(allocator);
    try testing.expectEqual(@as(u64, 6900), invalid.gas_used);
    try testing.expectEqual(@as(usize, 0), invalid.output.len);

    // So does input of the wrong length.
    const empty = try execute(allocator, P256VERIFY_ADDRESS, &.{}, p256verify.GAS, .OSAKA);
    defer empty.deinit(allocator);
    try testing.expectEqual(@as(usize, 0), empty.output.len);
}

test "execute - EIP-2537 dispatches the seven final operations at 0x0b..0x11" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // All-zero input of the right length is a valid call for every operation
    // (points at infinity, the zero field element), and each operation has a
    // distinct input length, output length and gas. A wrong route cannot pass.
    const Case = struct { address: Address, input_len: usize, output_len: usize, gas: u64 };
    const cases = [_]Case{
        .{ .address = BLS12_G1ADD_ADDRESS, .input_len = 256, .output_len = 128, .gas = 375 },
        .{ .address = BLS12_G1MSM_ADDRESS, .input_len = 160, .output_len = 128, .gas = 12000 },
        .{ .address = BLS12_G2ADD_ADDRESS, .input_len = 512, .output_len = 256, .gas = 600 },
        .{ .address = BLS12_G2MSM_ADDRESS, .input_len = 288, .output_len = 256, .gas = 22500 },
        .{ .address = BLS12_PAIRING_ADDRESS, .input_len = 384, .output_len = 32, .gas = 70300 },
        .{ .address = BLS12_MAP_FP_TO_G1_ADDRESS, .input_len = 64, .output_len = 128, .gas = 5500 },
        .{ .address = BLS12_MAP_FP2_TO_G2_ADDRESS, .input_len = 128, .output_len = 256, .gas = 23800 },
    };
    const zeros = @as([512]u8, @splat(0));

    for (cases, 0x0B..) |case, expected_address| {
        try testing.expectEqual(@as(u256, expected_address), case.address.toU256());
        const input = zeros[0..case.input_len];

        for ([_]Hardfork{ .PRAGUE, .OSAKA }) |fork| {
            const result = try execute(allocator, case.address, input, case.gas, fork);
            defer result.deinit(allocator);
            try testing.expectEqual(case.gas, result.gas_used);
            try testing.expectEqual(case.output_len, result.output.len);
            try testing.expectError(error.OutOfGas, execute(allocator, case.address, input, case.gas - 1, fork));
        }

        // Not a precompile before Prague.
        try testing.expectError(error.NotImplemented, execute(allocator, case.address, input, 10_000_000, .CANCUN));
    }

    // 0x12 and 0x13 held MAP operations in a draft address layout. They are
    // not precompiles in the final EIP.
    try testing.expectError(error.NotImplemented, execute(allocator, Address.fromU256(0x12), zeros[0..64], 10_000_000, .PRAGUE));
    try testing.expectError(error.NotImplemented, execute(allocator, Address.fromU256(0x13), zeros[0..128], 10_000_000, .PRAGUE));
    try testing.expectError(error.NotImplemented, execute(allocator, Address.fromU256(0x12), zeros[0..64], 10_000_000, .OSAKA));
    try testing.expectError(error.NotImplemented, execute(allocator, Address.fromU256(0x13), zeros[0..128], 10_000_000, .OSAKA));
}

test "execute - EIP-2537 pairing and map outputs through the dispatcher" {
    const testing = std.testing;
    const allocator = testing.allocator;
    const zeros = @as([384]u8, @splat(0));

    // e(infinity, infinity) = 1
    const pairing = try execute(allocator, BLS12_PAIRING_ADDRESS, &zeros, 70300, .PRAGUE);
    defer pairing.deinit(allocator);
    try testing.expectEqualSlices(u8, &(@as([31]u8, @splat(0)) ++ [_]u8{1}), pairing.output);

    // Mapping the zero field element gives a point, not infinity, with the
    // 16 padding bytes of each coordinate zero.
    const mapped = try execute(allocator, BLS12_MAP_FP_TO_G1_ADDRESS, zeros[0..64], 5500, .PRAGUE);
    defer mapped.deinit(allocator);
    try testing.expect(!std.mem.allEqual(u8, mapped.output, 0));
    try testing.expect(std.mem.allEqual(u8, mapped.output[0..16], 0));
    try testing.expect(std.mem.allEqual(u8, mapped.output[64..80], 0));

    // Empty input is an error for the variable-length operations.
    try testing.expectError(error.InvalidInput, execute(allocator, BLS12_G1MSM_ADDRESS, &.{}, 10_000_000, .PRAGUE));
    try testing.expectError(error.InvalidInput, execute(allocator, BLS12_G2MSM_ADDRESS, &.{}, 10_000_000, .PRAGUE));
    try testing.expectError(error.InvalidInput, execute(allocator, BLS12_PAIRING_ADDRESS, &.{}, 10_000_000, .PRAGUE));
}

test "execute - BN254 uses Byzantium pricing before Istanbul and EIP-1108 pricing after" {
    const testing = std.testing;
    const allocator = testing.allocator;
    const zeros = @as([192]u8, @splat(0));

    const Case = struct { address: Address, input: []const u8, byzantium: u64, istanbul: u64 };
    const cases = [_]Case{
        .{ .address = ECADD_ADDRESS, .input = zeros[0..128], .byzantium = 500, .istanbul = 150 },
        .{ .address = ECMUL_ADDRESS, .input = zeros[0..96], .byzantium = 40000, .istanbul = 6000 },
        .{ .address = ECPAIRING_ADDRESS, .input = zeros[0..192], .byzantium = 180000, .istanbul = 79000 },
        .{ .address = ECPAIRING_ADDRESS, .input = zeros[0..0], .byzantium = 100000, .istanbul = 45000 },
    };

    for (cases) |case| {
        for ([_]Hardfork{ .BYZANTIUM, .CONSTANTINOPLE, .PETERSBURG }) |fork| {
            try testing.expectError(error.OutOfGas, execute(allocator, case.address, case.input, case.byzantium - 1, fork));
            const result = try execute(allocator, case.address, case.input, case.byzantium, fork);
            defer result.deinit(allocator);
            try testing.expectEqual(case.byzantium, result.gas_used);
        }
        for ([_]Hardfork{ .ISTANBUL, .BERLIN, .CANCUN, .PRAGUE, .OSAKA }) |fork| {
            try testing.expectError(error.OutOfGas, execute(allocator, case.address, case.input, case.istanbul - 1, fork));
            const result = try execute(allocator, case.address, case.input, case.istanbul, fork);
            defer result.deinit(allocator);
            try testing.expectEqual(case.istanbul, result.gas_used);
        }
    }
}

test "execute - ECRECOVER returns empty output for an invalid signature" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const zeros = @as([128]u8, @splat(0));
    const result = try execute(allocator, ECRECOVER_ADDRESS, &zeros, 3000, .CANCUN);
    defer result.deinit(allocator);
    try testing.expectEqual(@as(u64, 3000), result.gas_used);
    try testing.expectEqual(@as(usize, 0), result.output.len);
}
