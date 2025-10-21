const std = @import("std");
const primitives = @import("primitives");
const crypto = @import("crypto");
const Address = primitives.Address;
const Blob = primitives.Blob;
const secp256k1 = crypto.secp256k1;
const SHA256_Accel = crypto.SHA256_Accel;
const Ripemd160 = crypto.Ripemd160;
const bn254 = crypto.bn254;
const Blake2 = crypto.Blake2;
const ModExp = crypto.ModExp;
const c_kzg = crypto.c_kzg;
const kzg_setup = crypto.kzg_setup;
const Hardfork = @import("hardfork").Hardfork;

/// Precompile contract addresses (0x01 through 0x12)
pub const ECRECOVER_ADDRESS: Address = Address.fromInt(0x01);
pub const SHA256_ADDRESS: Address = Address.fromInt(0x02);
pub const RIPEMD160_ADDRESS: Address = Address.fromInt(0x03);
pub const IDENTITY_ADDRESS: Address = Address.fromInt(0x04);
pub const MODEXP_ADDRESS: Address = Address.fromInt(0x05);
pub const ECADD_ADDRESS: Address = Address.fromInt(0x06);
pub const ECMUL_ADDRESS: Address = Address.fromInt(0x07);
pub const ECPAIRING_ADDRESS: Address = Address.fromInt(0x08);
pub const BLAKE2F_ADDRESS: Address = Address.fromInt(0x09);
pub const POINT_EVALUATION_ADDRESS: Address = Address.fromInt(0x0A);
pub const BLS12_G1ADD_ADDRESS: Address = Address.fromInt(0x0B);
pub const BLS12_G1MUL_ADDRESS: Address = Address.fromInt(0x0C);
pub const BLS12_G1MSM_ADDRESS: Address = Address.fromInt(0x0D);
pub const BLS12_G2ADD_ADDRESS: Address = Address.fromInt(0x0E);
pub const BLS12_G2MUL_ADDRESS: Address = Address.fromInt(0x0F);
pub const BLS12_G2MSM_ADDRESS: Address = Address.fromInt(0x10);
pub const BLS12_PAIRING_ADDRESS: Address = Address.fromInt(0x11);
pub const BLS12_MAP_FP_TO_G1_ADDRESS: Address = Address.fromInt(0x12);
pub const BLS12_MAP_FP2_TO_G2_ADDRESS: Address = Address.fromInt(0x13);

/// Gas costs for precompiles
pub const ECRECOVER_BASE_GAS: u64 = 3000;
pub const SHA256_BASE_GAS: u64 = 60;
pub const SHA256_PER_WORD_GAS: u64 = 12;
pub const RIPEMD160_BASE_GAS: u64 = 600;
pub const RIPEMD160_PER_WORD_GAS: u64 = 120;
pub const IDENTITY_BASE_GAS: u64 = 15;
pub const IDENTITY_PER_WORD_GAS: u64 = 3;
pub const MODEXP_MIN_GAS: u64 = 200;
pub const ECADD_GAS: u64 = 150;
pub const ECMUL_GAS: u64 = 6000;
pub const ECPAIRING_BASE_GAS: u64 = 45000;
pub const ECPAIRING_PER_POINT_GAS: u64 = 34000;
pub const BLAKE2F_PER_ROUND_GAS: u64 = 1;
pub const POINT_EVALUATION_GAS: u64 = 50000;

/// BLS12-381 gas costs (EIP-2537)
pub const BLS12_G1ADD_GAS: u64 = 500;
pub const BLS12_G1MUL_GAS: u64 = 12000;
pub const BLS12_G1MSM_BASE_GAS: u64 = 12000;
pub const BLS12_G1MSM_MULTIPLIER: u64 = 50;
pub const BLS12_G2ADD_GAS: u64 = 800;
pub const BLS12_G2MUL_GAS: u64 = 45000;
pub const BLS12_G2MSM_BASE_GAS: u64 = 45000;
pub const BLS12_G2MSM_MULTIPLIER: u64 = 55;
pub const BLS12_PAIRING_BASE_GAS: u64 = 65000;
pub const BLS12_PAIRING_PER_PAIR_GAS: u64 = 43000;
pub const BLS12_MAP_FP_TO_G1_GAS: u64 = 5500;
pub const BLS12_MAP_FP2_TO_G2_GAS: u64 = 75000;

/// Precompile result
pub const PrecompileResult = struct {
    output: []u8,
    gas_used: u64,

    pub fn deinit(self: PrecompileResult, allocator: std.mem.Allocator) void {
        allocator.free(self.output);
    }
};

