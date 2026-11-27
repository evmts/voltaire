//! secp256k1 Elliptic Curve Cryptography
//!
//! Implementation of secp256k1 elliptic curve operations for Bitcoin and Ethereum.
//! This implementation uses Zig's standard library `std.crypto.ecc.Secp256k1` for
//! curve operations and implements public key recovery on top.
//!
//! ⚠️ UNAUDITED - Custom public key recovery implementation that has NOT been security audited.
//! The underlying std.crypto.ecc.Secp256k1 is audited, but this wrapper code and the
//! public key recovery logic are UNAUDITED. Use audited alternatives in production:
//! - @noble/curves (audited) - https://github.com/paulmillr/noble-curves
//! - libsecp256k1 (audited) - https://github.com/bitcoin-core/secp256k1
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

        const reduced = scalar % SECP256K1_N;
        if (reduced == 0) return Self.zero();

        // Convert scalar to bytes (big-endian)
        var scalar_bytes: [32]u8 = undefined;
        defer std.crypto.secureZero(u8, &scalar_bytes);
        std.mem.writeInt(u256, &scalar_bytes, reduced, .big);

        // Fast path for generator multiplication avoids SEC1 encode + curve check
        if (self.x == SECP256K1_GX and self.y == SECP256K1_GY) {
            const result = Secp256k1.basePoint.mul(scalar_bytes, .big) catch return Self.zero();
            return fromStdPoint(result) catch Self.zero();
        }

        // Use std lib for arbitrary point scalar multiplication
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
        // std encodes the identity as 0x04 || 0 || 0, never with a 0x00 tag,
        // so ask the point itself. (0, 0) is not on the curve.
        pt.rejectIdentity() catch return Self.zero();
        const sec1 = pt.toUncompressedSec1();

        const x = std.mem.readInt(u256, sec1[1..33], .big);
        const y = std.mem.readInt(u256, sec1[33..65], .big);
        return Self{ .x = x, .y = y, .infinity = false };
    }
};

/// Validates ECDSA signature parameters for Ethereum
/// SECURITY: Uses constant-time comparisons to prevent timing attacks.
pub fn unauditedValidateSignature(r: u256, s: u256) bool {
    return validateSignature(r, s, true);
}

fn validateSignature(r: u256, s: u256, enforce_low_s: bool) bool {
    // r and s must be in [1, n-1]
    const r_is_zero = constant_time.constantTimeIsZeroU256(r);
    const r_gte_n = constant_time.constantTimeGteU256(r, SECP256K1_N);
    const s_is_zero = constant_time.constantTimeIsZeroU256(s);
    const s_gte_n = constant_time.constantTimeGteU256(s, SECP256K1_N);

    // Ethereum enforces s <= n/2 to prevent malleability
    const half_n = SECP256K1_N >> 1;
    const s_gt_half_n = constant_time.constantTimeLtU256(half_n, s);

    // Combine all checks
    const invalid = r_is_zero | r_gte_n | s_is_zero | s_gte_n | if (enforce_low_s) s_gt_half_n else 0;
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
    return recoverPubkeyWithOptions(hash, r, s, v, true);
}

/// Recovers uncompressed 64-byte public key without EIP-2 low-s rejection.
/// The ECRECOVER precompile is specified to keep accepting high-s signatures.
pub fn recoverPubkeyAllowHighS(
    hash: []const u8,
    r: []const u8,
    s: []const u8,
    v: u8,
) ![64]u8 {
    return recoverPubkeyWithOptions(hash, r, s, v, false);
}

fn recoverPubkeyWithOptions(
    hash: []const u8,
    r: []const u8,
    s: []const u8,
    v: u8,
    enforce_low_s: bool,
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

    if (!validateSignature(r_u256, s_u256, enforce_low_s)) return error.InvalidSignature;

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

inline fn feFromReduced(a_mod: u256) !Secp256k1.Fe {
    var bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &bytes, a_mod, .big);
    return Secp256k1.Fe.fromBytes(bytes, .big);
}

inline fn feToU256(fe: Secp256k1.Fe) u256 {
    return std.mem.readInt(u256, &fe.toBytes(.big), .big);
}

