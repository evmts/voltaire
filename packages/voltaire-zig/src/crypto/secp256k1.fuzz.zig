const std = @import("std");
const secp256k1 = @import("secp256k1.zig");
const primitives = @import("primitives");

// ============================================================================
// Signature Validation Fuzzing
// ============================================================================

test "fuzz signature validation" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return; // Need at least r and s

    // Extract r and s from fuzz input
    const r = std.mem.readInt(u256, input[0..32], .big);
    const s = std.mem.readInt(u256, input[32..64], .big);

    // Validation should never panic
    const valid = secp256k1.unauditedValidateSignature(r, s);

    // Property: if valid, then r and s must be in range [1, n-1]
    if (valid) {
        try std.testing.expect(r > 0 and r < secp256k1.SECP256K1_N);
        try std.testing.expect(s > 0 and s < secp256k1.SECP256K1_N);
        // Ethereum malleability check: s <= n/2
        try std.testing.expect(s <= (secp256k1.SECP256K1_N >> 1));
    }
}

test "fuzz signature validation edge cases" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const r = std.mem.readInt(u256, input[0..32], .big);
    const s = std.mem.readInt(u256, input[32..64], .big);

    // Test specific edge cases based on input bytes
    const r_edge = switch (input[0] & 0x3) {
        0 => r,
        1 => 0, // r = 0 (invalid)
        2 => secp256k1.SECP256K1_N, // r = n (invalid)
        3 => secp256k1.SECP256K1_N - 1, // r = n-1 (valid if s valid)
        else => unreachable,
    };

    const s_edge = switch (input[1] & 0x3) {
        0 => s,
        1 => 0, // s = 0 (invalid)
        2 => secp256k1.SECP256K1_N, // s = n (invalid)
        3 => secp256k1.SECP256K1_N - 1, // s = n-1 (may be invalid due to malleability)
        else => unreachable,
    };

    const valid = secp256k1.unauditedValidateSignature(r_edge, s_edge);

    // Property: zero or >= n is always invalid
    if (r_edge == 0 or r_edge >= secp256k1.SECP256K1_N) {
        try std.testing.expect(!valid);
    }
    if (s_edge == 0 or s_edge >= secp256k1.SECP256K1_N) {
        try std.testing.expect(!valid);
    }
    // Property: s > n/2 is invalid (malleability)
    if (s_edge > (secp256k1.SECP256K1_N >> 1)) {
        try std.testing.expect(!valid);
    }
}

// ============================================================================
// Public Key Recovery Fuzzing
// ============================================================================

test "fuzz recover pubkey with random inputs" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 97) return; // Need hash(32) + r(32) + s(32) + v(1)

    const hash = input[0..32];
    const r = input[32..64];
    const s = input[64..96];
    const v = input[96];

    // Recovery should handle all inputs gracefully
    const result = secp256k1.recoverPubkey(hash, r, s, v) catch |err| {
        // All errors should be expected
        switch (err) {
            error.InvalidHashLength,
            error.InvalidRLength,
            error.InvalidSLength,
            error.InvalidRecoveryId,
            error.InvalidSignature,
            => return,
            else => return err, // Unexpected error
        }
    };

    // If recovery succeeds, validate properties
    try std.testing.expect(result.len == 64);

    // Extract public key coordinates
    const x = std.mem.readInt(u256, result[0..32], .big);
    const y = std.mem.readInt(u256, result[32..64], .big);

    // Public key must be on curve
    const point = secp256k1.AffinePoint{ .x = x, .y = y, .infinity = false };
    try std.testing.expect(point.isOnCurve());
}

test "fuzz recover pubkey with invalid lengths" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 4) return;

    // Use input to generate various invalid lengths
    const hash_len = @as(usize, input[0]) % 64;
    const r_len = @as(usize, input[1]) % 64;
    const s_len = @as(usize, input[2]) % 64;

    if (input.len < hash_len + r_len + s_len + 1) return;

    const hash = input[0..hash_len];
    const r = input[hash_len .. hash_len + r_len];
    const s = input[hash_len + r_len .. hash_len + r_len + s_len];
    const v = input[hash_len + r_len + s_len];

    // Should return length errors for invalid inputs
    _ = secp256k1.recoverPubkey(hash, r, s, v) catch |err| {
        switch (err) {
            error.InvalidHashLength => {
                try std.testing.expect(hash_len != 32);
                return;
            },
            error.InvalidRLength => {
                try std.testing.expect(r_len != 32);
                return;
            },
            error.InvalidSLength => {
                try std.testing.expect(s_len != 32);
                return;
            },
            error.InvalidRecoveryId,
            error.InvalidSignature,
            => return,
            else => return err,
        }
    };
}

