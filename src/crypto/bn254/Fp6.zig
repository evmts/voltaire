const Fp2 = @import("Fp2.zig");
const Fp = @import("Fp.zig");
const curve_parameters = @import("curve_parameters.zig");
pub const FP_MOD = Fp2.FP_MOD;

pub const Fp6 = @This();
v0: Fp2,
v1: Fp2,
v2: Fp2,

pub const ZERO = Fp6{ .v0 = Fp2.ZERO, .v1 = Fp2.ZERO, .v2 = Fp2.ZERO };
pub const ONE = Fp6{ .v0 = Fp2.ONE, .v1 = Fp2.ZERO, .v2 = Fp2.ZERO };

pub const FROBENIUS_COEFF_V1 = curve_parameters.FROBENIUS_COEFF_FP6_V1;
pub const FROBENIUS_COEFF_V2 = curve_parameters.FROBENIUS_COEFF_FP6_V2;

pub fn init(val_v0: *const Fp2, val_v1: *const Fp2, val_v2: *const Fp2) Fp6 {
    return Fp6{
        .v0 = val_v0.*,
        .v1 = val_v1.*,
        .v2 = val_v2.*,
    };
}

pub fn init_from_int(v0_real: u256, v0_imag: u256, v1_real: u256, v1_imag: u256, v2_real: u256, v2_imag: u256) Fp6 {
    return Fp6{
        .v0 = Fp2.init_from_int(v0_real, v0_imag),
        .v1 = Fp2.init_from_int(v1_real, v1_imag),
        .v2 = Fp2.init_from_int(v2_real, v2_imag),
    };
}

pub fn add(self: *const Fp6, other: *const Fp6) Fp6 {
    return Fp6{
        .v0 = self.v0.add(&other.v0),
        .v1 = self.v1.add(&other.v1),
        .v2 = self.v2.add(&other.v2),
    };
}

pub fn addAssign(self: *Fp6, other: *const Fp6) void {
    self.* = self.add(other);
}

pub fn neg(self: *const Fp6) Fp6 {
    return Fp6{
        .v0 = self.v0.neg(),
        .v1 = self.v1.neg(),
        .v2 = self.v2.neg(),
    };
}

pub fn negAssign(self: *Fp6) void {
    self.* = self.neg();
}

pub fn sub(self: *const Fp6, other: *const Fp6) Fp6 {
    return Fp6{
        .v0 = self.v0.sub(&other.v0),
        .v1 = self.v1.sub(&other.v1),
        .v2 = self.v2.sub(&other.v2),
    };
}

pub fn subAssign(self: *Fp6, other: *const Fp6) void {
    self.* = self.sub(other);
}

pub fn mul(self: *const Fp6, other: *const Fp6) Fp6 {
    // ξ = 9 + u ∈ Fp2
    const xi = curve_parameters.XI;

    // s0 = a0 * b0, s1 = a1 * b1, s2 = a2 * b2
    const s0 = self.v0.mul(&other.v0);
    const s1 = self.v1.mul(&other.v1);
    const s2 = self.v2.mul(&other.v2);

    // t0 = (a1 + a2) * (b1 + b2)
    // t1 = (a0 + a1) * (b0 + b1)
    // t2 = (a0 + a2) * (b0 + b2)
    const t0 = self.v1.add(&self.v2).mul(&other.v1.add(&other.v2));
    const t1 = self.v0.add(&self.v1).mul(&other.v0.add(&other.v1));
    const t2 = self.v0.add(&self.v2).mul(&other.v0.add(&other.v2));

    // tmp0 = t0 - s1 - s2
    // tmp1 = t1 - s0 - s1
    // tmp2 = t2 - s0 - s2
    const tmp0 = t0.sub(&s1).sub(&s2);
    const tmp1 = t1.sub(&s0).sub(&s1);
    const tmp2 = t2.sub(&s0).sub(&s2);

    // c0 = s0 + ξ * tmp0
    // c1 = tmp1 + ξ * s2
    // c2 = tmp2 + s1
    const c0 = s0.add(&xi.mul(&tmp0));
    const c1 = tmp1.add(&xi.mul(&s2));
    const c2 = tmp2.add(&s1);

    return Fp6{
        .v0 = c0,
        .v1 = c1,
        .v2 = c2,
    };
}

pub fn mulAssign(self: *Fp6, other: *const Fp6) void {
    self.* = self.mul(other);
}

//we use double and add to multiply by a small integer
pub fn mulBySmallInt(self: *const Fp6, other: u64) Fp6 {
    var result = ZERO;
    var base = self.*;
    var exp = other;
    while (exp > 0) : (exp >>= 1) {
        if (exp & 1 == 1) {
            result.addAssign(&base);
        }
        base.addAssign(&base);
    }
    return result;
}

pub fn mulBySmallIntAssign(self: *Fp6, other: u64) void {
    self.* = self.mulBySmallInt(other);
}

// TODO: optimize this
pub fn square(self: *const Fp6) Fp6 {
    return self.mul(self);
}