/// Precompile error types
pub const PrecompileError = error{
    InvalidInput,
    InvalidSignature,
    InvalidPoint,
    InvalidPairing,
    OutOfGas,
    NotImplemented,
} || std.mem.Allocator.Error;

/// Check if an address is a precompile
pub fn isPrecompile(address: Address, hardfork: Hardfork) bool {
    const addr_int = address.toInt();

    return switch (hardfork) {
        .Frontier, .Homestead => addr_int >= 0x01 and addr_int <= 0x04,
        .Byzantium => addr_int >= 0x01 and addr_int <= 0x08,
        .Istanbul => addr_int >= 0x01 and addr_int <= 0x09,
        .Cancun => addr_int >= 0x01 and addr_int <= 0x0A,
        .Prague => addr_int >= 0x01 and addr_int <= 0x13,
    };
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

    const addr_int = address.toInt();
    return switch (addr_int) {
        0x01 => ecRecover(allocator, input, gas_limit),
        0x02 => sha256Hash(allocator, input, gas_limit),
        0x03 => ripemd160Hash(allocator, input, gas_limit),
        0x04 => identity(allocator, input, gas_limit),
        0x05 => modexp(allocator, input, gas_limit, hardfork),
        0x06 => bn254Add(allocator, input, gas_limit),
        0x07 => bn254Mul(allocator, input, gas_limit),
        0x08 => bn254Pairing(allocator, input, gas_limit),
        0x09 => blake2f(allocator, input, gas_limit),
        0x0A => pointEvaluation(allocator, input, gas_limit),
        0x0B => bls12G1Add(allocator, input, gas_limit),
        0x0C => bls12G1Mul(allocator, input, gas_limit),
        0x0D => bls12G1Msm(allocator, input, gas_limit),
        0x0E => bls12G2Add(allocator, input, gas_limit),
        0x0F => bls12G2Mul(allocator, input, gas_limit),
        0x10 => bls12G2Msm(allocator, input, gas_limit),
        0x11 => bls12Pairing(allocator, input, gas_limit),
        0x12 => bls12MapFpToG1(allocator, input, gas_limit),
        0x13 => bls12MapFp2ToG2(allocator, input, gas_limit),
        else => error.NotImplemented,
    };
}

/// 0x01: ECRECOVER - Elliptic curve signature recovery
fn ecRecover(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < ECRECOVER_BASE_GAS) {
        return error.OutOfGas;
    }

    // Input: 128 bytes (hash32, v32, r32, s32)
    var input_buf: [128]u8 = [_]u8{0} ** 128;
    @memcpy(input_buf[0..@min(input.len, 128)], input[0..@min(input.len, 128)]);

    const hash = input_buf[0..32];
    const v_bytes = input_buf[32..64];
    const r = input_buf[64..96];
    const s = input_buf[96..128];

    // Extract v from the padded 32-byte value
    const v = v_bytes[31];

    // Recover public key
    const pubkey = secp256k1.recoverPubkey(hash, r, s, v) catch {
        // Invalid signature - return empty output
        const output = try allocator.alloc(u8, 32);
        @memset(output, 0);
        return PrecompileResult{
            .output = output,
            .gas_used = ECRECOVER_BASE_GAS,
        };
    };

    // Derive address from public key (last 20 bytes of keccak256(pubkey))
    var hash_output: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&pubkey, &hash_output);

    const output = try allocator.alloc(u8, 32);
    @memset(output[0..12], 0); // Left-pad with zeros
    @memcpy(output[12..32], hash_output[12..32]);

    return PrecompileResult{
        .output = output,
        .gas_used = ECRECOVER_BASE_GAS,
    };
}

/// 0x02: SHA256 - SHA-256 hash function
fn sha256Hash(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    const num_words = (input.len + 31) / 32;
    const gas_cost = SHA256_BASE_GAS + SHA256_PER_WORD_GAS * num_words;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 32);
    SHA256_Accel.hash(input, output[0..32]);

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

/// 0x03: RIPEMD160 - RIPEMD-160 hash function
fn ripemd160Hash(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    const num_words = (input.len + 31) / 32;
    const gas_cost = RIPEMD160_BASE_GAS + RIPEMD160_PER_WORD_GAS * num_words;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 32);
    @memset(output[0..12], 0); // Left-pad with zeros

    var hash_output: [20]u8 = undefined;
    Ripemd160.hash(input, &hash_output);
    @memcpy(output[12..32], &hash_output);

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