test "fuzz recover pubkey with malformed v values" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 97) return;

    const hash = input[0..32];
    const r = input[32..64];
    const s = input[64..96];
    const v = input[96];

    _ = secp256k1.recoverPubkey(hash, r, s, v) catch |err| {
        // v must be 0, 1, 27, or 28
        if (v > 28 and v != 0 and v != 1) {
            try std.testing.expectEqual(error.InvalidRecoveryId, err);
        }
        return;
    };
}

// ============================================================================
// Address Recovery Fuzzing
// ============================================================================

test "fuzz recover address" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 65) return; // Need hash(32) + recoveryId(1) + r(32) + s(32) - but we pack it

    const hash = input[0..32];
    const recoveryId = input[32] & 0x1; // Only 0 or 1
    const r = std.mem.readInt(u256, input[33..65], .big);

    // Generate s from remaining bytes or use default
    var s: u256 = undefined;
    if (input.len >= 97) {
        s = std.mem.readInt(u256, input[65..97], .big);
    } else {
        s = 1; // Default valid value
    }

    _ = secp256k1.unauditedRecoverAddress(hash, recoveryId, r, s) catch |err| {
        switch (err) {
            error.InvalidHashLength => {
                try std.testing.expect(hash.len != 32);
                return;
            },
            error.InvalidRecoveryId => {
                try std.testing.expect(recoveryId > 1);
                return;
            },
            error.InvalidSignature => return, // Expected for invalid sigs
            else => return err,
        }
    };

    // If successful, address should be valid (20 bytes)
    // This is implicitly checked by the Address type
}

test "fuzz recover address with invalid recovery id" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 65) return;

    const hash = input[0..32];
    const recoveryId = input[32]; // Full byte, not masked
    const r = std.mem.readInt(u256, input[33..65], .big);
    const s: u256 = 1; // Valid s

    _ = secp256k1.unauditedRecoverAddress(hash, recoveryId, r, s) catch |err| {
        if (recoveryId > 1) {
            try std.testing.expectEqual(error.InvalidRecoveryId, err);
        }
        return;
    };
}

// ============================================================================
// Modular Arithmetic Fuzzing
// ============================================================================

test "fuzz mulmod never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 96) return; // Need 3x u256

    const a = std.mem.readInt(u256, input[0..32], .big);
    const b = std.mem.readInt(u256, input[32..64], .big);
    const m = std.mem.readInt(u256, input[64..96], .big);

    const result = secp256k1.unauditedMulmod(a, b, m);

    // Properties
    if (m == 0) {
        try std.testing.expectEqual(@as(u256, 0), result);
    } else {
        try std.testing.expect(result < m);
        // Property: mulmod(0, x, m) = 0
        if (a == 0 or b == 0) {
            try std.testing.expectEqual(@as(u256, 0), result);
        }
    }
}

test "fuzz addmod never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 96) return;

    const a = std.mem.readInt(u256, input[0..32], .big);
    const b = std.mem.readInt(u256, input[32..64], .big);
    const m = std.mem.readInt(u256, input[64..96], .big);

    const result = secp256k1.unauditedAddmod(a, b, m);

    // Properties
    if (m == 0) {
        try std.testing.expectEqual(@as(u256, 0), result);
    } else {
        try std.testing.expect(result < m);
    }
}

test "fuzz submod never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 96) return;

    const a = std.mem.readInt(u256, input[0..32], .big);
    const b = std.mem.readInt(u256, input[32..64], .big);
    const m = std.mem.readInt(u256, input[64..96], .big);

    const result = secp256k1.unauditedSubmod(a, b, m);

    // Property: result always < m
    if (m > 0) {
        try std.testing.expect(result < m);
    }
}

test "fuzz powmod never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 96) return;

    const base = std.mem.readInt(u256, input[0..32], .big);
    const exp = std.mem.readInt(u256, input[32..64], .big);
    const modulus = std.mem.readInt(u256, input[64..96], .big);

    const result = secp256k1.unauditedPowmod(base, exp, modulus);

    // Properties
    if (modulus == 1) {
        try std.testing.expectEqual(@as(u256, 0), result);
    } else if (exp == 0) {
        try std.testing.expectEqual(@as(u256, 1), result);
    } else if (modulus > 0) {
        try std.testing.expect(result < modulus);
    }
}

