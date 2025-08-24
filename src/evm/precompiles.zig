/// Ethereum precompiled contracts implementation
/// 
/// Precompiles are special contracts with addresses 0x01-0x0A (and beyond) that provide
/// cryptographic functions and other utilities natively implemented for efficiency:
/// - 0x01: ecRecover - ECDSA signature recovery
/// - 0x02: sha256 - SHA-256 hash function  
/// - 0x03: ripemd160 - RIPEMD-160 hash function
/// - 0x04: identity - data copy function
/// - 0x05: modexp - modular exponentiation
/// - 0x06: ecAdd - BN254 elliptic curve addition
/// - 0x07: ecMul - BN254 elliptic curve multiplication  
/// - 0x08: ecPairing - BN254 pairing check
/// - 0x09: blake2f - BLAKE2F compression function
/// - 0x0A: pointEvaluation - KZG point evaluation (EIP-4844)
/// 
/// These contracts have deterministic gas costs and behavior across all EVM implementations.
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const crypto = @import("crypto");
const build_options = @import("build_options");

/// Precompile addresses (Ethereum mainnet)
pub const ECRECOVER_ADDRESS = primitives.Address.from_u256(1);
pub const SHA256_ADDRESS = primitives.Address.from_u256(2);
pub const RIPEMD160_ADDRESS = primitives.Address.from_u256(3);
pub const IDENTITY_ADDRESS = primitives.Address.from_u256(4);
pub const MODEXP_ADDRESS = primitives.Address.from_u256(5);
pub const ECADD_ADDRESS = primitives.Address.from_u256(6);
pub const ECMUL_ADDRESS = primitives.Address.from_u256(7);
pub const ECPAIRING_ADDRESS = primitives.Address.from_u256(8);
pub const BLAKE2F_ADDRESS = primitives.Address.from_u256(9);
pub const POINT_EVALUATION_ADDRESS = primitives.Address.from_u256(10);

/// Precompile error types
pub const PrecompileError = error{
    InvalidInput,
    OutOfGas,
    ExecutionError,
    OutOfMemory,
    NoSpaceLeft,
    DivisionByZero,
    AllocationFailed,
    NotImplemented,
    InvalidBase,
    InvalidCharacter,
    InvalidLength,
};

/// Precompile output result
pub const PrecompileOutput = struct {
    /// Output data from the precompile
    output: []const u8,
    /// Gas consumed by the precompile
    gas_used: u64,
    /// Whether the precompile succeeded
    success: bool,
};

/// Check if an address is a precompile
pub fn is_precompile(address: Address) bool {
    // Check if the address is one of the known precompile addresses
    // Precompiles are at addresses 0x01 through 0x0A
    // Check if all bytes except the last one are zero
    for (address[0..19]) |byte| {
        if (byte != 0) return false;
    }
    // Check if the last byte is between 1 and 10
    return address[19] >= 1 and address[19] <= 10;
}

/// Execute a precompile based on its address
pub fn execute_precompile(
    allocator: std.mem.Allocator,
    address: Address,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileOutput {
    if (!is_precompile(address)) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = 0,
            .success = false,
        };
    }

    const precompile_id = address[19]; // Last byte is the precompile ID
    return switch (precompile_id) {
        1 => execute_ecrecover(allocator, input, gas_limit),
        2 => execute_sha256(allocator, input, gas_limit),
        3 => execute_ripemd160(allocator, input, gas_limit),
        4 => execute_identity(allocator, input, gas_limit),
        5 => execute_modexp(allocator, input, gas_limit),
        6 => execute_ecadd(allocator, input, gas_limit),
        7 => execute_ecmul(allocator, input, gas_limit),
        8 => execute_ecpairing(allocator, input, gas_limit),
        9 => execute_blake2f(allocator, input, gas_limit),
        10 => execute_point_evaluation(allocator, input, gas_limit),
        else => PrecompileOutput{
            .output = &.{},
            .gas_used = 0,
            .success = false,
        },
    };
}

