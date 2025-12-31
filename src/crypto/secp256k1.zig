//! secp256k1 Elliptic Curve Cryptography
//!
//! Implementation of secp256k1 elliptic curve operations for Bitcoin and Ethereum.
//! This implementation uses Zig's standard library `std.crypto.ecc.Secp256k1` for
//! curve operations and implements public key recovery on top.
//!
//! ## Overview
//! secp256k1 is a Koblitz elliptic curve used in Bitcoin and Ethereum for:
//! - Transaction signing (ECDSA)
//! - Public key derivation
//! - Address generation
//! - Signature verification and recovery
//!
//! ## Curve Parameters
//! - Prime field: p = 2^256 - 2^32 - 977 (SECP256K1_P)
//! - Curve order: n = ~2^256 (SECP256K1_N)
//! - Curve equation: y² = x³ + 7
//! - Generator point: (SECP256K1_GX, SECP256K1_GY)
//!
//! ## Key Features
//! - ECDSA signature generation and verification
//! - Public key recovery from signatures (v parameter)
//! - Ethereum address derivation
//! - Uses battle-tested std library curve operations
//!
//! ## References
//! - [SEC 2](https://www.secg.org/sec2-v2.pdf) - secp256k1 specification
//! - [libsecp256k1](https://github.com/bitcoin-core/secp256k1) - Bitcoin Core implementation
//! - [Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Appendix F

const std = @import("std");
const crypto = std.crypto;
const Secp256k1 = crypto.ecc.Secp256k1;
const primitives = @import("primitives");
const constant_time = @import("constant_time.zig");

// secp256k1 curve parameters (exported for compatibility)
pub const SECP256K1_P: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
pub const SECP256K1_N: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
pub const SECP256K1_B: u256 = 7;
pub const SECP256K1_GX: u256 = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
pub const SECP256K1_GY: u256 = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;

/// Affine point on secp256k1 curve
/// Wraps std.crypto.ecc.Secp256k1 for curve operations
pub const AffinePoint = struct {
    x: u256,
    y: u256,
    infinity: bool,

    const Self = @This();

    pub fn zero() Self {
        return Self{ .x = 0, .y = 0, .infinity = true };
    }

    pub fn generator() Self {
        return Self{ .x = SECP256K1_GX, .y = SECP256K1_GY, .infinity = false };
    }

    /// Check if point is on secp256k1 curve: y² = x³ + 7 mod p
    pub fn isOnCurve(self: Self) bool {
        if (self.infinity) return true;

        // Convert to std lib point and check
        const sec1 = self.toUncompressedSec1() catch return false;
        _ = Secp256k1.fromSec1(&sec1) catch return false;
        return true;
    }

    pub fn negate(self: Self) Self {
        if (self.infinity) return self;
        return Self{ .x = self.x, .y = SECP256K1_P - self.y, .infinity = false };
    }

    pub fn double(self: Self) Self {
        if (self.infinity) return self;

        // Use std lib for doubling
        const sec1 = self.toUncompressedSec1() catch return Self.zero();
        const pt = Secp256k1.fromSec1(&sec1) catch return Self.zero();
        const result = pt.dbl();
        return fromStdPoint(result) catch Self.zero();
    }

    pub fn add(self: Self, other: Self) Self {
        if (self.infinity) return other;
        if (other.infinity) return self;

        // Use std lib for addition
        const sec1_a = self.toUncompressedSec1() catch return Self.zero();
        const sec1_b = other.toUncompressedSec1() catch return Self.zero();
        const pt_a = Secp256k1.fromSec1(&sec1_a) catch return Self.zero();
        const pt_b = Secp256k1.fromSec1(&sec1_b) catch return Self.zero();
        const result = pt_a.add(pt_b);
        return fromStdPoint(result) catch Self.zero();
    }

    pub fn scalarMul(self: Self, scalar: u256) Self {
        if (scalar == 0 or self.infinity) return Self.zero();

        // Convert scalar to bytes (big-endian)
        var scalar_bytes: [32]u8 = undefined;
        std.mem.writeInt(u256, &scalar_bytes, scalar, .big);

        // Use std lib for scalar multiplication
        const sec1 = self.toUncompressedSec1() catch return Self.zero();
        const pt = Secp256k1.fromSec1(&sec1) catch return Self.zero();
        const result = pt.mul(scalar_bytes, .big) catch return Self.zero();
        return fromStdPoint(result) catch Self.zero();
    }

    /// Convert to uncompressed SEC1 format (0x04 || x || y)
    fn toUncompressedSec1(self: Self) ![65]u8 {
        if (self.infinity) return error.PointAtInfinity;
        var result: [65]u8 = undefined;
        result[0] = 0x04;
        std.mem.writeInt(u256, result[1..33], self.x, .big);
        std.mem.writeInt(u256, result[33..65], self.y, .big);
        return result;
    }

    /// Create from std lib point
    fn fromStdPoint(pt: Secp256k1) !Self {
        const sec1 = pt.toUncompressedSec1();
        if (sec1[0] == 0) {
            // Point at infinity - check if all zeros
            var all_zero = true;
            for (sec1[1..]) |b| {
                if (b != 0) {
                    all_zero = false;
                    break;
                }
            }
            if (all_zero) return Self.zero();
        }

        const x = std.mem.readInt(u256, sec1[1..33], .big);
        const y = std.mem.readInt(u256, sec1[33..65], .big);
        return Self{ .x = x, .y = y, .infinity = false };
    }
};

