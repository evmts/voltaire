const std = @import("std");
const crypto = std.crypto;

// Common address type (20 bytes) - defined locally to avoid import issues
pub const Address = [20]u8;

/// Production-ready ECDSA signature recovery for secp256k1
///
/// This module provides a wrapper around the existing precompile implementation
/// to make it accessible from the primitives package.

// secp256k1 curve parameters
pub const SECP256K1_P: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
pub const SECP256K1_N: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
pub const SECP256K1_B: u256 = 7;
pub const SECP256K1_GX: u256 = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
pub const SECP256K1_GY: u256 = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;

/// Affine point on secp256k1 curve
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

    pub fn isOnCurve(self: Self) bool {
        if (self.infinity) return true;

        // Check y² = x³ + 7 mod p
        const y2 = mulmod(self.y, self.y, SECP256K1_P);
        const x3 = mulmod(mulmod(self.x, self.x, SECP256K1_P), self.x, SECP256K1_P);
        const right = addmod(x3, SECP256K1_B, SECP256K1_P);

        return y2 == right;
    }

    pub fn negate(self: Self) Self {
        if (self.infinity) return self;
        return Self{ .x = self.x, .y = SECP256K1_P - self.y, .infinity = false };
    }

    pub fn double(self: Self) Self {
        if (self.infinity) return self;

        // λ = (3x² + a) / (2y) mod p, where a = 0 for secp256k1
        const x2 = mulmod(self.x, self.x, SECP256K1_P);
        const three_x2 = mulmod(3, x2, SECP256K1_P);
        const two_y = mulmod(2, self.y, SECP256K1_P);
        const two_y_inv = invmod(two_y, SECP256K1_P) orelse return Self.zero();
        const lambda = mulmod(three_x2, two_y_inv, SECP256K1_P);

        // x3 = λ² - 2x mod p
        const lambda2 = mulmod(lambda, lambda, SECP256K1_P);
        const two_x = mulmod(2, self.x, SECP256K1_P);
        const x3 = submod(lambda2, two_x, SECP256K1_P);

        // y3 = λ(x - x3) - y mod p
        const x_diff = submod(self.x, x3, SECP256K1_P);
        const y3 = submod(mulmod(lambda, x_diff, SECP256K1_P), self.y, SECP256K1_P);

        return Self{ .x = x3, .y = y3, .infinity = false };
    }

    pub fn add(self: Self, other: Self) Self {
        if (self.infinity) return other;
        if (other.infinity) return self;
        if (self.x == other.x) {
            if (self.y == other.y) return self.double();
            return Self.zero();
        }

        // λ = (y2 - y1) / (x2 - x1) mod p
        const y_diff = submod(other.y, self.y, SECP256K1_P);
        const x_diff = submod(other.x, self.x, SECP256K1_P);
        const x_diff_inv = invmod(x_diff, SECP256K1_P) orelse return Self.zero();
        const lambda = mulmod(y_diff, x_diff_inv, SECP256K1_P);

        // x3 = λ² - x1 - x2 mod p
        const lambda2 = mulmod(lambda, lambda, SECP256K1_P);
        const x3 = submod(submod(lambda2, self.x, SECP256K1_P), other.x, SECP256K1_P);

        // y3 = λ(x1 - x3) - y1 mod p
        const x1_diff = submod(self.x, x3, SECP256K1_P);
        const y3 = submod(mulmod(lambda, x1_diff, SECP256K1_P), self.y, SECP256K1_P);

        return Self{ .x = x3, .y = y3, .infinity = false };
    }

    pub fn scalarMul(self: Self, scalar: u256) Self {
        if (scalar == 0 or self.infinity) return Self.zero();

        var result = Self.zero();
        var addend = self;
        var k = scalar;

        while (k > 0) : (k >>= 1) {
            if (k & 1 == 1) {
                result = result.add(addend);
            }
            addend = addend.double();
        }

        return result;
    }
};

/// Validates ECDSA signature parameters for Ethereum
pub fn validate_signature(r: u256, s: u256) bool {
    // r and s must be in [1, n-1]
    if (r == 0 or r >= SECP256K1_N) return false;
    if (s == 0 or s >= SECP256K1_N) return false;

    // Ethereum enforces s <= n/2 to prevent malleability
    const half_n = SECP256K1_N >> 1;
    if (s > half_n) return false;

    return true;
}

