/**
 * BN254 G1 Point Operations
 *
 * G1 is the group of points on the base curve E(Fp): y^2 = x^3 + 3
 * Points are represented in projective coordinates (x, y, z) for efficiency.
 * The affine form is (x/z^2, y/z^3).
 *
 * Operations:
 * - generator(): Standard G1 generator point (1, 2)
 * - infinity(): Identity element (point at infinity)
 * - add(p1, p2): Point addition
 * - double(p): Point doubling
 * - mul(p, scalar): Scalar multiplication
 * - negate(p): Point negation (-p)
 * - equal(p1, p2): Point equality check
 * - isOnCurve(p): Verify point is on curve
 * - isZero(p): Check if point is infinity
 * - toAffine(p): Convert to affine coordinates
 */

import { BN254 } from "@tevm/voltaire";

const { G1 } = BN254;

console.log("=== G1 Point Operations ===\n");

// Get the generator point
const g = G1.generator();
console.log("Generator Point G:");
console.log("  Coordinates: (1, 2) in affine form");
console.log("  On curve:", G1.isOnCurve(g), "\n");

// Point doubling: 2G
const g2 = G1.double(g);
console.log("Doubling: 2G = G + G");
const g2Affine = G1.toAffine(g2);
console.log("  x:", g2Affine.x.toString().slice(0, 50) + "...");
console.log("  y:", g2Affine.y.toString().slice(0, 50) + "...\n");

// Point addition: G + 2G = 3G
const g3Add = G1.add(g, g2);
console.log("Addition: G + 2G = 3G");
console.log("  On curve:", G1.isOnCurve(g3Add), "\n");

// Scalar multiplication: 3G directly
const g3Mul = G1.mul(g, 3n);
console.log("Scalar Multiplication: 3 * G");
console.log("  Equals G + 2G:", G1.equal(g3Add, g3Mul), "\n");

// Negation: -G (same x, negated y)
const gNeg = G1.negate(g);
console.log("Negation: -G");
const gNegAffine = G1.toAffine(gNeg);
console.log("  x:", gNegAffine.x.toString());
console.log("  y (negated):", gNegAffine.y.toString().slice(0, 50) + "...\n");

// Adding a point to its negation gives infinity
const gPlusNeg = G1.add(g, gNeg);
console.log("G + (-G) = Infinity:");
console.log("  Is infinity:", G1.isZero(gPlusNeg), "\n");

// Infinity (identity element)
const inf = G1.infinity();
console.log("Identity Element (Infinity):");
console.log("  Is zero:", G1.isZero(inf));
console.log("  G + Infinity = G:", G1.equal(G1.add(g, inf), g), "\n");

// Scalar multiplication edge cases
console.log("Scalar Multiplication Edge Cases:");
console.log("  0 * G = Infinity:", G1.isZero(G1.mul(g, 0n)));
console.log("  1 * G = G:", G1.equal(G1.mul(g, 1n), g));

// Multiply by curve order gives infinity
const FR_MOD =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const gTimesOrder = G1.mul(g, FR_MOD);
console.log(
	"  r * G = Infinity (r = curve order):",
	G1.isZero(gTimesOrder),
	"\n",
);

// Commutativity: a*G + b*G = b*G + a*G
const a = 7n,
	b = 11n;
const aG = G1.mul(g, a);
const bG = G1.mul(g, b);
const sum1 = G1.add(aG, bG);
const sum2 = G1.add(bG, aG);
console.log("Commutativity: 7G + 11G = 11G + 7G");
console.log("  Result:", G1.equal(sum1, sum2), "\n");

// Associativity: (a*G + b*G) + c*G = a*G + (b*G + c*G)
const c = 13n;
const cG = G1.mul(g, c);
const left = G1.add(G1.add(aG, bG), cG);
const right = G1.add(aG, G1.add(bG, cG));
console.log("Associativity: (7G + 11G) + 13G = 7G + (11G + 13G)");
console.log("  Result:", G1.equal(left, right), "\n");

// Distributivity: k*(P + Q) = k*P + k*Q
const k = 5n;
const kTimesSum = G1.mul(sum1, k);
const sumOfProducts = G1.add(G1.mul(aG, k), G1.mul(bG, k));
console.log("Distributivity: 5 * (7G + 11G) = 5*7G + 5*11G");
console.log("  Result:", G1.equal(kTimesSum, sumOfProducts));
