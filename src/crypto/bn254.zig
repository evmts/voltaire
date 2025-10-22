const std = @import("std");
const curve_parameters = @import("bn254/curve_parameters.zig");

pub const FpMont = @import("bn254/FpMont.zig");
pub const Fp2Mont = @import("bn254/Fp2Mont.zig");
pub const Fp6Mont = @import("bn254/Fp6Mont.zig");
pub const Fp12Mont = @import("bn254/Fp12Mont.zig");
pub const Fr = @import("bn254/Fr.zig").Fr;

pub const FP_MOD = curve_parameters.FP_MOD;
pub const FR_MOD = curve_parameters.FR_MOD;
pub const G1 = @import("bn254/G1.zig");
pub const G2 = @import("bn254/G2.zig");
pub const pairing = @import("bn254/pairing.zig").pairing;

// ============================================================================
// TESTS - BN254 Module-Level Integration Tests
// ============================================================================

test "BN254 G1 point addition on curve" {
    const gen = G1.GENERATOR;
    const doubled = gen.double();
    const sum = gen.add(&gen);
    try std.testing.expect(sum.equal(&doubled));
    try std.testing.expect(sum.isOnCurve());
}

test "BN254 G1 point doubling matches repeated addition" {
    const gen = G1.GENERATOR;
    const doubled = gen.double();
    const quadrupled_by_double = doubled.double();
    const quadrupled_by_add = gen.add(&gen).add(&gen).add(&gen);
    try std.testing.expect(quadrupled_by_double.equal(&quadrupled_by_add));
}

test "BN254 G1 scalar multiplication basic" {
    const gen = G1.GENERATOR;
    const scalar = Fr.init(5);
    const result = gen.mul(&scalar);

    const manual = gen.add(&gen).add(&gen).add(&gen).add(&gen);
    try std.testing.expect(result.equal(&manual));
    try std.testing.expect(result.isOnCurve());
}

test "BN254 G1 scalar multiplication by zero" {
    const gen = G1.GENERATOR;
    const result = gen.mul_by_int(0);
    try std.testing.expect(result.isInfinity());
}

test "BN254 G1 scalar multiplication by one" {
    const gen = G1.GENERATOR;
    const result = gen.mul_by_int(1);
    try std.testing.expect(result.equal(&gen));
}

test "BN254 G1 scalar multiplication by curve order gives infinity" {
    const gen = G1.GENERATOR;
    const result = gen.mul_by_int(FR_MOD);
    try std.testing.expect(result.isInfinity());
}

test "BN254 G1 point validation rejects off-curve points" {
    const bad_x = FpMont.init(1);
    const bad_y = FpMont.init(2);
    const z = FpMont.ONE;

    const result = G1.init(&bad_x, &bad_y, &z);
    try std.testing.expectError(error.InvalidPoint, result);
}

test "BN254 G1 point at infinity operations" {
    const inf = G1.INFINITY;
    const gen = G1.GENERATOR;

    try std.testing.expect(inf.isInfinity());
    try std.testing.expect(inf.isOnCurve());

    const inf_plus_gen = inf.add(&gen);
    try std.testing.expect(inf_plus_gen.equal(&gen));

    const gen_plus_inf = gen.add(&inf);
    try std.testing.expect(gen_plus_inf.equal(&gen));

    const inf_doubled = inf.double();
    try std.testing.expect(inf_doubled.isInfinity());
}

test "BN254 G1 inverse points sum to infinity" {
    const gen = G1.GENERATOR;
    const neg_gen = gen.neg();
    const sum = gen.add(&neg_gen);
    try std.testing.expect(sum.isInfinity());
}

test "BN254 G1 associativity of addition" {
    const scalar1 = Fr.init(3);
    const scalar2 = Fr.init(5);
    const scalar3 = Fr.init(7);

    const p1 = G1.GENERATOR.mul(&scalar1);
    const p2 = G1.GENERATOR.mul(&scalar2);
    const p3 = G1.GENERATOR.mul(&scalar3);

    const left = p1.add(&p2).add(&p3);
    const right = p1.add(&p2.add(&p3));
    try std.testing.expect(left.equal(&right));
}

test "BN254 G1 commutativity of addition" {
    const scalar1 = Fr.init(11);
    const scalar2 = Fr.init(13);

    const p1 = G1.GENERATOR.mul(&scalar1);
    const p2 = G1.GENERATOR.mul(&scalar2);

    const left = p1.add(&p2);
    const right = p2.add(&p1);
    try std.testing.expect(left.equal(&right));
}

