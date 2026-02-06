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

// Get the generator point
const g = G2.generator();

// Point doubling: 2G
const g2 = G2.double(g);

// Point addition: G + 2G = 3G
const g3Add = G2.add(g, g2);

// Scalar multiplication: 3G directly
const g3Mul = G2.mul(g, 3n);

// Negation: -G
const gNeg = G2.negate(g);

// Adding a point to its negation gives infinity
const gPlusNeg = G2.add(g, gNeg);

// Infinity (identity element)
const inf = G2.infinity();

// Multiply by curve order gives infinity
const FR_MOD =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const gTimesOrder = G2.mul(g, FR_MOD);
const testScalars = [2n, 7n, 13n, 99n];
for (const scalar of testScalars) {
	const point = G2.mul(g, scalar);
}

// Convert to affine coordinates
const point = G2.mul(g, 17n);
const affine = G2.toAffine(point);