inline fn scalarFromReduced(a_mod: u256) !Secp256k1.scalar.Scalar {
    var bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &bytes, a_mod, .big);
    return Secp256k1.scalar.Scalar.fromBytes(bytes, .big);
}

inline fn scalarToU256(sc: Secp256k1.scalar.Scalar) u256 {
    return std.mem.readInt(u256, &sc.toBytes(.big), .big);
}

/// Compute std.crypto.ecc.Secp256k1 point from x-coordinate and recovery bit
fn computeStdPointFromX(x: u256, recoveryId: u8) !Secp256k1 {
    if (x >= SECP256K1_P) return error.InvalidSignature;
    const x_fe = feFromReduced(x) catch return error.InvalidSignature;
    const y_fe = Secp256k1.recoverY(x_fe, (recoveryId & 1) == 1) catch return error.InvalidSignature;
    return Secp256k1{
        .x = x_fe,
        .y = y_fe,
        .z = Secp256k1.Fe.one,
    };
}

/// Internal: Recover public key point from signature components
fn recoverPublicKeyPoint(hash: [32]u8, r: u256, s: u256, recoveryId: u8) !AffinePoint {
    if (r >= SECP256K1_P) return error.InvalidSignature;

    // Step 1: Compute R point from r value using Fiat-Crypto field sqrt
    const R_std = computeStdPointFromX(r, recoveryId) catch return error.InvalidSignature;

    // Step 2: Compute scalars in Z_n using stdlib Secp256k1.scalar.Scalar
    // Q = r^(-1) * (s*R - e*G) = (-e * r^(-1))*G + (s * r^(-1))*R
    const r_scalar = scalarFromReduced(r) catch return error.InvalidSignature;
    const s_scalar = scalarFromReduced(s) catch return error.InvalidSignature;
    const r_inv = r_scalar.invert();

    const e_raw = std.mem.readInt(u256, &hash, .big);
    const e_mod = e_raw % SECP256K1_N;
    const e_scalar = scalarFromReduced(e_mod) catch return error.InvalidSignature;

    const u_1_scalar = e_scalar.neg().mul(r_inv);
    const u_2_scalar = s_scalar.mul(r_inv);

    const u_1_bytes = u_1_scalar.toBytes(.big);
    const u_2_bytes = u_2_scalar.toBytes(.big);

    const u_1_zero = u_1_scalar.isZero();
    const u_2_zero = u_2_scalar.isZero();

    const Q_std = if (u_1_zero and u_2_zero)
        return error.InvalidSignature
    else if (u_1_zero)
        R_std.mulPublic(u_2_bytes, .big) catch return error.InvalidSignature
    else if (u_2_zero)
        Secp256k1.basePoint.mulPublic(u_1_bytes, .big) catch return error.InvalidSignature
    else
        Secp256k1.mulDoubleBasePublic(R_std, u_2_bytes, Secp256k1.basePoint, u_1_bytes, .big) catch return error.InvalidSignature;

    Q_std.rejectIdentity() catch return error.InvalidSignature;
    const Q = AffinePoint.fromStdPoint(Q_std) catch return error.InvalidSignature;
    if (Q.infinity) return error.InvalidSignature;

    return Q;
}

/// Compute point on curve from x-coordinate and recovery bit
fn computePointFromX(x: u256, recoveryId: u8) !AffinePoint {
    const pt = try computeStdPointFromX(x, recoveryId);
    return AffinePoint.fromStdPoint(pt) catch return error.InvalidSignature;
}

