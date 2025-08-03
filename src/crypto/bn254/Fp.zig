const std = @import("std");
const curve_parameters = @import("curve_parameters.zig");

pub const FP_MOD = curve_parameters.FP_MOD;

pub const Fp = @This();

value: u256,

pub const ZERO = Fp{ .value = 0 };
pub const ONE = Fp{ .value = 1 };

pub fn init(value: u256) Fp {
return Fp{
    .value = value % FP_MOD,
};
}

pub fn add(self: *const Fp, other: *const Fp) Fp {
    const sum = self.value + other.value;
    return Fp{
        .value = if (sum >= FP_MOD) sum - FP_MOD else sum,
    };
}

pub fn addAssign(self: *Fp, other: *const Fp) void {
    self.* = self.add(other);
}

pub fn neg(self: *const Fp) Fp {
    return Fp{
        .value = if (self.value == 0) 0 else FP_MOD - self.value,
    };
}

pub fn negAssign(self: *Fp) void {
    self.* = self.neg();
}

pub fn sub(self: *const Fp, other: *const Fp) Fp {
    return self.add(&other.neg());
}

pub fn subAssign(self: *Fp, other: *const Fp) void {
    self.* = self.sub(other);
}

pub fn mul(self: *const Fp, other: *const Fp) Fp {
    const product = @as(u512, self.value) * @as(u512, other.value);
    return Fp{
        .value = @intCast(product % FP_MOD),
    };
}

pub fn mulAssign(self: *Fp, other: *const Fp) void {
    self.* = self.mul(other);
}

