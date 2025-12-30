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

// Get the generator point
const g = G1.generator();

// Point doubling: 2G
const g2 = G1.double(g);
const g2Affine = G1.toAffine(g2);

// Point addition: G + 2G = 3G
const g3Add = G1.add(g, g2);

// Scalar multiplication: 3G directly
const g3Mul = G1.mul(g, 3n);

// Negation: -G (same x, negated y)
const gNeg = G1.negate(g);
const gNegAffine = G1.toAffine(gNeg);

// Adding a point to its negation gives infinity
const gPlusNeg = G1.add(g, gNeg);

// Infinity (identity element)
const inf = G1.infinity();

// Multiply by curve order gives infinity
const FR_MOD =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const gTimesOrder = G1.mul(g, FR_MOD);

// Commutativity: a*G + b*G = b*G + a*G
const a = 7n;
const b = 11n;
const aG = G1.mul(g, a);
const bG = G1.mul(g, b);
const sum1 = G1.add(aG, bG);
const sum2 = G1.add(bG, aG);

// Associativity: (a*G + b*G) + c*G = a*G + (b*G + c*G)
const c = 13n;
const cG = G1.mul(g, c);
const left = G1.add(G1.add(aG, bG), cG);
const right = G1.add(aG, G1.add(bG, cG));

// Distributivity: k*(P + Q) = k*P + k*Q
const k = 5n;
const kTimesSum = G1.mul(sum1, k);
const sumOfProducts = G1.add(G1.mul(aG, k), G1.mul(bG, k));