pub fn squareAssign(self: *Fp6) void {
    self.* = self.square();
}

pub fn pow(self: *const Fp6, exponent: u256) Fp6 {
    var result = ONE;
    var base = self.*;
    var exp = exponent;
    while (exp > 0) {
        if (exp & 1 == 1) {
            result.mulAssign(&base);
        }
        base.mulAssign(&base);
        exp >>= 1;
    }
    return result;
}

pub fn powAssign(self: *Fp6, exponent: u256) void {
    self.* = self.pow(exponent);
}

pub fn norm(self: *const Fp6) Fp2 {
    const xi = curve_parameters.XI;

    // c0 = v0^2 - ξ * (v1 * v2)
    const c0 = self.v0.mul(&self.v0).sub(&xi.mul(&self.v1.mul(&self.v2)));

    // c1 = ξ * v2^2 - v0 * v1
    const c1 = xi.mul(&self.v2.mul(&self.v2)).sub(&self.v0.mul(&self.v1));

    // c2 = v1^2 - v0 * v2
    const c2 = self.v1.mul(&self.v1).sub(&self.v0.mul(&self.v2));

    // norm_result = v0 * c0 + ξ * (v2 * c1 + v1 * c2)
    return self.v0.mul(&c0).add(&xi.mul(&self.v2.mul(&c1).add(&self.v1.mul(&c2))));
}

pub fn scalarMul(self: *const Fp6, scalar: *const Fp) Fp6 {
    return Fp6{
        .v0 = self.v0.scalarMul(scalar),
        .v1 = self.v1.scalarMul(scalar),
        .v2 = self.v2.scalarMul(scalar),
    };
}

pub fn scalarMulAssign(self: *Fp6, scalar: *const Fp) void {
    self.* = self.scalarMul(scalar);
}

pub fn inv(self: *const Fp6) Fp6 {
    const xi = curve_parameters.XI;
    const three = Fp.init(3);

    // Calculate squares and basic products
    const v0_sq = self.v0.mul(&self.v0);
    const v1_sq = self.v1.mul(&self.v1);
    const v2_sq = self.v2.mul(&self.v2);
    const v2_xi = self.v2.mul(&xi);
    const v1_v0 = self.v1.mul(&self.v0);

    // Calculate norm factor components
    const D1 = v2_sq.mul(&v2_xi).mul(&xi);
    const D2 = v1_v0.mul(&v2_xi).scalarMul(&three);
    const D3 = v1_sq.mul(&self.v1).mul(&xi);
    const D4 = v0_sq.mul(&self.v0);

    const norm_factor = D1.sub(&D2).add(&D3).add(&D4);
    const norm_factor_inv = norm_factor.inv();

    // Calculate result components
    const result_v0 = v0_sq.sub(&v2_xi.mul(&self.v1));
    const result_v1 = v2_sq.mul(&xi).sub(&v1_v0);
    const result_v2 = v1_sq.sub(&self.v0.mul(&self.v2));

    return Fp6{
        .v0 = result_v0.mul(&norm_factor_inv),
        .v1 = result_v1.mul(&norm_factor_inv),
        .v2 = result_v2.mul(&norm_factor_inv),
    };
}

pub fn invAssign(self: *Fp6) void {
    self.* = self.inv();
}

pub fn equal(self: *const Fp6, other: *const Fp6) bool {
    return self.v0.equal(&other.v0) and self.v1.equal(&other.v1) and self.v2.equal(&other.v2);
}

pub fn frobeniusMap(self: *const Fp6) Fp6 {
    return Fp6{
        .v0 = self.v0.frobeniusMap(),
        .v1 = self.v1.frobeniusMap().mul(&FROBENIUS_COEFF_V1),
        .v2 = self.v2.frobeniusMap().mul(&FROBENIUS_COEFF_V2),
    };
}

pub fn frobeniusMapAssign(self: *Fp6) void {
    self.v0.frobeniusMapAssign();
    self.v1.frobeniusMapAssign();
    self.v2.frobeniusMapAssign();
}

pub fn print(self: *const Fp6) void {
    std.debug.print("Fp6(\n", .{});
    std.debug.print("  v0: (0x{x}+ u * 0x{x}),\n", .{ self.v0.u0.value, self.v0.u1.value });
    std.debug.print("  v1: (0x{x}+ u * 0x{x}),\n", .{ self.v1.u0.value, self.v1.u1.value });
    std.debug.print("  v2: (0x{x}+ u * 0x{x})\n", .{ self.v2.u0.value, self.v2.u1.value });
    std.debug.print(")\n", .{});
}


const std = @import("std");

// Helper function to check Fp6 equality
fn expectFp6Equal(expected: Fp6, actual: Fp6) !void {
try std.testing.expect(expected.equal(&actual));
}

test "Fp6.equal basic equality" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const b = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
try std.testing.expect(a.equal(&b));
}

test "Fp6.add basic addition" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const b = Fp6.init_from_int(7, 8, 9, 10, 11, 12);
const result = a.add(&b);
const expected = Fp6.init_from_int(8, 10, 12, 14, 16, 18);
try expectFp6Equal(expected, result);
}

