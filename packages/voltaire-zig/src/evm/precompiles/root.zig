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

fn runFirstVectorLine(
    allocator: std.mem.Allocator,
    address: Address,
    vectors_txt: []const u8,
    hardfork: Hardfork,
) !void {
    const testing = std.testing;
    var lines = std.mem.splitScalar(u8, vectors_txt, '\n');
    while (lines.next()) |raw| {
        const line = std.mem.trim(u8, raw, " \t\r");
        if (line.len == 0 or line[0] == '#') continue;
        var parts = std.mem.splitScalar(u8, line, '|');
        _ = parts.next() orelse return error.InvalidVectorFormat;
        const in_hex = parts.next() orelse return error.InvalidVectorFormat;
        const out_hex = parts.next() orelse return error.InvalidVectorFormat;
        const gas_str = parts.next() orelse return error.InvalidVectorFormat;
        if (std.mem.eql(u8, out_hex, "ERR")) continue;

        const input = try allocator.alloc(u8, in_hex.len / 2);
        defer allocator.free(input);
        _ = try std.fmt.hexToBytes(input, in_hex);

        const expected = try allocator.alloc(u8, out_hex.len / 2);
        defer allocator.free(expected);
        _ = try std.fmt.hexToBytes(expected, out_hex);

        const expected_gas = try std.fmt.parseInt(u64, gas_str, 10);
        const result = try execute(allocator, address, input, expected_gas, hardfork);
        defer result.deinit(allocator);
        try testing.expectEqual(expected_gas, result.gas_used);
        try testing.expectEqualSlices(u8, expected, result.output);
        return;
    }
    return error.NoValidVector;
}

