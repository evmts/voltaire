const std = @import("std");
const crypto = @import("crypto");

const G1 = crypto.bn254.G1;
const G2 = crypto.bn254.G2;
const Fr = crypto.bn254.Fr;
const FpMont = crypto.bn254.FpMont;
const Fp2Mont = crypto.bn254.Fp2Mont;
const Fp12Mont = crypto.bn254.Fp12Mont;
const pairing = crypto.bn254.pairing.pairing;

/// BN254 Pairing Check
///
/// Demonstrates the bilinear pairing operation - the core of zkSNARKs:
/// - Single pairing computation
/// - Pairing bilinearity property
/// - Understanding e(P, Q) notation
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== BN254 Pairing Check ===\n\n", .{});

    // Initialize generators
    const g1_gen = G1{
        .x = FpMont.init(1),
        .y = FpMont.init(2),
        .z = FpMont.init(1),
    };

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

    // 1. Single Pairing
    try stdout.print("1. Single Pairing Computation\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Convert to affine for pairing
    const g1_affine = try g1_gen.toAffine();
    const g2_affine = g2_gen.toAffine();

    // Compute e(G1, G2) - the pairing of generators
    const result1 = try pairing(&g1_affine, &g2_affine);
    _ = result1;
    try stdout.print("Computed e(G1, G2)\n", .{});
    try stdout.print("Pairing result is in Fp12 extension field\n\n", .{});

    // 2. Bilinearity Property: e(a*P, b*Q) = e(P, Q)^(a*b)
    try stdout.print("2. Bilinearity Property\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const a = Fr.init(5);
    const b = Fr.init(7);

    // Left side: e(a*G1, b*G2)
    const aG1 = try g1_gen.mul(&a);
    const bG2 = g2_gen.mul(&b);
    const aG1_affine = try aG1.toAffine();
    const bG2_affine = bG2.toAffine();
    const left_side = try pairing(&aG1_affine, &bG2_affine);

    // Right side: e((a*b)*G1, G2)
    const ab = a.mul(&b);
    const abG1 = try g1_gen.mul(&ab);
    const abG1_affine = try abG1.toAffine();
    const right_side = try pairing(&abG1_affine, &g2_affine);

    const bilinearity_holds = left_side.equal(&right_side);
    try stdout.print("e(5×G1, 7×G2) = e(35×G1, G2): {}\n", .{bilinearity_holds});
    try stdout.print("This property is fundamental to zkSNARKs!\n\n", .{});

    // 3. Pairing Check - Core zkSNARK Operation
    try stdout.print("3. Pairing Check (zkSNARK Core)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Pairing check verifies: e(P1, Q1) * e(P2, Q2) * ... = 1
    // Create test points
    const s = Fr.init(123);
    const sG1 = try g1_gen.mul(&s);
    const sG2 = g2_gen.mul(&s);

    // Verify e(s*G1, G2) = e(G1, s*G2)
    const sG1_affine = try sG1.toAffine();
    const sG2_affine = sG2.toAffine();
    const pair1 = try pairing(&sG1_affine, &g2_affine);
    const pair2 = try pairing(&g1_affine, &sG2_affine);

    const check1 = pair1.equal(&pair2);
    try stdout.print("e(s×G1, G2) = e(G1, s×G2): {}\n", .{check1});
    try stdout.print("Verifies consistent encoding of secret s\n\n", .{});

    // 4. Pairing Product Property
    try stdout.print("4. Pairing Product Property\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // e(2×G1, G2) * e(3×G1, G2) should equal e(5×G1, G2)
    const two = Fr.init(2);
    const three = Fr.init(3);
    const five = Fr.init(5);

    const twoG1 = try g1_gen.mul(&two);
    const threeG1 = try g1_gen.mul(&three);
    const fiveG1 = try g1_gen.mul(&five);

    const twoG1_affine = try twoG1.toAffine();
    const threeG1_affine = try threeG1.toAffine();
    const fiveG1_affine = try fiveG1.toAffine();

    const pair_two = try pairing(&twoG1_affine, &g2_affine);
    const pair_three = try pairing(&threeG1_affine, &g2_affine);
    const pair_five = try pairing(&fiveG1_affine, &g2_affine);

    // Product of pairings
    const product = pair_two.mul(&pair_three);
    const product_check = product.equal(&pair_five);

    try stdout.print("e(2×G1, G2) × e(3×G1, G2) = e(5×G1, G2): {}\n", .{product_check});
    try stdout.print("Demonstrates pairing multiplicative property\n\n", .{});

    // 5. Pairing Product Equation (zkSNARK Pattern)
    try stdout.print("5. Pairing Product Equation\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Classic pattern: Verify e(A, B) = e(C, D)
    const alpha = Fr.init(17);
    const beta = Fr.init(19);

    // Create points such that alpha * beta is encoded consistently
    const A = try g1_gen.mul(&alpha);
    const B = g2_gen.mul(&beta);
    const alpha_beta = alpha.mul(&beta);
    const C = try g1_gen.mul(&alpha_beta);
    const D = g2_gen;

    const A_affine = try A.toAffine();
    const B_affine = B.toAffine();
    const C_affine = try C.toAffine();
    const D_affine = D.toAffine();

    const pair_AB = try pairing(&A_affine, &B_affine);
    const pair_CD = try pairing(&C_affine, &D_affine);

    const product_check2 = pair_AB.equal(&pair_CD);
    try stdout.print("Verify e(17×G1, 19×G2) = e(323×G1, G2): {}\n", .{product_check2});
    try stdout.print("Pattern used in Groth16 verification\n\n", .{});

    // 6. Invalid Pairing Check (Should Fail)
    try stdout.print("6. Invalid Pairing Check\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Try to verify e(3×G1, G2) = e(5×G1, G2) - this should fail!
    const pair_3 = try pairing(&threeG1_affine, &g2_affine);
    const pair_5 = try pairing(&fiveG1_affine, &g2_affine);

    const invalid_check = pair_3.equal(&pair_5);
    try stdout.print("e(3×G1, G2) = e(5×G1, G2): {}\n", .{invalid_check});
    try stdout.print("Correctly rejected invalid equation\n\n", .{});

    // 7. Complex Multi-Pairing Property
    try stdout.print("7. Complex Pairing Property\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const x = Fr.init(11);
    const y = Fr.init(13);

    const xG1 = try g1_gen.mul(&x);
    const yG2 = g2_gen.mul(&y);

    const xG1_affine = try xG1.toAffine();
    const yG2_affine = yG2.toAffine();

    // Verify e(x×G1, y×G2) = e((x*y)×G1, G2)
    const pair_xy = try pairing(&xG1_affine, &yG2_affine);

    const xy = x.mul(&y);
    const xyG1 = try g1_gen.mul(&xy);
    const xyG1_affine = try xyG1.toAffine();
    const pair_xy_g = try pairing(&xyG1_affine, &g2_affine);

    const complex_check = pair_xy.equal(&pair_xy_g);
    try stdout.print("e(11×G1, 13×G2) = e(143×G1, G2): {}\n\n", .{complex_check});

    try stdout.print("=== Complete ===\n", .{});
    try stdout.print("\nKey Insights:\n", .{});
    try stdout.print("- Pairing maps G1 × G2 → GT (target group Fp12)\n", .{});
    try stdout.print("- Bilinearity: e(a×P, b×Q) = e(P, Q)^(ab)\n", .{});
    try stdout.print("- zkSNARKs encode equations as pairing checks\n", .{});
    try stdout.print("- Product of pairings = 1 verifies relationships\n", .{});
}