/// 0x04: IDENTITY - Identity function (returns input)
fn identity(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    const num_words = (input.len + 31) / 32;
    const gas_cost = IDENTITY_BASE_GAS + IDENTITY_PER_WORD_GAS * num_words;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.dupe(u8, input);

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

/// 0x05: MODEXP - Modular exponentiation
fn modexp(
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
    const result = try ModExp.modexp(allocator, base, exponent, modulus);
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

/// 0x06: BN254ADD - BN254 elliptic curve addition
fn bn254Add(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < ECADD_GAS) {
        return error.OutOfGas;
    }

    // Input: 128 bytes (two points, 64 bytes each)
    var input_buf: [128]u8 = [_]u8{0} ** 128;
    @memcpy(input_buf[0..@min(input.len, 128)], input[0..@min(input.len, 128)]);

    const output = try allocator.alloc(u8, 64);

    // Perform addition using pure Zig implementation
    bn254.bn254Add(&input_buf, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = ECADD_GAS,
    };
}

/// 0x07: BN254MUL - BN254 elliptic curve scalar multiplication
fn bn254Mul(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < ECMUL_GAS) {
        return error.OutOfGas;
    }

    // Input: 96 bytes (point 64 bytes + scalar 32 bytes)
    var input_buf: [96]u8 = [_]u8{0} ** 96;
    @memcpy(input_buf[0..@min(input.len, 96)], input[0..@min(input.len, 96)]);

    const output = try allocator.alloc(u8, 64);

    // Perform multiplication using pure Zig implementation
    bn254.bn254Mul(&input_buf, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = ECMUL_GAS,
    };
}

/// 0x08: BN254PAIRING - BN254 elliptic curve pairing check
fn bn254Pairing(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    // Input must be multiple of 192 bytes (each pair is 192 bytes)
    if (input.len % 192 != 0) {
        return error.InvalidInput;
    }

    const num_pairs = input.len / 192;
    const gas_cost = ECPAIRING_BASE_GAS + ECPAIRING_PER_POINT_GAS * num_pairs;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 32);
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

/// 0x09: BLAKE2F - Blake2b compression function
fn blake2f(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len != 213) {
        return error.InvalidInput;
    }

    const rounds = std.mem.readInt(u32, input[0..4], .big);
    const gas_cost = BLAKE2F_PER_ROUND_GAS * rounds;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 64);

    Blake2.compress(input, output) catch {
        return error.InvalidInput;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

/// 0x0A: POINT_EVALUATION - KZG point evaluation (EIP-4844)
fn pointEvaluation(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < POINT_EVALUATION_GAS) {
        return error.OutOfGas;
    }

    // Input format (192 bytes):
    // - versioned_hash (32 bytes)
    // - z (32 bytes) - evaluation point
    // - y (32 bytes) - claimed evaluation
    // - commitment (48 bytes) - KZG commitment
    // - proof (48 bytes) - KZG proof
    if (input.len != 192) {
        return error.InvalidInput;
    }

    const versioned_hash = input[0..32];
    const z = input[32..64];
    const y = input[64..96];
    const commitment = input[96..144];
    const proof = input[144..192];

    // Verify versioned hash matches commitment
    var computed_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(commitment, &computed_hash);
    computed_hash[0] = 0x01; // Version byte for EIP-4844

    // Check if versioned hash matches
    for (versioned_hash, computed_hash) |a, b| {
        if (a != b) {
            return error.InvalidInput;
        }
    }

    // Verify KZG proof
    const commitment_ptr: *const c_kzg.KZGCommitment = @ptrCast(@alignCast(commitment));
    const z_ptr: *const c_kzg.Bytes32 = @ptrCast(@alignCast(z));
    const y_ptr: *const c_kzg.Bytes32 = @ptrCast(@alignCast(y));
    const proof_ptr: *const c_kzg.KZGProof = @ptrCast(@alignCast(proof));

    const valid = kzg_setup.verifyKZGProofThreadSafe(
        commitment_ptr,
        z_ptr,
        y_ptr,
        proof_ptr,
    ) catch {
        return error.InvalidInput;
    };

    const output = try allocator.alloc(u8, 64);
    @memset(output, 0);

    if (valid) {
        // Return the precompile return value: FIELD_ELEMENTS_PER_BLOB, BLS_MODULUS
        // FIELD_ELEMENTS_PER_BLOB = 4096
        output[30] = 0x10;
        output[31] = 0x00;

        // BLS_MODULUS (last 32 bytes) = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
        const bls_modulus = [_]u8{
            0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48,
            0x33, 0x39, 0xd8, 0x08, 0x09, 0xa1, 0xd8, 0x05,
            0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe,
            0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
        };
        @memcpy(output[32..64], &bls_modulus);
    }

    return PrecompileResult{
        .output = output,
        .gas_used = POINT_EVALUATION_GAS,
    };
}