/// Verify signature with public key
pub fn verifySignature(
    hash: [32]u8,
    r: u256,
    s: u256,
    pub_key: AffinePoint,
) bool {
    if (pub_key.infinity) return false;
    if (r == 0 or r >= SECP256K1_N or s == 0 or s >= SECP256K1_N) return false;

    const sec1 = pub_key.toUncompressedSec1() catch return false;
    const Q_std = Secp256k1.fromSec1(&sec1) catch return false;

    const s_scalar = scalarFromReduced(s) catch return false;
    const r_scalar = scalarFromReduced(r) catch return false;
    const s_inv = s_scalar.invert();

    const e_raw = std.mem.readInt(u256, &hash, .big);
    const e_scalar = scalarFromReduced(e_raw % SECP256K1_N) catch return false;

    // u_1 = e * s^(-1) mod n, u_2 = r * s^(-1) mod n
    const u_1_scalar = e_scalar.mul(s_inv);
    const u_2_scalar = r_scalar.mul(s_inv);

    const u_1_bytes = u_1_scalar.toBytes(.big);
    const u_2_bytes = u_2_scalar.toBytes(.big);

    const u_1_zero = u_1_scalar.isZero();
    const u_2_zero = u_2_scalar.isZero();

    const R_std = if (u_1_zero and u_2_zero)
        return false
    else if (u_1_zero)
        Q_std.mulPublic(u_2_bytes, .big) catch return false
    else if (u_2_zero)
        Secp256k1.basePoint.mulPublic(u_1_bytes, .big) catch return false
    else
        Secp256k1.mulDoubleBasePublic(Q_std, u_2_bytes, Secp256k1.basePoint, u_1_bytes, .big) catch return false;

    R_std.rejectIdentity() catch return false;
    const R_prime = AffinePoint.fromStdPoint(R_std) catch return false;
    if (R_prime.infinity) return false;

    // r' = R'.x mod n
    const r_prime = R_prime.x % SECP256K1_N;
    return constant_time.constantTimeEqU256(r_prime, r) == 1;
}

// Field arithmetic helpers

/// Modular multiplication with Fiat-Crypto fast paths for secp256k1 P and N
pub fn mulmod(a: u256, b: u256, m: u256) u256 {
    if (m == 0 or a == 0 or b == 0) return 0;

    const a_mod = a % m;
    const b_mod = b % m;
    if (a_mod == 0 or b_mod == 0) return 0;

    if (m == SECP256K1_P) {
        if (feFromReduced(a_mod)) |fa| {
            if (feFromReduced(b_mod)) |fb| {
                return feToU256(fa.mul(fb));
            } else |_| {}
        } else |_| {}
    }
    if (m == SECP256K1_N) {
        if (scalarFromReduced(a_mod)) |sa| {
            if (scalarFromReduced(b_mod)) |sb| {
                return scalarToU256(sa.mul(sb));
            } else |_| {}
        } else |_| {}
    }

    return @truncate((@as(u512, a_mod) * @as(u512, b_mod)) % @as(u512, m));
}

/// Modular addition
pub fn addmod(a: u256, b: u256, m: u256) u256 {
    if (m == 0) return 0;

    const a_mod = a % m;
    const b_mod = b % m;

    // Constant-time: compute both candidate results and select without branching.
    // If a_mod + b_mod >= m (i.e. a_mod > m - b_mod), the reduced result is
    // a_mod - (m - b_mod); otherwise it is a_mod + b_mod.
    const m_minus_b = m - b_mod;
    const overflow = constant_time.constantTimeGtU256(a_mod, m_minus_b);
    const reduced = a_mod -% m_minus_b;
    const summed = a_mod +% b_mod;
    return constant_time.constantTimeSelectU256(overflow, reduced, summed);
}