/// Gas costs for precompiles (in gas units)
pub const GasCosts = struct {
    pub const ECRECOVER = 3000;
    pub const SHA256_BASE = 60;
    pub const SHA256_PER_WORD = 12;
    pub const RIPEMD160_BASE = 600;
    pub const RIPEMD160_PER_WORD = 120;
    pub const IDENTITY_BASE = 15;
    pub const IDENTITY_PER_WORD = 3;
    pub const MODEXP_MIN = 200;
    pub const ECADD = 150;
    pub const ECMUL = 6000;
    pub const ECPAIRING_BASE = 45000;
    pub const ECPAIRING_PER_PAIR = 34000;
    pub const BLAKE2F_PER_ROUND = 1;
    pub const POINT_EVALUATION = 50000;
};

/// 0x01: ecRecover - ECDSA signature recovery
/// Recovers the public key from ECDSA signature and message hash
/// Input: 32 bytes hash + 32 bytes v + 32 bytes r + 32 bytes s (128 bytes total)
/// Output: 32 bytes (20-byte address + 12 zero bytes padding)
pub fn execute_ecrecover(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    const required_gas = GasCosts.ECRECOVER;
    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    // Pad input to exactly 128 bytes if needed
    var padded_input: [128]u8 = [_]u8{0} ** 128;
    const copy_len = @min(input.len, 128);
    @memcpy(padded_input[0..copy_len], input[0..copy_len]);

    // Parse input: hash(32) + v(32) + r(32) + s(32)
    const hash = padded_input[0..32];
    const v_bytes = padded_input[32..64];
    const r_bytes = padded_input[64..96];
    const s_bytes = padded_input[96..128];

    // Parse v - must be 27 or 28
    var v: u8 = 0;
    for (v_bytes) |byte| {
        if (byte != 0) {
            if (v != 0) {
                // Multiple non-zero bytes in v, invalid
                const empty_output = try allocator.alloc(u8, 32);
                @memset(empty_output, 0);
                return PrecompileOutput{
                    .output = empty_output,
                    .gas_used = required_gas,
                    .success = true,
                };
            }
            v = byte;
        }
    }
    
    if (v != 27 and v != 28) {
        const empty_output = try allocator.alloc(u8, 32);
        @memset(empty_output, 0);
        return PrecompileOutput{
            .output = empty_output,
            .gas_used = required_gas,
            .success = true,
        };
    }

    // Parse r and s as u256
    const r = bytesToU256(r_bytes);
    const s = bytesToU256(s_bytes);

    // Convert v to recovery_id (0 or 1)
    const recovery_id = v - 27;

    // Use the actual secp256k1 implementation from crypto module
    const address = crypto.secp256k1.unaudited_recover_address(hash, recovery_id, r, s) catch {
        // Return zero address on recovery failure
        const empty_output = try allocator.alloc(u8, 32);
        @memset(empty_output, 0);
        return PrecompileOutput{
            .output = empty_output,
            .gas_used = required_gas,
            .success = true,
        };
    };

    // Format output: 20-byte address + 12 zero bytes padding
    const output = try allocator.alloc(u8, 32);
    @memset(output, 0);
    @memcpy(output[12..32], &address);

    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

/// 0x02: sha256 - SHA-256 hash function
/// Input: arbitrary bytes
/// Output: 32-byte SHA-256 hash
pub fn execute_sha256(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    const word_count = (input.len + 31) / 32;
    const required_gas = GasCosts.SHA256_BASE + word_count * GasCosts.SHA256_PER_WORD;
    
    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    // Compute SHA-256 hash
    const output = try allocator.alloc(u8, 32);
    var hash: [32]u8 = undefined;
    std.crypto.hash.sha2.Sha256.hash(input, &hash, .{});
    @memcpy(output, &hash);

    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

/// 0x03: ripemd160 - RIPEMD-160 hash function  
/// Input: arbitrary bytes
/// Output: 32-byte result (20-byte RIPEMD-160 hash + 12 zero bytes padding)
pub fn execute_ripemd160(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    const word_count = (input.len + 31) / 32;
    const required_gas = GasCosts.RIPEMD160_BASE + word_count * GasCosts.RIPEMD160_PER_WORD;
    
    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    const output = try allocator.alloc(u8, 32);
    @memset(output, 0);

    // Use the actual RIPEMD160 implementation from crypto module
    var hasher = crypto.ripemd160.RIPEMD160.init();
    hasher.update(input);
    var hash: [20]u8 = undefined;
    hasher.final(&hash);
    
    // Copy the 20-byte hash to the output with 12 bytes of padding at the front
    @memcpy(output[12..32], &hash);

    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

/// 0x04: identity - Data copy function
/// Input: arbitrary bytes
/// Output: exact copy of input
pub fn execute_identity(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    const word_count = (input.len + 31) / 32;
    const required_gas = GasCosts.IDENTITY_BASE + word_count * GasCosts.IDENTITY_PER_WORD;
    
    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    const output = try allocator.dupe(u8, input);
    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

/// 0x05: modexp - Modular exponentiation
/// Input: base_len(32) + exp_len(32) + mod_len(32) + base + exp + mod
/// Output: result of (base^exp) % mod
pub fn execute_modexp(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    if (input.len < 96) {
        const empty_output = try allocator.alloc(u8, 0);
        return PrecompileOutput{
            .output = empty_output,
            .gas_used = GasCosts.MODEXP_MIN,
            .success = true,
        };
    }

    // Parse lengths
    const base_len = bytesToU32(input[0..32]);
    const exp_len = bytesToU32(input[32..64]);
    const mod_len = bytesToU32(input[64..96]);

    // Validate input length
    const expected_len = 96 + base_len + exp_len + mod_len;
    if (input.len < expected_len) {
        const empty_output = try allocator.alloc(u8, 0);
        return PrecompileOutput{
            .output = empty_output,
            .gas_used = GasCosts.MODEXP_MIN,
            .success = true,
        };
    }

    // Extract base, exp, mod
    var offset: usize = 96;
    const base = input[offset..offset + base_len];
    offset += base_len;
    const exp = input[offset..offset + exp_len];
    offset += exp_len;
    const mod = input[offset..offset + mod_len];

    // Handle special cases
    if (mod_len == 0) {
        const empty_output = try allocator.alloc(u8, 0);
        return PrecompileOutput{
            .output = empty_output,
            .gas_used = GasCosts.MODEXP_MIN,
            .success = true,
        };
    }

    // Calculate gas cost (simplified version)
    const max_len = @max(@max(base_len, exp_len), mod_len);
    const complexity = (max_len * max_len) / 64;
    const required_gas = @max(GasCosts.MODEXP_MIN, complexity);

    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    // Perform modular exponentiation
    const output = try allocator.alloc(u8, mod_len);
    
    // Use the actual modexp implementation from crypto module
    crypto.modexp.unaudited_modexp(allocator, base, exp, mod, output) catch {
        // On error, return zeros (following EVM spec)
        @memset(output, 0);
        return PrecompileOutput{
            .output = output,
            .gas_used = required_gas,
            .success = true,
        };
    };

    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

/// 0x06: ecAdd - BN254 elliptic curve addition
/// Input: 128 bytes (x1, y1, x2, y2 as 32-byte big-endian)
/// Output: 64 bytes (x, y coordinates of sum)
pub fn execute_ecadd(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    const required_gas = GasCosts.ECADD;
    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    // Pad input to 128 bytes
    var padded_input: [128]u8 = [_]u8{0} ** 128;
    const copy_len = @min(input.len, 128);
    @memcpy(padded_input[0..copy_len], input[0..copy_len]);

    if (build_options.no_bn254) {
        // BN254 operations disabled - return error
        const output = try allocator.alloc(u8, 64);
        @memset(output, 0);
        return PrecompileOutput{
            .output = output,
            .gas_used = required_gas,
            .success = false,
        };
    }

    // Parse points
    const x1 = bytesToU256(padded_input[0..32]);
    const y1 = bytesToU256(padded_input[32..64]);
    const x2 = bytesToU256(padded_input[64..96]);
    const y2 = bytesToU256(padded_input[96..128]);

    const output = try allocator.alloc(u8, 64);
    
    // TODO: Implement proper BN254 elliptic curve addition
    // For now, return zero point (placeholder implementation)
    _ = x1;
    _ = y1;
    _ = x2;
    _ = y2;
    @memset(output, 0);

    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

/// 0x07: ecMul - BN254 elliptic curve multiplication
/// Input: 96 bytes (x, y, scalar as 32-byte big-endian)
/// Output: 64 bytes (x, y coordinates of product)
pub fn execute_ecmul(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    const required_gas = GasCosts.ECMUL;
    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    // Pad input to 96 bytes
    var padded_input: [96]u8 = [_]u8{0} ** 96;
    const copy_len = @min(input.len, 96);
    @memcpy(padded_input[0..copy_len], input[0..copy_len]);

    if (build_options.no_bn254) {
        // BN254 operations disabled - return error
        const output = try allocator.alloc(u8, 64);
        @memset(output, 0);
        return PrecompileOutput{
            .output = output,
            .gas_used = required_gas,
            .success = false,
        };
    }

    // Parse point and scalar
    const x = bytesToU256(padded_input[0..32]);
    const y = bytesToU256(padded_input[32..64]);
    const scalar = bytesToU256(padded_input[64..96]);

    const output = try allocator.alloc(u8, 64);
    
    // TODO: Implement proper BN254 elliptic curve multiplication
    // For now, return zero point (placeholder implementation)
    _ = x;
    _ = y;
    _ = scalar;
    @memset(output, 0);

    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

/// 0x08: ecPairing - BN254 pairing check
/// Input: pairs of G1 and G2 points (192 bytes per pair)
/// Output: 32 bytes (1 if pairing is valid, 0 otherwise)
pub fn execute_ecpairing(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    if (input.len % 192 != 0) {
        const output = try allocator.alloc(u8, 32);
        @memset(output, 0);
        return PrecompileOutput{
            .output = output,
            .gas_used = GasCosts.ECPAIRING_BASE,
            .success = true,
        };
    }

    const pair_count = input.len / 192;
    const required_gas = GasCosts.ECPAIRING_BASE + pair_count * GasCosts.ECPAIRING_PER_PAIR;
    
    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    if (build_options.no_bn254) {
        // BN254 operations disabled - return error
        const output = try allocator.alloc(u8, 32);
        @memset(output, 0);
        return PrecompileOutput{
            .output = output,
            .gas_used = required_gas,
            .success = false,
        };
    }

    const output = try allocator.alloc(u8, 32);
    @memset(output, 0);

    if (pair_count == 0) {
        // Empty input means pairing is valid
        output[31] = 1;
        return PrecompileOutput{
            .output = output,
            .gas_used = required_gas,
            .success = true,
        };
    }

    // TODO: Implement proper BN254 pairing check
    // For now, return false (placeholder implementation)
    // output[31] remains 0 (false)

    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

/// 0x09: blake2f - BLAKE2F compression function
/// Input: rounds(4) + h(64) + m(128) + t(16) + f(1) = 213 bytes
/// Output: 64 bytes (BLAKE2b state)
pub fn execute_blake2f(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    if (input.len != 213) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = 0,
            .success = false,
        };
    }

    // Parse rounds from first 4 bytes (big-endian)
    const rounds = (@as(u32, input[0]) << 24) | 
                   (@as(u32, input[1]) << 16) | 
                   (@as(u32, input[2]) << 8) | 
                   @as(u32, input[3]);
    
    const required_gas = rounds * GasCosts.BLAKE2F_PER_ROUND;
    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    // Validate final block indicator (must be 0 or 1)
    const f = input[212];
    if (f != 0 and f != 1) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = 0,
            .success = false,
        };
    }

    const output = try allocator.alloc(u8, 64);
    
    // Parse input components
    const h_bytes = input[4..68];   // 64 bytes state (8 x u64)
    const m_bytes = input[68..196]; // 128 bytes message (16 x u64)
    const t_bytes = input[196..212]; // 16 bytes counter (2 x u64)
    
    // Convert bytes to u64 arrays (little-endian as per spec)
    var h: [8]u64 = undefined;
    var m: [16]u64 = undefined;
    var t: [2]u64 = undefined;
    
    for (0..8) |i| {
        h[i] = std.mem.readInt(u64, h_bytes[i * 8..][0..8], .little);
    }
    for (0..16) |i| {
        m[i] = std.mem.readInt(u64, m_bytes[i * 8..][0..8], .little);
    }
    t[0] = std.mem.readInt(u64, t_bytes[0..8], .little);
    t[1] = std.mem.readInt(u64, t_bytes[8..16], .little);
    
    // Use the actual blake2f implementation from crypto module
    crypto.blake2.unaudited_blake2f_compress(&h, &m, t, f != 0, rounds);
    
    // Convert result back to bytes (little-endian)
    for (0..8) |i| {
        std.mem.writeInt(u64, output[i * 8..][0..8], h[i], .little);
    }

    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

/// 0x0A: pointEvaluation - KZG point evaluation (EIP-4844)
/// Input: 192 bytes (versioned_hash + z + y + commitment + proof)
/// Output: 64 bytes (FIELD_ELEMENTS_PER_BLOB + BLS_MODULUS)
pub fn execute_point_evaluation(allocator: std.mem.Allocator, input: []const u8, gas_limit: u64) PrecompileError!PrecompileOutput {
    const required_gas = GasCosts.POINT_EVALUATION;
    if (gas_limit < required_gas) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = gas_limit,
            .success = false,
        };
    }

    if (input.len != 192) {
        return PrecompileOutput{
            .output = &.{},
            .gas_used = required_gas,
            .success = false,
        };
    }

    // For now, return a placeholder implementation
    // Full KZG implementation would require c_kzg library integration
    const output = try allocator.alloc(u8, 64);
    @memset(output, 0);
    
    // Set FIELD_ELEMENTS_PER_BLOB (4096) in first 32 bytes
    output[28] = 0x10; // 4096 in big-endian
    
    // Set BLS_MODULUS in last 32 bytes  
    // 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
    const bls_modulus = [32]u8{
        0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48, 0x33, 0x39, 0xd8, 0x08, 0x09, 0xa1, 0xd8, 0x05,
        0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
    };
    @memcpy(output[32..64], &bls_modulus);

    return PrecompileOutput{
        .output = output,
        .gas_used = required_gas,
        .success = true,
    };
}

// Utility functions for byte manipulation
fn bytesToU256(bytes: []const u8) u256 {
    var result: u256 = 0;
    for (bytes) |byte| {
        result = (result << 8) | byte;
    }
    return result;
}

fn bytesToU32(bytes: []const u8) u32 {
    var result: u32 = 0;
    for (bytes[0..@min(bytes.len, 4)]) |byte| {
        result = (result << 8) | byte;
    }
    return result;
}

fn u256ToBytes(value: u256, output: []u8) void {
    var v = value;
    var i = output.len;
    while (i > 0) {
        i -= 1;
        output[i] = @intCast(v & 0xFF);
        v >>= 8;
    }
}

test "is_precompile detects valid precompile addresses" {
    const testing = std.testing;
    
    // Test valid precompile addresses
    try testing.expect(is_precompile(ECRECOVER_ADDRESS));
    try testing.expect(is_precompile(SHA256_ADDRESS));
    try testing.expect(is_precompile(RIPEMD160_ADDRESS));
    try testing.expect(is_precompile(IDENTITY_ADDRESS));
    try testing.expect(is_precompile(MODEXP_ADDRESS));
    try testing.expect(is_precompile(ECADD_ADDRESS));
    try testing.expect(is_precompile(ECMUL_ADDRESS));
    try testing.expect(is_precompile(ECPAIRING_ADDRESS));
    try testing.expect(is_precompile(BLAKE2F_ADDRESS));
    try testing.expect(is_precompile(POINT_EVALUATION_ADDRESS));
    
    // Test invalid addresses
    try testing.expect(!is_precompile(primitives.Address.from_u256(0)));
    try testing.expect(!is_precompile(primitives.Address.from_u256(11)));
    try testing.expect(!is_precompile(primitives.Address.from_u256(100)));
}

test "execute_identity precompile" {
    const testing = std.testing;
    
    const input = "Hello, World!";
    const result = try execute_identity(testing.allocator, input, 1000);
    defer testing.allocator.free(result.output);
    
    try testing.expect(result.success);
    try testing.expectEqualSlices(u8, input, result.output);
    try testing.expect(result.gas_used == GasCosts.IDENTITY_BASE + GasCosts.IDENTITY_PER_WORD);
}

test "execute_sha256 precompile" {
    const testing = std.testing;
    
    const input = "abc";
    const result = try execute_sha256(testing.allocator, input, 1000);
    defer testing.allocator.free(result.output);
    
    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 32), result.output.len);
    
    // Expected SHA-256 hash of "abc"
    const expected = [_]u8{
        0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde, 0x5d, 0xae, 0x22, 0x23,
        0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad,
    };
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "execute_ecrecover invalid signature" {
    const testing = std.testing;
    
    // Invalid input (all zeros)
    const input = [_]u8{0} ** 128;
    const result = try execute_ecrecover(testing.allocator, &input, GasCosts.ECRECOVER + 100);
    defer testing.allocator.free(result.output);
    
    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 32), result.output.len);
    // Should return all zeros for invalid signature
    for (result.output) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}