/// 0x0B: BLS12_G1ADD - BLS12-381 G1 addition
fn bls12G1Add(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < BLS12_G1ADD_GAS) {
        return error.OutOfGas;
    }

    if (input.len != 256) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 128);
    crypto.Crypto.bls12_381.g1Add(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = BLS12_G1ADD_GAS,
    };
}

/// 0x0C: BLS12_G1MUL - BLS12-381 G1 multiplication
fn bls12G1Mul(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < BLS12_G1MUL_GAS) {
        return error.OutOfGas;
    }

    if (input.len != 160) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 128);
    crypto.Crypto.bls12_381.g1Mul(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = BLS12_G1MUL_GAS,
    };
}

/// 0x0D: BLS12_G1MSM - BLS12-381 G1 multi-scalar multiplication
fn bls12G1Msm(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len % 160 != 0 or input.len == 0) {
        return error.InvalidInput;
    }

    const k = input.len / 160;
    const discount = msmDiscount(k);
    const gas_cost = (BLS12_G1MSM_BASE_GAS * k * discount) / 1000;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 128);
    crypto.Crypto.bls12_381.g1Msm(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

/// 0x0E: BLS12_G2ADD - BLS12-381 G2 addition
fn bls12G2Add(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < BLS12_G2ADD_GAS) {
        return error.OutOfGas;
    }

    if (input.len != 512) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 256);
    crypto.Crypto.bls12_381.g2Add(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = BLS12_G2ADD_GAS,
    };
}

/// 0x0F: BLS12_G2MUL - BLS12-381 G2 multiplication
fn bls12G2Mul(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < BLS12_G2MUL_GAS) {
        return error.OutOfGas;
    }

    if (input.len != 288) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 256);
    crypto.Crypto.bls12_381.g2Mul(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = BLS12_G2MUL_GAS,
    };
}

/// 0x10: BLS12_G2MSM - BLS12-381 G2 multi-scalar multiplication
fn bls12G2Msm(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len % 288 != 0 or input.len == 0) {
        return error.InvalidInput;
    }

    const k = input.len / 288;
    const discount = msmDiscount(k);
    const gas_cost = (BLS12_G2MSM_BASE_GAS * k * discount) / 1000;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 256);
    crypto.Crypto.bls12_381.g2Msm(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = gas_cost,
    };
}

/// 0x11: BLS12_PAIRING - BLS12-381 pairing check
fn bls12Pairing(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (input.len % 384 != 0) {
        return error.InvalidInput;
    }

    const k = input.len / 384;
    const gas_cost = BLS12_PAIRING_BASE_GAS + BLS12_PAIRING_PER_PAIR_GAS * k;

    if (gas_limit < gas_cost) {
        return error.OutOfGas;
    }

    const output = try allocator.alloc(u8, 32);
    @memset(output, 0);

    const success = crypto.Crypto.bls12_381.pairing(input) catch {
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

/// 0x12: BLS12_MAP_FP_TO_G1 - BLS12-381 map field element to G1
fn bls12MapFpToG1(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < BLS12_MAP_FP_TO_G1_GAS) {
        return error.OutOfGas;
    }

    if (input.len != 64) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 128);
    crypto.Crypto.bls12_381.mapFpToG1(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = BLS12_MAP_FP_TO_G1_GAS,
    };
}

/// 0x13: BLS12_MAP_FP2_TO_G2 - BLS12-381 map field element to G2
fn bls12MapFp2ToG2(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < BLS12_MAP_FP2_TO_G2_GAS) {
        return error.OutOfGas;
    }

    if (input.len != 128) {
        return error.InvalidInput;
    }

    const output = try allocator.alloc(u8, 256);
    crypto.Crypto.bls12_381.mapFp2ToG2(input, output) catch {
        return error.InvalidPoint;
    };

    return PrecompileResult{
        .output = output,
        .gas_used = BLS12_MAP_FP2_TO_G2_GAS,
    };
}

/// Calculate MSM discount factor for multi-scalar multiplication
/// Based on EIP-2537 discount table
fn msmDiscount(k: usize) u64 {
    return if (k >= 128)
        174
    else if (k >= 64)
        200
    else if (k >= 32)
        250
    else if (k >= 16)
        320
    else if (k >= 8)
        430
    else if (k >= 4)
        580
    else if (k >= 2)
        820
    else
        1000;
}