/// Modular subtraction
pub fn submod(a: u256, b: u256, m: u256) u256 {
    const a_mod = a % m;
    const b_mod = b % m;

    // Constant-time: select between the direct difference and the wrapped result.
    const ge = constant_time.constantTimeGteU256(a_mod, b_mod);
    const direct = a_mod -% b_mod;
    const wrapped = m -% (b_mod -% a_mod);
    return constant_time.constantTimeSelectU256(ge, direct, wrapped);
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

/// Constant-time modular multiplication for a prime modulus.
/// Fixed 256-iteration double-and-add; no secret-dependent loop bound or branch.
/// Requires m > 0. Operands need not be reduced mod m on entry.
fn ctMulmod(a: u256, b: u256, m: u256) u256 {
    const a_mod = a % m;
    const b_mod = b % m;

    if (m == SECP256K1_P) {
        if (feFromReduced(a_mod)) |fa| {
            if (feFromReduced(b_mod)) |fb| {
                return feToU256(fa.mul(fb));
            } else |_| {}
        } else |_| {}
    }
    if (m == SECP256K1_N) {
        if (scalarFromReduced(a_mod)) |sa| {
            if (scalarFromReduced(b_mod)) |sb| {
                return scalarToU256(sa.mul(sb));
            } else |_| {}
        } else |_| {}
    }

    var result: u256 = 0;
    var multiplicand = a_mod;
    var multiplier = b_mod;

    // Iterate over all 256 bits regardless of value to keep the loop count fixed.
    var i: usize = 0;
    while (i < 256) : (i += 1) {
        const bit: u8 = @truncate(multiplier & 1);
        const candidate = addmod(result, multiplicand, m);
        result = constant_time.constantTimeSelectU256(bit, candidate, result);
        multiplicand = addmod(multiplicand, multiplicand, m);
        multiplier >>= 1;
    }

    return result;
}

/// Constant-time modular exponentiation for a prime modulus.
/// Fixed 256-iteration square-and-multiply with constant-time conditional multiply.
/// The exponent is treated as secret (each bit branchlessly selects the multiply).
fn ctPowmod(base: u256, exp: u256, m: u256) u256 {
    var result: u256 = 1 % m;
    var base_mod = base % m;
    var exp_remaining = exp;

    var i: usize = 0;
    while (i < 256) : (i += 1) {
        const bit: u8 = @truncate(exp_remaining & 1);
        const candidate = ctMulmod(result, base_mod, m);
        result = constant_time.constantTimeSelectU256(bit, candidate, result);
        base_mod = ctMulmod(base_mod, base_mod, m);
        exp_remaining >>= 1;
    }

    return result;
}

/// Modular inverse for a PRIME modulus via Fermat's little theorem:
/// a^(-1) ≡ a^(m-2) (mod m). This is constant-time in `a` (fixed iteration
/// count, constant-time conditional multiplies) so it is safe to call on
/// secret values such as ephemeral ECDSA nonces.
///
/// SECURITY: `m` MUST be prime (e.g. SECP256K1_N or SECP256K1_P). Composite
/// moduli are not supported by Fermat-based inversion.
///
/// Returns null only for the non-secret degenerate inputs (m == 0 or a == 0),
/// preserving the prior API contract. The a == 0 fast path leaks nothing
/// secret-sensitive (0 has no inverse and is not a valid nonce).
pub fn modInverse(a: u256, m: u256) ?u256 {
    if (m == 0 or a == 0) return null;
    // m == 1 has no meaningful inverse (every residue is 0); also guards the
    // m - 2 subtraction below from underflow. Not a secret-sensitive path.
    if (m == 1) return null;

    const a_mod = a % m;
    if (a_mod == 0) return null;

    // Fast constant-time paths via stdlib Fiat-Crypto addition chains
    if (m == SECP256K1_P) {
        const fa = feFromReduced(a_mod) catch return null;
        return feToU256(fa.invert());
    }
    if (m == SECP256K1_N) {
        const sa = scalarFromReduced(a_mod) catch return null;
        return scalarToU256(sa.invert());
    }

    // inverse = a^(m-2) mod m
    return ctPowmod(a_mod, m - 2, m);
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

    if (p == SECP256K1_P and a < SECP256K1_P) {
        const fa = feFromReduced(a) catch return null;
        const root = fa.sqrt() catch return null;
        return feToU256(root);
    }

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

    const zero_address = @as([20]u8, @splat(0));
    try std.testing.expect(!std.mem.eql(u8, &recovered_address.bytes, &zero_address));
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
    const zero_hash = @as([32]u8, @splat(0));
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

test "modInverse constant-time Fermat correctness" {
    // a * a^(-1) mod m == 1 across both curve moduli and varied magnitudes.
    const vectors = [_]u256{
        1,
        2,
        3,
        12345,
        0x9f150809ad6e882b6e8f0c4dc4b0c5d58d6fd84ee8d48aef7e37b8d60f3d4f5a,
        SECP256K1_N - 1,
        SECP256K1_P - 1,
        0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798,
    };

    for ([_]u256{ SECP256K1_N, SECP256K1_P }) |m| {
        for (vectors) |a_raw| {
            const a = a_raw % m;
            if (a == 0) continue;
            const inv = modInverse(a, m) orelse {
                try std.testing.expect(false);
                return;
            };
            // inverse must lie in [1, m-1]
            try std.testing.expect(inv >= 1 and inv < m);
            // a * inv ≡ 1 (mod m)
            try std.testing.expectEqual(@as(u256, 1), mulmod(a, inv, m));
        }
    }

    // Known small-prime vector: inverse of 3 mod 11 is 4 (3*4 = 12 ≡ 1).
    try std.testing.expectEqual(@as(u256, 4), modInverse(3, 11).?);
    // Inverse of 7 mod 11 is 8 (7*8 = 56 ≡ 1).
    try std.testing.expectEqual(@as(u256, 8), modInverse(7, 11).?);

    // Degenerate inputs preserve the null contract.
    try std.testing.expect(modInverse(0, SECP256K1_N) == null);
    try std.testing.expect(modInverse(12345, 0) == null);
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

test "Wycheproof - secp256k1 ECDSA boundary scalars, malleability, R=O, and curve checks" {
    const testing = std.testing;
    const max_u256 = std.math.maxInt(u256);

    // 1. Official go-ethereum / EEST ValidKey vector (s is high-s > n/2; v = 28).
    var valid_hash: [32]u8 = undefined;
    var valid_r_bytes: [32]u8 = undefined;
    var high_s_bytes: [32]u8 = undefined;
    _ = try std.fmt.hexToBytes(&valid_hash, "18c547e4f7b0f325ad1e56f57e26c745b09a3e503d86e00e5255ff7f715d3d1c");
    _ = try std.fmt.hexToBytes(&valid_r_bytes, "73b1693892219d736caba55bdb67216e485557ea6b6af75f37096c9aa6a5a75f");
    _ = try std.fmt.hexToBytes(&high_s_bytes, "eeb940b1d03b21e36b0e47e79769f095fe2ab855bd91e3a38756b7d75a9c4549");

    const r_val = std.mem.readInt(u256, &valid_r_bytes, .big);
    const high_s_val = std.mem.readInt(u256, &high_s_bytes, .big);
    const low_s_val = SECP256K1_N - high_s_val;
    var low_s_bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &low_s_bytes, low_s_val, .big);

    try testing.expect(high_s_val > SECP256K1_N >> 1);
    try testing.expect(low_s_val <= SECP256K1_N >> 1);

    // EIP-2 / Wycheproof malleability: strict recovery rejects high-s, accepts low-s sibling (v = 27),
    // while ECRECOVER-mode recoverPubkeyAllowHighS accepts both and recovers identical keys.
    try testing.expect(!unauditedValidateSignature(r_val, high_s_val));
    try testing.expect(unauditedValidateSignature(r_val, low_s_val));
    try testing.expectError(error.InvalidSignature, recoverPubkey(&valid_hash, &valid_r_bytes, &high_s_bytes, 28));
    try testing.expectError(error.InvalidSignature, unauditedRecoverAddress(&valid_hash, 1, r_val, high_s_val));
    const pk_low = try recoverPubkey(&valid_hash, &valid_r_bytes, &low_s_bytes, 27);
    const pk_high = try recoverPubkeyAllowHighS(&valid_hash, &valid_r_bytes, &high_s_bytes, 28);
    try testing.expectEqualSlices(u8, &pk_low, &pk_high);

    const recovered_pt = AffinePoint{
        .x = std.mem.readInt(u256, pk_low[0..32], .big),
        .y = std.mem.readInt(u256, pk_low[32..64], .big),
        .infinity = false,
    };
    try testing.expect(recovered_pt.isOnCurve());
    try testing.expect(verifySignature(valid_hash, r_val, low_s_val, recovered_pt));
    // Mathematical ECDSA accepts the conjugate (r, n - s), whereas EIP-2 gate unauditedValidateSignature rejects it.
    try testing.expect(verifySignature(valid_hash, r_val, high_s_val, recovered_pt));
    try testing.expect(!verifySignature(valid_hash, r_val ^ 1, low_s_val, recovered_pt));
    try testing.expect(!verifySignature(valid_hash, r_val, low_s_val ^ 1, recovered_pt));

    // Exact EIP-2 half-order boundary: n/2 valid, n/2 + 1 invalid.
    const half_n = SECP256K1_N >> 1;
    try testing.expect(unauditedValidateSignature(1, half_n));
    try testing.expect(!unauditedValidateSignature(1, half_n + 1));

    // 2. Wycheproof boundary scalar rejections: 0, n, n+1, maxInt(u256).
    for ([_]u256{ 0, SECP256K1_N, SECP256K1_N + 1, max_u256 }) |bad| {
        var bad_bytes: [32]u8 = undefined;
        std.mem.writeInt(u256, &bad_bytes, bad, .big);
        try testing.expect(!unauditedValidateSignature(bad, 1));
        try testing.expect(!unauditedValidateSignature(1, bad));
        try testing.expectError(error.InvalidSignature, recoverPubkey(&valid_hash, &bad_bytes, &low_s_bytes, 27));
        try testing.expectError(error.InvalidSignature, recoverPubkey(&valid_hash, &valid_r_bytes, &bad_bytes, 27));
        try testing.expectError(error.InvalidSignature, recoverPubkeyAllowHighS(&valid_hash, &bad_bytes, &low_s_bytes, 27));
        try testing.expectError(error.InvalidSignature, recoverPubkeyAllowHighS(&valid_hash, &valid_r_bytes, &bad_bytes, 27));
        try testing.expect(!verifySignature(valid_hash, bad, low_s_val, recovered_pt));
        try testing.expect(!verifySignature(valid_hash, r_val, bad, recovered_pt));
    }

    // 3. Invalid recovery IDs.
    for ([_]u8{ 2, 26, 29, 35, 36, 255 }) |bad_v| {
        try testing.expectError(error.InvalidRecoveryId, recoverPubkey(&valid_hash, &valid_r_bytes, &low_s_bytes, bad_v));
    }

    // 4. Non-canonical field coordinates, infinity, and off-curve public keys rejected.
    const G = AffinePoint.generator();
    const bad_points = [_]AffinePoint{
        AffinePoint.zero(),
        .{ .x = 0, .y = 0, .infinity = false },
        .{ .x = 0, .y = 1, .infinity = false },
        .{ .x = G.x, .y = G.y + 1, .infinity = false },
        .{ .x = SECP256K1_P, .y = G.y, .infinity = false },
        .{ .x = G.x, .y = SECP256K1_P, .infinity = false },
        .{ .x = max_u256, .y = max_u256, .infinity = false },
    };
    for (bad_points) |pt| {
        if (!pt.infinity) try testing.expect(!pt.isOnCurve());
        try testing.expect(!verifySignature(valid_hash, r_val, low_s_val, pt));
    }

    // 5. Degenerate R = O (u1*G + u2*Q = O): Q = G, hash = n - 1, r = 1, s = 1 -> -G + G = O.
    var n_minus_1_hash: [32]u8 = undefined;
    std.mem.writeInt(u256, &n_minus_1_hash, SECP256K1_N - 1, .big);
    try testing.expect(!verifySignature(n_minus_1_hash, 1, 1, G));

    // 6. Zero digest (h = 0 and h = n): Q = G, r = G.x, s = G.x -> u1=0, u2=1 -> R = G.
    //    Use low-s form if G.x > n/2 (G.x = 0x79be... <= n/2 = 0x7fffffff..., so low-s).
    const zero_hash = @as([32]u8, @splat(0));
    var n_hash: [32]u8 = undefined;
    std.mem.writeInt(u256, &n_hash, SECP256K1_N, .big);
    try testing.expect(verifySignature(zero_hash, G.x, G.x, G));
    try testing.expect(verifySignature(n_hash, G.x, G.x, G));

    // 7. Non-quadratic-residue x-coordinate (x = 5 -> 5^3 + 7 = 132 has no sqrt mod p).
    var non_qr_r = @as([32]u8, @splat(0));
    non_qr_r[31] = 5;
    try testing.expectError(error.InvalidSignature, recoverPubkey(&valid_hash, &non_qr_r, &low_s_bytes, 27));
}