test "execute_modexp simple case" {
    const testing = std.testing;
    
    // 3^4 mod 5 = 81 mod 5 = 1
    var input: [128]u8 = [_]u8{0} ** 128;
    
    // base_len = 1 (32 bytes, big-endian)
    input[31] = 1;
    // exp_len = 1 (32 bytes, big-endian)  
    input[63] = 1;
    // mod_len = 1 (32 bytes, big-endian)
    input[95] = 1;
    // base = 3
    input[96] = 3;
    // exp = 4  
    input[97] = 4;
    // mod = 5
    input[98] = 5;
    
    const result = try execute_modexp(testing.allocator, input[0..99], 1000);
    defer testing.allocator.free(result.output);
    
    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 1), result.output.len);
    try testing.expectEqual(@as(u8, 1), result.output[0]);
}

test "execute_blake2f invalid input length" {
    const testing = std.testing;
    
    const input = [_]u8{0} ** 100; // Wrong length
    const result = try execute_blake2f(testing.allocator, &input, 1000);
    
    try testing.expect(!result.success);
    try testing.expectEqual(@as(usize, 0), result.output.len);
}

test "precompile gas cost calculations" {
    const testing = std.testing;
    
    // Test SHA256 gas cost scaling
    const small_input = "a";
    const large_input = "a" ** 100;
    
    const small_result = try execute_sha256(testing.allocator, small_input, 10000);
    defer testing.allocator.free(small_result.output);
    
    const large_result = try execute_sha256(testing.allocator, large_input, 10000);  
    defer testing.allocator.free(large_result.output);
    
    // Large input should cost more gas
    try testing.expect(large_result.gas_used > small_result.gas_used);
}

test "precompile insufficient gas" {
    const testing = std.testing;
    
    const input = "test";
    
    // Test with insufficient gas
    const result = try execute_identity(testing.allocator, input, 5); // Too little gas
    
    try testing.expect(!result.success);
    try testing.expectEqual(@as(usize, 0), result.output.len);
}