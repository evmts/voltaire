const Fp_mod = @import("Fp.zig");
const Fr_mod = @import("Fr.zig");
const std = @import("std");

const Fp = Fp_mod.Fp;
const Fr = Fr_mod.Fr;

//G1 is the group of points on the elliptic curve y^2 = x^3 + 3
// We use the Jacobian projective coordinates to represent the points
pub const G1 = struct {
    x: Fp,
    y: Fp,
    z: Fp,

    pub const INFINITY = G1{ .x = Fp.ZERO, .y = Fp.ONE, .z = Fp.ZERO };
    pub const GENERATOR = G1{ .x = Fp.init(1), .y = Fp.init(2), .z = Fp.init(1) };

    pub fn isInfinity(self: *const G1) bool {
        return self.z.value == 0;
    }

    // Unchecked constructor
    pub fn initUnchecked(x: *const Fp, y: *const Fp, z: *const Fp) G1 {
        return G1{ .x = x.*, .y = y.*, .z = z.* };
    }

    // Checked constructor - validates point is on curve
    pub fn init(x: *const Fp, y: *const Fp, z: *const Fp) !G1 {
        const point = G1{ .x = x.*, .y = y.*, .z = z.* };
        if (!point.isOnCurve()) {
            return error.InvalidPoint;
        }
        return point;
    }

    pub fn toAffine(self: *const G1) G1 {
        if (self.isInfinity()) {
            return INFINITY;
        }
        const z_inv = self.z.inv();
        const z_inv_sq = z_inv.mul(&z_inv);
        const z_inv_cubed = z_inv_sq.mul(&z_inv);

        return G1{
            .x = self.x.mul(&z_inv_sq),
            .y = self.y.mul(&z_inv_cubed),
            .z = Fp.ONE,
        };
    }

    pub fn isOnCurve(self: *const G1) bool {
        if (self.isInfinity()) return true;

        // BN254 Jacobian equation: Y² = X³ + 3Z⁶
        const y_squared = self.y.mul(&self.y);
        const x_cubed = self.x.mul(&self.x).mul(&self.x);
        const z_squared = self.z.mul(&self.z);
        const z_sixth = z_squared.mul(&z_squared).mul(&z_squared);
        const three = Fp.init(3);
        const rhs = x_cubed.add(&three.mul(&z_sixth));

        return y_squared.equal(&rhs);
    }

    pub fn neg(self: *const G1) G1 {
        return G1{
            .x = self.x,
            .y = self.y.neg(),
            .z = self.z,
        };
    }

    pub fn negAssign(self: *G1) void {
        self.* = self.neg();
    }

    pub fn equal(self: *const G1, other: *const G1) bool {
        const selfInf = self.isInfinity();
        const otherInf = other.isInfinity();

        if (selfInf and otherInf) {
            return true;
        }
        if (selfInf != otherInf) {
            return false;
        }

        // Both not infinity: cross-multiply to compare
        // For X coordinates: X1/Z1² = X2/Z2² => X1 * Z2² = X2 * Z1²
        const Z1_sq = self.z.mul(&self.z);
        const Z2_sq = other.z.mul(&other.z);
        const X1_Z2_sq = self.x.mul(&Z2_sq);
        const X2_Z1_sq = other.x.mul(&Z1_sq);

        // For Y coordinates: Y1/Z1³ = Y2/Z2³ => Y1 * Z2³ = Y2 * Z1³
        const Z1_cubed = Z1_sq.mul(&self.z);
        const Z2_cubed = Z2_sq.mul(&other.z);
        const Y1_Z2_cubed = self.y.mul(&Z2_cubed);
        const Y2_Z1_cubed = other.y.mul(&Z1_cubed);

        return X1_Z2_sq.equal(&X2_Z1_sq) and Y1_Z2_cubed.equal(&Y2_Z1_cubed);
    }

    pub fn sub(self: *const G1, other: *const G1) G1 {
        return self.add(other.neg());
    }

    pub fn subAssign(self: *G1, other: *const G1) void {
        self.* = self.sub(other);
    }

    pub fn double(self: *const G1) G1 {
        // Compute intermediate values
        const X_squared = self.x.mul(&self.x); // X²
        const Y_squared = self.y.mul(&self.y); // Y²
        const Y_fourth = Y_squared.mul(&Y_squared); // Y⁴

        // S = 4XY²
        const S = self.x.mul(&Y_squared).mul(&Fp.init(4));

        // M = 3X²
        const M = X_squared.mul(&Fp.init(3));

        // X' = M² - 2S
        const M_squared = M.mul(&M);
        const two_S = S.mul(&Fp.init(2));
        const x_result = M_squared.sub(&two_S);

        // Y' = M(S - X') - 8Y⁴
        const S_minus_X = S.sub(&x_result);

        //const eight_Y_fourth = Y_fourth.mul(&Fp.init(8));
        const eight_Y_fourth = Y_fourth.mulBySmallInt(8);

        const y_result = M.mul(&S_minus_X).sub(&eight_Y_fourth);

        // Z' = 2YZ
        const z_result = self.y.mul(&self.z).mul(&Fp.init(2));

        return G1{ .x = x_result, .y = y_result, .z = z_result };
    }

    pub fn doubleAssign(self: *G1) void {
        self.* = self.double();
    }

    pub fn add(self: *const G1, other: *const G1) G1 {
        if (self.isInfinity()) {
            return other.*;
        }
        if (other.isInfinity()) {
            return self.*;
        }

        // Compute U1 = X1 * Z2² and U2 = X2 * Z1²
        const Z1_sq = self.z.mul(&self.z);
        const Z2_sq = other.z.mul(&other.z);
        const U1 = self.x.mul(&Z2_sq);
        const U2 = other.x.mul(&Z1_sq);

        // Compute S1 = Y1 * Z2³ and S2 = Y2 * Z1³
        const Z1_cubed = Z1_sq.mul(&self.z);
        const Z2_cubed = Z2_sq.mul(&other.z);
        const S1 = self.y.mul(&Z2_cubed);
        const S2 = other.y.mul(&Z1_cubed);

        // Check if points are equal or negatives
        if (U1.equal(&U2)) {
            if (S1.equal(&S2)) {
                return self.double();
            }
            return INFINITY;
        }

        // Compute H = U2 - U1 and R = S2 - S1
        const H = U2.sub(&U1);
        const R = S2.sub(&S1);

        // Compute H², H³, and intermediate values
        const H_sq = H.mul(&H);
        const H_cubed = H_sq.mul(&H);
        const U1_H_sq = U1.mul(&H_sq);

        // X3 = R² - H³ - 2*U1*H²
        const R_sq = R.mul(&R);
        const two_U1_H_sq = U1_H_sq.mul(&Fp.init(2));
        const result_x = R_sq.sub(&H_cubed).sub(&two_U1_H_sq);

        // Y3 = R*(U1*H² - X3) - S1*H³
        const result_y = R.mul(&U1_H_sq.sub(&result_x)).sub(&S1.mul(&H_cubed));

        // Z3 = Z1 * Z2 * H
        const result_z = self.z.mul(&other.z).mul(&H);

        return G1{ .x = result_x, .y = result_y, .z = result_z };
    }

    pub fn addAssign(self: *G1, other: *const G1) void {
        self.* = self.add(other);
    }

    pub fn mul(self: *const G1, scalar: *const Fr) G1 {
        return self.mul_by_int(scalar.value);
    }

    pub fn mul_by_int(self: *const G1, scalar: u256) G1 {
        if (self.isInfinity()) {
            return INFINITY;
        }
        var result = INFINITY;
        var base = self.*;
        var exp = scalar;
        while (exp > 0) : (exp >>= 1) {
            if (exp & 1 == 1) {
                result.addAssign(&base);
            }
            base.doubleAssign();
        }
        return result;
    }

    pub fn mulAssign(self: *G1, scalar: *const Fr) void {
        self.* = self.mul(scalar);
    }
};

