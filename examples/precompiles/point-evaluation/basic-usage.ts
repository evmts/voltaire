import { execute, PrecompileAddress } from '../../../src/precompiles/precompiles.js';
import { Hardfork } from '../../../src/primitives/Hardfork/index.js';

/**
 * Point Evaluation Precompile (0x0A) - Basic Usage
 *
 * Address: 0x000000000000000000000000000000000000000a
 * Introduced: Cancun (EIP-4844)
 *
 * Verifies KZG polynomial commitment proofs for blob transactions.
 * Enables Proto-Danksharding - critical for Ethereum scaling.
 *
 * Gas Cost: Fixed 50,000 gas
 *
 * Input: Exactly 192 bytes
 *   - Bytes 0-31:   versioned_hash (SHA-256(commitment) with version 0x01)
 *   - Bytes 32-63:  z (evaluation point, BLS field element)
 *   - Bytes 64-95:  y (claimed evaluation value, BLS field element)
 *   - Bytes 96-143: commitment (KZG commitment, BLS12-381 G1 point, 48 bytes)
 *   - Bytes 144-191: proof (KZG proof, BLS12-381 G1 point, 48 bytes)
 *
 * Output: 64 bytes
 *   - Success: [0x00...0x1000, BLS_MODULUS]
 *   - Failure: [0x00...0x0000, 0x00...0x0000]
 */

console.log('=== Point Evaluation Precompile (0x0A) - Basic Usage ===\n');

// BLS12-381 field modulus
const BLS_MODULUS = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001n;
const FIELD_ELEMENTS_PER_BLOB = 4096;

/**
 * Simple SHA-256 mock (in real code, use crypto.subtle or library)
 * For demonstration only - shows versioned hash structure
 */
function mockSha256(data: Uint8Array): Uint8Array {
  const hash = new Uint8Array(32);
  // In reality: hash = SHA256(data)
  // For demo, fill with pattern
  for (let i = 0; i < 32; i++) {
    hash[i] = data[i % data.length] ^ (i * 7);
  }
  return hash;
}

/**
 * Create versioned hash from commitment
 */
function createVersionedHash(commitment: Uint8Array): Uint8Array {
  const hash = mockSha256(commitment);
  hash[0] = 0x01; // Version byte for EIP-4844
  return hash;
}

/**
 * Convert bigint to bytes (big-endian, padded to length)
 */
function toBytes(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[length - 1 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
  }
  return bytes;
}

/**
 * Read bigint from bytes (big-endian)
 */
function fromBytes(bytes: Uint8Array): bigint {
  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  return value;
}

// Example 1: Point at infinity (simplest valid proof)
console.log('1. Point at Infinity (Trivial Proof)');
console.log('-'.repeat(50));

const input1 = new Uint8Array(192);

// Commitment: point at infinity in compressed format
// BLS12-381 compressed infinity = 0xc0 followed by zeros
const commitment1 = new Uint8Array(48);
commitment1[0] = 0xc0; // Infinity marker

// Proof: also point at infinity
const proof1 = new Uint8Array(48);
proof1[0] = 0xc0;

// Versioned hash
const versionedHash1 = createVersionedHash(commitment1);

// z and y are zero (default)
// Assemble input
input1.set(versionedHash1, 0);    // versioned_hash
input1.set(new Uint8Array(32), 32); // z = 0
input1.set(new Uint8Array(32), 64); // y = 0
input1.set(commitment1, 96);        // commitment (48 bytes)
input1.set(proof1, 144);            // proof (48 bytes)