test "EEST - full precompile dispatch 0x01..0x11 and 0x0100 with non-trivial vectors" {
    const testing = std.testing;
    const allocator = testing.allocator;
    const crypto = @import("crypto");

    // 0x01 ECRECOVER (go-ethereum / EEST ValidKey high-s vector)
    var ec_in: [128]u8 = undefined;
    var ec_exp: [32]u8 = undefined;
    _ = try std.fmt.hexToBytes(&ec_in, "18c547e4f7b0f325ad1e56f57e26c745b09a3e503d86e00e5255ff7f715d3d1c" ++
        "000000000000000000000000000000000000000000000000000000000000001c" ++
        "73b1693892219d736caba55bdb67216e485557ea6b6af75f37096c9aa6a5a75f" ++
        "eeb940b1d03b21e36b0e47e79769f095fe2ab855bd91e3a38756b7d75a9c4549");
    _ = try std.fmt.hexToBytes(&ec_exp, "000000000000000000000000a94f5374fce5edbc8e2a8697c15331677e6ebf0b");
    const ec_res = try execute(allocator, ECRECOVER_ADDRESS, &ec_in, 3000, .OSAKA);
    defer ec_res.deinit(allocator);
    try testing.expectEqual(@as(u64, 3000), ec_res.gas_used);
    try testing.expectEqualSlices(u8, &ec_exp, ec_res.output);

    // 0x02 SHA256 ("abc")
    var sha_exp: [32]u8 = undefined;
    _ = try std.fmt.hexToBytes(&sha_exp, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    const sha_res = try execute(allocator, SHA256_ADDRESS, "abc", 72, .OSAKA);
    defer sha_res.deinit(allocator);
    try testing.expectEqual(@as(u64, 72), sha_res.gas_used);
    try testing.expectEqualSlices(u8, &sha_exp, sha_res.output);

    // 0x03 RIPEMD160 ("abc", left-padded to 32 bytes)
    var ripemd_exp: [32]u8 = undefined;
    _ = try std.fmt.hexToBytes(&ripemd_exp, "0000000000000000000000008eb208f7e05d987a9b044a8e98c6b087f15a0bfc");
    const ripemd_res = try execute(allocator, RIPEMD160_ADDRESS, "abc", 720, .OSAKA);
    defer ripemd_res.deinit(allocator);
    try testing.expectEqual(@as(u64, 720), ripemd_res.gas_used);
    try testing.expectEqualSlices(u8, &ripemd_exp, ripemd_res.output);

    // 0x04 IDENTITY (33 bytes -> 2 words -> 15 + 3*2 = 21 gas)
    const id_in = "voltaire-eest-identity-precompile";
    const id_res = try execute(allocator, IDENTITY_ADDRESS, id_in, 21, .OSAKA);
    defer id_res.deinit(allocator);
    try testing.expectEqual(@as(u64, 21), id_res.gas_used);
    try testing.expectEqualSlices(u8, id_in, id_res.output);

    // 0x05 MODEXP (2^3 mod 5 = 3; Berlin=200 gas, Osaka=500 gas)
    var modexp_in = @as([99]u8, @splat(0));
    modexp_in[31] = 1;
    modexp_in[63] = 1;
    modexp_in[95] = 1;
    modexp_in[96] = 2;
    modexp_in[97] = 3;
    modexp_in[98] = 5;
    const me_prague = try execute(allocator, MODEXP_ADDRESS, &modexp_in, 200, .PRAGUE);
    defer me_prague.deinit(allocator);
    try testing.expectEqual(@as(u64, 200), me_prague.gas_used);
    try testing.expectEqualSlices(u8, &[_]u8{3}, me_prague.output);
    const me_osaka = try execute(allocator, MODEXP_ADDRESS, &modexp_in, 500, .OSAKA);
    defer me_osaka.deinit(allocator);
    try testing.expectEqual(@as(u64, 500), me_osaka.gas_used);
    try testing.expectEqualSlices(u8, &[_]u8{3}, me_osaka.output);

    // 0x06..0x08 BN254 ECADD, ECMUL, ECPAIRING (official EIP-196/197 vectors)
    try runFirstVectorLine(allocator, ECADD_ADDRESS, @embedFile("vectors/eip196_add.txt"), .OSAKA);
    try runFirstVectorLine(allocator, ECMUL_ADDRESS, @embedFile("vectors/eip196_mul.txt"), .OSAKA);
    try runFirstVectorLine(allocator, ECPAIRING_ADDRESS, @embedFile("vectors/eip197_pairing.txt"), .OSAKA);

    // 0x09 BLAKE2F (RFC 7693 Appendix A / EIP-152 "abc" 12 rounds)
    var b2_in = @as([213]u8, @splat(0));
    std.mem.writeInt(u32, b2_in[0..4], 12, .big);
    const iv = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };
    for (iv, 0..) |word, i| {
        std.mem.writeInt(u64, b2_in[4 + i * 8 ..][0..8], word, .little);
    }
    @memcpy(b2_in[68..71], "abc");
    std.mem.writeInt(u64, b2_in[196..204], 3, .little);
    b2_in[212] = 1;
    var b2_exp: [64]u8 = undefined;
    _ = try std.fmt.hexToBytes(&b2_exp, "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d1" ++
        "7d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923");
    const b2_res = try execute(allocator, BLAKE2F_ADDRESS, &b2_in, 12, .OSAKA);
    defer b2_res.deinit(allocator);
    try testing.expectEqual(@as(u64, 12), b2_res.gas_used);
    try testing.expectEqualSlices(u8, &b2_exp, b2_res.output);

    // 0x0A POINT_EVALUATION (EIP-4844 valid infinity commitment/proof)
    try crypto.kzg_setup.init();
    defer crypto.kzg_setup.deinit(allocator);
    var pe_in = @as([192]u8, @splat(0));
    pe_in[96] = 0xc0;
    pe_in[144] = 0xc0;
    std.crypto.hash.sha2.Sha256.hash(pe_in[96..144], pe_in[0..32], .{});
    pe_in[0] = 0x01;
    const pe_res = try execute(allocator, POINT_EVALUATION_ADDRESS, &pe_in, 50000, .OSAKA);
    defer pe_res.deinit(allocator);
    try testing.expectEqual(@as(u64, 50000), pe_res.gas_used);
    try testing.expectEqual(@as(usize, 64), pe_res.output.len);
    try testing.expectEqual(@as(u8, 0x10), pe_res.output[30]);

    // 0x0B..0x11 EIP-2537 BLS12-381 official vectors
    try runFirstVectorLine(allocator, BLS12_G1ADD_ADDRESS, @embedFile("vectors/eip2537_g1_add.txt"), .OSAKA);
    try runFirstVectorLine(allocator, BLS12_G1MSM_ADDRESS, @embedFile("vectors/eip2537_g1_msm.txt"), .OSAKA);
    try runFirstVectorLine(allocator, BLS12_G2ADD_ADDRESS, @embedFile("vectors/eip2537_g2_add.txt"), .OSAKA);
    try runFirstVectorLine(allocator, BLS12_G2MSM_ADDRESS, @embedFile("vectors/eip2537_g2_msm.txt"), .OSAKA);
    try runFirstVectorLine(allocator, BLS12_PAIRING_ADDRESS, @embedFile("vectors/eip2537_pairing.txt"), .OSAKA);
    try runFirstVectorLine(allocator, BLS12_MAP_FP_TO_G1_ADDRESS, @embedFile("vectors/eip2537_map_fp_to_g1.txt"), .OSAKA);
    try runFirstVectorLine(allocator, BLS12_MAP_FP2_TO_G2_ADDRESS, @embedFile("vectors/eip2537_map_fp2_to_g2.txt"), .OSAKA);

    // 0x0100 EIP-7951 P256VERIFY (Osaka+)
    const p256_in = try firstValidP256Vector();
    const p256_res = try execute(allocator, P256VERIFY_ADDRESS, &p256_in, p256verify.GAS, .OSAKA);
    defer p256_res.deinit(allocator);
    try testing.expectEqual(@as(u64, 6900), p256_res.gas_used);
    try testing.expectEqualSlices(u8, &(@as([31]u8, @splat(0)) ++ [_]u8{1}), p256_res.output);
}