test "Fp6.mul distributive property over addition" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const b = Fp6.init_from_int(7, 8, 9, 10, 11, 12);
const c = Fp6.init_from_int(13, 14, 15, 16, 17, 18);
const left = a.mul(&b.add(&c));
const right = a.mul(&b).add(&a.mul(&c));
try expectFp6Equal(left, right);
}

test "Fp6.mul associative property" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const b = Fp6.init_from_int(7, 8, 9, 10, 11, 12);
const c = Fp6.init_from_int(2, 3, 4, 5, 6, 7);
const left = a.mul(&b).mul(&c);
const right = a.mul(&b.mul(&c));
try expectFp6Equal(left, right);
}

test "Fp6.mul with zero" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const zero = Fp6.init_from_int(0, 0, 0, 0, 0, 0);
const result = a.mul(&zero);
try expectFp6Equal(zero, result);
}

test "Fp6.mul with one" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const one = Fp6.init_from_int(1, 0, 0, 0, 0, 0);
const result = a.mul(&one);
try expectFp6Equal(a, result);
}

test "Fp6.pow to power of zero" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const result = a.pow(0);
const one = Fp6.init_from_int(1, 0, 0, 0, 0, 0);
try expectFp6Equal(one, result);
}

test "Fp6.pow to power of one" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const result = a.pow(1);
try expectFp6Equal(a, result);
}

test "Fp6.pow basic squaring" {
const a = Fp6.init_from_int(1, 1, 1, 1, 1, 1);
const result = a.pow(2);
const manual_square = a.mul(&a);
try expectFp6Equal(manual_square, result);
}

test "Fp6.norm multiplicative property" {
const a = Fp6.init_from_int(2, 3, 4, 5, 6, 7);
const b = Fp6.init_from_int(8, 9, 10, 11, 12, 13);
const product = a.mul(&b);
const norm_product = product.norm();
const product_norms = a.norm().mul(&b.norm());
try std.testing.expect(norm_product.equal(&product_norms));
}

test "Fp6.neg verification" {
const a = Fp6.init_from_int(10, 20, 30, 40, 50, 60);
const neg_a = a.neg();
const sum = a.add(&neg_a);
const zero = Fp6.init_from_int(0, 0, 0, 0, 0, 0);
try expectFp6Equal(zero, sum);
}

// FERMAT'S LITTLE THEOREM TEST
test "Fp6.mul fermat's little theorem" {
const test_elements = [_]Fp6{
    Fp6.init_from_int(0, 0, 0, 0, 0, 0), // zero
    Fp6.init_from_int(1, 0, 0, 0, 0, 0), // one
    Fp6.init_from_int(2, 3, 0, 0, 0, 0), // simple element
    Fp6.init_from_int(1, 1, 1, 1, 1, 1), // all ones
    Fp6.init_from_int(5, 7, 11, 13, 17, 19), // mixed values
};

for (test_elements) |a| {
    // Test a^(p^6)==a using pow
    var pow_result = a.pow(FP_MOD);
    pow_result = pow_result.pow(FP_MOD);
    pow_result = pow_result.pow(FP_MOD);
    pow_result = pow_result.pow(FP_MOD);
    pow_result = pow_result.pow(FP_MOD);
    pow_result = pow_result.pow(FP_MOD);

    try expectFp6Equal(pow_result, a);
}
}

test "Fp6.inv basic inverse" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const a_inv = a.inv();
const product = a.mul(&a_inv);
const one = Fp6.init_from_int(1, 0, 0, 0, 0, 0);
try expectFp6Equal(one, product);
}

test "Fp6.inv double inverse" {
const a = Fp6.init_from_int(1, 2, 3, 4, 5, 6);
const a_inv = a.inv();
const a_double_inv = a_inv.inv();
try expectFp6Equal(a, a_double_inv);
}

test "Fp6.frobeniusMap" {
const pts = [_]Fp6{
    Fp6.init_from_int(3, 5, 7, 11, 13, 17),
    Fp6.init_from_int(123, 456, 789, 1011, 1213, 1415),
    Fp6.init_from_int(999, 888, 777, 666, 555, 444),
    Fp6.init_from_int(31415, 92653, 58979, 32384, 62643, 38327),
    Fp6.init_from_int(17, 23, 31, 47, 53, 61),
    Fp6.init_from_int(0, 1, 2, 3, 4, 5),
    Fp6.init_from_int(1, 0, 0, 1, 1, 1),
    Fp6.init_from_int(2023, 2024, 2025, 2026, 2027, 2028),
    Fp6.init_from_int(123456, 654321, 111111, 222222, 333333, 444444),
    Fp6.init_from_int(7, 6, 5, 4, 3, 2),
};

for (pts) |pt| {
    const frob_pow = pt.pow(FP_MOD);
    const frob_map = pt.frobeniusMap();
    try expectFp6Equal(frob_pow, frob_map);
}
}