/// Recovers Ethereum address from ECDSA signature
pub fn recover_address(
    hash: []const u8,
    recovery_id: u8,
    r: u256,
    s: u256,
) !Address {
    if (hash.len != 32) return error.InvalidHashLength;
    if (recovery_id > 1) return error.InvalidRecoveryId;
    if (!validate_signature(r, s)) return error.InvalidSignature;

    // Step 1: Calculate point R from r and recovery_id
    // x = r (we don't handle r >= p case as it's extremely rare)
    if (r >= SECP256K1_P) return error.InvalidSignature;

    // Calculate y² = x³ + 7 mod p
    const x3 = mulmod(mulmod(r, r, SECP256K1_P), r, SECP256K1_P);
    const y2 = addmod(x3, SECP256K1_B, SECP256K1_P);

    // Calculate y = y²^((p+1)/4) mod p (works because p ≡ 3 mod 4)
    const y = powmod(y2, (SECP256K1_P + 1) >> 2, SECP256K1_P);

    // Verify y is correct
    if (mulmod(y, y, SECP256K1_P) != y2) return error.InvalidSignature;

    // Choose correct y based on recovery_id
    const y_is_odd = (y & 1) == 1;
    const y_final = if (y_is_odd == (recovery_id == 1)) y else SECP256K1_P - y;

    const R = AffinePoint{ .x = r, .y = y_final, .infinity = false };
    if (!R.isOnCurve()) return error.InvalidSignature;

    // Step 2: Calculate e from message hash
    var hash_array: [32]u8 = undefined;
    @memcpy(&hash_array, hash);
    const e = std.mem.readInt(u256, &hash_array, .big);

    // Step 3: Calculate public key Q = r⁻¹(sR - eG)
    const r_inv = invmod(r, SECP256K1_N) orelse return error.InvalidSignature;

    // Calculate sR
    const sR = R.scalarMul(s);

    // Calculate eG
    const eG = AffinePoint.generator().scalarMul(e);

    // Calculate sR - eG
    const diff = sR.add(eG.negate());

    // Calculate Q = r⁻¹ * (sR - eG)
    const Q = diff.scalarMul(r_inv);

    if (!Q.isOnCurve() or Q.infinity) return error.InvalidSignature;

    // Step 4: Verify the signature with recovered key (optional but recommended)
    if (!verify_signature(hash_array, r, s, Q)) return error.InvalidSignature;

    // Step 5: Convert public key to Ethereum address
    var pub_key_bytes: [64]u8 = undefined;
    std.mem.writeInt(u256, pub_key_bytes[0..32], Q.x, .big);
    std.mem.writeInt(u256, pub_key_bytes[32..64], Q.y, .big);

    var keccak = crypto.hash.sha3.Keccak256.init(.{});
    keccak.update(&pub_key_bytes);
    var hash_out: [32]u8 = undefined;
    keccak.final(&hash_out);

    var address: Address = undefined;
    @memcpy(&address, hash_out[12..32]);

    return address;
}

/// Verify signature with public key (used internally for validation)
fn verify_signature(
    hash: [32]u8,
    r: u256,
    s: u256,
    pub_key: AffinePoint,
) bool {
    const e = std.mem.readInt(u256, &hash, .big);

    // Calculate s⁻¹
    const s_inv = invmod(s, SECP256K1_N) orelse return false;

    // u_1 = e * s⁻¹ mod n
    const u_1 = mulmod(e, s_inv, SECP256K1_N);

    // u_2 = r * s⁻¹ mod n
    const u_2 = mulmod(r, s_inv, SECP256K1_N);

    // R' = u_1*G + u_2*Q
    const u1G = AffinePoint.generator().scalarMul(u_1);
    const u2Q = pub_key.scalarMul(u_2);
    const R_prime = u1G.add(u2Q);

    if (R_prime.infinity) return false;

    // Check r' ≡ r mod n
    return (R_prime.x % SECP256K1_N) == r;
}

// Field arithmetic helpers

pub fn mulmod(a: u256, b: u256, m: u256) u256 {
    if (m == 0) return 0;
    if (a == 0 or b == 0) return 0;

    // Use built-in arithmetic with proper overflow handling
    const a_mod = a % m;
    const b_mod = b % m;

    // For large multiplications, use the standard algorithm
    var result: u256 = 0;
    var multiplicand = a_mod;
    var multiplier = b_mod;

    while (multiplier > 0) {
        if (multiplier & 1 == 1) {
            // Add multiplicand to result (mod m)
            result = addmod(result, multiplicand, m);
        }

        // Double multiplicand (mod m)
        multiplicand = addmod(multiplicand, multiplicand, m);

        multiplier >>= 1;
    }

    return result;
}

pub fn addmod(a: u256, b: u256, m: u256) u256 {
    if (m == 0) return 0;

    const a_mod = a % m;
    const b_mod = b % m;

    // Check for overflow
    if (a_mod > m - b_mod) {
        return a_mod - (m - b_mod);
    } else {
        return a_mod + b_mod;
    }
}

pub fn submod(a: u256, b: u256, m: u256) u256 {
    const a_mod = a % m;
    const b_mod = b % m;

    if (a_mod >= b_mod) {
        return a_mod - b_mod;
    } else {
        return m - (b_mod - a_mod);
    }
}

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

pub fn invmod(a: u256, m: u256) ?u256 {
    if (m == 0) return null;
    if (a == 0) return null;

    // Extended Euclidean Algorithm with careful arithmetic
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

    if (old_r > 1) return null; // Not invertible

    // Ensure result is positive
    if (old_s < 0) {
        old_s += @as(i512, @intCast(m));
    }

    return @as(u256, @intCast(old_s));
}
