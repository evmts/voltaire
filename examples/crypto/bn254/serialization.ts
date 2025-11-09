import { BN254 } from '../../../src/crypto/bn254/BN254.js';

/**
 * BN254 Point Serialization
 *
 * Demonstrates serialization formats for BN254 points:
 * - G1 point encoding (64 bytes)
 * - G2 point encoding (128 bytes)
 * - Infinity point representation
 * - Precompile-compatible format
 * - Round-trip serialization/deserialization
 * - Coordinate extraction
 */

console.log('=== BN254 Point Serialization ===\n');

const g1Gen = BN254.G1.generator();
const g2Gen = BN254.G2.generator();

// 1. G1 Point Serialization (64 bytes)
console.log('1. G1 Point Serialization');
console.log('-'.repeat(40));

const g1Point = BN254.G1.mul(g1Gen, 42n);
const g1Bytes = BN254.serializeG1(g1Point);

console.log(`G1 point serialized to ${g1Bytes.length} bytes`);
console.log('Format: [x, y] where each is 32 bytes (big-endian Fp)\n');

// Show coordinate breakdown
console.log('Coordinate breakdown:');
console.log(`  x (bytes 0-31):  0x${Array.from(g1Bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
console.log(`  y (bytes 32-63): 0x${Array.from(g1Bytes.slice(32, 36)).map(b => b.toString(16).padStart(2, '0')).join('')}...\n`);

// Extract individual coordinates (manual parsing)
const xBytes = g1Bytes.slice(0, 32);
const yBytes = g1Bytes.slice(32, 64);

console.log('Coordinate sizes:');
console.log(`  x: ${xBytes.length} bytes`);
console.log(`  y: ${yBytes.length} bytes\n`);

// 2. G1 Round-Trip Verification
console.log('2. G1 Round-Trip Verification');
console.log('-'.repeat(40));

const g1Deserialized = BN254.deserializeG1(g1Bytes);
const g1RoundTrip = BN254.G1.equal(g1Point, g1Deserialized);

console.log(`Original point: 42 × G1`);
console.log(`Serialized: ${g1Bytes.length} bytes`);
console.log(`Deserialized successfully: ${g1RoundTrip}`);
console.log(`Points are equal: ${g1RoundTrip}\n`);

// 3. G2 Point Serialization (128 bytes)
console.log('3. G2 Point Serialization');
console.log('-'.repeat(40));

const g2Point = BN254.G2.mul(g2Gen, 99n);
const g2Bytes = BN254.serializeG2(g2Point);

console.log(`G2 point serialized to ${g2Bytes.length} bytes`);
console.log('Format: [x.c0, x.c1, y.c0, y.c1] (32 bytes each)\n');

// Show coordinate breakdown for Fp2 elements
console.log('Fp2 coordinate breakdown:');
console.log(`  x.c0 (bytes 0-31):    0x${Array.from(g2Bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
console.log(`  x.c1 (bytes 32-63):   0x${Array.from(g2Bytes.slice(32, 36)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
console.log(`  y.c0 (bytes 64-95):   0x${Array.from(g2Bytes.slice(64, 68)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
console.log(`  y.c1 (bytes 96-127):  0x${Array.from(g2Bytes.slice(96, 100)).map(b => b.toString(16).padStart(2, '0')).join('')}...\n`);

console.log('Note: x = x.c0 + x.c1·i, y = y.c0 + y.c1·i (Fp2 elements)\n');

// 4. G2 Round-Trip Verification
console.log('4. G2 Round-Trip Verification');
console.log('-'.repeat(40));

const g2Deserialized = BN254.deserializeG2(g2Bytes);
const g2RoundTrip = BN254.G2.equal(g2Point, g2Deserialized);

console.log(`Original point: 99 × G2`);
console.log(`Serialized: ${g2Bytes.length} bytes`);
console.log(`Deserialized successfully: ${g2RoundTrip}`);
console.log(`Points are equal: ${g2RoundTrip}\n`);

// 5. Infinity Point Serialization
console.log('5. Infinity Point Serialization');
console.log('-'.repeat(40));

const g1Infinity = BN254.G1.infinity();
const g1InfinityBytes = BN254.serializeG1(g1Infinity);

// Check if all zeros
const allZeros = g1InfinityBytes.every(b => b === 0);
console.log('G1 infinity serialization:');
console.log(`  Length: ${g1InfinityBytes.length} bytes`);
console.log(`  All zeros: ${allZeros}`);
console.log(`  Format: (0, 0) represents point at infinity\n`);

const g2Infinity = BN254.G2.infinity();
const g2InfinityBytes = BN254.serializeG2(g2Infinity);

const allZerosG2 = g2InfinityBytes.every(b => b === 0);
console.log('G2 infinity serialization:');
console.log(`  Length: ${g2InfinityBytes.length} bytes`);
console.log(`  All zeros: ${allZerosG2}\n`);

// 6. Multiple Points Concatenation (Precompile Pattern)
console.log('6. Multiple Points (Precompile Input)');
console.log('-'.repeat(40));

// ECADD precompile input: two G1 points
const p1 = BN254.G1.mul(g1Gen, 5n);
const p2 = BN254.G1.mul(g1Gen, 7n);

const p1Bytes = BN254.serializeG1(p1);
const p2Bytes = BN254.serializeG1(p2);

const ecaddInput = new Uint8Array(128); // 64 + 64
ecaddInput.set(p1Bytes, 0);
ecaddInput.set(p2Bytes, 64);

console.log('ECADD input format:');
console.log(`  Total length: ${ecaddInput.length} bytes`);
console.log(`  Point 1: bytes 0-63`);
console.log(`  Point 2: bytes 64-127\n`);

// ECPAIRING input: G1 and G2 pairs
const q1 = BN254.G2.mul(g2Gen, 3n);
const q1Bytes = BN254.serializeG2(q1);

const pairingPair = new Uint8Array(192); // 64 (G1) + 128 (G2)
pairingPair.set(p1Bytes, 0);
pairingPair.set(q1Bytes, 64);

console.log('ECPAIRING pair format:');
console.log(`  Total length: ${pairingPair.length} bytes`);
console.log(`  G1 point: bytes 0-63`);
console.log(`  G2 point: bytes 64-191\n`);

// 7. Field Element Size Analysis
console.log('7. Field Element Sizes');
console.log('-'.repeat(40));

console.log('Base field Fp (BN254 prime p):');
console.log('  Modulus: 254 bits');
console.log('  Serialized: 32 bytes (256 bits, big-endian)');
console.log('  Padding: 2 bits unused\n');

console.log('Extension field Fp2:');
console.log('  Elements: a + b·i where a, b ∈ Fp');
console.log('  Serialized: 64 bytes (32 for real, 32 for imag)');
console.log('  Format: [c0, c1] where element = c0 + c1·i\n');

console.log('Scalar field Fr (curve order r):');
console.log('  Modulus: 254 bits');
console.log('  Serialized: 32 bytes (for ECMUL scalar input)\n');

// 8. Byte Order Verification
console.log('8. Byte Order (Big-Endian)');
console.log('-'.repeat(40));

// All field elements are big-endian
const smallScalar = 0x0102n; // Small value to see byte order
const smallPoint = BN254.G1.mul(g1Gen, smallScalar);
const smallBytes = BN254.serializeG1(smallPoint);

console.log('BN254 uses big-endian byte order:');
console.log('  Most significant byte first (index 0)');
console.log('  Least significant byte last (index 31)');
console.log('  Compatible with EVM memory layout\n');

// 9. Validation on Deserialization
console.log('9. Deserialization Validation');
console.log('-'.repeat(40));

console.log('Deserialization checks:');
console.log('  1. Coordinates are less than field modulus');
console.log('  2. Point satisfies curve equation (y² = x³ + b)');
console.log('  3. For G2: Point is in correct subgroup');
console.log('  4. Infinity point is (0, 0)\n');

// Test invalid point (should fail)
const invalidBytes = new Uint8Array(64);
invalidBytes.fill(0xFF); // All 1s - likely invalid

try {
    const invalidPoint = BN254.deserializeG1(invalidBytes);
    console.log('Invalid point deserialization: Should have failed!');
} catch (error) {
    console.log(`Invalid point correctly rejected: ${error instanceof Error ? error.message : 'validation failed'}\n`);
}

// 10. Compact Representation
console.log('10. Size Summary');
console.log('-'.repeat(40));

console.log('Point sizes:');
console.log('  G1 point: 64 bytes (uncompressed)');
console.log('  G2 point: 128 bytes (uncompressed)');
console.log('  Scalar: 32 bytes\n');

console.log('Groth16 proof size:');
console.log('  A (G1): 64 bytes');
console.log('  B (G2): 128 bytes');
console.log('  C (G1): 64 bytes');
console.log('  Total: 256 bytes (constant size!)\n');

console.log('Verification key (2 public inputs):');
console.log('  α (G1): 64 bytes');
console.log('  β (G2): 128 bytes');
console.log('  γ (G2): 128 bytes');
console.log('  δ (G2): 128 bytes');
console.log('  IC[0-2] (3× G1): 192 bytes');
console.log('  Total: 640 bytes\n');

console.log('=== Complete ===');
console.log('\nKey Points:');
console.log('- G1 points: 64 bytes (x, y in Fp)');
console.log('- G2 points: 128 bytes (x, y in Fp2)');
console.log('- Big-endian byte order (EVM compatible)');
console.log('- Infinity encoded as all zeros');
console.log('- Validation ensures curve membership');
console.log('- Format matches EIP-196/197 precompiles');
