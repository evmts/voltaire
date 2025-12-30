import { BN254, Hex } from "@tevm/voltaire";

// BN254 (BN128) - Pairing-friendly curve for zkSNARKs

// === G1 Point Operations ===
// Get the generator point (base point)
const g1Generator = BN254.G1.generator();

// Scalar multiplication: g1 * 5
const g1Scalar = BN254.G1.mul(g1Generator, 5n);

// Point addition
const g1Sum = BN254.G1.add(g1Generator, g1Scalar);

// Point negation
const g1Neg = BN254.G1.neg(g1Generator);

// Verify on curve
const isOnCurve = BN254.G1.isOnCurve(g1Generator);

// === G2 Point Operations ===
const g2Generator = BN254.G2.generator();

// Scalar multiplication on G2
const g2Scalar = BN254.G2.mul(g2Generator, 3n);

// Point addition on G2
const g2Sum = BN254.G2.add(g2Generator, g2Scalar);

// === Pairing Operations ===
// e(g1, g2) - bilinear pairing
const pairingResult = BN254.Pairing.pair(g1Generator, g2Generator);

// Pairing check: e(P1, Q1) * e(P2, Q2) == 1
// This is the core operation in zkSNARK verification
const p1 = g1Generator;
const q1 = g2Generator;
const p2 = BN254.G1.neg(g1Generator);
const q2 = g2Generator;

// Pairing check returns true if product of pairings equals identity
const pairingCheckResult = BN254.Pairing.pairingCheck([
	[p1, q1],
	[p2, q2],
]);

// === Serialization ===
// Serialize G1 point (64 bytes: x, y coordinates)
const g1Bytes = BN254.serializeG1(g1Generator);

// Deserialize back to G1 point
const g1Restored = BN254.deserializeG1(g1Bytes);

// Serialize G2 point (128 bytes: x, y coordinates in Fp2)
const g2Bytes = BN254.serializeG2(g2Generator);