// TESTS
// expected output came from arkworks-rs

test "g1.add opposite" {
    const Gen = G1.GENERATOR;
    const minusG = Gen.neg();
    const G_plus_minusG = Gen.add(&minusG);
    try std.testing.expect(G_plus_minusG.isInfinity());
}

test "g1.add" {
    const Gen = G1.GENERATOR;
    const Gen2 = G1{
        .x = Fp.init(21888242871839275222246405745257275088696311157297823662689037894645226208560),
        .y = Fp.init(21888242871839275222246405745257275088696311157297823662689037894645226208572),
        .z = Fp.init(4),
    };
    const expected_result = G1{
        .x = Fp.init(119872),
        .y = Fp.init(21888242871839275222246405745257275088696311157297823662689037894645159203143),
        .z = Fp.init(312),
    };
    try std.testing.expect(Gen.add(&Gen2).equal(&expected_result));
}

test "g1.double" {
    const Gen = G1.GENERATOR;
    const doubleG = Gen.double();
    const expected_result = G1{
        .x = Fp.init(21888242871839275222246405745257275088696311157297823662689037894645226208560),
        .y = Fp.init(21888242871839275222246405745257275088696311157297823662689037894645226208572),
        .z = Fp.init(4),
    };

    try std.testing.expect(doubleG.equal(&expected_result));
}