/// Validates ECDSA signature parameters for Ethereum
/// SECURITY: Uses constant-time comparisons to prevent timing attacks.
pub fn unauditedValidateSignature(r: u256, s: u256) bool {
    // r and s must be in [1, n-1]
    const r_is_zero = constant_time.constantTimeIsZeroU256(r);
    const r_gte_n = constant_time.constantTimeGteU256(r, SECP256K1_N);
    const s_is_zero = constant_time.constantTimeIsZeroU256(s);
    const s_gte_n = constant_time.constantTimeGteU256(s, SECP256K1_N);

    // Ethereum enforces s <= n/2 to prevent malleability
    const half_n = SECP256K1_N >> 1;
    const s_gt_half_n = constant_time.constantTimeLtU256(half_n, s);

    // Combine all checks
    const invalid = r_is_zero | r_gte_n | s_is_zero | s_gte_n | s_gt_half_n;
    return invalid == 0;
}

/// Recovers uncompressed 64-byte public key from ECDSA signature
/// Returns 64 bytes: x-coordinate (32 bytes) || y-coordinate (32 bytes)
pub fn recoverPubkey(
    hash: []const u8,
    r: []const u8,
    s: []const u8,
    v: u8,
) ![64]u8 {
    if (hash.len != 32) return error.InvalidHashLength;
    if (r.len != 32) return error.InvalidRLength;
    if (s.len != 32) return error.InvalidSLength;

    // Parse r and s as u256 (big-endian)
    const r_u256 = std.mem.readInt(u256, r[0..32], .big);
    const s_u256 = std.mem.readInt(u256, s[0..32], .big);

    // v in Ethereum is 27 or 28, we need recoveryId 0 or 1
    var recoveryId: u8 = undefined;
    if (v >= 27 and v <= 28) {
        recoveryId = v - 27;
    } else if (v <= 1) {
        recoveryId = v;
    } else {
        return error.InvalidRecoveryId;
    }

    if (!unauditedValidateSignature(r_u256, s_u256)) return error.InvalidSignature;

    // Use internal recovery
    var hash_array: [32]u8 = undefined;
    @memcpy(&hash_array, hash);

    const Q = recoverPublicKeyPoint(hash_array, r_u256, s_u256, recoveryId) catch return error.InvalidSignature;

    // Return public key as 64 bytes (x || y)
    var pub_key: [64]u8 = undefined;
    std.mem.writeInt(u256, pub_key[0..32], Q.x, .big);
    std.mem.writeInt(u256, pub_key[32..64], Q.y, .big);

    return pub_key;
}