test "BN254 G1 distributivity of scalar multiplication" {
    const scalar1 = Fr.init(7);
    const scalar2 = Fr.init(11);

    const p = G1.GENERATOR.mul(&scalar1);
    const q = G1.GENERATOR.mul(&scalar2);

    const scalar3 = Fr.init(5);
    const left = p.add(&q).mul(&scalar3);
    const right = p.mul(&scalar3).add(&q.mul(&scalar3));
    try std.testing.expect(left.equal(&right));
}

test "BN254 G2 point addition on curve" {
    const gen = G2.GENERATOR;
    const doubled = gen.double();
    const sum = gen.add(&gen);
    try std.testing.expect(sum.equal(&doubled));
    try std.testing.expect(sum.isOnCurve());
}

test "BN254 G2 scalar multiplication basic" {
    const gen = G2.GENERATOR;
    const result = gen.mul_by_int(3);
    const manual = gen.add(&gen).add(&gen);
    try std.testing.expect(result.equal(&manual));
    try std.testing.expect(result.isOnCurve());
}

test "BN254 G2 scalar multiplication by zero" {
    const gen = G2.GENERATOR;
    const result = gen.mul_by_int(0);
    try std.testing.expect(result.isInfinity());
}

test "BN254 G2 scalar multiplication by curve order" {
    const gen = G2.GENERATOR;
    const result = gen.mul_by_int(FR_MOD);
    try std.testing.expect(result.isInfinity());
}

test "BN254 G2 point validation rejects off-curve points" {
    const bad_x = Fp2Mont.init_from_int(1, 1);
    const bad_y = Fp2Mont.init_from_int(2, 2);
    const z = Fp2Mont.ONE;

    const result = G2.init(&bad_x, &bad_y, &z);
    try std.testing.expectError(error.InvalidPoint, result);
}

test "BN254 G2 point at infinity operations" {
    const inf = G2.INFINITY;
    const gen = G2.GENERATOR;

    try std.testing.expect(inf.isInfinity());
    try std.testing.expect(inf.isOnCurve());

    const inf_plus_gen = inf.add(&gen);
    try std.testing.expect(inf_plus_gen.equal(&gen));

    const inf_doubled = inf.double();
    try std.testing.expect(inf_doubled.isInfinity());
}

test "BN254 G2 subgroup check on generator" {
    const gen = G2.GENERATOR;
    try std.testing.expect(gen.isInSubgroup());
}

test "BN254 G2 subgroup check on multiples" {
    const scalars = [_]u256{ 2, 7, 13, 99, 1234 };
    for (scalars) |s| {
        const point = G2.GENERATOR.mul_by_int(s);
        try std.testing.expect(point.isInSubgroup());
    }
}

test "BN254 pairing bilinearity" {
    const scalar1 = Fr.init(7);
    const scalar2 = Fr.init(11);

    const g1_base = G1.GENERATOR;
    const g2_base = G2.GENERATOR;

    const g1_scaled = g1_base.mul(&scalar1);
    const g2_scaled = g2_base.mul(&scalar2);

    const e1 = pairing(&g1_scaled, &g2_base);
    const e2 = pairing(&g1_base, &g2_scaled);
    const e_both = pairing(&g1_scaled, &g2_scaled);

    _ = e1.mul(&e2);
    const scalar_combined = scalar1.mul(&scalar2);
    const e_base = pairing(&g1_base, &g2_base);
    const e_expected = e_base.pow(scalar_combined.value);

    try std.testing.expect(e_both.equal(&e_expected));
}

test "BN254 pairing with infinity" {
    const g1_gen = G1.GENERATOR;
    const g2_gen = G2.GENERATOR;
    const g1_inf = G1.INFINITY;
    const g2_inf = G2.INFINITY;

    const result1 = pairing(&g1_inf, &g2_gen);
    try std.testing.expect(result1.equal(&Fp12Mont.ONE));

    const result2 = pairing(&g1_gen, &g2_inf);
    try std.testing.expect(result2.equal(&Fp12Mont.ONE));

    const result3 = pairing(&g1_inf, &g2_inf);
    try std.testing.expect(result3.equal(&Fp12Mont.ONE));
}

test "BN254 pairing non-degeneracy" {
    const g1_gen = G1.GENERATOR;
    const g2_gen = G2.GENERATOR;

    const result = pairing(&g1_gen, &g2_gen);
    try std.testing.expect(!result.equal(&Fp12Mont.ONE));
}

