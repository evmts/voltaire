import { BN254 } from "../../../src/crypto/bn254/BN254.js";

const g1Gen = BN254.G1.generator();
const g2Gen = BN254.G2.generator();

// Compute e(G1, G2) - the pairing of generators
const result1 = BN254.Pairing.pair(g1Gen, g2Gen);

const a = 5n;
const b = 7n;

// Left side: e(a*G1, b*G2)
const aG1 = BN254.G1.mul(g1Gen, a);
const bG2 = BN254.G2.mul(g2Gen, b);
const leftSide = BN254.Pairing.pair(aG1, bG2);

// Right side: e(G1, G2)^(a*b)
const abG1 = BN254.G1.mul(g1Gen, a * b);
const rightSide = BN254.Pairing.pair(abG1, g2Gen);

const bilinearityHolds = BN254.Pairing.pairingResultEqual(leftSide, rightSide);

// Pairing check verifies: e(P1, Q1) * e(P2, Q2) * ... = 1
// Or equivalently: e(P1, Q1) = e(-P2, Q2)

// Create test points
const s = 123n; // Secret value
const sG1 = BN254.G1.mul(g1Gen, s);
const sG2 = BN254.G2.mul(g2Gen, s);

// Verify e(s*G1, G2) = e(G1, s*G2)
// This checks that both points encode the same scalar
const check1 = BN254.Pairing.pairingCheck([
	[sG1, g2Gen],
	[BN254.G1.negate(g1Gen), sG2],
]);

// Verify e(2×G1, G2) * e(3×G1, G2) = e(5×G1, G2)
// Using negation: e(2×G1, G2) * e(3×G1, G2) * e(-5×G1, G2) = 1

const twoG1 = BN254.G1.mul(g1Gen, 2n);
const threeG1 = BN254.G1.mul(g1Gen, 3n);
const fiveG1 = BN254.G1.mul(g1Gen, 5n);
const negFiveG1 = BN254.G1.negate(fiveG1);

const multiPairingCheck = BN254.Pairing.pairingCheck([
	[twoG1, g2Gen],
	[threeG1, g2Gen],
	[negFiveG1, g2Gen],
]);

// Classic pattern: Verify e(A, B) = e(C, D)
// Rearrange to: e(A, B) * e(-C, D) = 1

const alpha = 17n;
const beta = 19n;

// Create points such that alpha * beta is encoded consistently
const A = BN254.G1.mul(g1Gen, alpha);
const B = BN254.G2.mul(g2Gen, beta);
const C = BN254.G1.mul(g1Gen, alpha * beta);
const D = g2Gen;

const productCheck = BN254.Pairing.pairingCheck([
	[A, B],
	[BN254.G1.negate(C), D],
]);

// Try to verify e(3×G1, G2) = e(5×G1, G2) - this should fail!
const invalidCheck = BN254.Pairing.pairingCheck([
	[threeG1, g2Gen],
	[BN254.G1.negate(fiveG1), g2Gen],
]);

const x = 11n;
const y = 13n;
const z = 17n;

const xG1 = BN254.G1.mul(g1Gen, x);
const yG2 = BN254.G2.mul(g2Gen, y);
const zG2 = BN254.G2.mul(g2Gen, z);

// Verify e(x×G1, y×G2) = e((x*y)×G1, G2)
const complexCheck1 = BN254.Pairing.pairingCheck([
	[xG1, yG2],
	[BN254.G1.negate(BN254.G1.mul(g1Gen, x * y)), g2Gen],
]);

// Verify e(x×G1, y×G2) * e(x×G1, z×G2) = e(x×G1, (y+z)×G2)
const yzSum = y + z;
const yzG2 = BN254.G2.mul(g2Gen, yzSum);

const complexCheck2 = BN254.Pairing.pairingCheck([
	[xG1, yG2],
	[xG1, zG2],
	[BN254.G1.negate(xG1), yzG2],
]);

// e(P, Q) * e(-P, Q) = 1 always holds
const P = BN254.G1.mul(g1Gen, 42n);
const Q = BN254.G2.mul(g2Gen, 99n);

const tautologyCheck = BN254.Pairing.pairingCheck([
	[P, Q],
	[BN254.G1.negate(P), Q],
]);