console.log('Input configuration:');
console.log(`  Versioned hash: 0x${Array.from(versionedHash1.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
console.log(`  Evaluation point z: 0`);
console.log(`  Claimed value y: 0`);
console.log(`  Commitment: point at infinity`);
console.log(`  Proof: point at infinity\n`);

const result1 = execute(
  PrecompileAddress.POINT_EVALUATION,
  input1,
  60000n,
  Hardfork.CANCUN
);

if (result1.success) {
  // Check output format
  const fieldElements = (result1.output[30] << 8) | result1.output[31];
  const modulusBytes = result1.output.slice(32, 64);
  const modulusValue = fromBytes(modulusBytes);

  console.log('✓ Success');
  console.log(`Gas used: ${result1.gasUsed}`);
  console.log(`Field elements per blob: ${fieldElements} (expected 4096)`);
  console.log(`BLS modulus: 0x${modulusValue.toString(16).slice(0, 16)}...`);

  const isValid = fieldElements !== 0;
  console.log(`Proof valid: ${isValid ? 'YES' : 'NO'}\n`);
} else {
  console.log(`✗ Failed: ${result1.error}\n`);
}

// Example 2: Input format demonstration
console.log('2. Input Format Breakdown');
console.log('-'.repeat(50));

console.log('Total input: 192 bytes');
console.log('  [0-31]     (32 bytes) Versioned hash');
console.log('  [32-63]    (32 bytes) Evaluation point z');
console.log('  [64-95]    (32 bytes) Claimed value y');
console.log('  [96-143]   (48 bytes) KZG commitment (G1 point)');
console.log('  [144-191]  (48 bytes) KZG proof (G1 point)\n');

console.log('Versioned hash format:');
console.log('  Byte 0: 0x01 (EIP-4844 version)');
console.log('  Bytes 1-31: SHA256(commitment)[1:32]\n');

console.log('BLS12-381 G1 point (compressed, 48 bytes):');
console.log('  Bit 0-1: Compression flags');
console.log('  Bit 2: Infinity flag');
console.log('  Bit 3: Y sign flag');
console.log('  Bits 4-383: X-coordinate\n');

// Example 3: Field element constraints
console.log('3. BLS Field Element Constraints');
console.log('-'.repeat(50));

console.log(`BLS12-381 scalar field modulus:`);
console.log(`  ${BLS_MODULUS}`);
console.log(`  ≈ 2^255 (slightly less)\n`);

console.log('Field element requirements:');
console.log('  - Must be < BLS_MODULUS');
console.log('  - Stored as 32 bytes big-endian');
console.log('  - Values ≥ modulus cause failure\n');

// Test with valid field element
const validFieldElement = BLS_MODULUS - 1n;
console.log(`Valid element (modulus - 1):`);
console.log(`  ${validFieldElement}\n`);

// Test with invalid field element (too large)
const invalidFieldElement = BLS_MODULUS + 1n;
console.log(`Invalid element (modulus + 1):`);
console.log(`  ${invalidFieldElement}`);
console.log(`  Would cause precompile to fail\n`);

// Example 4: Versioned hash validation
console.log('4. Versioned Hash Validation');
console.log('-'.repeat(50));

const commitment4 = new Uint8Array(48);
commitment4[0] = 0xc0;

const correctHash = createVersionedHash(commitment4);
console.log('Correct versioned hash:');
console.log(`  Computed from SHA256(commitment)`);
console.log(`  Version byte: 0x${correctHash[0].toString(16).padStart(2, '0')}\n`);

// Wrong hash (mismatch)
const wrongHash = new Uint8Array(32);
wrongHash[0] = 0x01;
wrongHash[1] = 0xFF; // Wrong hash value

const input4 = new Uint8Array(192);
input4.set(wrongHash, 0);
input4.set(commitment4, 96);
input4.set(new Uint8Array(48), 144);
input4[144] = 0xc0;

console.log('Testing with wrong versioned hash...');

const result4 = execute(
  PrecompileAddress.POINT_EVALUATION,
  input4,
  60000n,
  Hardfork.CANCUN
);

console.log(`Result: ${result4.success ? 'unexpected success' : '✗ failed as expected'}`);
console.log('Versioned hash must match SHA256(commitment)!\n');

// Example 5: Output interpretation
console.log('5. Output Format');
console.log('-'.repeat(50));

console.log('Success output (64 bytes):');
console.log('  Bytes 0-29:  0x000...000');
console.log('  Bytes 30-31: 0x1000 (4096 field elements)');
console.log('  Bytes 32-63: BLS modulus\n');

console.log('Failure output (64 bytes):');
console.log('  All zeros (proof verification failed)\n');

console.log('Checking output:');
console.log('  if (output[30] == 0x10 && output[31] == 0x00) {');
console.log('    // Proof is valid');
console.log('  } else {');
console.log('    // Proof is invalid or error occurred');
console.log('  }\n');

// Example 6: Error cases
console.log('6. Error Cases');
console.log('-'.repeat(50));

// Wrong length
const wrongLength = new Uint8Array(191); // Should be 192
const resultLen = execute(
  PrecompileAddress.POINT_EVALUATION,
  wrongLength,
  60000n,
  Hardfork.CANCUN
);
console.log(`Wrong length (191 bytes): ${resultLen.success ? 'unexpected success' : '✓ failed'}`);

// Out of gas
const input6b = new Uint8Array(192);
input6b.set(createVersionedHash(new Uint8Array(48)), 0);
const resultGas = execute(
  PrecompileAddress.POINT_EVALUATION,
  input6b,
  40000n, // Not enough (need 50,000)
  Hardfork.CANCUN
);
console.log(`Out of gas (40k for 50k): ${resultGas.success ? 'unexpected success' : '✓ failed'}`);

console.log('\n');

// Example 7: Gas cost analysis
console.log('7. Gas Cost Analysis');
console.log('-'.repeat(50));

console.log('Fixed cost: 50,000 gas');
console.log('  Covers:');
console.log('    - BLS12-381 pairing operation (~45k gas)');
console.log('    - Field arithmetic and validation');
console.log('    - SHA-256 hash verification\n');

console.log('Comparison to alternatives:');
console.log('  - BLS12-381 pairing (0x11): 65k + 43k/pair');
console.log('  - BN254 pairing (0x08): 45k + 34k/pair');
console.log('  - Point eval is optimized for single pairing\n');

console.log('Cost per blob verification:');
console.log('  - Point evaluation: 50,000 gas');
console.log('  - Blob data: stored off-chain (consensus layer)');
console.log('  - Total L1 cost: minimal (just commitment)\n');

console.log('=== Complete ===\n');
console.log('Key Points:');
console.log('- Fixed 50,000 gas regardless of blob size');
console.log('- Input must be exactly 192 bytes');
console.log('- Versioned hash must match commitment');
console.log('- Enables 128KB blobs at ~10× lower cost');
console.log('- Critical for rollup scaling (EIP-4844)');
console.log('- Used by Optimism, Arbitrum, Base, zkSync');
