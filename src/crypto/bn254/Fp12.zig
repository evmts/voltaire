const Fp6_mod = @import("Fp6.zig");
const Fp6 = Fp6_mod.Fp6;
const Fp = Fp6_mod.Fp;
const Fp2_mod = @import("Fp2.zig");
const Fp2 = Fp2_mod.Fp2;

pub const Fp12 = struct {
    w0: Fp6,
    w1: Fp6,

    pub const ZERO = Fp12{ .w0 = Fp6.ZERO, .w1 = Fp6.ZERO };
    pub const ONE = Fp12{ .w0 = Fp6.ONE, .w1 = Fp6.ZERO };

    const FROBENIUS_COEFF_Fp6 = Fp6{
        .v0 = Fp2.init_from_int(8376118865763821496583973867626364092589906065868298776909617916018768340080, 16469823323077808223889137241176536799009286646108169935659301613961712198316),
        .v1 = Fp2.ZERO,
        .v2 = Fp2.ZERO,
    };

    pub fn init(w0: *const Fp6, w1: *const Fp6) Fp12 {
        return Fp12{ .w0 = w0.*, .w1 = w1.* };
    }

    pub fn init_from_int(w0_v0_real: u256, w0_v0_imag: u256, w0_v1_real: u256, w0_v1_imag: u256, w0_v2_real: u256, w0_v2_imag: u256, w1_v0_real: u256, w1_v0_imag: u256, w1_v1_real: u256, w1_v1_imag: u256, w1_v2_real: u256, w1_v2_imag: u256) Fp12 {
        const w0 = Fp6.init_from_int(w0_v0_real, w0_v0_imag, w0_v1_real, w0_v1_imag, w0_v2_real, w0_v2_imag);
        const w1 = Fp6.init_from_int(w1_v0_real, w1_v0_imag, w1_v1_real, w1_v1_imag, w1_v2_real, w1_v2_imag);
        return Fp12{
            .w0 = w0,
            .w1 = w1,
        };
    }

    pub fn add(self: *const Fp12, other: *const Fp12) Fp12 {
        return Fp12{
            .w0 = self.w0.add(&other.w0),
            .w1 = self.w1.add(&other.w1),
        };
    }

    pub fn addAssign(self: *Fp12, other: *const Fp12) void {
        self.* = self.add(other);
    }

    pub fn neg(self: *const Fp12) Fp12 {
        return Fp12{
            .w0 = self.w0.neg(),
            .w1 = self.w1.neg(),
        };
    }

    pub fn negAssign(self: *Fp12) void {
        self.* = self.neg();
    }

    pub fn sub(self: *const Fp12, other: *const Fp12) Fp12 {
        return Fp12{
            .w0 = self.w0.sub(&other.w0),
            .w1 = self.w1.sub(&other.w1),
        };
    }

    pub fn subAssign(self: *Fp12, other: *const Fp12) void {
        self.* = self.sub(other);
    }

    pub fn mul(self: *const Fp12, other: *const Fp12) Fp12 {
        const v = Fp6.init_from_int(0, 0, 1, 0, 0, 0);

        const w0_mul_w0 = self.w0.mul(&other.w0);
        const w1_mul_w1 = self.w1.mul(&other.w1);
        const result_w0 = w0_mul_w0.add(&v.mul(&w1_mul_w1));

        const result_w1 = self.w1.mul(&other.w0).add(&self.w0.mul(&other.w1));

        return Fp12{
            .w0 = result_w0,
            .w1 = result_w1,
        };
    }

    pub fn mulAssign(self: *Fp12, other: *const Fp12) void {
        self.* = self.mul(other);
    }

    //we use double and add to multiply by a small integer
    pub fn mulBySmallInt(self: *const Fp12, other: u64) Fp12 {
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

    pub fn mulBySmallIntAssign(self: *Fp12, other: u64) void {
        self.* = self.mulBySmallInt(other);
    }

    // TODO: optimize this
    pub fn square(self: *const Fp12) Fp12 {
        return self.mul(self);
    }

    pub fn squareAssign(self: *Fp12) void {
        self.* = self.square();
    }

    pub fn pow(self: *const Fp12, exponent: u256) Fp12 {
        var result = ONE;
        var base = self.*;
        var exp = exponent;
        while (exp > 0) : (exp >>= 1) {
            if (exp & 1 == 1) {
                result.mulAssign(&base);
            }
            base.mulAssign(&base);
        }
        return result;
    }

    pub fn powAssign(self: *Fp12, exponent: u256) void {
        self.* = self.pow(exponent);
    }

    pub fn inv(self: *const Fp12) Fp12 {
        const v = Fp6.init_from_int(0, 0, 1, 0, 0, 0);

        const w0_squared = self.w0.mul(&self.w0);
        const w1_squared = self.w1.mul(&self.w1);
        const norm = w0_squared.sub(&v.mul(&w1_squared));
        const norm_inv = norm.inv();

        return Fp12{
            .w0 = self.w0.mul(&norm_inv),
            .w1 = self.w1.mul(&norm_inv).neg(),
        };
    }

    pub fn invAssign(self: *Fp12) void {
        self.* = self.inv();
    }

    pub fn equal(self: *const Fp12, other: *const Fp12) bool {
        return self.w0.equal(&other.w0) and self.w1.equal(&other.w1);
    }

    pub fn frobeniusMap(self: *const Fp12) Fp12 {
        return Fp12{
            .w0 = self.w0.frobeniusMap(),
            .w1 = self.w1.frobeniusMap().mul(&FROBENIUS_COEFF_Fp6),
        };
    }

    pub fn frobeniusMapAssign(self: *Fp12) void {
        self.* = self.frobeniusMap();
    }
};

const std = @import("std");
const FP_MOD = Fp6_mod.FP_MOD;

// Helper function to create Fp12 from Fp6 values
fn fp12(w0: Fp6, w1: Fp6) Fp12 {
    return Fp12.init(w0, w1);
}

// Helper function to check Fp12 equality
fn expectFp12Equal(expected: Fp12, actual: Fp12) !void {
    try std.testing.expect(expected.equal(&actual));
}

test "Fp12.add basic addition" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const b = Fp12.init_from_int(13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24);
    const result = a.add(&b);
    const expected = Fp12.init_from_int(14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36);
    try expectFp12Equal(expected, result);
}

