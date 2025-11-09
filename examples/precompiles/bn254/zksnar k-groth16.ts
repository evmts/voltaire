import { execute, PrecompileAddress } from '../../../src/precompiles/precompiles.js';
import { Hardfork } from '../../../src/primitives/Hardfork/index.js';

/**
 * BN254 Pairing - Groth16 zkSNARK Verification
 *
 * Demonstrates Groth16 proof verification using BN254 pairing precompile (0x08).
 *
 * Groth16 is the most widely used zkSNARK system:
 * - Used by Tornado Cash, Zcash, Filecoin
 * - Smallest proof size (3 G1 points)
 * - Fastest verification (4 pairings)
 *
 * Verification equation: e(A,B) * e(α,β) * e(L,γ) * e(C,δ) = 1
 * Rearranged: e(-A,B) * e(α,β) * e(-L,γ) * e(C,δ) = 1
 *
 * Gas cost: 45,000 + (4 × 34,000) = 181,000 gas
 */

console.log('=== BN254 Pairing - Groth16 zkSNARK Verification ===\n');

/**
 * Convert bigint to 32-byte big-endian
 */
function toBigEndian(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[31 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
  }
  return bytes;
}

/**
 * Read bigint from bytes
 */
function fromBigEndian(bytes: Uint8Array): bigint {
  let value = 0n;
  for (let i = 0; i < Math.min(32, bytes.length); i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  return value;
}

// G1 generator
const G1_GENERATOR = {
  x: 1n,
  y: 2n,
};

// G2 generator
const G2_GENERATOR = {
  x1: 0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6edn,
  x2: 0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2n,
  y1: 0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daan,
  y2: 0x090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975bn,
};

/**
 * Negate a G1 point (flip y-coordinate)
 */
function negateG1(x: bigint, y: bigint): { x: bigint; y: bigint } {
  const FIELD_MODULUS = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
  return {
    x,
    y: FIELD_MODULUS - y,
  };
}

/**
 * Serialize G1 point (64 bytes)
 */
function serializeG1(x: bigint, y: bigint): Uint8Array {
  const bytes = new Uint8Array(64);
  bytes.set(toBigEndian(x), 0);
  bytes.set(toBigEndian(y), 32);
  return bytes;
}

/**
 * Serialize G2 point (128 bytes)
 */
function serializeG2(x1: bigint, x2: bigint, y1: bigint, y2: bigint): Uint8Array {
  const bytes = new Uint8Array(128);
  bytes.set(toBigEndian(x1), 0);
  bytes.set(toBigEndian(x2), 32);
  bytes.set(toBigEndian(y1), 64);
  bytes.set(toBigEndian(y2), 96);
  return bytes;
}

// Example 1: Simple pairing check
console.log('1. Basic Pairing Check');
console.log('-'.repeat(50));

// Verify: e(G1, G2) * e(-G1, G2) = 1
// This should return true (identity)

const pair1Input = new Uint8Array(384); // 2 pairs

// First pair: (G1, G2)
pair1Input.set(serializeG1(G1_GENERATOR.x, G1_GENERATOR.y), 0);
pair1Input.set(serializeG2(G2_GENERATOR.x1, G2_GENERATOR.x2, G2_GENERATOR.y1, G2_GENERATOR.y2), 64);

// Second pair: (-G1, G2)
const negG1 = negateG1(G1_GENERATOR.x, G1_GENERATOR.y);
pair1Input.set(serializeG1(negG1.x, negG1.y), 192);
pair1Input.set(serializeG2(G2_GENERATOR.x1, G2_GENERATOR.x2, G2_GENERATOR.y1, G2_GENERATOR.y2), 256);

console.log('Checking: e(G1, G2) × e(-G1, G2) = 1');
console.log(`Input: 384 bytes (2 pairs)`);
console.log(`Format: [G1, G2, -G1, G2]\n`);

const pair1Result = execute(
  PrecompileAddress.BN254_PAIRING,
  pair1Input,
  150000n,
  Hardfork.CANCUN
);

if (pair1Result.success) {
  const isValid = pair1Result.output[31] === 1;
  console.log(`✓ Pairing executed`);
  console.log(`Gas used: ${pair1Result.gasUsed} (45k + 2×34k = 113k)`);
  console.log(`Result: ${isValid ? 'VALID (1)' : 'INVALID (0)'}`);
  console.log(`Expected: VALID\n`);
} else {
  console.log(`✗ Failed: ${pair1Result.error}\n`);
}

// Example 2: Groth16 proof structure
console.log('2. Groth16 Proof Structure');
console.log('-'.repeat(50));

console.log('Groth16 proof components:');
console.log('  Proof π = (A, B, C):');
console.log('    A ∈ G1  (64 bytes)');
console.log('    B ∈ G2  (128 bytes)');
console.log('    C ∈ G1  (64 bytes)');
console.log('  Total proof size: 256 bytes\n');

console.log('Verification key (VK):');
console.log('  α ∈ G1, β ∈ G2 (trusted setup)');
console.log('  γ ∈ G2, δ ∈ G2 (trusted setup)');
console.log('  IC[] ∈ G1  (per public input)\n');

console.log('Verification equation:');
console.log('  e(A, B) × e(α, β) × e(L, γ) × e(C, δ) = 1\n');

console.log('Where L = IC[0] + Σ(input[i] × IC[i+1])\n');

// Example 3: Simulated Groth16 verification
console.log('3. Simulated Groth16 Verification');
console.log('-'.repeat(50));

// Simulated proof (in reality, these come from prover)
const proof = {
  A: { x: 123n, y: 456n }, // Simplified, not real values
  B: { x1: 789n, x2: 101n, y1: 112n, y2: 131n },
  C: { x: 415n, y: 161n },
};

// Simulated verification key (from trusted setup)
const vk = {
  alpha: { x: 1n, y: 2n }, // G1
  beta: { x1: G2_GENERATOR.x1, x2: G2_GENERATOR.x2, y1: G2_GENERATOR.y1, y2: G2_GENERATOR.y2 }, // G2
  gamma: { x1: G2_GENERATOR.x1, x2: G2_GENERATOR.x2, y1: G2_GENERATOR.y1, y2: G2_GENERATOR.y2 }, // G2
  delta: { x1: G2_GENERATOR.x1, x2: G2_GENERATOR.x2, y1: G2_GENERATOR.y1, y2: G2_GENERATOR.y2 }, // G2
  IC: [{ x: 1n, y: 2n }], // G1 points for public inputs
};

// Public input (what we're proving about)
const publicInput = [42n];

console.log('Proof components:');
console.log(`  A: (${proof.A.x}, ${proof.A.y})`);
console.log(`  B: ((${proof.B.x1}, ${proof.B.x2}), (${proof.B.y1}, ${proof.B.y2}))`);
console.log(`  C: (${proof.C.x}, ${proof.C.y})`);
console.log(`\nPublic input: [${publicInput}]`);

// In real verification, we'd compute L using ECADD and ECMUL
// L = IC[0] + publicInput[0] × IC[1] + ...
// For demonstration, we use IC[0]
const L = vk.IC[0];

console.log(`\nComputing L = IC[0] + Σ(input[i] × IC[i+1])...`);
console.log(`(Simplified: using IC[0] directly)\n`);

// Build pairing input: 4 pairs (768 bytes)
const grothInput = new Uint8Array(768);

// Pair 1: e(-A, B)
const negA = negateG1(proof.A.x, proof.A.y);
grothInput.set(serializeG1(negA.x, negA.y), 0);
grothInput.set(serializeG2(proof.B.x1, proof.B.x2, proof.B.y1, proof.B.y2), 64);

// Pair 2: e(α, β)
grothInput.set(serializeG1(vk.alpha.x, vk.alpha.y), 192);
grothInput.set(serializeG2(vk.beta.x1, vk.beta.x2, vk.beta.y1, vk.beta.y2), 256);

// Pair 3: e(-L, γ)
const negL = negateG1(L.x, L.y);
grothInput.set(serializeG1(negL.x, negL.y), 384);
grothInput.set(serializeG2(vk.gamma.x1, vk.gamma.x2, vk.gamma.y1, vk.gamma.y2), 448);

// Pair 4: e(C, δ)
grothInput.set(serializeG1(proof.C.x, proof.C.y), 576);
grothInput.set(serializeG2(vk.delta.x1, vk.delta.x2, vk.delta.y1, vk.delta.y2), 640);

console.log('Pairing input: 4 pairs (768 bytes)');
console.log('  Pair 1: e(-A, B)');
console.log('  Pair 2: e(α, β)');
console.log('  Pair 3: e(-L, γ)');
console.log('  Pair 4: e(C, δ)\n');

const grothResult = execute(
  PrecompileAddress.BN254_PAIRING,
  grothInput,
  200000n,
  Hardfork.CANCUN
);

if (grothResult.success) {
  const isValid = grothResult.output[31] === 1;
  console.log(`✓ Pairing executed`);
  console.log(`Gas used: ${grothResult.gasUsed}`);
  console.log(`Expected: 45,000 + (4 × 34,000) = 181,000 gas`);
  console.log(`Result: ${isValid ? 'VALID' : 'INVALID'}`);
  console.log('(Note: Invalid because proof is simulated)\n');
} else {
  console.log(`✗ Failed: ${grothResult.error}\n`);
}

// Example 4: Real-world use cases
console.log('4. Real-World Groth16 Applications');
console.log('-'.repeat(50));

console.log('Tornado Cash (Privacy):');
console.log('  - Proves: "I deposited to this contract"');
console.log('  - Without revealing: which deposit');
console.log('  - Circuit: ~2,000 constraints (Merkle tree)');
console.log('  - Gas: ~181,000 (verification only)\n');

console.log('zkSync (Rollup):');
console.log('  - Proves: "1000 transactions are valid"');
console.log('  - Without revealing: transaction details');
console.log('  - Circuit: ~100,000 constraints');
console.log('  - Gas: ~181,000 (same verification cost!)\n');

console.log('Zcash (Shielded Transactions):');
console.log('  - Proves: "I own this coin + no double-spend"');
console.log('  - Without revealing: amounts or recipients');
console.log('  - Circuit: ~20,000 constraints');
console.log('  - Verified off-chain (Zcash nodes)\n');

// Example 5: Gas cost analysis
console.log('5. Gas Cost Analysis');
console.log('-'.repeat(50));

console.log('Pre-Istanbul (EIP-196/197):');
console.log('  Base: 100,000 gas');
console.log('  Per pair: 80,000 gas');
console.log('  4 pairs: 100k + 4×80k = 420,000 gas\n');

console.log('Post-Istanbul (EIP-1108):');
console.log('  Base: 45,000 gas');
console.log('  Per pair: 34,000 gas');
console.log('  4 pairs: 45k + 4×34k = 181,000 gas\n');

console.log('Improvement: 57% reduction (239,000 gas saved)');
console.log('This made privacy protocols economically viable!\n');

console.log('Cost breakdown:');
console.log('  Proof generation: Off-chain (free)');
console.log('  Proof verification: 181,000 gas (~$3-30 @ 20 gwei)');
console.log('  Proof + contract logic: ~250,000-500,000 gas\n');

// Example 6: Empty pairing (edge case)
console.log('6. Empty Pairing (Edge Case)');
console.log('-'.repeat(50));

const emptyInput = new Uint8Array(0);

console.log('Empty input (0 pairs) = empty product = 1\n');

const emptyResult = execute(
  PrecompileAddress.BN254_PAIRING,
  emptyInput,
  50000n,
  Hardfork.CANCUN
);

if (emptyResult.success) {
  const isValid = emptyResult.output[31] === 1;
  console.log(`✓ Success`);
  console.log(`Gas used: ${emptyResult.gasUsed} (base cost: 45,000)`);
  console.log(`Result: ${isValid ? 'VALID (1)' : 'INVALID (0)'}`);
  console.log(`Expected: VALID\n`);
}

console.log('=== Complete ===\n');
console.log('Summary:');
console.log('- Groth16 verification: 181,000 gas (4 pairings)');
console.log('- Smallest proof system (256 bytes)');
console.log('- Fastest verification (constant time)');
console.log('- Powers Tornado Cash, zkSync, Zcash');
console.log('- EIP-1108 made zkSNARKs economically viable');
console.log('- Critical for privacy and scaling');
