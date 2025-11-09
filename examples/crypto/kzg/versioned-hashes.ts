/**
 * Versioned Hash Management Example
 *
 * Demonstrates:
 * - Computing versioned hashes from commitments
 * - Understanding version byte semantics
 * - Hash verification workflow
 * - Future versioning considerations
 */

import { KZG } from '../../../src/crypto/KZG/KZG.js';
import { SHA256 } from '../../../src/crypto/SHA256/index.js';
import * as Hex from '../../../src/primitives/Hex/index.js';
import * as Hash from '../../../src/primitives/Hash/index.js';

console.log('=== Versioned Hash Management ===\n');

// Initialize KZG
KZG.loadTrustedSetup();

// Step 1: Understanding versioned hashes
console.log('1. What is a Versioned Hash?');
console.log('-'.repeat(50));

console.log('Purpose:');
console.log('  - Compact on-chain reference to blob commitment');
console.log('  - Version byte allows future commitment schemes');
console.log('  - SHA-256 hash provides 32-byte identifier');
console.log('  - Included in transaction, not the full commitment');
console.log();

console.log('Structure (32 bytes):');
console.log('  Byte 0:     Version byte (0x01 for EIP-4844)');
console.log('  Bytes 1-31: SHA256(commitment)[1:32]');
console.log();

console.log('Version byte semantics:');
console.log('  0x01 - SHA-256 of KZG commitment (EIP-4844)');
console.log('  0x02+ - Reserved for future schemes');
console.log();

// Step 2: Computing versioned hash
console.log('2. Computing Versioned Hash');
console.log('-'.repeat(50));

const blob = KZG.generateRandomBlob();
const commitment = KZG.blobToKzgCommitment(blob);

console.log('Commitment (48 bytes):', Hex.fromBytes(commitment));
console.log();

// Compute SHA-256 of commitment
const commitmentHash = SHA256.hash(commitment);
console.log('SHA-256(commitment):', Hex.fromBytes(commitmentHash));
console.log();

// Create versioned hash
const versionedHash = new Uint8Array(32);
versionedHash.set(commitmentHash);
versionedHash[0] = 0x01; // Version byte for EIP-4844

console.log('Versioned hash:', Hex.fromBytes(versionedHash));
console.log('Version byte:', '0x' + versionedHash[0].toString(16).padStart(2, '0'));
console.log();

// Step 3: Extracting components
console.log('3. Versioned Hash Components');
console.log('-'.repeat(50));

const version = versionedHash[0];
const hashSuffix = versionedHash.slice(1);

console.log('Version:', '0x' + version.toString(16).padStart(2, '0'));
console.log('Hash suffix (31 bytes):', Hex.fromBytes(hashSuffix));
console.log();

console.log('Interpretation:');
if (version === 0x01) {
  console.log('  ✓ Version 0x01: SHA-256 of KZG commitment (EIP-4844)');
} else {
  console.log('  ✗ Unknown version');
}
console.log();

// Step 4: Verification workflow
console.log('4. Versioned Hash Verification');
console.log('-'.repeat(50));

function verifyVersionedHash(
  versionedHash: Uint8Array,
  commitment: Uint8Array
): { valid: boolean; reason?: string } {
  // Check length
  if (versionedHash.length !== 32) {
    return { valid: false, reason: 'Wrong length (must be 32 bytes)' };
  }

  // Check version byte
  if (versionedHash[0] !== 0x01) {
    return { valid: false, reason: 'Unsupported version (must be 0x01)' };
  }

  // Compute expected hash
  const expectedHash = SHA256.hash(commitment);
  expectedHash[0] = 0x01;

  // Compare
  const matches = expectedHash.every((byte, i) => byte === versionedHash[i]);
  if (!matches) {
    return { valid: false, reason: 'Hash mismatch' };
  }

  return { valid: true };
}

const result = verifyVersionedHash(versionedHash, commitment);
console.log('Verification result:', result.valid ? '✓ Valid' : '✗ Invalid');
if (result.reason) {
  console.log('Reason:', result.reason);
}
console.log();

// Step 5: Testing invalid cases
console.log('5. Testing Invalid Versioned Hashes');
console.log('-'.repeat(50));

// Test 1: Wrong version
const wrongVersion = new Uint8Array(versionedHash);
wrongVersion[0] = 0x02;
const test1 = verifyVersionedHash(wrongVersion, commitment);
console.log('Test 1 - Wrong version (0x02):', test1.valid ? '✗ Valid (BAD)' : '✓ Invalid');
console.log('  Reason:', test1.reason);
console.log();

// Test 2: Wrong hash
const wrongHash = new Uint8Array(32);
wrongHash[0] = 0x01;
crypto.getRandomValues(wrongHash.slice(1));
const test2 = verifyVersionedHash(wrongHash, commitment);
console.log('Test 2 - Wrong hash:', test2.valid ? '✗ Valid (BAD)' : '✓ Invalid');
console.log('  Reason:', test2.reason);
console.log();

// Test 3: Wrong commitment
const blob2 = KZG.generateRandomBlob();
const commitment2 = KZG.blobToKzgCommitment(blob2);
const test3 = verifyVersionedHash(versionedHash, commitment2);
console.log('Test 3 - Wrong commitment:', test3.valid ? '✗ Valid (BAD)' : '✓ Invalid');
console.log('  Reason:', test3.reason);
console.log();

