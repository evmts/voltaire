/**
 * Keccak-256 Hashing Example
 *
 * Demonstrates:
 * - Computing Keccak-256 hashes from bytes, strings, and hex
 * - Hashing messages for Ethereum signatures
 * - Transaction hashing
 * - Content addressing and data integrity
 * - Hash chaining and composition
 */

import { Hash } from '../../../src/primitives/Hash/index.js';

console.log('=== Keccak-256 Hashing Example ===\n');

// ============================================================
// 1. Basic Hashing Methods
// ============================================================

console.log('1. Basic Hashing Methods\n');

// Hash raw bytes
const data = new Uint8Array([1, 2, 3, 4, 5]);
const bytesHash = Hash.keccak256(data);
console.log(`Bytes hash:  ${bytesHash.toHex()}`);

// Hash UTF-8 string
const stringHash = Hash.keccak256String("hello");
console.log(`String hash: ${stringHash.toHex()}`);

// Hash hex-encoded data
const hexHash = Hash.keccak256Hex("0x1234");
console.log(`Hex hash:    ${hexHash.toHex()}\n`);

// ============================================================
// 2. Hashing Empty Data
// ============================================================

console.log('2. Hashing Empty Data\n');

// Empty bytes
const emptyBytes = new Uint8Array(0);
const emptyBytesHash = Hash.keccak256(emptyBytes);
console.log(`Empty bytes: ${emptyBytesHash.toHex()}`);

// Empty string
const emptyStringHash = Hash.keccak256String("");
console.log(`Empty string: ${emptyStringHash.toHex()}`);

// These are the same
console.log(`Equal: ${emptyBytesHash.equals(emptyStringHash)}\n`);

// ============================================================
// 3. Deterministic Hashing
// ============================================================

console.log('3. Deterministic Hashing (Same Input → Same Hash)\n');

const message = "Hello, Ethereum!";
const hash1 = Hash.keccak256String(message);
const hash2 = Hash.keccak256String(message);
const hash3 = Hash.keccak256String(message);

console.log(`Message: "${message}"`);
console.log(`Hash 1:  ${hash1.toHex()}`);
console.log(`Hash 2:  ${hash2.toHex()}`);
console.log(`Hash 3:  ${hash3.toHex()}`);
console.log(`All equal: ${hash1.equals(hash2) && hash2.equals(hash3)}\n`);

// ============================================================
// 4. Avalanche Effect (Small Change → Big Difference)
// ============================================================

console.log('4. Avalanche Effect\n');

const msg1 = "hello";
const msg2 = "Hello"; // Only capital H different
const msg3 = "hello!"; // Added exclamation

const avalanche1 = Hash.keccak256String(msg1);
const avalanche2 = Hash.keccak256String(msg2);
const avalanche3 = Hash.keccak256String(msg3);

console.log(`"${msg1}":  ${avalanche1.toHex()}`);
console.log(`"${msg2}":  ${avalanche2.toHex()}`);
console.log(`"${msg3}": ${avalanche3.toHex()}`);
console.log('\nNote: Tiny changes produce completely different hashes\n');

// ============================================================
// 5. Hashing Messages for Ethereum Signatures (EIP-191)
// ============================================================

console.log('5. Ethereum Signed Message (EIP-191)\n');

function hashEthereumSignedMessage(message: string): Hash {
  // EIP-191: "\x19Ethereum Signed Message:\n" + message.length + message
  const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
  const prefixBytes = new TextEncoder().encode(prefix);
  const messageBytes = new TextEncoder().encode(message);

  // Concatenate prefix + message
  const combined = new Uint8Array(prefixBytes.length + messageBytes.length);
  combined.set(prefixBytes, 0);
  combined.set(messageBytes, prefixBytes.length);

  return Hash.keccak256(combined);
}

const signMessage = "Sign this message";
const messageHash = hashEthereumSignedMessage(signMessage);

console.log(`Message: "${signMessage}"`);
console.log(`Hash:    ${messageHash.toHex()}`);
console.log('\nThis hash can be signed with a private key\n');

// ============================================================
// 6. Transaction Hashing
// ============================================================

console.log('6. Transaction Hashing\n');

// Example: Hash transaction data (RLP-encoded)
// In reality, you'd use proper RLP encoding
const txData = new Uint8Array([
  0xf8, 0x6c, // RLP list header
  0x01, // nonce
  0x85, 0x04, 0xa8, 0x17, 0xc8, 0x00, // gasPrice
  0x52, 0x08, // gasLimit
  // ... more transaction fields
]);

const txHash = Hash.keccak256(txData);
console.log(`Transaction data: ${txData.length} bytes`);
console.log(`Transaction hash: ${txHash.toHex()}\n`);

// ============================================================
// 7. Content Addressing
// ============================================================

console.log('7. Content Addressing\n');

// Hash content to create unique identifier
const content1 = "This is file content";
const content2 = "This is different content";

const contentHash1 = Hash.keccak256String(content1);
const contentHash2 = Hash.keccak256String(content2);

console.log(`Content 1 hash: ${contentHash1.format()}`);
console.log(`Content 2 hash: ${contentHash2.format()}`);

// Use hash as content identifier (IPFS-like)
const contentStore = new Map<string, string>();
contentStore.set(contentHash1.toHex(), content1);
contentStore.set(contentHash2.toHex(), content2);