test "BN254 field modulus properties" {
    try std.testing.expect(FP_MOD > 0);
    try std.testing.expect(FR_MOD > 0);
    try std.testing.expect(FP_MOD != FR_MOD);
}

test "BN254 generator points are on curve" {
    try std.testing.expect(G1.GENERATOR.isOnCurve());
    try std.testing.expect(G2.GENERATOR.isOnCurve());
}

test "BN254 generator points are not infinity" {
    try std.testing.expect(!G1.GENERATOR.isInfinity());
    try std.testing.expect(!G2.GENERATOR.isInfinity());
}

test "BN254 G1 large scalar multiplication" {
    const large_scalar = FR_MOD - 1;
    const result = G1.GENERATOR.mul_by_int(large_scalar);
    const neg_gen = G1.GENERATOR.neg();
    try std.testing.expect(result.equal(&neg_gen));
}

test "BN254 G2 large scalar multiplication" {
    const large_scalar = FR_MOD - 1;
    const result = G2.GENERATOR.mul_by_int(large_scalar);
    const neg_gen = G2.GENERATOR.neg();
    try std.testing.expect(result.equal(&neg_gen));
}

test "BN254 G1 small scalar edge cases" {
    const gen = G1.GENERATOR;

    const by_2 = gen.mul_by_int(2);
    const doubled = gen.double();
    try std.testing.expect(by_2.equal(&doubled));

    const by_3 = gen.mul_by_int(3);
    const tripled = gen.add(&gen).add(&gen);
    try std.testing.expect(by_3.equal(&tripled));

    const by_4 = gen.mul_by_int(4);
    const quadrupled = doubled.double();
    try std.testing.expect(by_4.equal(&quadrupled));
}

test "BN254 G2 small scalar edge cases" {
    const gen = G2.GENERATOR;

    const by_2 = gen.mul_by_int(2);
    const doubled = gen.double();
    try std.testing.expect(by_2.equal(&doubled));

    const by_3 = gen.mul_by_int(3);
    const tripled = gen.add(&gen).add(&gen);
    try std.testing.expect(by_3.equal(&tripled));
}

test "BN254 G1 toAffine preserves point" {
    const scalar = Fr.init(17);
    const point = G1.GENERATOR.mul(&scalar);
    const affine = point.toAffine();

    try std.testing.expect(point.equal(&affine));
    try std.testing.expect(affine.isOnCurve());
    try std.testing.expect(affine.z.equal(&FpMont.ONE));
}

test "BN254 G2 toAffine preserves point" {
    const scalar = Fr.init(19);
    const point = G2.GENERATOR.mul(&scalar);
    const affine = point.toAffine();

    try std.testing.expect(point.equal(&affine));
    try std.testing.expect(affine.isOnCurve());
    try std.testing.expect(affine.z.equal(&Fp2Mont.ONE));
}

test "BN254 G1 negation twice gives original" {
    const scalar = Fr.init(23);
    const point = G1.GENERATOR.mul(&scalar);
    const neg_neg = point.neg().neg();
    try std.testing.expect(point.equal(&neg_neg));
}

test "BN254 G2 negation twice gives original" {
    const scalar = Fr.init(29);
    const point = G2.GENERATOR.mul(&scalar);
    const neg_neg = point.neg().neg();
    try std.testing.expect(point.equal(&neg_neg));
}

test "BN254 pairing additivity in first argument" {
    const scalar1 = Fr.init(3);
    const scalar2 = Fr.init(5);

    const p1 = G1.GENERATOR.mul(&scalar1);
    const p2 = G1.GENERATOR.mul(&scalar2);
    const q = G2.GENERATOR;

    const e_sum = pairing(&p1.add(&p2), &q);
    const e1 = pairing(&p1, &q);
    const e2 = pairing(&p2, &q);
    const e_product = e1.mul(&e2);

    try std.testing.expect(e_sum.equal(&e_product));
}

test "BN254 pairing additivity in second argument" {
    const scalar1 = Fr.init(7);
    const scalar2 = Fr.init(9);

    const p = G1.GENERATOR;
    const q1 = G2.GENERATOR.mul(&scalar1);
    const q2 = G2.GENERATOR.mul(&scalar2);

    const e_sum = pairing(&p, &q1.add(&q2));
    const e1 = pairing(&p, &q1);
    const e2 = pairing(&p, &q2);
    const e_product = e1.mul(&e2);

    try std.testing.expect(e_sum.equal(&e_product));
}
