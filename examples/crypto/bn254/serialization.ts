import { BN254 } from "../../../src/crypto/bn254/BN254.js";

const g1Gen = BN254.G1.generator();
const g2Gen = BN254.G2.generator();

const g1Point = BN254.G1.mul(g1Gen, 42n);
const g1Bytes = BN254.serializeG1(g1Point);

// Extract individual coordinates (manual parsing)
const xBytes = g1Bytes.slice(0, 32);
const yBytes = g1Bytes.slice(32, 64);

const g1Deserialized = BN254.deserializeG1(g1Bytes);
const g1RoundTrip = BN254.G1.equal(g1Point, g1Deserialized);

const g2Point = BN254.G2.mul(g2Gen, 99n);
const g2Bytes = BN254.serializeG2(g2Point);

const g2Deserialized = BN254.deserializeG2(g2Bytes);
const g2RoundTrip = BN254.G2.equal(g2Point, g2Deserialized);

const g1Infinity = BN254.G1.infinity();
const g1InfinityBytes = BN254.serializeG1(g1Infinity);

// Check if all zeros
const allZeros = g1InfinityBytes.every((b) => b === 0);

const g2Infinity = BN254.G2.infinity();
const g2InfinityBytes = BN254.serializeG2(g2Infinity);

const allZerosG2 = g2InfinityBytes.every((b) => b === 0);

// ECADD precompile input: two G1 points
const p1 = BN254.G1.mul(g1Gen, 5n);
const p2 = BN254.G1.mul(g1Gen, 7n);

const p1Bytes = BN254.serializeG1(p1);
const p2Bytes = BN254.serializeG1(p2);

const ecaddInput = new Uint8Array(128); // 64 + 64
ecaddInput.set(p1Bytes, 0);
ecaddInput.set(p2Bytes, 64);

// ECPAIRING input: G1 and G2 pairs
const q1 = BN254.G2.mul(g2Gen, 3n);
const q1Bytes = BN254.serializeG2(q1);

const pairingPair = new Uint8Array(192); // 64 (G1) + 128 (G2)
pairingPair.set(p1Bytes, 0);
pairingPair.set(q1Bytes, 64);

// All field elements are big-endian
const smallScalar = 0x0102n; // Small value to see byte order
const smallPoint = BN254.G1.mul(g1Gen, smallScalar);
const smallBytes = BN254.serializeG1(smallPoint);

// Test invalid point (should fail)
const invalidBytes = new Uint8Array(64);
invalidBytes.fill(0xff); // All 1s - likely invalid

try {
	const invalidPoint = BN254.deserializeG1(invalidBytes);
} catch (error) {}
