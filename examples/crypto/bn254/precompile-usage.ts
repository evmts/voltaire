import { BN254 } from "../../../src/crypto/bn254/BN254.js";

const g1Gen = BN254.G1.generator();

// Serialize two G1 points for input
const p1 = BN254.G1.mul(g1Gen, 5n);
const p2 = BN254.G1.mul(g1Gen, 7n);

const p1Bytes = BN254.serializeG1(p1);
const p2Bytes = BN254.serializeG1(p2);

// Precompile input: 128 bytes (64 for each point)
const ecaddInput = new Uint8Array(128);
ecaddInput.set(p1Bytes, 0); // First 64 bytes
ecaddInput.set(p2Bytes, 64); // Next 64 bytes

// Simulate precompile output (64 bytes: result point)
const resultPoint = BN254.G1.add(p1, p2);
const ecaddOutput = BN254.serializeG1(resultPoint);

// Verify result
const expectedResult = BN254.G1.mul(g1Gen, 12n); // 5 + 7 = 12
const isCorrect = BN254.G1.equal(resultPoint, expectedResult);

const basePoint = BN254.G1.mul(g1Gen, 3n);
const scalar = 17n;

// Precompile input: 96 bytes (64 for point, 32 for scalar)
const ecmulInput = new Uint8Array(96);
const baseBytes = BN254.serializeG1(basePoint);
ecmulInput.set(baseBytes, 0); // First 64 bytes: point

// Scalar in big-endian 32 bytes
const scalarBytes = new Uint8Array(32);
const scalarBigInt = scalar;
for (let i = 0; i < 32; i++) {
	scalarBytes[31 - i] = Number((scalarBigInt >> BigInt(i * 8)) & 0xffn);
}
ecmulInput.set(scalarBytes, 64); // Last 32 bytes: scalar

// Simulate precompile output
const mulResult = BN254.G1.mul(basePoint, scalar);
const ecmulOutput = BN254.serializeG1(mulResult);

// Verify: (3 × G1) × 17 = 51 × G1
const expectedMul = BN254.G1.mul(g1Gen, 51n);
const mulCorrect = BN254.G1.equal(mulResult, expectedMul);

const g2Gen = BN254.G2.generator();

// Pairing check: e(P1, Q1) × e(P2, Q2) = 1
// Rearranged: e(P1, Q1) × e(-P2, Q2) × ... = 1

// Create two pairing terms
const P1 = BN254.G1.mul(g1Gen, 11n);
const Q1 = BN254.G2.mul(g2Gen, 13n);
const P2 = BN254.G1.mul(g1Gen, 11n * 13n);
const Q2 = g2Gen;
const P2Neg = BN254.G1.negate(P2);

// Serialize pairs
const P1Bytes = BN254.serializeG1(P1);
const Q1Bytes = BN254.serializeG2(Q1);
const P2NegBytes = BN254.serializeG1(P2Neg);
const Q2Bytes = BN254.serializeG2(Q2);

// Precompile input: 192 bytes per pair (64 for G1, 128 for G2)
const numPairs = 2;
const ecpairingInput = new Uint8Array(192 * numPairs);

// First pair
ecpairingInput.set(P1Bytes, 0); // G1 point (64 bytes)
ecpairingInput.set(Q1Bytes, 64); // G2 point (128 bytes)

// Second pair
ecpairingInput.set(P2NegBytes, 192); // G1 point (64 bytes)
ecpairingInput.set(Q2Bytes, 256); // G2 point (128 bytes)

// Simulate precompile output (32 bytes: 1 if valid, 0 if invalid)
const pairingResult = BN254.Pairing.pairingCheck([
	[P1, Q1],
	[P2Neg, Q2],
]);

const ecpairingOutput = new Uint8Array(32);
if (pairingResult) {
	ecpairingOutput[31] = 1; // Success = 1 in last byte
}

const baseGas = 45000;
const perPairGas = 34000;
const totalGas = baseGas + numPairs * perPairGas;

// Typical Groth16 uses 3-4 pairing checks
const groth16Pairs = 3; // Simplified, usually 4 in practice

const groth16Gas = baseGas + 4 * perPairGas; // 4 pairings

// Infinity point
const infinity = BN254.G1.infinity();
const infinityBytes = BN254.serializeG1(infinity);

// Adding infinity
const pPlusInfinity = BN254.G1.add(p1, infinity);
const identityHolds = BN254.G1.equal(p1, pPlusInfinity);

// Multiplying by zero
const zeroMul = BN254.G1.mul(g1Gen, 0n);
const isInfinity = BN254.G1.isZero(zeroMul);
