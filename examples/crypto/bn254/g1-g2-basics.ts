import { BN254 } from "../../../src/crypto/bn254/BN254.js";

// Get G1 generator
const g1Gen = BN254.G1.generator();

// Scalar multiplication
const scalar1 = 5n;
const g1Point1 = BN254.G1.mul(g1Gen, scalar1);

// Point addition
const scalar2 = 3n;
const g1Point2 = BN254.G1.mul(g1Gen, scalar2);
const g1Sum = BN254.G1.add(g1Point1, g1Point2);

// Verify linearity: (5 + 3) * G1 should equal (5 * G1) + (3 * G1)
const g1Direct = BN254.G1.mul(g1Gen, scalar1 + scalar2);
const linearityHolds = BN254.G1.equal(g1Sum, g1Direct);

// Point doubling
const g1Doubled = BN254.G1.double(g1Gen);
const g1Times2 = BN254.G1.mul(g1Gen, 2n);
const doublingCorrect = BN254.G1.equal(g1Doubled, g1Times2);

// Get G2 generator
const g2Gen = BN254.G2.generator();

// Scalar multiplication
const scalar3 = 7n;
const g2Point1 = BN254.G2.mul(g2Gen, scalar3);

// Point addition
const scalar4 = 11n;
const g2Point2 = BN254.G2.mul(g2Gen, scalar4);
const g2Sum = BN254.G2.add(g2Point1, g2Point2);

// Verify G2 linearity
const g2Direct = BN254.G2.mul(g2Gen, scalar3 + scalar4);
const g2LinearityHolds = BN254.G2.equal(g2Sum, g2Direct);

const g1Neg = BN254.G1.negate(g1Gen);
const g1ZeroFromAdd = BN254.G1.add(g1Gen, g1Neg);

const g2Neg = BN254.G2.negate(g2Gen);
const g2ZeroFromAdd = BN254.G2.add(g2Gen, g2Neg);

const g1Infinity = BN254.G1.infinity();

// Adding infinity is identity
const g1PlusInfinity = BN254.G1.add(g1Point1, g1Infinity);
const identityHolds = BN254.G1.equal(g1Point1, g1PlusInfinity);

const g2Infinity = BN254.G2.infinity();

// Serialize G1 point (64 bytes: 32 for x, 32 for y)
const g1Serialized = BN254.serializeG1(g1Point1);

// Deserialize back
const g1Deserialized = BN254.deserializeG1(g1Serialized);
const g1RoundTrip = BN254.G1.equal(g1Point1, g1Deserialized);

// Serialize G2 point (128 bytes: 32 each for x.c0, x.c1, y.c0, y.c1)
const g2Serialized = BN254.serializeG2(g2Point1);

// Deserialize back
const g2Deserialized = BN254.deserializeG2(g2Serialized);
const g2RoundTrip = BN254.G2.equal(g2Point1, g2Deserialized);

const largeScalar = 123456789012345678901234567890n;
const g1Large = BN254.G1.mul(g1Gen, largeScalar);

// Demonstrate that order matters: n*G + m*G = (n+m)*G
const n = 999999n;
const m = 111111n;
const nG = BN254.G1.mul(g1Gen, n);
const mG = BN254.G1.mul(g1Gen, m);
const sum = BN254.G1.add(nG, mG);
const direct = BN254.G1.mul(g1Gen, n + m);
