const std = @import("std");
const crypto = @import("crypto");

const G1 = crypto.bn254.G1;
const G2 = crypto.bn254.G2;
const Fr = crypto.bn254.Fr;
const FpMont = crypto.bn254.FpMont;
const Fp2Mont = crypto.bn254.Fp2Mont;

/// BN254 G1/G2 Basic Operations
///
/// Demonstrates fundamental elliptic curve operations:
/// - Generator points
/// - Point addition
/// - Scalar multiplication
/// - Point equality
/// - Subgroup membership checks
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== BN254 G1/G2 Basic Operations ===\n\n", .{});

    // 1. G1 Generator and Basic Operations
    try stdout.print("1. G1 Point Operations\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Get G1 generator (hardcoded values from curve_parameters.zig)
    const g1_gen = G1{
        .x = FpMont.init(1),
        .y = FpMont.init(2),
        .z = FpMont.init(1),
    };

    try stdout.print("G1 generator created\n", .{});
    try stdout.print("Is infinity: {}\n", .{g1_gen.isInfinity()});
    try stdout.print("Is on curve: {}\n\n", .{g1_gen.isOnCurve()});

    // Scalar multiplication
    const scalar1 = Fr.init(5);
    const g1_point1 = try g1_gen.mul(&scalar1);
    try stdout.print("G1 generator × 5:\n", .{});
    try stdout.print("Result is on curve: {}\n\n", .{g1_point1.isOnCurve()});

    // Point addition
    const scalar2 = Fr.init(3);
    const g1_point2 = try g1_gen.mul(&scalar2);
    const g1_sum = g1_point1.add(&g1_point2);
    try stdout.print("(G1 × 5) + (G1 × 3):\n", .{});
    try stdout.print("Result is on curve: {}\n", .{g1_sum.isOnCurve()});

    // Verify linearity: (5 + 3) * G1 should equal (5 * G1) + (3 * G1)
    const scalar_sum = scalar1.add(&scalar2);
    const g1_direct = try g1_gen.mul(&scalar_sum);
    const linearity_holds = g1_sum.equal(&g1_direct);
    try stdout.print("Linearity check (5+3)×G1 = (5×G1)+(3×G1): {}\n\n", .{linearity_holds});

    // Point doubling
    const g1_doubled = g1_gen.double();
    const scalar_two = Fr.init(2);
    const g1_times2 = try g1_gen.mul(&scalar_two);
    const doubling_correct = g1_doubled.equal(&g1_times2);
    try stdout.print("Point doubling: 2×G1 = G1+G1: {}\n\n", .{doubling_correct});

    // 2. G2 Operations (Extension Field)
    try stdout.print("2. G2 Point Operations (Fp2)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Get G2 generator (hardcoded values from curve_parameters.zig)
    const g2_gen = G2{
        .x = Fp2Mont.initFromInt(
            0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed,
            0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2,
        ),
        .y = Fp2Mont.initFromInt(
            0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa,
            0x090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b,
        ),
        .z = Fp2Mont.initFromInt(1, 0),
    };

    try stdout.print("G2 generator created\n", .{});
    try stdout.print("Is infinity: {}\n", .{g2_gen.isInfinity()});
    try stdout.print("Is on curve: {}\n", .{g2_gen.isOnCurve()});
    try stdout.print("Is in subgroup: {}\n\n", .{g2_gen.isInSubgroup()});

    // Scalar multiplication
    const scalar3 = Fr.init(7);
    const g2_point1 = g2_gen.mul(&scalar3);
    try stdout.print("G2 generator × 7:\n", .{});
    try stdout.print("Result is on curve: {}\n", .{g2_point1.isOnCurve()});
    try stdout.print("Result is in subgroup: {}\n\n", .{g2_point1.isInSubgroup()});

    // Point addition
    const scalar4 = Fr.init(11);
    const g2_point2 = g2_gen.mul(&scalar4);
    const g2_sum = g2_point1.add(&g2_point2);
    try stdout.print("(G2 × 7) + (G2 × 11):\n", .{});
    try stdout.print("Result is on curve: {}\n", .{g2_sum.isOnCurve()});
    try stdout.print("Result is in subgroup: {}\n\n", .{g2_sum.isInSubgroup()});

    // Verify G2 linearity
    const scalar_sum2 = scalar3.add(&scalar4);
    const g2_direct = g2_gen.mul(&scalar_sum2);
    const g2_linearity_holds = g2_sum.equal(&g2_direct);
    try stdout.print("G2 Linearity check (7+11)×G2 = (7×G2)+(11×G2): {}\n\n", .{g2_linearity_holds});

    // 3. Point Negation
    try stdout.print("3. Point Negation\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const g1_neg = g1_gen.neg();
    const g1_zero_from_add = g1_gen.add(&g1_neg);
    try stdout.print("G1 + (-G1) = infinity: {}\n", .{g1_zero_from_add.isInfinity()});

    const g2_neg = g2_gen.neg();
    const g2_zero_from_add = g2_gen.add(&g2_neg);
    try stdout.print("G2 + (-G2) = infinity: {}\n\n", .{g2_zero_from_add.isInfinity()});

    // 4. Infinity Point
    try stdout.print("4. Infinity Point (Group Identity)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const g1_infinity = G1{
        .x = FpMont.init(0),
        .y = FpMont.init(0),
        .z = FpMont.init(0),
    };
    try stdout.print("G1 infinity is zero: {}\n", .{g1_infinity.isInfinity()});

    // Adding infinity is identity
    const g1_plus_infinity = g1_point1.add(&g1_infinity);
    const identity_holds = g1_point1.equal(&g1_plus_infinity);
    try stdout.print("P + infinity = P: {}\n", .{identity_holds});

    const g2_infinity = G2{
        .x = Fp2Mont.initFromInt(0, 0),
        .y = Fp2Mont.initFromInt(0, 0),
        .z = Fp2Mont.initFromInt(0, 0),
    };
    try stdout.print("G2 infinity is zero: {}\n\n", .{g2_infinity.isInfinity()});

    // 5. Large Scalar Multiplication
    try stdout.print("5. Large Scalar Multiplication\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const large_scalar = Fr.init(123456789);
    const g1_large = try g1_gen.mul(&large_scalar);
    try stdout.print("G1 × 123456789:\n", .{});
    try stdout.print("Result is on curve: {}\n", .{g1_large.isOnCurve()});

    // Demonstrate that order matters: n*G + m*G = (n+m)*G
    const n = Fr.init(999999);
    const m = Fr.init(111111);
    const nG = try g1_gen.mul(&n);
    const mG = try g1_gen.mul(&m);
    const sum = nG.add(&mG);
    const n_plus_m = n.add(&m);
    const direct = try g1_gen.mul(&n_plus_m);
    try stdout.print("Distributive property: 999999×G + 111111×G = 1111110×G: {}\n\n", .{sum.equal(&direct)});

    try stdout.print("=== Complete ===\n", .{});
}