test "g1.mul" {
    const Gen = G1.GENERATOR;
    const minus_G = Gen.mul(&Fr.init(1).neg());
    const G_plus_minus_G = Gen.add(&minus_G);
    try std.testing.expect(G_plus_minus_G.isInfinity());
}

test "g1.isOnCurve generator" {
    const gen = G1.GENERATOR;
    try std.testing.expect(gen.isOnCurve());
}

test "g1.isOnCurve identity" {
    const identity = G1.INFINITY;
    try std.testing.expect(identity.isOnCurve());
}

test "g1.isOnCurve random point" {
    const k = 7; // example scalar
    const random_point = G1.GENERATOR.mul(&Fr.init(k));
    try std.testing.expect(random_point.isOnCurve());
}

test "g1.equal generator to itself" {
    const gen = G1.GENERATOR;
    try std.testing.expect(gen.equal(&gen));
}

test "g1.equal different representations same point" {
    const gen = G1.GENERATOR;
    const scaled_gen = G1{
        .x = gen.x.mul(&Fp.init(4)), // scale by 2²
        .y = gen.y.mul(&Fp.init(8)), // scale by 2³
        .z = gen.z.mul(&Fp.init(2)), // scale by 2
    };
    try std.testing.expect(gen.equal(&scaled_gen));
}

test "g1.toAffine random point" {
    const k = 13; // example scalar
    const random_point = G1.GENERATOR.mul(&Fr.init(k));
    const affine = random_point.toAffine();

    const expected_result = G1{
        .x = Fp.init(2672242651313367459976336264061690128665099451055893690004467838496751824703),
        .y = Fp.init(18247534626997477790812670345925575171672701304065784723769023620148097699216),
        .z = Fp.ONE, // affine points have z = 1
    };

    try std.testing.expect(affine.equal(&expected_result));
    try std.testing.expect(affine.isOnCurve());
}

test "g1.add generator to identity" {
    const gen = G1.GENERATOR;
    const identity = G1.INFINITY;
    const result = gen.add(&identity);
    try std.testing.expect(result.equal(&gen));
}

test "g1.add random points" {
    const k1 = 3; // example scalar
    const k2 = 5; // example scalar
    const point1 = G1.GENERATOR.mul(&Fr.init(k1));
    const point2 = G1.GENERATOR.mul(&Fr.init(k2));
    const result = point1.add(&point2);

    const expected_result = G1{
        .x = Fp.init(41677742803929195922238593),
        .y = Fp.init(269065159484683478575364835230449703617),
        .z = Fp.init(712815062608),
    };

    try std.testing.expect(result.equal(&expected_result));
    try std.testing.expect(result.isOnCurve());
}

test "g1.add commutativity" {
    const k1 = 11; // example scalar
    const k2 = 17; // example scalar
    const point1 = G1.GENERATOR.mul(&Fr.init(k1));
    const point2 = G1.GENERATOR.mul(&Fr.init(k2));

    const result1 = point1.add(&point2);
    const result2 = point2.add(&point1);
    try std.testing.expect(result1.equal(&result2));
}

test "g1.double identity" {
    const identity = G1.INFINITY;
    const result = identity.double();
    try std.testing.expect(result.isInfinity());
}

test "g1.double random point" {
    const k = 9; // example scalar
    const random_point = G1.GENERATOR.mul(&Fr.init(k));
    const doubled = random_point.double();

    const expected_result = G1{
        .x = Fp.init(16214338358589738794944521397038398142658042174982207107873684518498175669939),
        .y = Fp.init(11686337248854933627526225912767414320106940505209835321155346996117578735613),
        .z = Fp.init(2952297635626254264598100546197407825999396807330657291329469442697244479715),
    };

    try std.testing.expect(doubled.equal(&expected_result));
    try std.testing.expect(doubled.isOnCurve());
}

test "g1.chain operations" {
    const gen = G1.GENERATOR;
    const doubled = gen.double();
    const quadrupled = doubled.double();
    const gen_times_four = gen.add(&gen).add(&gen).add(&gen);
    try std.testing.expect(quadrupled.equal(&gen_times_four));
}