// Retrieve by hash
const retrieved = contentStore.get(contentHash1.toHex());
console.log(`\nRetrieved: "${retrieved}"\n`);

// ============================================================
// 8. Data Integrity Verification
// ============================================================

console.log('8. Data Integrity Verification\n');

const originalData = new Uint8Array([10, 20, 30, 40, 50]);
const originalHash = Hash.keccak256(originalData);

console.log(`Original hash: ${originalHash.format()}`);

// Simulate data transmission
const receivedData = new Uint8Array([10, 20, 30, 40, 50]); // Correct
const corruptedData = new Uint8Array([10, 20, 99, 40, 50]); // Corrupted

// Verify integrity
const receivedHash = Hash.keccak256(receivedData);
const corruptedHash = Hash.keccak256(corruptedData);

console.log(`Received hash:  ${receivedHash.format()} - ${originalHash.equals(receivedHash) ? 'VALID ✓' : 'INVALID ✗'}`);
console.log(`Corrupted hash: ${corruptedHash.format()} - ${originalHash.equals(corruptedHash) ? 'VALID ✓' : 'INVALID ✗'}\n`);

// ============================================================
// 9. Hash Chaining
// ============================================================

console.log('9. Hash Chaining\n');

// Hash of hash
const base = Hash.keccak256String("base");
const chain1 = Hash.keccak256(base);
const chain2 = Hash.keccak256(chain1);
const chain3 = Hash.keccak256(chain2);

console.log(`Base:    ${base.format()}`);
console.log(`Chain 1: ${chain1.format()}`);
console.log(`Chain 2: ${chain2.format()}`);
console.log(`Chain 3: ${chain3.format()}\n`);

// ============================================================
// 10. Combining Data Before Hashing
// ============================================================

console.log('10. Combining Data (Solidity abi.encodePacked equivalent)\n');

// Hash multiple values together
function hashPacked(address: Uint8Array, value: bigint): Hash {
  // Pack address (20 bytes) + uint256 (32 bytes)
  const valueBytes = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    valueBytes[i] = Number(v & 0xFFn);
    v >>= 8n;
  }

  const packed = new Uint8Array(52); // 20 + 32
  packed.set(address, 0);
  packed.set(valueBytes, 20);

  return Hash.keccak256(packed);
}

const addr = new Uint8Array(20).fill(0xaa);
const value = 123456789n;
const packedHash = hashPacked(addr, value);

console.log(`Packed hash: ${packedHash.toHex()}\n`);

// ============================================================
// 11. Commitment Schemes
// ============================================================

console.log('11. Commitment Schemes\n');

function createCommitment(secret: string, salt: Uint8Array): Hash {
  const secretBytes = new TextEncoder().encode(secret);
  const combined = new Uint8Array(secretBytes.length + salt.length);
  combined.set(secretBytes, 0);
  combined.set(salt, secretBytes.length);
  return Hash.keccak256(combined);
}

function verifyCommitment(commitment: Hash, secret: string, salt: Uint8Array): boolean {
  const computed = createCommitment(secret, salt);
  return commitment.equals(computed);
}

// Create commitment
const secret = "my secret bid";
const salt = crypto.getRandomValues(new Uint8Array(32));
const commitment = createCommitment(secret, salt);

console.log(`Commitment: ${commitment.format()}`);

// Later, reveal and verify
const valid = verifyCommitment(commitment, "my secret bid", salt);
const invalid = verifyCommitment(commitment, "wrong bid", salt);

console.log(`Verify correct secret: ${valid}`);
console.log(`Verify wrong secret:   ${invalid}\n`);

// ============================================================
// 12. Benchmarking Hash Performance
// ============================================================

console.log('12. Hash Performance\n');

// Hash small data
const smallData = new Uint8Array(32);
const smallStart = performance.now();
for (let i = 0; i < 10000; i++) {
  Hash.keccak256(smallData);
}
const smallTime = performance.now() - smallStart;

// Hash large data
const largeData = new Uint8Array(1024 * 1024); // 1MB
const largeStart = performance.now();
Hash.keccak256(largeData);
const largeTime = performance.now() - largeStart;

console.log(`10,000 × 32-byte hashes: ${smallTime.toFixed(2)}ms (${(10000 / smallTime * 1000).toFixed(0)} hashes/sec)`);
console.log(`1 × 1MB hash: ${largeTime.toFixed(2)}ms\n`);

// ============================================================
// 13. Practical Use Cases
// ============================================================

console.log('13. Practical Use Cases\n');

// Block hash (simulated)
const blockData = new Uint8Array(256);
crypto.getRandomValues(blockData);
const blockHash = Hash.keccak256(blockData);
console.log(`Block hash: ${blockHash.format()}`);

// Merkle leaf
const leafData = Hash.keccak256String("transaction data");
console.log(`Merkle leaf: ${leafData.format()}`);

// Storage key
const storageSlot = Hash.keccak256String("balanceOf[0x123...]");
console.log(`Storage key: ${storageSlot.format()}`);

// Event topic
const eventSig = Hash.keccak256String("Transfer(address,address,uint256)");
console.log(`Event topic: ${eventSig.format()}\n`);

console.log('=== Example Complete ===\n');