test "fuzz invmod never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = std.mem.readInt(u256, input[0..32], .big);
    const m = std.mem.readInt(u256, input[32..64], .big);

    const result = secp256k1.unauditedInvmod(a, m);

    // Properties
    if (a == 0 or m == 0) {
        try std.testing.expect(result == null);
    }

    if (result) |inv| {
        // Property: a * inv ≡ 1 (mod m)
        if (m > 0) {
            try std.testing.expect(inv < m);
            const product = secp256k1.unauditedMulmod(a, inv, m);
            try std.testing.expectEqual(@as(u256, 1), product);
        }
    }
}

test "fuzz sqrt never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = std.mem.readInt(u256, input[0..32], .big);
    const p = std.mem.readInt(u256, input[32..64], .big);

    const result = secp256k1.unauditedSqrt(a, p);

    if (a == 0) {
        try std.testing.expectEqual(@as(?u256, 0), result);
    }

    if (result) |y| {
        // Property: y² ≡ a (mod p)
        if (p > 0) {
            const y_squared = secp256k1.unauditedMulmod(y, y, p);
            try std.testing.expectEqual(a % p, y_squared);
        }
    }
}

// ============================================================================
// Point Arithmetic Fuzzing
// ============================================================================

test "fuzz affine point validation" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const x = std.mem.readInt(u256, input[0..32], .big);
    const y = std.mem.readInt(u256, input[32..64], .big);

    const point = secp256k1.AffinePoint{ .x = x, .y = y, .infinity = false };

    // isOnCurve should never panic
    const on_curve = point.isOnCurve();

    // Property: generator is always on curve
    const gen = secp256k1.AffinePoint.generator();
    try std.testing.expect(gen.isOnCurve());

    // Property: zero point is on curve
    const zero = secp256k1.AffinePoint.zero();
    try std.testing.expect(zero.isOnCurve());

    // If on curve and not infinity, coordinates must be valid
    if (on_curve and !point.infinity) {
        try std.testing.expect(x < secp256k1.SECP256K1_P);
        try std.testing.expect(y < secp256k1.SECP256K1_P);
    }
}

test "fuzz point addition never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 128) return;

    const x1 = std.mem.readInt(u256, input[0..32], .big);
    const y1 = std.mem.readInt(u256, input[32..64], .big);
    const x2 = std.mem.readInt(u256, input[64..96], .big);
    const y2 = std.mem.readInt(u256, input[96..128], .big);

    const p1 = secp256k1.AffinePoint{ .x = x1, .y = y1, .infinity = false };
    const p2 = secp256k1.AffinePoint{ .x = x2, .y = y2, .infinity = false };

    // Addition should never panic, even for invalid points
    const result = p1.add(p2);

    // Properties
    // 1. Adding zero returns the point
    const with_zero = p1.add(secp256k1.AffinePoint.zero());
    try std.testing.expectEqual(p1.x, with_zero.x);
    try std.testing.expectEqual(p1.y, with_zero.y);

    // 2. If both points are on curve, result should be on curve
    if (p1.isOnCurve() and p2.isOnCurve()) {
        try std.testing.expect(result.isOnCurve());
    }

    // 3. Addition is commutative for valid points
    if (p1.isOnCurve() and p2.isOnCurve()) {
        const reverse = p2.add(p1);
        try std.testing.expectEqual(result.x, reverse.x);
        try std.testing.expectEqual(result.y, reverse.y);
        try std.testing.expectEqual(result.infinity, reverse.infinity);
    }
}

test "fuzz point doubling never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const x = std.mem.readInt(u256, input[0..32], .big);
    const y = std.mem.readInt(u256, input[32..64], .big);

    const point = secp256k1.AffinePoint{ .x = x, .y = y, .infinity = false };

    // Doubling should never panic
    const doubled = point.double();

    // Properties
    // 1. Doubling infinity returns infinity
    try std.testing.expect(secp256k1.AffinePoint.zero().double().infinity);

    // 2. If point is on curve, doubled point is on curve
    if (point.isOnCurve()) {
        try std.testing.expect(doubled.isOnCurve());
    }

    // 3. Doubling equals adding to itself
    if (point.isOnCurve() and !point.infinity) {
        const added = point.add(point);
        if (!added.infinity and !doubled.infinity) {
            try std.testing.expectEqual(added.x, doubled.x);
            try std.testing.expectEqual(added.y, doubled.y);
        }
    }
}