test "Fp12.mul distributive property over addition" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const b = Fp12.init_from_int(13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24);
    const c = Fp12.init_from_int(25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36);
    const left = a.mul(&b.add(&c));
    const right = a.mul(&b).add(&a.mul(&c));
    try expectFp12Equal(left, right);
}

test "Fp12.mul associative property" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const b = Fp12.init_from_int(13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24);
    const c = Fp12.init_from_int(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13);
    const left = a.mul(&b).mul(&c);
    const right = a.mul(&b.mul(&c));
    try expectFp12Equal(left, right);
}

test "Fp12.mul with zero" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const zero = Fp12.ZERO;
    const result = a.mul(&zero);
    try expectFp12Equal(zero, result);
}

test "Fp12.mul with one" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const one = Fp12.ONE;
    const result = a.mul(&one);
    try expectFp12Equal(a, result);
}

test "Fp12.pow to power of zero" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const result = a.pow(0);
    const one = Fp12.ONE;
    try expectFp12Equal(one, result);
}

test "Fp12.pow to power of one" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const result = a.pow(1);
    try expectFp12Equal(a, result);
}

test "Fp12.pow basic squaring" {
    const a = Fp12.init_from_int(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
    const result = a.pow(2);
    const manual_square = a.mul(&a);
    try expectFp12Equal(manual_square, result);
}

test "Fp12.neg verification" {
    const a = Fp12.init_from_int(10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120);
    const neg_a = a.neg();
    const sum = a.add(&neg_a);
    const zero = Fp12.ZERO;
    try expectFp12Equal(zero, sum);
}

// FERMAT'S LITTLE THEOREM TEST FOR Fp12
test "Fp12.pow fermat's little theorem" {
    const test_elements = [_]Fp12{
        Fp12.ZERO, // zero
        Fp12.ONE, // one
        Fp12.init_from_int(2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), // simple element
        Fp12.init_from_int(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), // all ones
        Fp12.init_from_int(5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43), // mixed values
    };

    for (test_elements) |a| {
        // Test a^(p^12) == a using pow (Fermat's Little Theorem for Fp12)
        var pow_result = a.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);
        pow_result = pow_result.pow(FP_MOD);

        try expectFp12Equal(pow_result, a);
    }
}

test "Fp12.inv basic inverse" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const a_inv = a.inv();
    const product = a.mul(&a_inv);
    const one = Fp12.ONE;
    try expectFp12Equal(one, product);
}

test "Fp12.inv double inverse" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const a_inv = a.inv();
    const a_double_inv = a_inv.inv();
    try expectFp12Equal(a, a_double_inv);
}

test "Fp12.inv multiplication verification" {
    const test_elements = [_]Fp12{
        Fp12.ONE,
        Fp12.init_from_int(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13),
        Fp12.init_from_int(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
        Fp12.init_from_int(5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
        Fp12.init_from_int(0, 0, 0, 0, 0, 0, 3, 7, 0, 0, 0, 0),
    };

    for (test_elements) |a| {
        const a_inv = a.inv();
        const product1 = a.mul(&a_inv);
        const product2 = a_inv.mul(&a);
        const one = Fp12.ONE;

        // Both a * a^-1 and a^-1 * a should equal 1
        try expectFp12Equal(one, product1);
        try expectFp12Equal(one, product2);
    }
}

test "Fp12.sub basic subtraction" {
    const a = Fp12.init_from_int(10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120);
    const b = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const result = a.sub(&b);
    const expected = Fp12.init_from_int(9, 18, 27, 36, 45, 54, 63, 72, 81, 90, 99, 108);
    try expectFp12Equal(expected, result);
}

test "Fp12.mul commutativity" {
    const a = Fp12.init_from_int(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const b = Fp12.init_from_int(13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24);
    const left = a.mul(&b);
    const right = b.mul(&a);
    try expectFp12Equal(left, right);
}

test "Fp12.frobeniusMap" {
    const pts = [_]Fp12{
        Fp12.init_from_int(3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41),
        Fp12.init_from_int(123, 456, 789, 1011, 1213, 1415, 1617, 1819, 2021, 2223, 2425, 2627),
        Fp12.init_from_int(999, 888, 777, 666, 555, 444, 333, 222, 111, 100, 99, 88),
        Fp12.init_from_int(31415, 92653, 58979, 32384, 62643, 38327, 95028, 84197, 16939, 93751, 5820, 9749),
        Fp12.init_from_int(17, 23, 31, 47, 53, 61, 67, 71, 73, 79, 83, 89),
        Fp12.init_from_int(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11),
        Fp12.init_from_int(1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0),
        Fp12.init_from_int(2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034),
        Fp12.init_from_int(123456, 654321, 111111, 222222, 333333, 444444, 555555, 666666, 777777, 888888, 999999, 101010),
        Fp12.init_from_int(7, 6, 5, 4, 3, 2, 1, 0, 9, 8, 7, 6),
    };

    for (pts) |pt| {
        const frob_pow = pt.pow(FP_MOD);
        const frob_map = pt.frobeniusMap();
        try expectFp12Equal(frob_pow, frob_map);
    }
}