// Step 6: Multiple blobs
console.log('6. Managing Multiple Versioned Hashes');
console.log('-'.repeat(50));

const blobs = [
  KZG.generateRandomBlob(),
  KZG.generateRandomBlob(),
  KZG.generateRandomBlob(),
];

const commitments = blobs.map((b) => KZG.blobToKzgCommitment(b));
const versionedHashes = commitments.map((c) => {
  const hash = SHA256.hash(c);
  hash[0] = 0x01;
  return hash;
});

console.log('Created', versionedHashes.length, 'versioned hashes:');
for (let i = 0; i < versionedHashes.length; i++) {
  console.log(`  Blob ${i + 1}: ${Hex.fromBytes(versionedHashes[i])}`);

  // Verify each
  const verify = verifyVersionedHash(versionedHashes[i], commitments[i]);
  console.log(`    Verification: ${verify.valid ? '✓' : '✗'}`);
}
console.log();

// Step 7: Transaction usage
console.log('7. Versioned Hashes in Transactions');
console.log('-'.repeat(50));

console.log('Type 3 blob transaction structure:');
console.log('```typescript');
console.log('interface BlobTransaction {');
console.log('  // ... standard transaction fields ...');
console.log('  ');
console.log('  // On-chain (in transaction body)');
console.log('  blobVersionedHashes: Hash[]; // Array of 32-byte hashes');
console.log('  ');
console.log('  // Sidecar (separate from transaction)');
console.log('  blobs: Blob[];');
console.log('  commitments: KZGCommitment[];');
console.log('  proofs: KZGProof[];');
console.log('}');
console.log('```');
console.log();

console.log('Why versioned hashes on-chain:');
console.log('  - Only 32 bytes vs 48 bytes for full commitment');
console.log('  - Allows future commitment schemes (via version byte)');
console.log('  - Transaction hash is deterministic');
console.log('  - Commitment hash binds to blob data');
console.log();

// Step 8: Size comparison
console.log('8. Size Comparison');
console.log('-'.repeat(50));

const NUM_BLOBS = 6; // Maximum

console.log(`For ${NUM_BLOBS} blobs:`);
console.log('  Commitments:', NUM_BLOBS * 48, 'bytes');
console.log('  Versioned hashes:', NUM_BLOBS * 32, 'bytes');
console.log('  Savings:', NUM_BLOBS * (48 - 32), 'bytes');
console.log();

console.log('Additional benefits:');
console.log('  - Version byte enables future upgrades');
console.log('  - Hash provides content addressing');
console.log('  - Smaller transaction size');
console.log();

// Step 9: Future versions
console.log('9. Future Version Considerations');
console.log('-'.repeat(50));

console.log('Potential future versions:');
console.log('  0x02 - Alternative commitment scheme');
console.log('  0x03 - Post-quantum safe commitments');
console.log('  0x04 - Different curve or hash function');
console.log();

console.log('Backward compatibility:');
console.log('  - Old clients reject unknown versions');
console.log('  - Hard fork required for new versions');
console.log('  - Version byte parsed first');
console.log('  - Allows smooth protocol upgrades');
console.log();

// Step 10: Helper functions
console.log('10. Helper Functions');
console.log('-'.repeat(50));

function commitmentToVersionedHash(commitment: Uint8Array): Uint8Array {
  const hash = SHA256.hash(commitment);
  hash[0] = 0x01;
  return hash;
}

function parseVersionedHash(hash: Uint8Array): {
  version: number;
  hashSuffix: Uint8Array;
} {
  return {
    version: hash[0],
    hashSuffix: hash.slice(1),
  };
}

// Example usage
const testCommitment = KZG.blobToKzgCommitment(KZG.generateRandomBlob());
const testHash = commitmentToVersionedHash(testCommitment);
const parsed = parseVersionedHash(testHash);

console.log('Helper function usage:');
console.log('  Commitment → Hash:', Hex.fromBytes(testHash).slice(0, 20) + '...');
console.log('  Parsed version:', '0x' + parsed.version.toString(16).padStart(2, '0'));
console.log('  Parsed suffix:', Hex.fromBytes(parsed.hashSuffix).slice(0, 20) + '...');
console.log();

// Step 11: Production checklist
console.log('11. Production Checklist');
console.log('-'.repeat(50));

console.log('When working with versioned hashes:');
console.log('  ✓ Always verify version byte = 0x01');
console.log('  ✓ Compute SHA-256(commitment) and compare');
console.log('  ✓ Handle unknown versions gracefully');
console.log('  ✓ Store commitments alongside hashes');
console.log('  ✓ Validate hash length (32 bytes)');
console.log('  ✓ Use constant-time comparison');
console.log();

console.log('Common mistakes:');
console.log('  ✗ Forgetting version byte');
console.log('  ✗ Using wrong hash function (must be SHA-256)');
console.log('  ✗ Not validating hash matches commitment');
console.log('  ✗ Accepting unknown version bytes');
console.log();

// Cleanup
KZG.freeTrustedSetup();

console.log('=== Key Takeaways ===');
console.log('- Versioned hash = 0x01 + SHA256(commitment)[1:32]');
console.log('- Version byte 0x01 indicates EIP-4844 (SHA-256 of KZG)');
console.log('- Always verify hash matches commitment');
console.log('- 32 bytes (16 bytes smaller than commitment)');
console.log('- Enables future protocol upgrades');
console.log('- Critical for blob transaction validation');