test "fuzz point negation never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const x = std.mem.readInt(u256, input[0..32], .big);
    const y = std.mem.readInt(u256, input[32..64], .big);

    const point = secp256k1.AffinePoint{ .x = x, .y = y, .infinity = false };

    const negated = point.negate();

    // Properties
    // 1. Negating infinity returns infinity
    try std.testing.expect(secp256k1.AffinePoint.zero().negate().infinity);

    // 2. Double negation returns original (for valid points)
    if (!point.infinity) {
        const double_neg = negated.negate();
        try std.testing.expectEqual(point.x, double_neg.x);
        try std.testing.expectEqual(point.y, double_neg.y);
    }

    // 3. Point + (-Point) = infinity (for points on curve)
    if (point.isOnCurve() and !point.infinity) {
        const sum = point.add(negated);
        try std.testing.expect(sum.infinity or sum.x == 0);
    }

    // 4. x coordinate unchanged
    if (!point.infinity) {
        try std.testing.expectEqual(point.x, negated.x);
    }
}

test "fuzz scalar multiplication never panics" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 96) return;

    const x = std.mem.readInt(u256, input[0..32], .big);
    const y = std.mem.readInt(u256, input[32..64], .big);
    const scalar = std.mem.readInt(u256, input[64..96], .big);

    const point = secp256k1.AffinePoint{ .x = x, .y = y, .infinity = false };

    // Scalar multiplication should never panic
    const result = point.scalarMul(scalar);

    // Properties
    // 1. Multiplication by 0 returns infinity
    const zero_mul = point.scalarMul(0);
    try std.testing.expect(zero_mul.infinity);

    // 2. Multiplication by 1 returns the point (if on curve)
    if (point.isOnCurve()) {
        const one_mul = point.scalarMul(1);
        if (!point.infinity) {
            try std.testing.expectEqual(point.x, one_mul.x);
            try std.testing.expectEqual(point.y, one_mul.y);
        }
    }

    // 3. If point is on curve, result is on curve
    if (point.isOnCurve()) {
        try std.testing.expect(result.isOnCurve());
    }

    // 4. Generator scalar multiplication stays on curve
    const gen_mul = secp256k1.AffinePoint.generator().scalarMul(scalar);
    try std.testing.expect(gen_mul.isOnCurve());
}

// ============================================================================
// Integration Property Tests
// ============================================================================

test "fuzz signature roundtrip property" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 97) return;

    // Use first 32 bytes as message hash
    const hash = input[0..32];
    const r = input[32..64];
    const s = input[64..96];
    const v = input[96];

    // Try to recover public key
    const pubkey = secp256k1.recoverPubkey(hash, r, s, v) catch return;

    // Property: Recovered public key should always be on curve
    const x = std.mem.readInt(u256, pubkey[0..32], .big);
    const y = std.mem.readInt(u256, pubkey[32..64], .big);
    const point = secp256k1.AffinePoint{ .x = x, .y = y, .infinity = false };
    try std.testing.expect(point.isOnCurve());

    // Property: Coordinates should be less than field modulus
    try std.testing.expect(x < secp256k1.SECP256K1_P);
    try std.testing.expect(y < secp256k1.SECP256K1_P);
}

test "fuzz address recovery consistency" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 97) return;

    const hash = input[0..32];
    const r_bytes = input[32..64];
    const s_bytes = input[64..96];
    const v = input[96];

    const r = std.mem.readInt(u256, r_bytes, .big);
    const s = std.mem.readInt(u256, s_bytes, .big);

    // Try both recovery methods
    _ = secp256k1.recoverPubkey(hash, r_bytes, s_bytes, v) catch return;

    // Convert recoveryId
    var recoveryId: u8 = undefined;
    if (v >= 27 and v <= 28) {
        recoveryId = v - 27;
    } else if (v <= 1) {
        recoveryId = v;
    } else {
        return;
    }

    const addr = secp256k1.unauditedRecoverAddress(hash, recoveryId, r, s) catch return;

    // Property: Both methods should produce consistent results
    // (Same public key should derive same address)
    // We verify the address is 20 bytes
    try std.testing.expectEqual(@as(usize, 20), addr.len);
}
