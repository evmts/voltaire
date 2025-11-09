import { BN254 } from '../../../src/crypto/bn254/BN254.js';

/**
 * BN254 EVM Precompile Usage
 *
 * Demonstrates how to use Ethereum's BN254 precompiled contracts:
 * - 0x06: ECADD - G1 point addition
 * - 0x07: ECMUL - G1 scalar multiplication
 * - 0x08: ECPAIRING - Pairing check
 *
 * These precompiles make zkSNARK verification gas-efficient on Ethereum.
 * Activated in Byzantium (EIP-196/197), optimized in Istanbul (EIP-1108).
 */

console.log('=== BN254 EVM Precompile Usage ===\n');

// 1. ECADD - G1 Point Addition (0x06)
console.log('1. ECADD Precompile (0x06)');
console.log('-'.repeat(40));

const g1Gen = BN254.G1.generator();

// Serialize two G1 points for input
const p1 = BN254.G1.mul(g1Gen, 5n);
const p2 = BN254.G1.mul(g1Gen, 7n);

const p1Bytes = BN254.serializeG1(p1);
const p2Bytes = BN254.serializeG1(p2);

// Precompile input: 128 bytes (64 for each point)
const ecaddInput = new Uint8Array(128);
ecaddInput.set(p1Bytes, 0);   // First 64 bytes
ecaddInput.set(p2Bytes, 64);  // Next 64 bytes

console.log(`Input size: ${ecaddInput.length} bytes`);
console.log('Format: [x1, y1, x2, y2] (32 bytes each)');

// Simulate precompile output (64 bytes: result point)
const resultPoint = BN254.G1.add(p1, p2);
const ecaddOutput = BN254.serializeG1(resultPoint);

console.log(`Output size: ${ecaddOutput.length} bytes`);
console.log(`Gas cost: 150 gas (after EIP-1108)\n`);

// Verify result
const expectedResult = BN254.G1.mul(g1Gen, 12n); // 5 + 7 = 12
const isCorrect = BN254.G1.equal(resultPoint, expectedResult);
console.log(`Result verification: ${isCorrect ? 'PASS' : 'FAIL'}\n`);

// 2. ECMUL - G1 Scalar Multiplication (0x07)
console.log('2. ECMUL Precompile (0x07)');
console.log('-'.repeat(40));

const basePoint = BN254.G1.mul(g1Gen, 3n);
const scalar = 17n;

// Precompile input: 96 bytes (64 for point, 32 for scalar)
const ecmulInput = new Uint8Array(96);
const baseBytes = BN254.serializeG1(basePoint);
ecmulInput.set(baseBytes, 0);  // First 64 bytes: point

// Scalar in big-endian 32 bytes
const scalarBytes = new Uint8Array(32);
const scalarBigInt = scalar;
for (let i = 0; i < 32; i++) {
    scalarBytes[31 - i] = Number((scalarBigInt >> BigInt(i * 8)) & 0xFFn);
}
ecmulInput.set(scalarBytes, 64);  // Last 32 bytes: scalar

console.log(`Input size: ${ecmulInput.length} bytes`);
console.log('Format: [x, y, scalar] (32 bytes each)');

// Simulate precompile output
const mulResult = BN254.G1.mul(basePoint, scalar);
const ecmulOutput = BN254.serializeG1(mulResult);

console.log(`Output size: ${ecmulOutput.length} bytes`);
console.log(`Gas cost: 6,000 gas (after EIP-1108)\n`);

// Verify: (3 × G1) × 17 = 51 × G1
const expectedMul = BN254.G1.mul(g1Gen, 51n);
const mulCorrect = BN254.G1.equal(mulResult, expectedMul);
console.log(`Result verification: ${mulCorrect ? 'PASS' : 'FAIL'}\n`);

// 3. ECPAIRING - Pairing Check (0x08)
console.log('3. ECPAIRING Precompile (0x08)');
console.log('-'.repeat(40));

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
ecpairingInput.set(P1Bytes, 0);      // G1 point (64 bytes)
ecpairingInput.set(Q1Bytes, 64);     // G2 point (128 bytes)

// Second pair
ecpairingInput.set(P2NegBytes, 192); // G1 point (64 bytes)
ecpairingInput.set(Q2Bytes, 256);    // G2 point (128 bytes)

console.log(`Input size: ${ecpairingInput.length} bytes (${numPairs} pairs)`);
console.log('Format: [G1_1, G2_1, G1_2, G2_2, ...]');