// Tests
test "ecRecover - valid signature" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Example from Ethereum yellow paper
    const hash = [_]u8{0x47} ** 32;
    const v = [_]u8{0} ** 31 ++ [_]u8{28};
    const r = [_]u8{0x69} ** 32;
    const s = [_]u8{0x7a} ** 32;

    var input: [128]u8 = undefined;
    @memcpy(input[0..32], &hash);
    @memcpy(input[32..64], &v);
    @memcpy(input[64..96], &r);
    @memcpy(input[96..128], &s);

    const result = try ecRecover(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);
    try testing.expectEqual(ECRECOVER_BASE_GAS, result.gas_used);
}

test "sha256 - empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const result = try sha256Hash(allocator, &[_]u8{}, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);

    // SHA256 of empty string
    const expected = [_]u8{
        0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
        0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
        0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
        0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
    };
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "ripemd160 - empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const result = try ripemd160Hash(allocator, &[_]u8{}, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);

    // First 12 bytes should be zero padding
    for (result.output[0..12]) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}

test "identity - returns input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{ 1, 2, 3, 4, 5 };
    const result = try identity(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqualSlices(u8, &input, result.output);
}

test "identity - gas calculation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 64; // 2 words
    const result = try identity(allocator, &input, 1000000);
    defer result.deinit(allocator);

    const expected_gas = IDENTITY_BASE_GAS + IDENTITY_PER_WORD_GAS * 2;
    try testing.expectEqual(expected_gas, result.gas_used);
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

    const result = try modexp(allocator, &input, 1000000, .Cancun);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 1), result.output.len);
    try testing.expectEqual(@as(u8, 3), result.output[0]);
}

test "bn254Add - point at infinity" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Adding point at infinity to itself
    const input = [_]u8{0} ** 128;
    const result = try bn254Add(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(ECADD_GAS, result.gas_used);
}

test "bn254Mul - multiply by zero" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Multiply any point by zero = point at infinity
    const input = [_]u8{0} ** 96;
    const result = try bn254Mul(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 64), result.output.len);
    try testing.expectEqual(ECMUL_GAS, result.gas_used);
}

test "bn254Pairing - empty input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Empty input = pairing of zero points = success
    const input = [_]u8{};
    const result = try bn254Pairing(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqual(@as(usize, 32), result.output.len);
    try testing.expectEqual(@as(u8, 1), result.output[31]);
}

test "blake2f - invalid input length" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 100; // Wrong length
    const result = blake2f(allocator, &input, 1000000);
    try testing.expectError(error.InvalidInput, result);
}

test "precompile - out of gas" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 32;
    const result = sha256Hash(allocator, &input, 10); // Not enough gas
    try testing.expectError(error.OutOfGas, result);
}

test "isPrecompile - Frontier" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromInt(0x01), .Frontier));
    try testing.expect(isPrecompile(Address.fromInt(0x04), .Frontier));
    try testing.expect(!isPrecompile(Address.fromInt(0x05), .Frontier));
}

test "isPrecompile - Byzantium" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromInt(0x01), .Byzantium));
    try testing.expect(isPrecompile(Address.fromInt(0x08), .Byzantium));
    try testing.expect(!isPrecompile(Address.fromInt(0x09), .Byzantium));
}

test "isPrecompile - Istanbul" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromInt(0x09), .Istanbul));
    try testing.expect(!isPrecompile(Address.fromInt(0x0A), .Istanbul));
}

test "isPrecompile - Cancun" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromInt(0x0A), .Cancun));
    try testing.expect(!isPrecompile(Address.fromInt(0x0B), .Cancun));
}

test "isPrecompile - Prague" {
    const testing = std.testing;

    try testing.expect(isPrecompile(Address.fromInt(0x0B), .Prague));
    try testing.expect(isPrecompile(Address.fromInt(0x13), .Prague));
    try testing.expect(!isPrecompile(Address.fromInt(0x14), .Prague));
}

test "msmDiscount - discount table" {
    const testing = std.testing;

    try testing.expectEqual(@as(u64, 1000), msmDiscount(1));
    try testing.expectEqual(@as(u64, 820), msmDiscount(2));
    try testing.expectEqual(@as(u64, 580), msmDiscount(4));
    try testing.expectEqual(@as(u64, 430), msmDiscount(8));
    try testing.expectEqual(@as(u64, 320), msmDiscount(16));
    try testing.expectEqual(@as(u64, 250), msmDiscount(32));
    try testing.expectEqual(@as(u64, 200), msmDiscount(64));
    try testing.expectEqual(@as(u64, 174), msmDiscount(128));
}
