import { Blake2 } from '../../../src/crypto/Blake2/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

/**
 * Blake2 EVM Precompile (EIP-152)
 *
 * Demonstrates Blake2b as used in Ethereum precompile at address 0x09:
 * - F compression function (used in EIP-152)
 * - Zcash-style 32-byte output
 * - Block header hashing
 * - Proof-of-work verification patterns
 *
 * Note: EIP-152 adds Blake2b F compression function precompile
 * for ZCash cross-chain verification on Ethereum
 */

console.log('=== Blake2 EVM Precompile (EIP-152) ===\n');

// 1. Zcash-style hashing (32-byte output)
console.log('1. Zcash-Style Hashing (BLAKE2b-256)');
console.log('-'.repeat(40));

// Zcash uses Blake2b with 32-byte output in Equihash PoW
const zcashHeader = new Uint8Array(140); // Zcash block header
zcashHeader.fill(0x01); // Example data

const zcashHash = Blake2.hash(zcashHeader, 32);
console.log(`Zcash header size: ${zcashHeader.length} bytes`);
console.log(`Blake2b-256 hash: ${Hex.fromBytes(zcashHash)}`);
console.log(`Output length: ${zcashHash.length} bytes (Zcash standard)\n`);

// 2. EIP-152 precompile context
console.log('2. EIP-152 Blake2b Precompile Context');
console.log('-'.repeat(40));
console.log('Address: 0x0000000000000000000000000000000000000009');
console.log('Purpose: Blake2b F compression function');
console.log('Use case: ZCash transaction verification on Ethereum');
console.log('Gas cost: Variable based on rounds parameter\n');

// The precompile exposes the F compression function directly
// rather than the full hash, for ZCash proof verification
console.log('Unlike full Blake2.hash(), the precompile exposes:');
console.log('- F compression function (internal primitive)');
console.log('- Used for verifying ZCash Equihash proofs');
console.log('- Enables cross-chain ZCash → Ethereum bridges\n');

// 3. Ethereum block hash comparison
console.log('3. Ethereum Use Cases for Blake2');
console.log('-'.repeat(40));

// Ethereum uses Keccak-256, but Blake2 is faster for many use cases
const ethereumData = new TextEncoder().encode('Ethereum transaction data');

// Blake2 is ~3x faster than Keccak-256 in software
const blake2Hash = Blake2.hash(ethereumData, 32);
console.log('Example Ethereum data hashing:');
console.log(`Input: ${ethereumData.length} bytes`);
console.log(`Blake2b-256: ${Hex.fromBytes(blake2Hash)}`);
console.log('\nAdvantages over Keccak-256:');
console.log('- 3-4x faster in software');
console.log('- Variable output length (1-64 bytes)');
console.log('- Used in EIP-152 for ZCash interop\n');

// 4. Merkle tree with Blake2 (faster than Keccak)
console.log('4. Merkle Tree with Blake2 (Performance)');
console.log('-'.repeat(40));

const leaves = [
  new TextEncoder().encode('leaf1'),
  new TextEncoder().encode('leaf2'),
  new TextEncoder().encode('leaf3'),
  new TextEncoder().encode('leaf4'),
];

// Hash leaves with 32-byte output
const hashedLeaves = leaves.map(leaf => Blake2.hash(leaf, 32));

console.log('Merkle tree leaf hashing:');
hashedLeaves.forEach((hash, i) => {
  console.log(`Leaf ${i + 1}: ${Hex.fromBytes(hash)}`);
});

// Combine pairs and hash
const combined1 = new Uint8Array([...hashedLeaves[0], ...hashedLeaves[1]]);
const combined2 = new Uint8Array([...hashedLeaves[2], ...hashedLeaves[3]]);

const parent1 = Blake2.hash(combined1, 32);
const parent2 = Blake2.hash(combined2, 32);

console.log(`\nParent 1: ${Hex.fromBytes(parent1)}`);
console.log(`Parent 2: ${Hex.fromBytes(parent2)}`);

// Final root
const rootData = new Uint8Array([...parent1, ...parent2]);
const merkleRoot = Blake2.hash(rootData, 32);

console.log(`\nMerkle root: ${Hex.fromBytes(merkleRoot)}`);
console.log('Blake2 is ideal for Merkle trees due to speed\n');

// 5. IPFS content addressing
console.log('5. IPFS-Style Content Addressing');
console.log('-'.repeat(40));

// IPFS uses Blake2b for content addressing (faster than SHA-256)
const fileContent = new Uint8Array(1024).fill(0xFF);
const contentHash = Blake2.hash(fileContent, 32);

console.log(`File size: ${fileContent.length} bytes`);
console.log(`Blake2b content hash: ${Hex.fromBytes(contentHash)}`);
console.log('\nIPFS uses Blake2b because:');
console.log('- 2-3x faster than SHA-256');
console.log('- Same security level (256-bit)');
console.log('- Better for large file processing\n');

// 6. Fast checksum for data deduplication
console.log('6. Fast Checksums for Data Deduplication');
console.log('-'.repeat(40));

const chunk1 = new Uint8Array(4096).fill(0xAA);
const chunk2 = new Uint8Array(4096).fill(0xBB);
const chunk3 = new Uint8Array(4096).fill(0xAA); // Same as chunk1

// Use 16-byte Blake2 for fast checksums
const checksum1 = Blake2.hash(chunk1, 16);
const checksum2 = Blake2.hash(chunk2, 16);
const checksum3 = Blake2.hash(chunk3, 16);

console.log('4KB chunk checksums (16 bytes):');
console.log(`Chunk 1: ${Hex.fromBytes(checksum1)}`);
console.log(`Chunk 2: ${Hex.fromBytes(checksum2)}`);
console.log(`Chunk 3: ${Hex.fromBytes(checksum3)}`);

console.log(`\nChunk 1 == Chunk 3: ${Hex.fromBytes(checksum1) === Hex.fromBytes(checksum3)}`);
console.log('16-byte Blake2 is fast enough for real-time deduplication\n');

// 7. Password hashing key derivation (NOT recommended alone)
console.log('7. Key Derivation (Use with KDF like Argon2)');
console.log('-'.repeat(40));

const password = 'secure_password_123';
const salt = new Uint8Array(16).fill(0x42);

// Combine password and salt
const combined = new Uint8Array([
  ...new TextEncoder().encode(password),
  ...salt,
]);

const derivedKey = Blake2.hash(combined, 32);
console.log(`Password: "${password}"`);
console.log(`Salt: ${Hex.fromBytes(salt)}`);
console.log(`Derived key: ${Hex.fromBytes(derivedKey)}`);
console.log('\nWARNING: Use proper KDFs (Argon2, scrypt, bcrypt) for passwords');
console.log('Blake2 is too fast for password hashing alone!\n');

// 8. EIP-152 gas cost efficiency
console.log('8. EIP-152 Gas Cost Comparison');
console.log('-'.repeat(40));

console.log('Blake2 F precompile gas costs (EIP-152):');
console.log('- Base: 0 gas');
console.log('- Per round: Variable (configured by caller)');
console.log('- Typical: ~12 rounds for security');
console.log('\nCompared to Keccak-256:');
console.log('- Keccak-256: 30 gas + 6 gas per word');
console.log('- Blake2 F: More efficient for certain operations');
console.log('- Enables ZCash proof verification on-chain\n');

console.log('=== Complete ===');