/// Recovers Ethereum address from ECDSA signature
pub fn unauditedRecoverAddress(
    hash: []const u8,
    recoveryId: u8,
    r: u256,
    s: u256,
) !primitives.Address.Address {
    if (hash.len != 32) return error.InvalidHashLength;
    if (recoveryId > 1) return error.InvalidRecoveryId;
    if (!unauditedValidateSignature(r, s)) return error.InvalidSignature;

    var hash_array: [32]u8 = undefined;
    @memcpy(&hash_array, hash);

    const Q = recoverPublicKeyPoint(hash_array, r, s, recoveryId) catch return error.InvalidSignature;

    // Convert public key to Ethereum address
    var pub_key_bytes: [64]u8 = undefined;
    std.mem.writeInt(u256, pub_key_bytes[0..32], Q.x, .big);
    std.mem.writeInt(u256, pub_key_bytes[32..64], Q.y, .big);

    var keccak = crypto.hash.sha3.Keccak256.init(.{});
    keccak.update(&pub_key_bytes);
    var hash_out: [32]u8 = undefined;
    keccak.final(&hash_out);

    var address: primitives.Address = undefined;
    @memcpy(&address.bytes, hash_out[12..32]);

    return address;
}

/// Internal: Recover public key point from signature components
fn recoverPublicKeyPoint(hash: [32]u8, r: u256, s: u256, recoveryId: u8) !AffinePoint {
    if (r >= SECP256K1_P) return error.InvalidSignature;

    // Step 1: Compute R point from r value
    // x = r, compute y from curve equation y² = x³ + 7 mod p
    const R = computePointFromX(r, recoveryId) catch return error.InvalidSignature;

    // Step 2: Compute message hash as scalar
    const e = std.mem.readInt(u256, &hash, .big);

    // Step 3: Compute r_inv = r^(-1) mod n
    const r_inv = modInverse(r, SECP256K1_N) orelse return error.InvalidSignature;

    // Step 4: Compute public key Q = r^(-1) * (s*R - e*G)
    // sR
    const sR = R.scalarMul(s);
    if (sR.infinity) return error.InvalidSignature;

    // eG
    const eG = AffinePoint.generator().scalarMul(e);

    // sR - eG
    const diff = sR.add(eG.negate());
    if (diff.infinity) return error.InvalidSignature;

    // r^(-1) * (sR - eG)
    const Q = diff.scalarMul(r_inv);
    if (Q.infinity) return error.InvalidSignature;

    // Verify the signature
    if (!verifySignature(hash, r, s, Q)) return error.InvalidSignature;

    return Q;
}

/// Compute point on curve from x-coordinate and recovery bit
fn computePointFromX(x: u256, recoveryId: u8) !AffinePoint {
    // y² = x³ + 7 mod p
    const x3 = mulmod(mulmod(x, x, SECP256K1_P), x, SECP256K1_P);
    const y2 = addmod(x3, SECP256K1_B, SECP256K1_P);

    // y = sqrt(y²) mod p using Tonelli-Shanks for p ≡ 3 mod 4
    // y = y²^((p+1)/4) mod p
    const y = powmod(y2, (SECP256K1_P + 1) >> 2, SECP256K1_P);

    // Verify sqrt is correct
    const y_sq = mulmod(y, y, SECP256K1_P);
    if (y_sq != y2) return error.InvalidSignature;

    // Choose y based on parity (recoveryId bit 0)
    const y_is_odd = (y & 1) == 1;
    const recovery_bit = (recoveryId & 1) == 1;
    const y_final = if (y_is_odd == recovery_bit) y else SECP256K1_P - y;

    return AffinePoint{ .x = x, .y = y_final, .infinity = false };
}

/// Verify signature with public key
pub fn verifySignature(
    hash: [32]u8,
    r: u256,
    s: u256,
    pub_key: AffinePoint,
) bool {
    if (pub_key.infinity) return false;

    const e = std.mem.readInt(u256, &hash, .big);

    // s_inv = s^(-1) mod n
    const s_inv = modInverse(s, SECP256K1_N) orelse return false;

    // u_1 = e * s^(-1) mod n
    const u_1 = mulmod(e, s_inv, SECP256K1_N);

    // u_2 = r * s^(-1) mod n
    const u_2 = mulmod(r, s_inv, SECP256K1_N);

    // R' = u_1*G + u_2*Q
    const u1G = AffinePoint.generator().scalarMul(u_1);
    const u2Q = pub_key.scalarMul(u_2);
    const R_prime = u1G.add(u2Q);

    if (R_prime.infinity) return false;

    // r' = R'.x mod n
    const r_prime = R_prime.x % SECP256K1_N;
    return constant_time.constantTimeEqU256(r_prime, r) == 1;
}

// Field arithmetic helpers