// Simulate precompile output (32 bytes: 1 if valid, 0 if invalid)
const pairingResult = BN254.Pairing.pairingCheck([
    [P1, Q1],
    [P2Neg, Q2],
]);

const ecpairingOutput = new Uint8Array(32);
if (pairingResult) {
    ecpairingOutput[31] = 1;  // Success = 1 in last byte
}

console.log(`Output: 0x${Array.from(ecpairingOutput).map(b => b.toString(16).padStart(2, '0')).join('')}`);
console.log(`Result: ${pairingResult ? 'VALID (1)' : 'INVALID (0)'}`);

const baseGas = 45000;
const perPairGas = 34000;
const totalGas = baseGas + (numPairs * perPairGas);

console.log(`Gas cost: ${baseGas} + (${numPairs} × ${perPairGas}) = ${totalGas} gas\n`);

// 4. Groth16 Verification Pattern
console.log('4. Groth16 Verification Pattern');
console.log('-'.repeat(40));

// Typical Groth16 uses 3-4 pairing checks
const groth16Pairs = 3; // Simplified, usually 4 in practice

console.log('Groth16 pairing structure:');
console.log('- e(A, B): Proof commitment');
console.log('- e(-α, β): Verification key');
console.log('- e(-L, γ): Public inputs');
console.log('- e(-C, δ): Additional proof element\n');

const groth16Gas = baseGas + (4 * perPairGas); // 4 pairings
console.log(`Gas for Groth16 verification: ${groth16Gas} gas`);
console.log('Makes privacy protocols economically viable!\n');

// 5. Point Format Details
console.log('5. Point Serialization Format');
console.log('-'.repeat(40));

console.log('G1 Point (64 bytes):');
console.log('  Bytes 0-31:  x-coordinate (Fp element, big-endian)');
console.log('  Bytes 32-63: y-coordinate (Fp element, big-endian)');
console.log('  Infinity: (0, 0)\n');

console.log('G2 Point (128 bytes):');
console.log('  Bytes 0-31:   x.c0 (Fp element)');
console.log('  Bytes 32-63:  x.c1 (Fp element)');
console.log('  Bytes 64-95:  y.c0 (Fp element)');
console.log('  Bytes 96-127: y.c1 (Fp element)');
console.log('  Where x = x.c0 + x.c1·i, y = y.c0 + y.c1·i\n');

// 6. Gas Cost Comparison
console.log('6. Gas Cost Summary (EIP-1108)');
console.log('-'.repeat(40));

console.log('Before Istanbul (EIP-196/197):');
console.log('  ECADD:    500 gas');
console.log('  ECMUL:    40,000 gas');
console.log('  ECPAIRING base: 100,000 gas');
console.log('  ECPAIRING per pair: 80,000 gas\n');

console.log('After Istanbul (EIP-1108):');
console.log('  ECADD:    150 gas (97% reduction)');
console.log('  ECMUL:    6,000 gas (85% reduction)');
console.log('  ECPAIRING base: 45,000 gas (55% reduction)');
console.log('  ECPAIRING per pair: 34,000 gas (58% reduction)\n');

console.log('Impact: Groth16 verification went from ~820k to ~182k gas\n');

// 7. Edge Cases
console.log('7. Edge Cases');
console.log('-'.repeat(40));

// Infinity point
const infinity = BN254.G1.infinity();
const infinityBytes = BN254.serializeG1(infinity);
console.log('Infinity point serialization:');
console.log(`  All zeros: ${infinityBytes.every(b => b === 0)}`);

// Adding infinity
const pPlusInfinity = BN254.G1.add(p1, infinity);
const identityHolds = BN254.G1.equal(p1, pPlusInfinity);
console.log(`  P + infinity = P: ${identityHolds}`);

// Multiplying by zero
const zeroMul = BN254.G1.mul(g1Gen, 0n);
const isInfinity = BN254.G1.isZero(zeroMul);
console.log(`  G1 × 0 = infinity: ${isInfinity}\n`);

console.log('=== Complete ===');
console.log('\nKey Points:');
console.log('- Precompiles make zkSNARKs affordable (~182k gas)');
console.log('- ECADD/ECMUL operate on G1 only (Fp base field)');
console.log('- ECPAIRING handles G1×G2 pairs (outputs 0 or 1)');
console.log('- EIP-1108 reduced costs by 80-97% in Istanbul');
console.log('- Critical for Tornado Cash, zkSync, Aztec, etc.');