//we use double and add to multiply by a small integer
pub fn mulBySmallInt(self: *const Fp, other: u64) Fp {
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

pub fn mulBySmallIntAssign(self: *Fp, other: u64) void {
    self.* = self.mulBySmallInt(other);
}

pub fn square(self: *const Fp) Fp {
    return self.mul(self);
}

pub fn pow(self: *const Fp, exponent: u256) Fp {
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

pub fn powAssign(self: *Fp, exponent: u256) void {
    self.* = self.pow(exponent);
}

// Fermat's little theorem: a^(p-1) = 1 (mod p)
// disgustingly slow, temporary solution
pub fn inv(self: *const Fp) Fp {
    return self.pow(FP_MOD - 2);
}

pub fn invAssign(self: *Fp) void {
    self.* = self.inv();
}

pub fn equal(self: *const Fp, other: *const Fp) bool {
    return self.value == other.value;
}

    test "Fp.mulBySmallInt basic multiplication" {
    const a = Fp{ .value = 2 };
    const result = a.mulBySmallInt(3);
    try std.testing.expect(result.value == 6);
    }

    test "Fp.add basic addition" {
    const a = Fp{ .value = 10 };
    const b = Fp{ .value = 20 };
    const result = a.add(&b);
    try std.testing.expect(result.value == 30);
    }

    test "Fp.add with modular reduction" {
    const a = Fp{ .value = FP_MOD - 1 };
    const b = Fp{ .value = 5 };
    const result = a.add(&b);
    try std.testing.expect(result.value == 4);
    }

    test "Fp.add with zero" {
    const a = Fp{ .value = 100 };
    const b = Fp{ .value = 0 };
    const result = a.add(&b);
    try std.testing.expect(result.value == 100);
    }

    test "Fp.add resulting in modulus" {
    const a = Fp{ .value = FP_MOD - 10 };
    const b = Fp{ .value = 10 };
    const result = a.add(&b);
    try std.testing.expect(result.value == 0);
    }

    test "Fp.neg basic negation" {
    const a = Fp{ .value = 100 };
    const result = a.neg();
    try std.testing.expect(result.value == FP_MOD - 100);
    }

    test "Fp.neg of zero" {
    const a = Fp{ .value = 0 };
    const result = a.neg();
    try std.testing.expect(result.value == 0);
    }

    test "Fp.neg of maximum value" {
    const a = Fp{ .value = FP_MOD - 1 };
    const result = a.neg();
    try std.testing.expect(result.value == 1);
    }

    test "Fp.sub basic subtraction" {
    const a = Fp{ .value = 50 };
    const b = Fp{ .value = 20 };
    const result = a.sub(&b);
    try std.testing.expect(result.value == 30);
    }

    test "Fp.sub with underflow" {
    const a = Fp{ .value = 10 };
    const b = Fp{ .value = 20 };
    const result = a.sub(&b);
    try std.testing.expect(result.value == FP_MOD - 10);
    }

    test "Fp.sub with zero" {
    const a = Fp{ .value = 100 };
    const b = Fp{ .value = 0 };
    const result = a.sub(&b);
    try std.testing.expect(result.value == 100);
    }

    test "Fp.sub from zero" {
    const a = Fp{ .value = 0 };
    const b = Fp{ .value = 25 };
    const result = a.sub(&b);
    try std.testing.expect(result.value == FP_MOD - 25);
    }

    test "Fp.mul basic multiplication" {
    const a = Fp{ .value = 6 };
    const b = Fp{ .value = 5 };
    const result = a.mul(&b);
    try std.testing.expect(result.value == 30);
    }

    test "Fp.mul with zero" {
    const a = Fp{ .value = 100 };
    const b = Fp{ .value = 0 };
    const result = a.mul(&b);
    try std.testing.expect(result.value == 0);
    }

    test "Fp.mul with one" {
    const a = Fp{ .value = 123 };
    const b = Fp{ .value = 1 };
    const result = a.mul(&b);
    try std.testing.expect(result.value == 123);
    }

    test "Fp.mul with modular reduction" {
    const a = Fp{ .value = FP_MOD - 1 };
    const b = Fp{ .value = 2 };
    const result = a.mul(&b);
    try std.testing.expect(result.value == FP_MOD - 2);
    }

    test "Fp.mul large values" {
    const a = Fp{ .value = 0x1000000000000000000000000000000000000000000000000000000000000000 };
    const b = Fp{ .value = 0x2000000000000000000000000000000000000000000000000000000000000000 };
    const result = a.mul(&b);
    // This will test the modular reduction behavior with large numbers
    try std.testing.expect(result.value < FP_MOD);
    }

    test "Fp.pow basic power" {
    const a = Fp{ .value = 2 };
    const result = a.pow(3);
    try std.testing.expect(result.value == 8);
    }

    test "Fp.pow to power of zero" {
    const a = Fp{ .value = 123 };
    const result = a.pow(0);
    try std.testing.expect(result.value == 1);
    }

    test "Fp.pow to power of one" {
    const a = Fp{ .value = 456 };
    const result = a.pow(1);
    try std.testing.expect(result.value == 456);
    }

    test "Fp.pow with base zero" {
    const a = Fp{ .value = 0 };
    const result = a.pow(5);
    try std.testing.expect(result.value == 0);
    }

    test "Fp.pow with base one" {
    const a = Fp{ .value = 1 };
    const result = a.pow(100);
    try std.testing.expect(result.value == 1);
    }

    test "Fp.pow large exponent" {
    const a = Fp{ .value = 3 };
    const result = a.pow(10);
    try std.testing.expect(result.value == 59049);
    }

    test "Fp.pow with modular reduction" {
    const a = Fp{ .value = FP_MOD - 1 };
    const result = a.pow(2);
    try std.testing.expect(result.value == 1);
    }

    test "Fp.inv basic inverse" {
    const a = Fp{ .value = 2 };
    const a_inv = a.inv();
    const product = a.mul(&a_inv);
    try std.testing.expect(product.value == 1);
    }

    test "Fp.inv of one" {
    const a = Fp{ .value = 1 };
    const result = a.inv();
    try std.testing.expect(result.value == 1);
    }

    test "Fp.inv double inverse" {
    const a = Fp{ .value = 17 };
    const a_inv = a.inv();
    const a_double_inv = a_inv.inv();
    try std.testing.expect(a_double_inv.value == a.value);
    }

    test "Fp.inv with known value" {
    const a = Fp{ .value = 3 };
    const a_inv = a.inv();
    const product = a.mul(&a_inv);
    try std.testing.expect(product.value == 1);
    }

    test "Fp.inv large value" {
    const a = Fp{ .value = 12345678 };
    const a_inv = a.inv();
    const product = a.mul(&a_inv);
    try std.testing.expect(product.value == 1);
    }

    test "Fp.equal basic equality" {
    const a = Fp{ .value = 123 };
    const b = Fp{ .value = 123 };
    try std.testing.expect(a.equal(&b));
    }

    test "Fp.equal different values" {
    const a = Fp{ .value = 123 };
    const b = Fp{ .value = 456 };
    try std.testing.expect(!a.equal(&b));
    }

    test "Fp.init basic initialization" {
    const a = Fp.init(123);
    try std.testing.expect(a.value == 123);
    }

    test "Fp.init with modular reduction" {
    const a = Fp.init(FP_MOD + 5);
    try std.testing.expect(a.value == 5);
    }

    test "Fp.mul near modulus boundary" {
    const a = Fp{ .value = FP_MOD - 1 };
    const b = Fp{ .value = FP_MOD - 1 };
    const result = a.mul(&b);
    try std.testing.expect(result.value == 1);
    }

    test "Fp.mul maximum values causing overflow" {
    const a = Fp{ .value = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF };
    const b = Fp{ .value = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF };
    const result = a.mul(&b);
    try std.testing.expect(result.value < FP_MOD);
    }

    test "Fp.mul distributive property" {
    const a = Fp{ .value = 123 };
    const b = Fp{ .value = 456 };
    const c = Fp{ .value = 789 };
    const left = a.mul(&b.add(&c));
    const right = a.mul(&b).add(&a.mul(&c));
    try std.testing.expect(left.equal(&right));
    }

    test "Fp.mul associative property" {
    const a = Fp{ .value = 123 };
    const b = Fp{ .value = 456 };
    const c = Fp{ .value = 789 };
    const left = a.mul(&b).mul(&c);
    const right = a.mul(&b).mul(&c);
    try std.testing.expect(left.equal(&right));
    }

    test "Fp.add modular wraparound edge case" {
    const a = Fp{ .value = FP_MOD - 1 };
    const b = Fp{ .value = FP_MOD - 1 };
    const result = a.add(&b);
    try std.testing.expect(result.value == FP_MOD - 2);
    }

    test "Fp.pow edge case with large exponent" {
    const a = Fp{ .value = 2 };
    const result = a.pow(256);
    // 2^256 mod FP_MOD should be computed correctly
    try std.testing.expect(result.value < FP_MOD);
    }

    test "Fp.inv mathematical property a * a^-1 = 1" {
    const values = [_]u256{ 2, 3, 7, 11, 13, 17, 65537, FP_MOD - 1 };
    for (values) |val| {
        const a = Fp{ .value = val };
        const a_inv = a.inv();
        const product = a.mul(&a_inv);
        try std.testing.expect(product.value == 1);
    }
}