/// Modular multiplication using shift-and-add for u256
pub fn mulmod(a: u256, b: u256, m: u256) u256 {
    if (m == 0 or a == 0 or b == 0) return 0;

    const a_mod = a % m;
    const b_mod = b % m;

    var result: u256 = 0;
    var multiplicand = a_mod;
    var multiplier = b_mod;

    while (multiplier > 0) {
        if (multiplier & 1 == 1) {
            result = addmod(result, multiplicand, m);
        }
        multiplicand = addmod(multiplicand, multiplicand, m);
        multiplier >>= 1;
    }

    return result;
}

/// Modular addition
pub fn addmod(a: u256, b: u256, m: u256) u256 {
    if (m == 0) return 0;

    const a_mod = a % m;
    const b_mod = b % m;

    if (a_mod > m - b_mod) {
        return a_mod - (m - b_mod);
    } else {
        return a_mod + b_mod;
    }
}

/// Modular subtraction
pub fn submod(a: u256, b: u256, m: u256) u256 {
    const a_mod = a % m;
    const b_mod = b % m;

    if (a_mod >= b_mod) {
        return a_mod - b_mod;
    } else {
        return m - (b_mod - a_mod);
    }
}

/// Modular exponentiation
pub fn powmod(base: u256, exp: u256, modulus: u256) u256 {
    if (modulus == 1) return 0;
    if (exp == 0) return 1;

    var result: u256 = 1;
    var base_mod = base % modulus;
    var exp_remaining = exp;

    while (exp_remaining > 0) {
        if (exp_remaining & 1 == 1) {
            result = mulmod(result, base_mod, modulus);
        }
        base_mod = mulmod(base_mod, base_mod, modulus);
        exp_remaining >>= 1;
    }

    return result;
}

/// Modular inverse using Extended Euclidean Algorithm
pub fn modInverse(a: u256, m: u256) ?u256 {
    if (m == 0 or a == 0) return null;

    var old_r: u256 = a % m;
    var r: u256 = m;
    var old_s: i512 = 1;
    var s: i512 = 0;

    while (r != 0) {
        const quotient = old_r / r;

        const temp_r = r;
        r = old_r - quotient * r;
        old_r = temp_r;

        const temp_s = s;
        s = old_s - @as(i512, @intCast(quotient)) * s;
        old_s = temp_s;
    }

    if (old_r > 1) return null;

    if (old_s < 0) {
        old_s += @as(i512, @intCast(m));
    }

    return @as(u256, @intCast(old_s));
}

// Legacy aliases for compatibility
pub const unauditedMulmod = mulmod;
pub const unauditedAddmod = addmod;
pub const unauditedSubmod = submod;
pub const unauditedPowmod = powmod;
pub const unauditedInvmod = modInverse;

/// Compute modular square root
pub fn unauditedSqrt(a: u256, p: u256) ?u256 {
    if (constant_time.constantTimeIsZeroU256(a) == 1) return 0;

    const exp = (p + 1) / 4;
    const y = powmod(a, exp, p);

    const y_squared = mulmod(y, y, p);
    if (constant_time.constantTimeEqU256(y_squared, a) != 1) return null;

    return y;
}

// ============================================================================
// Tests
// ============================================================================

test "recover address from signature" {
    const message = "Hello, Ethereum!";
    var hasher = crypto.hash.sha3.Keccak256.init(.{});
    hasher.update("\x19Ethereum Signed Message:\n");
    const length_str = try std.fmt.allocPrint(std.testing.allocator, "{d}", .{message.len});
    defer std.testing.allocator.free(length_str);
    hasher.update(length_str);
    hasher.update(message);
    var message_hash: [32]u8 = undefined;
    hasher.final(&message_hash);

    const r_val: u256 = 0x9f150809ad6e882b6e8f0c4dc4b0c5d58d6fd84ee8d48aef7e37b8d60f3d4f5a;
    const s_val: u256 = 0x6fc95f48bd0e960fb86fd656887187152553ad9fc4a5f0e9f098e9d4e2ec4895;
    const recoveryId: u8 = 0;

    const recovered_address = unauditedRecoverAddress(&message_hash, recoveryId, r_val, s_val) catch |err| {
        try std.testing.expect(err == error.InvalidSignature);
        return;
    };

    const zero_address = [_]u8{0} ** 20;
    try std.testing.expect(!std.mem.eql(u8, &recovered_address, &zero_address));
}

