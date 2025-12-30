import { BN254, Hex } from "@tevm/voltaire";

// BN254 (BN128) - Pairing-friendly curve for zkSNARKs

// === G1 Point Operations ===
// Get the generator point (base point)
const g1Generator = BN254.G1.generator();
console.log("G1 generator point generated");

// Scalar multiplication: g1 * 5
const g1Scalar = BN254.G1.mul(g1Generator, 5n);
console.log("G1 scalar multiplication (g * 5)");

// Point addition
const g1Sum = BN254.G1.add(g1Generator, g1Scalar);
console.log("G1 point addition");

// Point negation
const g1Neg = BN254.G1.neg(g1Generator);
console.log("G1 point negation");

// Verify on curve
const isOnCurve = BN254.G1.isOnCurve(g1Generator);
console.log("G1 point on curve:", isOnCurve);

// === G2 Point Operations ===
const g2Generator = BN254.G2.generator();
console.log("\nG2 generator point generated");

// Scalar multiplication on G2
const g2Scalar = BN254.G2.mul(g2Generator, 3n);
console.log("G2 scalar multiplication (g * 3)");

// Point addition on G2
const g2Sum = BN254.G2.add(g2Generator, g2Scalar);
console.log("G2 point addition");

// === Pairing Operations ===
// e(g1, g2) - bilinear pairing
const pairingResult = BN254.Pairing.pair(g1Generator, g2Generator);
console.log("\nPairing computed");

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
console.log("Pairing check (e(P,-Q) * e(P,Q) = 1):", pairingCheckResult);

// === Serialization ===
// Serialize G1 point (64 bytes: x, y coordinates)
const g1Bytes = BN254.serializeG1(g1Generator);
console.log("\nG1 serialized:", g1Bytes.length, "bytes");

// Deserialize back to G1 point
const g1Restored = BN254.deserializeG1(g1Bytes);
console.log("G1 deserialized successfully");

// Serialize G2 point (128 bytes: x, y coordinates in Fp2)
const g2Bytes = BN254.serializeG2(g2Generator);
console.log("G2 serialized:", g2Bytes.length, "bytes");

// === zkSNARK Verification Pattern ===
// In a real zkSNARK verifier:
// e(A, B) = e(C, D) * e(E, F) * e(G, H)
// Which is checked as: e(A, B) * e(-C, D) * e(-E, F) * e(-G, H) == 1

console.log("\nBN254 zkSNARK curve operations complete");
