const Fp2_mod = @import("Fp2.zig");
const Fr_mod = @import("Fr.zig");
const std = @import("std");
const Fp6_mod = @import("Fp6.zig");
const Fp12_mod = @import("Fp12.zig");

const Fp2 = Fp2_mod.Fp2;
const FP_MOD = Fp2_mod.FP_MOD;
const Fp = Fp2_mod.Fp;
const Fr = Fr_mod.Fr;
const Fp12 = Fp12_mod.Fp12;
const Fp6 = Fp6_mod.Fp6;

//G1 is the group of points on the elliptic curve y^2 = x^3 + 3
// We use the Jacobian projective coordinates to represent the points
pub const G2 = struct {
    x: Fp2,
    y: Fp2,
    z: Fp2,

    pub const INFINITY = G2{ .x = Fp2.ZERO, .y = Fp2.ONE, .z = Fp2.ZERO };
    pub const GENERATOR = G2{ .x = Fp2.init_from_int(10857046999023057135944570762232829481370756359578518086990519993285655852781, 11559732032986387107991004021392285783925812861821192530917403151452391805634), .y = Fp2.init_from_int(8495653923123431417604973247489272438418190587263600148770280649306958101930, 4082367875863433681332203403145435568316851327593401208105741076214120093531), .z = Fp2.init_from_int(1, 0) };

    pub const FROBENIUS_X_COEFF = Fp2.init_from_int(21575463638280843010398324269430826099269044274347216827212613867836435027261, 10307601595873709700152284273816112264069230130616436755625194854815875713954);
    pub const FROBENIUS_Y_COEFF = Fp2.init_from_int(2821565182194536844548159561693502659359617185244120367078079554186484126554, 3505843767911556378687030309984248845540243509899259641013678093033130930403);

    pub fn isInfinity(self: *const G2) bool {
        return self.z.u0.value == 0 and self.z.u1.value == 0;
    }

    // Unchecked constructor
    pub fn initUnchecked(x: *const Fp2, y: *const Fp2, z: *const Fp2) G2 {
        return G2{ .x = x.*, .y = y.*, .z = z.* };
    }

    // Checked constructor - validates point is on curve
    pub fn init(x: *const Fp2, y: *const Fp2, z: *const Fp2) !G2 {
        const point = G2{ .x = x.*, .y = y.*, .z = z.* };
        if (!point.isOnCurve()) {
            return error.InvalidPoint;
        }
        return point;
    }

    pub fn toAffine(self: *const G2) G2 {
        if (self.isInfinity()) {
            return INFINITY;
        }
        const z_inv = self.z.inv();
        const z_inv_sq = z_inv.mul(&z_inv);
        const z_inv_cubed = z_inv_sq.mul(&z_inv);

        return G2{
            .x = self.x.mul(&z_inv_sq),
            .y = self.y.mul(&z_inv_cubed),
            .z = Fp2.ONE,
        };
    }

    pub fn isOnCurve(self: *const G2) bool {
        if (self.isInfinity()) return true;
        const xi = Fp2.init_from_int(9, 1);
        const z_factor = Fp2.init_from_int(3, 0).mul(&xi.inv());

        // BN254 Jacobian equation: Y² = X³ + (3/xi)Z⁶
        const y_squared = self.y.mul(&self.y);
        const x_cubed = self.x.mul(&self.x).mul(&self.x);
        const z_squared = self.z.mul(&self.z);
        const z_sixth = z_squared.mul(&z_squared).mul(&z_squared);
        const rhs = x_cubed.add(&z_sixth.mul(&z_factor));

        return y_squared.equal(&rhs);
    }

    pub fn isInSubgroup(self: *const G2) bool {
        _ = self;
        @panic("TODO: implement isInSubgroup");
    }

    pub fn neg(self: *const G2) G2 {
        return G2{
            .x = self.x,
            .y = self.y.neg(),
            .z = self.z,
        };
    }

    pub fn negAssign(self: *G2) void {
        self.* = self.neg();
    }

    pub fn equal(self: *const G2, other: *const G2) bool {
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

    pub fn double(self: *const G2) G2 {
        // Compute intermediate values
        const X_squared = self.x.mul(&self.x); // X²
        const Y_squared = self.y.mul(&self.y); // Y²
        const Y_fourth = Y_squared.mul(&Y_squared); // Y⁴

        // S = 4XY²
        const S = self.x.mul(&Y_squared).scalarMul(&Fp.init(4));

        // M = 3X²
        const M = X_squared.scalarMul(&Fp.init(3));

        // X' = M² - 2S
        const M_squared = M.mul(&M);
        const two_S = S.scalarMul(&Fp.init(2));
        const x_result = M_squared.sub(&two_S);

        // Y' = M(S - X') - 8Y⁴
        const S_minus_X = S.sub(&x_result);
        const eight_Y_fourth = Y_fourth.scalarMul(&Fp.init(8));
        const y_result = M.mul(&S_minus_X).sub(&eight_Y_fourth);

        // Z' = 2YZ
        const z_result = self.y.mul(&self.z).scalarMul(&Fp.init(2));

        return G2{ .x = x_result, .y = y_result, .z = z_result };
    }

    pub fn doubleAssign(self: *G2) void {
        self.* = self.double();
    }

    pub fn add(self: *const G2, other: *const G2) G2 {
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
        const two_U1_H_sq = U1_H_sq.scalarMul(&Fp.init(2));
        const result_x = R_sq.sub(&H_cubed).sub(&two_U1_H_sq);

        // Y3 = R*(U1*H² - X3) - S1*H³
        const result_y = R.mul(&U1_H_sq.sub(&result_x)).sub(&S1.mul(&H_cubed));

        // Z3 = Z1 * Z2 * H
        const result_z = self.z.mul(&other.z).mul(&H);

        return G2{ .x = result_x, .y = result_y, .z = result_z };
    }

    pub fn addAssign(self: *G2, other: *const G2) void {
        self.* = self.add(other);
    }

    pub fn mul(self: *const G2, scalar: *const Fr) G2 {
        return self.mul_by_int(scalar.value);
    }

    pub fn mul_by_int(self: *const G2, scalar: u256) G2 {
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

    pub fn frobenius(self: *const G2) G2 {
        return G2{
            .x = self.x.frobeniusMap().mul(&FROBENIUS_X_COEFF),
            .y = self.y.frobeniusMap().mul(&FROBENIUS_Y_COEFF),
            .z = self.z.frobeniusMap(),
        };
    }
};

// TESTS
// expected output came from arkworks-rs

test "g2.add opposite" {
    const Gen = G2.GENERATOR;
    const minusG = Gen.neg();
    const G_plus_minusG = Gen.add(&minusG);
    try std.testing.expect(G_plus_minusG.isInfinity());
}

test "g2.add" {
    const Gen = G2.GENERATOR;
    const Gen2 = G2{
        .x = Fp2.init_from_int(8068064665578754444291054647125927633989259848632494988160623383584150338969, 10201766053784902393624440516579763048402213644202139977240562962104124808534),
        .y = Fp2.init_from_int(18350387758438165722514006433324734852126505429007818091896560652419680779208, 2361120538552305763462588552289584032113666280040005078430227626567900900889),
        .z = Fp2.init_from_int(16991307846246862835209946494978544876836381174527200297540561298613916203860, 8164735751726867362664406806290871136633702655186802416211482152428240187062),
    };
    const expected_result = G2{
        .x = Fp2.init_from_int(16964963043016842499038600092728359482547221737098759962437502895503860098956, 9802038328124067467167916831831108021770181501290579378159059786039834492047),
        .y = Fp2.init_from_int(16820779252272725671048206721551654470547449467959363398932701258504709733061, 18729480042507864736551419171906659760696723842014658768251241386616345560593),
        .z = Fp2.init_from_int(394855990771205946776485094759919347105338213653118418588150452214006819405, 8586553845205426076950860668862984318775103285308506851115128319666650804540),
    };
    try std.testing.expect(Gen.add(&Gen2).equal(&expected_result));
}

test "g2.double expected" {
    const Gen = G2.GENERATOR;
    const doubleG = Gen.double();
    const expected_result = G2{
        .x = Fp2.init_from_int(8068064665578754444291054647125927633989259848632494988160623383584150338969, 10201766053784902393624440516579763048402213644202139977240562962104124808534),
        .y = Fp2.init_from_int(18350387758438165722514006433324734852126505429007818091896560652419680779208, 2361120538552305763462588552289584032113666280040005078430227626567900900889),
        .z = Fp2.init_from_int(16991307846246862835209946494978544876836381174527200297540561298613916203860, 8164735751726867362664406806290871136633702655186802416211482152428240187062),
    };

    try std.testing.expect(doubleG.equal(&expected_result));
}

test "g2.mul" {
    const Gen = G2.GENERATOR;
    const minus_G = Gen.mul(&Fr.init(1).neg());
    const G_plus_minus_G = Gen.add(&minus_G);
    try std.testing.expect(G_plus_minus_G.isInfinity());
}

test "g2.isOnCurve generator" {
    const gen = G2.GENERATOR;
    try std.testing.expect(gen.isOnCurve());
}

test "g2.isOnCurve identity" {
    const identity = G2.INFINITY;
    try std.testing.expect(identity.isOnCurve());
}

test "g2.isOnCurve random point" {
    const k = 7; // example scalar
    const random_point = G2.GENERATOR.mul(&Fr.init(k));
    try std.testing.expect(random_point.isOnCurve());
}

test "g2.equal generator to itself" {
    const gen = G2.GENERATOR;
    try std.testing.expect(gen.equal(&gen));
}

test "g2.toAffine random point" {
    const k = 13; // example scalar
    const random_point = G2.GENERATOR.mul(&Fr.init(k));
    const affine = random_point.toAffine();

    const expected_result = G2{
        .x = Fp2.init_from_int(16137324789686743234629608741537369181251990815455155257427276976918350071287, 280672898440571232725436467950720547829638241593507531241322547969961007057),
        .y = Fp2.init_from_int(12136420650226457477690750437223209427924916790606163705631661913973995426040, 17641806683785498955878869918183868440783188556637975525088932771694068429840),
        .z = Fp2.ONE, // affine points have z = 1
    };

    try std.testing.expect(affine.equal(&expected_result));
    try std.testing.expect(affine.isOnCurve());
}

test "g2.add generator to identity" {
    const gen = G2.GENERATOR;
    const identity = G2.INFINITY;
    const result = gen.add(&identity);
    try std.testing.expect(result.equal(&gen));
}

test "g2.add random points" {
    const k1 = 3; // example scalar
    const k2 = 5; // example scalar
    const point1 = G2.GENERATOR.mul(&Fr.init(k1));
    const point2 = G2.GENERATOR.mul(&Fr.init(k2));
    const result = point1.add(&point2);

    const expected_result = G2{
        .x = Fp2.init_from_int(12338822787986259899292241915605503554934128188921556766068436962878160930396, 7873988026505017611181106612809016613872895048560600031197901192282892195467),
        .y = Fp2.init_from_int(15022180381621582952906644413383285972184526146125412741587595613615896914712, 19921033716458048718332470098885436883122273955056609736463017767128109247250),
        .z = Fp2.init_from_int(1774573728518825553032624160373027001804770585936131378855038206560263646397, 16540582363439390354595677887183297241579373102577794439755118116102427771932),
    };

    try std.testing.expect(result.equal(&expected_result));
    try std.testing.expect(result.isOnCurve());
}

test "g2.add commutativity" {
    const k1 = 11; // example scalar
    const k2 = 17; // example scalar
    const point1 = G2.GENERATOR.mul(&Fr.init(k1));
    const point2 = G2.GENERATOR.mul(&Fr.init(k2));

    const result1 = point1.add(&point2);
    const result2 = point2.add(&point1);
    try std.testing.expect(result1.equal(&result2));
}

test "g2.double identity" {
    const identity = G2.INFINITY;
    const result = identity.double();
    try std.testing.expect(result.isInfinity());
}

test "g2.double random point" {
    const k = 9; // example scalar
    const random_point = G2.GENERATOR.mul(&Fr.init(k));
    const doubled = random_point.double();

    const expected_result = G2{
        .x = Fp2.init_from_int(9010315763217961467479503725255056756346217638634836905524514729866798122782, 12713521549126352466862126562479899179793375378918102927559864838005817848258),
        .y = Fp2.init_from_int(2938963071173997916611155186588796442091168500216583928241941802670927160507, 4637911005980597202814535267161061392968887007349473417306059045353733452774),
        .z = Fp2.init_from_int(21027050538969145131013453157421638377169363093479560088903524997919820324535, 16346656561829046745170627665889413954208741171200634938000383914340115265265),
    };

    try std.testing.expect(doubled.equal(&expected_result));
    try std.testing.expect(doubled.isOnCurve());
}

test "g2.chain operations" {
    const gen = G2.GENERATOR;
    const doubled = gen.double();
    const quadrupled = doubled.double();
    const gen_times_four = gen.add(&gen).add(&gen).add(&gen);
    try std.testing.expect(quadrupled.equal(&gen_times_four));
}

// check that the frobenius map is correct
test "g2.frobenius" {
    const scalars = [_]u64{
        1, 3, 5, 7, 11, 19, 123, 999, 10007, 123456, 987654321, 3141592653, 9007199254740991, 18446744073709551557,
    };
    for (scalars) |k| {
        const point = G2.GENERATOR.mul(&Fr.init(k));
        const frob_point = point.frobenius();
        const p_point = point.mul(&Fr.init(FP_MOD));
        try std.testing.expect(p_point.equal(&frob_point));
    }
}
