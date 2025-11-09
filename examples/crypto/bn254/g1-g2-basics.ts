import { BN254 } from '../../../src/crypto/bn254/BN254.js';

/**
 * BN254 G1/G2 Basic Operations
 *
 * Demonstrates fundamental elliptic curve operations:
 * - Generator points
 * - Point addition
 * - Scalar multiplication
 * - Point equality
 * - Point serialization/deserialization
 * - Subgroup membership checks
 */

console.log('=== BN254 G1/G2 Basic Operations ===\n');

// 1. G1 Generator and Basic Operations
console.log('1. G1 Point Operations');
console.log('-'.repeat(40));

// Get G1 generator
const g1Gen = BN254.G1.generator();
console.log('G1 generator created');
console.log(`Is zero: ${BN254.G1.isZero(g1Gen)}`);
console.log(`Is on curve: ${BN254.G1.isOnCurve(g1Gen)}\n`);

// Scalar multiplication
const scalar1 = 5n;
const g1Point1 = BN254.G1.mul(g1Gen, scalar1);
console.log(`G1 generator × ${scalar1}:`);
console.log(`Result is on curve: ${BN254.G1.isOnCurve(g1Point1)}\n`);

// Point addition
const scalar2 = 3n;
const g1Point2 = BN254.G1.mul(g1Gen, scalar2);
const g1Sum = BN254.G1.add(g1Point1, g1Point2);
console.log(`(G1 × ${scalar1}) + (G1 × ${scalar2}):`);
console.log(`Result is on curve: ${BN254.G1.isOnCurve(g1Sum)}`);

// Verify linearity: (5 + 3) * G1 should equal (5 * G1) + (3 * G1)
const g1Direct = BN254.G1.mul(g1Gen, scalar1 + scalar2);
const linearityHolds = BN254.G1.equal(g1Sum, g1Direct);
console.log(`Linearity check (5+3)×G1 = (5×G1)+(3×G1): ${linearityHolds}\n`);

// Point doubling
const g1Doubled = BN254.G1.double(g1Gen);
const g1Times2 = BN254.G1.mul(g1Gen, 2n);
const doublingCorrect = BN254.G1.equal(g1Doubled, g1Times2);
console.log(`Point doubling: 2×G1 = G1+G1: ${doublingCorrect}\n`);

// 2. G2 Operations (Extension Field)
console.log('2. G2 Point Operations (Fp2)');
console.log('-'.repeat(40));

// Get G2 generator
const g2Gen = BN254.G2.generator();
console.log('G2 generator created');
console.log(`Is zero: ${BN254.G2.isZero(g2Gen)}`);
console.log(`Is on curve: ${BN254.G2.isOnCurve(g2Gen)}`);
console.log(`Is in subgroup: ${BN254.G2.isInSubgroup(g2Gen)}\n`);

// Scalar multiplication
const scalar3 = 7n;
const g2Point1 = BN254.G2.mul(g2Gen, scalar3);
console.log(`G2 generator × ${scalar3}:`);
console.log(`Result is on curve: ${BN254.G2.isOnCurve(g2Point1)}`);
console.log(`Result is in subgroup: ${BN254.G2.isInSubgroup(g2Point1)}\n`);

// Point addition
const scalar4 = 11n;
const g2Point2 = BN254.G2.mul(g2Gen, scalar4);
const g2Sum = BN254.G2.add(g2Point1, g2Point2);
console.log(`(G2 × ${scalar3}) + (G2 × ${scalar4}):`);
console.log(`Result is on curve: ${BN254.G2.isOnCurve(g2Sum)}`);
console.log(`Result is in subgroup: ${BN254.G2.isInSubgroup(g2Sum)}\n`);

// Verify G2 linearity
const g2Direct = BN254.G2.mul(g2Gen, scalar3 + scalar4);
const g2LinearityHolds = BN254.G2.equal(g2Sum, g2Direct);
console.log(`G2 Linearity check (7+11)×G2 = (7×G2)+(11×G2): ${g2LinearityHolds}\n`);

// 3. Point Negation
console.log('3. Point Negation');
console.log('-'.repeat(40));

const g1Neg = BN254.G1.negate(g1Gen);
const g1ZeroFromAdd = BN254.G1.add(g1Gen, g1Neg);
console.log(`G1 + (-G1) = infinity: ${BN254.G1.isZero(g1ZeroFromAdd)}`);

const g2Neg = BN254.G2.negate(g2Gen);
const g2ZeroFromAdd = BN254.G2.add(g2Gen, g2Neg);
console.log(`G2 + (-G2) = infinity: ${BN254.G2.isZero(g2ZeroFromAdd)}\n`);

// 4. Infinity Point
console.log('4. Infinity Point (Group Identity)');
console.log('-'.repeat(40));

const g1Infinity = BN254.G1.infinity();
console.log(`G1 infinity is zero: ${BN254.G1.isZero(g1Infinity)}`);

// Adding infinity is identity
const g1PlusInfinity = BN254.G1.add(g1Point1, g1Infinity);
const identityHolds = BN254.G1.equal(g1Point1, g1PlusInfinity);
console.log(`P + infinity = P: ${identityHolds}`);

const g2Infinity = BN254.G2.infinity();
console.log(`G2 infinity is zero: ${BN254.G2.isZero(g2Infinity)}\n`);

// 5. Serialization (for precompiles and storage)
console.log('5. Point Serialization');
console.log('-'.repeat(40));

// Serialize G1 point (64 bytes: 32 for x, 32 for y)
const g1Serialized = BN254.serializeG1(g1Point1);
console.log(`G1 serialized length: ${g1Serialized.length} bytes`);
console.log(`First 8 bytes (x): ${Array.from(g1Serialized.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);

// Deserialize back
const g1Deserialized = BN254.deserializeG1(g1Serialized);
const g1RoundTrip = BN254.G1.equal(g1Point1, g1Deserialized);
console.log(`Round-trip successful: ${g1RoundTrip}\n`);

// Serialize G2 point (128 bytes: 32 each for x.c0, x.c1, y.c0, y.c1)
const g2Serialized = BN254.serializeG2(g2Point1);
console.log(`G2 serialized length: ${g2Serialized.length} bytes`);
console.log(`First 8 bytes (x.c0): ${Array.from(g2Serialized.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);

// Deserialize back
const g2Deserialized = BN254.deserializeG2(g2Serialized);
const g2RoundTrip = BN254.G2.equal(g2Point1, g2Deserialized);
console.log(`Round-trip successful: ${g2RoundTrip}\n`);

// 6. Large Scalar Multiplication
console.log('6. Large Scalar Multiplication');
console.log('-'.repeat(40));

const largeScalar = 123456789012345678901234567890n;
const g1Large = BN254.G1.mul(g1Gen, largeScalar);
console.log(`G1 × ${largeScalar}:`);
console.log(`Result is on curve: ${BN254.G1.isOnCurve(g1Large)}`);

// Demonstrate that order matters: n*G + m*G = (n+m)*G
const n = 999999n;
const m = 111111n;
const nG = BN254.G1.mul(g1Gen, n);
const mG = BN254.G1.mul(g1Gen, m);
const sum = BN254.G1.add(nG, mG);
const direct = BN254.G1.mul(g1Gen, n + m);
console.log(`Distributive property: ${n}×G + ${m}×G = ${n + m}×G: ${BN254.G1.equal(sum, direct)}\n`);

console.log('=== Complete ===');
