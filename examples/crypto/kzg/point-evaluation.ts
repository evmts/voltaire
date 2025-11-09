/**
 * Point Evaluation Precompile Example
 *
 * Demonstrates EIP-4844 point evaluation precompile (0x0a):
 * - Preparing input for precompile
 * - Computing versioned hash
 * - Calling point evaluation precompile
 * - Understanding precompile output
 */

import { KZG } from '../../../src/crypto/KZG/KZG.js';
import { SHA256 } from '../../../src/crypto/SHA256/index.js';
import * as Hex from '../../../src/primitives/Hex/index.js';

console.log('=== Point Evaluation Precompile (0x0a) ===\n');

// Initialize KZG
KZG.loadTrustedSetup();

// Step 1: Create blob and commitment
console.log('1. Creating Blob and Commitment');
console.log('-'.repeat(50));

const blob = KZG.generateRandomBlob();
const commitment = KZG.blobToKzgCommitment(blob);

console.log('Blob created:', blob.length, 'bytes');
console.log('Commitment:', Hex.fromBytes(commitment));
console.log();

// Step 2: Compute versioned hash
console.log('2. Computing Versioned Hash');
console.log('-'.repeat(50));

// Versioned hash = SHA256(commitment) with version byte 0x01
const commitmentHash = SHA256.hash(commitment);
const versionedHash = new Uint8Array(32);
versionedHash.set(commitmentHash);
versionedHash[0] = 0x01; // Version byte for EIP-4844

console.log('Commitment hash:', Hex.fromBytes(commitmentHash));
console.log('Versioned hash:', Hex.fromBytes(versionedHash));
console.log('Version byte:', '0x' + versionedHash[0].toString(16).padStart(2, '0'));
console.log();

// Step 3: Generate proof at evaluation point
console.log('3. Generating KZG Proof');
console.log('-'.repeat(50));

const z = new Uint8Array(32);
crypto.getRandomValues(z);
z[0] = 0; // Ensure < BLS12-381 modulus

const { proof, y } = KZG.computeKzgProof(blob, z);

console.log('Evaluation point z:', Hex.fromBytes(z).slice(0, 20) + '...');
console.log('Claimed value y:', Hex.fromBytes(y).slice(0, 20) + '...');
console.log('Proof:', Hex.fromBytes(proof).slice(0, 20) + '...');
console.log();

// Step 4: Prepare precompile input
console.log('4. Preparing Precompile Input (192 bytes)');
console.log('-'.repeat(50));

// Input format (exactly 192 bytes):
// Offset | Length | Description
// -------|--------|-------------
// 0      | 32     | versioned_hash
// 32     | 32     | z (evaluation point)
// 64     | 32     | y (claimed value)
// 96     | 48     | commitment
// 144    | 48     | proof

const precompileInput = new Uint8Array(192);
precompileInput.set(versionedHash, 0);      // bytes 0-31
precompileInput.set(z, 32);                  // bytes 32-63
precompileInput.set(y, 64);                  // bytes 64-95
precompileInput.set(commitment, 96);         // bytes 96-143
precompileInput.set(proof, 144);             // bytes 144-191

console.log('Input structure:');
console.log('  [0:32]   Versioned hash:', Hex.fromBytes(precompileInput.slice(0, 32)).slice(0, 20) + '...');
console.log('  [32:64]  z:', Hex.fromBytes(precompileInput.slice(32, 64)).slice(0, 20) + '...');
console.log('  [64:96]  y:', Hex.fromBytes(precompileInput.slice(64, 96)).slice(0, 20) + '...');
console.log('  [96:144] commitment:', Hex.fromBytes(precompileInput.slice(96, 144)).slice(0, 20) + '...');
console.log('  [144:192] proof:', Hex.fromBytes(precompileInput.slice(144, 192)).slice(0, 20) + '...');
console.log('  Total:', precompileInput.length, 'bytes');
console.log();

// Step 5: Verify proof (simulates precompile behavior)
console.log('5. Simulating Precompile Verification');
console.log('-'.repeat(50));

// First, verify versioned hash matches commitment
const expectedHash = SHA256.hash(commitment);
expectedHash[0] = 0x01;
const hashMatches = expectedHash.every((byte, i) => byte === versionedHash[i]);