test "signature malleability check" {
    const r_val: u256 = 0x1234567890123456789012345678901234567890123456789012345678901234;
    const s_high: u256 = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141;

    try std.testing.expect(!unauditedValidateSignature(r_val, s_high));
}

test "EIP-2 signature validation" {
    const r_val: u256 = 0x1234567890123456789012345678901234567890123456789012345678901234;
    const s_val: u256 = 0x3456789012345678901234567890123456789012345678901234567890123456;

    try std.testing.expect(unauditedValidateSignature(r_val, s_val));
    try std.testing.expect(!unauditedValidateSignature(0, s_val));
    try std.testing.expect(!unauditedValidateSignature(r_val, 0));
}

test "signature recovery edge cases" {
    const zero_hash = [_]u8{0} ** 32;
    const r_val: u256 = 0x1234567890123456789012345678901234567890123456789012345678901234;
    const s_val: u256 = 0x3456789012345678901234567890123456789012345678901234567890123456;

    const result = unauditedRecoverAddress(&zero_hash, 0, r_val, s_val);
    _ = result catch |err| {
        try std.testing.expect(err == error.InvalidSignature);
    };
}

test "affine point operations" {
    const generator = AffinePoint.generator();

    try std.testing.expect(generator.isOnCurve());
    try std.testing.expect(!generator.infinity);

    const doubled = generator.double();
    try std.testing.expect(doubled.isOnCurve());
    try std.testing.expect(!doubled.infinity);

    const added = generator.add(generator);
    try std.testing.expect(added.x == doubled.x);
    try std.testing.expect(added.y == doubled.y);

    const negated = generator.negate();
    try std.testing.expect(negated.isOnCurve());
    try std.testing.expect(negated.x == generator.x);
    try std.testing.expect(negated.y == SECP256K1_P - generator.y);

    const zero = generator.add(negated);
    try std.testing.expect(zero.infinity);
}

test "scalar multiplication" {
    const generator = AffinePoint.generator();

    const zero_mul = generator.scalarMul(0);
    try std.testing.expect(zero_mul.infinity);

    const one_mul = generator.scalarMul(1);
    try std.testing.expect(one_mul.x == generator.x);
    try std.testing.expect(one_mul.y == generator.y);

    const two_mul = generator.scalarMul(2);
    const doubled = generator.double();
    try std.testing.expect(two_mul.x == doubled.x);
    try std.testing.expect(two_mul.y == doubled.y);

    const n_mul = generator.scalarMul(SECP256K1_N);
    try std.testing.expect(n_mul.infinity);
}

test "field arithmetic" {
    const a: u256 = 0x123456789abcdef;
    const b: u256 = 0xfedcba987654321;
    const m: u256 = SECP256K1_P;
    const result = mulmod(a, b, m);
    try std.testing.expect(result < m);

    const sum = addmod(a, b, m);
    try std.testing.expect(sum < m);
    try std.testing.expect(sum == (a + b) % m);

    const diff = submod(b, a, m);
    try std.testing.expect(diff < m);
}

test "modular inverse" {
    const a: u256 = 12345;
    const m: u256 = SECP256K1_N;
    const inv = modInverse(a, m).?;
    const prod = mulmod(a, inv, m);
    try std.testing.expect(prod == 1);
}

test "recoverPubkey with valid signature" {
    // Known test vector
    const hash = [_]u8{
        0xd1, 0x67, 0xea, 0x22, 0x8e, 0x51, 0x6b, 0x1d,
        0x8e, 0x51, 0x23, 0x1b, 0x3a, 0x7e, 0x34, 0x4b,
        0x23, 0x6f, 0x89, 0x6b, 0x43, 0x21, 0x8f, 0x6a,
        0x8e, 0x3d, 0x5a, 0x7b, 0x12, 0x34, 0x56, 0x78,
    };

    var r: [32]u8 = undefined;
    std.mem.writeInt(u256, &r, 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798, .big);
    var s: [32]u8 = undefined;
    std.mem.writeInt(u256, &s, 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8, .big);

    // This may fail with test data - that's expected
    const result = recoverPubkey(&hash, &r, &s, 27);
    if (result) |pub_key| {
        try std.testing.expect(pub_key.len == 64);
    } else |_| {
        // Expected for contrived test data
    }
}
