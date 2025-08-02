const fp_mod = @import("Fp.zig");
pub const Fp = fp_mod.Fp;
pub const FP_MOD = fp_mod.FP_MOD;

pub const Fp2 = struct {
    u0: Fp,
    u1: Fp,

    pub const ZERO = Fp2{ .u0 = Fp.ZERO, .u1 = Fp.ZERO };
    pub const ONE = Fp2{ .u0 = Fp.ONE, .u1 = Fp.ZERO };

    pub fn init(val_u0: *const Fp, val_u1: *const Fp) Fp2 {
        return Fp2{
            .u0 = val_u0.*,
            .u1 = val_u1.*,
        };
    }

    pub fn init_from_int(real: u256, imag: u256) Fp2 {
        return Fp2{
            .u0 = Fp.init(real),
            .u1 = Fp.init(imag),
        };
    }

    pub fn add(self: *const Fp2, other: *const Fp2) Fp2 {
        return Fp2{
            .u0 = self.u0.add(&other.u0),
            .u1 = self.u1.add(&other.u1),
        };
    }

    pub fn addAssign(self: *Fp2, other: *const Fp2) void {
        self.* = self.add(other);
    }

    pub fn neg(self: *const Fp2) Fp2 {
        return Fp2{
            .u0 = self.u0.neg(),
            .u1 = self.u1.neg(),
        };
    }

    pub fn negAssign(self: *Fp2) void {
        self.* = self.neg();
    }

    pub fn sub(self: *const Fp2, other: *const Fp2) Fp2 {
        return Fp2{
            .u0 = self.u0.sub(&other.u0),
            .u1 = self.u1.sub(&other.u1),
        };
    }

    pub fn subAssign(self: *Fp2, other: *const Fp2) void {
        self.* = self.sub(other);
    }

    pub fn mul(self: *const Fp2, other: *const Fp2) Fp2 {
        const ac = self.u0.mul(&other.u0);
        const bd = self.u1.mul(&other.u1);
        const ad = self.u0.mul(&other.u1);
        const bc = self.u1.mul(&other.u0);
        const result_u0 = ac.sub(&bd);
        const result_u1 = ad.add(&bc);

        return Fp2{
            .u0 = result_u0,
            .u1 = result_u1,
        };
    }

    pub fn mulAssign(self: *Fp2, other: *const Fp2) void {
        self.* = self.mul(other);
    }

    //we use double and add to multiply by a small integer
    pub fn mulBySmallInt(self: *const Fp2, other: u64) Fp2 {
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

    pub fn mulBySmallIntAssign(self: *Fp2, other: u64) void {
        self.* = self.mulBySmallInt(other);
    }

    // TODO: optimize this
    pub fn square(self: *const Fp2) Fp2 {
        return self.mul(self);
    }

    pub fn squareAssign(self: *Fp2) void {
        self.* = self.square();
    }

    pub fn pow(self: *const Fp2, exponent: u256) Fp2 {
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

    pub fn powAssign(self: *Fp2, exponent: u256) void {
        self.* = self.pow(exponent);
    }

    pub fn norm(self: *const Fp2) Fp {
        const real_sq = self.u0.mul(&self.u0);
        const imag_sq = self.u1.mul(&self.u1);
        return real_sq.add(&imag_sq);
    }

    pub fn conj(self: *const Fp2) Fp2 {
        return Fp2{
            .u0 = self.u0,
            .u1 = self.u1.neg(),
        };
    }

    pub fn conjAssign(self: *Fp2) void {
        self.* = self.conj();
    }

    pub fn scalarMul(self: *const Fp2, scalar: *const Fp) Fp2 {
        return Fp2{
            .u0 = self.u0.mul(scalar),
            .u1 = self.u1.mul(scalar),
        };
    }

    pub fn scalarMulAssign(self: *Fp2, scalar: *const Fp) void {
        self.* = self.scalarMul(scalar);
    }

    pub fn inv(self: *const Fp2) Fp2 {
        const norm_val = self.norm();
        const norm_inv = norm_val.inv();
        const conj_val = self.conj();
        return conj_val.scalarMul(&norm_inv);
    }

    pub fn invAssign(self: *Fp2) void {
        self.* = self.inv();
    }

    pub fn equal(self: *const Fp2, other: *const Fp2) bool {
        return self.u0.equal(&other.u0) and self.u1.equal(&other.u1);
    }

    pub fn frobeniusMap(self: *const Fp2) Fp2 {
        return self.conj();
    }

    pub fn frobeniusMapAssign(self: *Fp2) void {
        self.* = self.frobeniusMap();
    }
};

const std = @import("std");

// Helper function to create Fp2 from integers
fn fp2(real: u256, imag: u256) Fp2 {
    return Fp2{ .u0 = Fp{ .value = real }, .u1 = Fp{ .value = imag } };
}

// Helper function to check Fp2 equality
fn expectFp2Equal(expected: Fp2, actual: Fp2) !void {
    try std.testing.expect(expected.u0.value == actual.u0.value);
    try std.testing.expect(expected.u1.value == actual.u1.value);
}

test "Fp2.add basic addition" {
    const a = fp2(10, 20);
    const b = fp2(30, 40);
    const result = a.add(&b);
    try expectFp2Equal(fp2(40, 60), result);
}

test "Fp2.add with zero" {
    const a = fp2(100, 200);
    const zero = fp2(0, 0);
    const result = a.add(&zero);
    try expectFp2Equal(a, result);
}

test "Fp2.add commutative property" {
    const a = fp2(15, 25);
    const b = fp2(35, 45);
    const result1 = a.add(&b);
    const result2 = b.add(&a);
    try expectFp2Equal(result1, result2);
}

test "Fp2.neg basic negation" {
    const a = fp2(100, 200);
    const result = a.neg();
    const expected = fp2(FP_MOD - 100, FP_MOD - 200);
    try expectFp2Equal(expected, result);
}

test "Fp2.neg double negation" {
    const a = fp2(123, 456);
    const result = a.neg().neg();
    try expectFp2Equal(a, result);
}

test "Fp2.neg of zero" {
    const zero = fp2(0, 0);
    const result = zero.neg();
    const expected = fp2(0, 0);
    try expectFp2Equal(expected, result);
}

test "Fp2.sub basic subtraction" {
    const a = fp2(50, 80);
    const b = fp2(20, 30);
    const result = a.sub(&b);
    try expectFp2Equal(fp2(30, 50), result);
}

test "Fp2.sub with zero" {
    const a = fp2(100, 200);
    const zero = fp2(0, 0);
    const result = a.sub(&zero);
    try expectFp2Equal(a, result);
}

test "Fp2.sub from zero" {
    const a = fp2(25, 35);
    const zero = fp2(0, 0);
    const result = zero.sub(&a);
    try expectFp2Equal(a.neg(), result);
}

test "Fp2.mul basic multiplication" {
    const a = fp2(3, 4);
    const b = fp2(1, 2);
    const result = a.mul(&b);
    // (3 + 4i)(1 + 2i) = 3 + 6i + 4i + 8i^2 = 3 + 10i - 8 = -5 + 10i
    const expected = fp2(FP_MOD - 5, 10);
    try expectFp2Equal(expected, result);
}

test "Fp2.mul with zero" {
    const a = fp2(100, 200);
    const zero = fp2(0, 0);
    const result = a.mul(&zero);
    try expectFp2Equal(zero, result);
}

test "Fp2.mul with one" {
    const a = fp2(123, 456);
    const one = fp2(1, 0);
    const result = a.mul(&one);
    try expectFp2Equal(a, result);
}

test "Fp2.mul with i" {
    const a = fp2(5, 7);
    const i = fp2(0, 1);
    const result = a.mul(&i);
    // (5 + 7i)(0 + 1i) = 0 + 5i + 0 + 7i^2 = 5i - 7 = -7 + 5i
    const expected = fp2(FP_MOD - 7, 5);
    try expectFp2Equal(expected, result);
}

test "Fp2.mul commutative property" {
    const a = fp2(6, 8);
    const b = fp2(3, 5);
    const result1 = a.mul(&b);
    const result2 = b.mul(&a);
    try expectFp2Equal(result1, result2);
}

test "Fp2.pow to power of zero" {
    const a = fp2(123, 456);
    const result = a.pow(0);
    try expectFp2Equal(fp2(1, 0), result);
}

test "Fp2.pow to power of one" {
    const a = fp2(123, 456);
    const result = a.pow(1);
    try expectFp2Equal(a, result);
}

test "Fp2.pow basic power" {
    const a = fp2(2, 1);
    const result = a.pow(2);
    // (2 + i)^2 = 4 + 4i + i^2 = 4 + 4i - 1 = 3 + 4i
    try expectFp2Equal(fp2(3, 4), result);
}

test "Fp2.pow of i" {
    const i = fp2(0, 1);
    const result = i.pow(2);
    // i^2 = -1
    try expectFp2Equal(fp2(FP_MOD - 1, 0), result);
}

test "Fp2.norm basic norm" {
    const a = fp2(3, 4);
    const result = a.norm();
    // norm(3 + 4i) = 3^2 + 4^2 = 9 + 16 = 25
    try std.testing.expect(result.value == 25);
}

test "Fp2.norm of zero" {
    const zero = fp2(0, 0);
    const result = zero.norm();
    try std.testing.expect(result.value == 0);
}

test "Fp2.norm of one" {
    const one = fp2(1, 0);
    const result = one.norm();
    try std.testing.expect(result.value == 1);
}

test "Fp2.norm of i" {
    const i = fp2(0, 1);
    const result = i.norm();
    try std.testing.expect(result.value == 1);
}

test "Fp2.conj basic conjugate" {
    const a = fp2(5, 7);
    const result = a.conj();
    try expectFp2Equal(fp2(5, FP_MOD - 7), result);
}

test "Fp2.conj double conjugate" {
    const a = fp2(123, 456);
    const result = a.conj().conj();
    try expectFp2Equal(a, result);
}

test "Fp2.conj of real number" {
    const a = fp2(100, 0);
    const result = a.conj();
    const expected = fp2(100, 0); // neg(0) = FP_MOD in finite field
    try expectFp2Equal(expected, result);
}

test "Fp2.conj mathematical property" {
    const a = fp2(50, 75);
    const conj_a = a.conj();
    const product = a.mul(&conj_a);
    const norm_squared = a.norm();
    // a * conj(a) should equal norm(a)
    try expectFp2Equal(fp2(norm_squared.value, 0), product);
}

test "Fp2.scalarMul basic scalar multiplication" {
    const a = fp2(3, 4);
    const scalar = Fp{ .value = 5 };
    const result = a.scalarMul(&scalar);
    try expectFp2Equal(fp2(15, 20), result);
}

test "Fp2.scalarMul with zero" {
    const a = fp2(10, 20);
    const zero = Fp{ .value = 0 };
    const result = a.scalarMul(&zero);
    try expectFp2Equal(fp2(0, 0), result);
}

test "Fp2.scalarMul with one" {
    const a = fp2(123, 456);
    const one = Fp{ .value = 1 };
    const result = a.scalarMul(&one);
    try expectFp2Equal(a, result);
}

test "Fp2.inv basic inverse" {
    const a = fp2(3, 4);
    const a_inv = a.inv();
    const product = a.mul(&a_inv);
    // Should be approximately (1, 0)
    try expectFp2Equal(fp2(1, 0), product);
}

test "Fp2.inv of one" {
    const one = fp2(1, 0);
    const result = one.inv();
    try expectFp2Equal(one, result);
}

test "Fp2.inv double inverse" {
    const a = fp2(17, 23);
    const a_inv = a.inv();
    const a_double_inv = a_inv.inv();
    try expectFp2Equal(a, a_double_inv);
}

test "Fp2.inv of i" {
    const i = fp2(0, 1);
    const i_inv = i.inv();
    const product = i.mul(&i_inv);
    try expectFp2Equal(fp2(1, 0), product);
}

test "Fp2.equal basic equality" {
    const a = fp2(123, 456);
    const b = fp2(123, 456);
    try std.testing.expect(a.equal(&b));
}

test "Fp2.equal different values" {
    const a = fp2(123, 456);
    const b = fp2(789, 456);
    try std.testing.expect(!a.equal(&b));
}

test "Fp2.equal different imaginary parts" {
    const a = fp2(123, 456);
    const b = fp2(123, 789);
    try std.testing.expect(!a.equal(&b));
}

test "Fp2.equal with zero" {
    const a = fp2(0, 0);
    const b = fp2(0, 0);
    try std.testing.expect(a.equal(&b));
}

test "Fp2.equal reflexive property" {
    const a = fp2(111, 222);
    try std.testing.expect(a.equal(&a));
}

test "Fp2.equal symmetric property" {
    const a = fp2(333, 444);
    const b = fp2(333, 444);
    try std.testing.expect(a.equal(&b));
    try std.testing.expect(b.equal(&a));
}

test "Fp2.equal one component different" {
    const a = fp2(100, 200);
    const b = fp2(100, 201);
    const c = fp2(101, 200);
    try std.testing.expect(!a.equal(&b));
    try std.testing.expect(!a.equal(&c));
}

test "Fp2.init basic initialization" {
    const a = Fp2.init_from_int(123, 456);
    try std.testing.expect(a.u0.value == 123);
    try std.testing.expect(a.u1.value == 456);
}

test "Fp2.init with modular reduction" {
    const a = Fp2.init_from_int(FP_MOD + 5, FP_MOD + 10);
    try std.testing.expect(a.u0.value == 5);
    try std.testing.expect(a.u1.value == 10);
}

test "Fp2.mul complex edge cases near modulus" {
    const a = fp2(FP_MOD - 1, FP_MOD - 1);
    const b = fp2(FP_MOD - 1, FP_MOD - 1);
    const result = a.mul(&b);
    // (FP_MOD-1 + (FP_MOD-1)i)^2 = (FP_MOD-1)^2 - (FP_MOD-1)^2 + 2(FP_MOD-1)^2 i = 2(FP_MOD-1)^2 i
    try std.testing.expect(result.u0.value == 0);
    try std.testing.expect(result.u1.value == 2); // Since (FP_MOD-1)^2 ≡ 1 (mod FP_MOD)
}

test "Fp2.mul distributive property over addition" {
    const a = fp2(123, 456);
    const b = fp2(789, 321);
    const c = fp2(654, 987);
    const left = a.mul(&b.add(&c));
    const right = a.mul(&b).add(&a.mul(&c));
    try expectFp2Equal(left, right);
}

test "Fp2.mul associative property" {
    const a = fp2(12, 34);
    const b = fp2(56, 78);
    const c = fp2(91, 23);
    const left = a.mul(&b).mul(&c);
    const right = a.mul(&b).mul(&c);
    try expectFp2Equal(left, right);
}

test "Fp2.mul by complex conjugate gives norm" {
    const a = fp2(123, 456);
    const conj_a = a.conj();
    const product = a.mul(&conj_a);
    const norm_a = a.norm();
    try expectFp2Equal(fp2(norm_a.value, 0), product);
}

test "Fp2.mul i properties" {
    const i = fp2(0, 1);
    const i_squared = i.mul(&i);
    try expectFp2Equal(fp2(FP_MOD - 1, 0), i_squared); // i^2 = -1

    const i_cubed = i_squared.mul(&i);
    try expectFp2Equal(fp2(0, FP_MOD - 1), i_cubed); // i^3 = -i

    const i_fourth = i_cubed.mul(&i);
    try expectFp2Equal(fp2(1, 0), i_fourth); // i^4 = 1
}

test "Fp2.pow complex exponentiation edge cases" {
    const a = fp2(2, 3);
    const a_256 = a.pow(256);
    // Should compute correctly without overflow
    try std.testing.expect(a_256.u0.value < FP_MOD);
    try std.testing.expect(a_256.u1.value < FP_MOD);

    // Test that a^0 = 1 for any non-zero a
    const a_zero = a.pow(0);
    try expectFp2Equal(fp2(1, 0), a_zero);
}

test "Fp2.norm multiplicative property" {
    const a = fp2(12, 34);
    const b = fp2(56, 78);
    const product = a.mul(&b);
    const norm_product = product.norm();
    const product_norms = a.norm().mul(&b.norm());
    try std.testing.expect(norm_product.equal(&product_norms));
}

test "Fp2.inv edge cases with large values" {
    const a = fp2(FP_MOD - 100, FP_MOD - 200);
    const a_inv = a.inv();
    const product = a.mul(&a_inv);
    try expectFp2Equal(fp2(1, 0), product);
}

test "Fp2.add/sub near modulus boundaries" {
    const a = fp2(FP_MOD - 5, FP_MOD - 10);
    const b = fp2(10, 20);
    const sum = a.add(&b);
    const diff = a.sub(&b);

    // Addition should wrap correctly
    try std.testing.expect(sum.u0.value == 5);
    try std.testing.expect(sum.u1.value == 10);

    // Subtraction should handle underflow correctly
    try std.testing.expect(diff.u0.value == FP_MOD - 15);
    try std.testing.expect(diff.u1.value == FP_MOD - 30);
}