console.log('Versioned hash validation:', hashMatches ? '✓ Valid' : '✗ Invalid');

// Verify KZG proof
const proofValid = KZG.verifyKzgProof(commitment, z, y, proof);
console.log('KZG proof validation:', proofValid ? '✓ Valid' : '✗ Invalid');

const precompileSuccess = hashMatches && proofValid;
console.log('Precompile result:', precompileSuccess ? '✓ Success' : '✗ Failure');
console.log();

// Step 6: Understanding precompile output
console.log('6. Precompile Output Format');
console.log('-'.repeat(50));

if (precompileSuccess) {
  // Success output (64 bytes):
  // Bytes 0-31: FIELD_ELEMENTS_PER_BLOB (0x1000 = 4096)
  // Bytes 32-63: BLS_MODULUS

  const FIELD_ELEMENTS_PER_BLOB = 4096;
  const BLS_MODULUS = '0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001';

  console.log('Success output (64 bytes):');
  console.log('  Bytes [0:32]:  FIELD_ELEMENTS_PER_BLOB =', FIELD_ELEMENTS_PER_BLOB);
  console.log('  Bytes [32:64]: BLS_MODULUS =', BLS_MODULUS);
} else {
  console.log('Failure output: 64 zero bytes');
}
console.log();

// Step 7: Gas cost
console.log('7. Gas Cost');
console.log('-'.repeat(50));
console.log('Fixed gas cost: 50,000 gas');
console.log('Covers: BLS12-381 pairing + field arithmetic + SHA-256');
console.log('Independent of blob size or proof validity');
console.log();

// Step 8: Test invalid inputs
console.log('8. Testing Invalid Inputs');
console.log('-'.repeat(50));

// Test 1: Wrong versioned hash
const wrongHash = new Uint8Array(32).fill(0xFF);
const wrongHashInput = new Uint8Array(precompileInput);
wrongHashInput.set(wrongHash, 0);

const wrongHashValid = (() => {
  const hash = wrongHashInput.slice(0, 32);
  const expectedH = SHA256.hash(commitment);
  expectedH[0] = 0x01;
  return hash.every((byte, i) => byte === expectedH[i]);
})();

console.log('Test 1 - Wrong versioned hash:', wrongHashValid ? '✓ Valid (BAD!)' : '✗ Invalid (expected)');

// Test 2: Wrong proof
const wrongProof = new Uint8Array(48);
crypto.getRandomValues(wrongProof);
wrongProof[0] = 0xc0; // Valid BLS point marker

try {
  const wrongProofValid = KZG.verifyKzgProof(commitment, z, y, wrongProof);
  console.log('Test 2 - Wrong proof:', wrongProofValid ? '✓ Valid (BAD!)' : '✗ Invalid (expected)');
} catch (error) {
  console.log('Test 2 - Wrong proof: ✗ Rejected (expected)');
}
console.log();

// Step 9: Real-world usage
console.log('9. Real-World Usage');
console.log('-'.repeat(50));
console.log('Use cases:');
console.log('  1. Optimistic Rollups: Verify fraud proof blob references');
console.log('  2. ZK Rollups: Sample blob data for data availability');
console.log('  3. Data Availability Sampling: Light clients verify random points');
console.log('  4. On-chain Blob Verification: Smart contracts verify blob commitments');
console.log();

console.log('Transaction flow:');
console.log('  1. L2 creates blob with rollup data');
console.log('  2. Compute KZG commitment');
console.log('  3. Create versioned hash (SHA256 + version byte)');
console.log('  4. Submit Type-3 blob transaction with versioned hash');
console.log('  5. Validators use 0x0a precompile to verify');
console.log('  6. Blob stored for ~18 days, commitment forever');
console.log();

// Cleanup
KZG.freeTrustedSetup();

console.log('=== Key Takeaways ===');
console.log('- Precompile 0x0a verifies KZG proofs on-chain');
console.log('- Input: 192 bytes (versioned hash + z + y + commitment + proof)');
console.log('- Output: 64 bytes (success) or 64 zeros (failure)');
console.log('- Gas: Fixed 50,000 gas');
console.log('- Critical for EIP-4844 blob transaction verification');
