/**
 * BN254 G2 Point Operations
 *
 * G2 is the group of points on the twisted curve E'(Fp2): y^2 = x^3 + 3/xi
 * where xi = 9 + u in Fp2 (the quadratic extension field).
 *
 * Fp2 elements are represented as c0 + c1*u where u^2 = -1 (or a specific non-residue).
 * This is similar to complex numbers but over a finite field.
 *
 * G2 operations are more expensive than G1 because they involve Fp2 arithmetic
 * (each Fp2 operation requires multiple Fp operations).
 *
 * Operations are similar to G1:
 * - generator(): Standard G2 generator point
 * - infinity(): Identity element
 * - add, double, mul, negate, equal, isOnCurve, isZero, toAffine
 * - isInSubgroup(): Verify point is in the prime-order subgroup
 * - frobenius(): Frobenius endomorphism (used in pairing)
 */

import { BN254 } from "@tevm/voltaire";

const { G2, Fp2 } = BN254;

console.log("=== G2 Point Operations ===\n");

// Get the generator point
const g = G2.generator();
console.log("G2 Generator Point:");
console.log("  Fp2 coordinates have two components: c0 + c1*u");
console.log("  x.c0:", g.x.c0.toString().slice(0, 40) + "...");
console.log("  x.c1:", g.x.c1.toString().slice(0, 40) + "...");
console.log("  On curve:", G2.isOnCurve(g));
console.log("  In subgroup:", G2.isInSubgroup(g), "\n");

// Point doubling: 2G
const g2 = G2.double(g);
console.log("Doubling: 2G = G + G");
console.log("  On curve:", G2.isOnCurve(g2));
console.log("  In subgroup:", G2.isInSubgroup(g2), "\n");

// Point addition: G + 2G = 3G
const g3Add = G2.add(g, g2);
console.log("Addition: G + 2G = 3G");
console.log("  On curve:", G2.isOnCurve(g3Add), "\n");

// Scalar multiplication: 3G directly
const g3Mul = G2.mul(g, 3n);
console.log("Scalar Multiplication: 3 * G");
console.log("  Equals G + 2G:", G2.equal(g3Add, g3Mul), "\n");

// Negation: -G
const gNeg = G2.negate(g);
console.log("Negation: -G");
console.log("  On curve:", G2.isOnCurve(gNeg), "\n");

// Adding a point to its negation gives infinity
const gPlusNeg = G2.add(g, gNeg);
console.log("G + (-G) = Infinity:");
console.log("  Is infinity:", G2.isZero(gPlusNeg), "\n");

// Infinity (identity element)
const inf = G2.infinity();
console.log("Identity Element (Infinity):");
console.log("  Is zero:", G2.isZero(inf));
console.log("  G + Infinity = G:", G2.equal(G2.add(g, inf), g), "\n");

// Scalar multiplication edge cases
console.log("Scalar Multiplication Edge Cases:");
console.log("  0 * G = Infinity:", G2.isZero(G2.mul(g, 0n)));
console.log("  1 * G = G:", G2.equal(G2.mul(g, 1n), g));

// Multiply by curve order gives infinity
const FR_MOD =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const gTimesOrder = G2.mul(g, FR_MOD);
console.log(
	"  r * G = Infinity (r = curve order):",
	G2.isZero(gTimesOrder),
	"\n",
);

// Subgroup checks for various multiples
console.log("Subgroup Membership:");
const testScalars = [2n, 7n, 13n, 99n];
for (const scalar of testScalars) {
	const point = G2.mul(g, scalar);
	console.log(`  ${scalar}*G in subgroup:`, G2.isInSubgroup(point));
}
console.log();

// Convert to affine coordinates
const point = G2.mul(g, 17n);
const affine = G2.toAffine(point);
console.log("Affine Conversion (17*G):");
console.log("  z.c0 after toAffine:", affine.z.c0.toString(), "(should be 1)");
console.log("  z.c1 after toAffine:", affine.z.c1.toString(), "(should be 0)");
console.log("  Still equal:", G2.equal(point, affine), "\n");

// Demonstrate Fp2 structure
console.log("Fp2 Field Structure:");
console.log("  ONE = 1 + 0*u");
console.log("  Fp2.ONE.c0:", Fp2.ONE.c0.toString());
console.log("  Fp2.ONE.c1:", Fp2.ONE.c1.toString());
