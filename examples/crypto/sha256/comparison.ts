/**
 * SHA256 vs Keccak256 Comparison
 *
 * Demonstrates differences and use cases:
 * - Algorithm differences
 * - Performance comparison
 * - When to use each
 * - Cross-validation with known values
 */

import { SHA256 } from '../../../src/crypto/sha256/SHA256.js';
import { Keccak256 } from '../../../src/crypto/keccak256/Keccak256.js';

console.log('=== SHA256 vs Keccak256 Comparison ===\n');

// Example 1: Basic hash comparison
console.log('1. Basic Hash Comparison');
console.log('-'.repeat(70));

const data = new TextEncoder().encode('Hello, World!');

const sha256Hash = SHA256.hash(data);
const keccak256Hash = Keccak256.hash(data);

console.log('Input: "Hello, World!"');
console.log('SHA-256:    ', SHA256.toHex(sha256Hash));
console.log('Keccak-256: ', Keccak256.toHex(keccak256Hash));
console.log('\nBoth produce 32-byte hashes, but different values!');
console.log();

// Example 2: Empty string hashes
console.log('2. Empty String Hash Constants');
console.log('-'.repeat(70));

const emptySha256 = SHA256.hashString('');
const emptyKeccak256 = Keccak256.hashString('');

console.log('Empty string:');
console.log('SHA-256:    ', SHA256.toHex(emptySha256));
console.log('Keccak-256: ', Keccak256.toHex(emptyKeccak256));
console.log();

// Known constants
console.log('These are important constants in crypto:');
console.log('SHA-256 empty:    Used in Bitcoin, TLS');
console.log('Keccak-256 empty: Used in Ethereum smart contracts');
console.log();

// Example 3: Use case - Bitcoin vs Ethereum
console.log('3. Use Cases: Bitcoin vs Ethereum');
console.log('-'.repeat(70));

// Bitcoin uses SHA-256 (double)
function bitcoinHash(data: Uint8Array): Uint8Array {
  return SHA256.hash(SHA256.hash(data));
}

// Ethereum uses Keccak-256
function ethereumHash(data: Uint8Array): Uint8Array {
  return Keccak256.hash(data);
}

const blockData = new TextEncoder().encode('Block header data');

const bitcoinBlockHash = bitcoinHash(blockData);
const ethereumBlockHash = ethereumHash(blockData);

console.log('Block header data:');
console.log('Bitcoin (double SHA-256): ', SHA256.toHex(bitcoinBlockHash));
console.log('Ethereum (Keccak-256):    ', Keccak256.toHex(ethereumBlockHash));
console.log();

console.log('Bitcoin:  Double SHA-256 for blocks, transactions, Merkle trees');
console.log('Ethereum: Keccak-256 for blocks, state, addresses, topics');
console.log();

// Example 4: Function selector comparison
console.log('4. Function Selectors (EVM)');
console.log('-'.repeat(70));

const functionSig = 'transfer(address,uint256)';
const functionBytes = new TextEncoder().encode(functionSig);

// Ethereum uses Keccak-256 for function selectors
const keccakHash = Keccak256.hash(functionBytes);
const selector = keccakHash.slice(0, 4);

console.log('Function signature:', functionSig);
console.log('Keccak-256 hash:', Keccak256.toHex(keccakHash));
console.log('Selector (first 4 bytes):', Array.from(selector).map(b => '0x' + b.toString(16).padStart(2, '0')).join(''));
console.log();

// If we used SHA-256 (WRONG for Ethereum!)
const wrongHash = SHA256.hash(functionBytes);
const wrongSelector = wrongHash.slice(0, 4);

console.log('If we incorrectly used SHA-256:');
console.log('SHA-256 hash:', SHA256.toHex(wrongHash));
console.log('Wrong selector:', Array.from(wrongSelector).map(b => '0x' + b.toString(16).padStart(2, '0')).join(''));
console.log('\n⚠️  Using wrong hash function breaks Ethereum compatibility!');
console.log();

// Example 5: Address derivation
console.log('5. Address Derivation Differences');
console.log('-'.repeat(70));

// Simulated public key
const publicKey = new Uint8Array(64);
for (let i = 0; i < 64; i++) {
  publicKey[i] = i & 0xFF;
}

// Bitcoin: SHA-256 then RIPEMD-160
console.log('Bitcoin P2PKH address derivation:');
console.log('  Step 1: SHA-256(public_key)');
const bitcoinStep1 = SHA256.hash(publicKey);
console.log('    Result:', SHA256.toHex(bitcoinStep1).slice(0, 40) + '...');
console.log('  Step 2: RIPEMD-160(SHA-256(public_key))');
console.log('    Then Base58Check encoding...\n');

// Ethereum: Keccak-256, take last 20 bytes
console.log('Ethereum address derivation:');
console.log('  Step 1: Keccak-256(public_key)');
const ethereumStep1 = Keccak256.hash(publicKey);
console.log('    Result:', Keccak256.toHex(ethereumStep1).slice(0, 40) + '...');
console.log('  Step 2: Take last 20 bytes as address');
const ethereumAddress = ethereumStep1.slice(12);
console.log('    Address: 0x' + Array.from(ethereumAddress).map(b => b.toString(16).padStart(2, '0')).join(''));
console.log();

// Example 6: Performance comparison
console.log('6. Performance Comparison');
console.log('-'.repeat(70));

const testData = new Uint8Array(1024 * 1024); // 1MB
for (let i = 0; i < testData.length; i++) {
  testData[i] = i & 0xFF;
}

const iterations = 10;

// SHA-256 benchmark
let sha256Start = performance.now();
for (let i = 0; i < iterations; i++) {
  SHA256.hash(testData);
}
let sha256Time = (performance.now() - sha256Start) / iterations;

// Keccak-256 benchmark
let keccak256Start = performance.now();
for (let i = 0; i < iterations; i++) {
  Keccak256.hash(testData);
}
let keccak256Time = (performance.now() - keccak256Start) / iterations;

console.log('Hashing 1MB of data (average of', iterations, 'runs):');
console.log('SHA-256:     ', sha256Time.toFixed(2), 'ms');
console.log('Keccak-256:  ', keccak256Time.toFixed(2), 'ms');

const faster = sha256Time < keccak256Time ? 'SHA-256' : 'Keccak-256';
const ratio = (Math.max(sha256Time, keccak256Time) / Math.min(sha256Time, keccak256Time)).toFixed(2);
console.log('\n' + faster, 'is', ratio + 'x faster (with hardware acceleration)');
console.log();

// Example 7: Security properties
console.log('7. Security Properties');
console.log('-'.repeat(70));

console.log('SHA-256:');
console.log('  Standard: NIST FIPS 180-4');
console.log('  Collision resistance: 2^128 operations');
console.log('  Preimage resistance: 2^256 operations');
console.log('  Hardware acceleration: SHA-NI (Intel/AMD)');
console.log('  Status: No known practical attacks');
console.log();

console.log('Keccak-256:');
console.log('  Standard: SHA-3 family (original Keccak)');
console.log('  Collision resistance: 2^128 operations');
console.log('  Preimage resistance: 2^256 operations');
console.log('  Hardware acceleration: Limited');
console.log('  Status: No known practical attacks');
console.log();

// Example 8: When to use each
console.log('8. When to Use Each Algorithm');
console.log('-'.repeat(70));

console.log('Use SHA-256 when:');
console.log('  ✓ Bitcoin/blockchain applications');
console.log('  ✓ Digital signatures (RSA, ECDSA)');
console.log('  ✓ Certificate fingerprints');
console.log('  ✓ HMAC for message authentication');
console.log('  ✓ Regulatory compliance required');
console.log('  ✓ Hardware acceleration important');
console.log();

console.log('Use Keccak-256 when:');
console.log('  ✓ Ethereum smart contracts');
console.log('  ✓ EVM function selectors');
console.log('  ✓ Ethereum address derivation');
console.log('  ✓ Event topic hashing');
console.log('  ✓ Solidity keccak256() compatibility');
console.log();

// Example 9: Avalanche effect comparison
console.log('9. Avalanche Effect Comparison');
console.log('-'.repeat(70));

const input1 = new Uint8Array([1, 2, 3, 4, 5]);
const input2 = new Uint8Array([1, 2, 3, 4, 6]); // Last byte different

const sha1 = SHA256.hash(input1);
const sha2 = SHA256.hash(input2);
const kec1 = Keccak256.hash(input1);
const kec2 = Keccak256.hash(input2);

// Count differing bits for SHA-256
let shaDiff = 0;
for (let i = 0; i < 32; i++) {
  const xor = sha1[i] ^ sha2[i];
  shaDiff += xor.toString(2).split('1').length - 1;
}

// Count differing bits for Keccak-256
let kecDiff = 0;
for (let i = 0; i < 32; i++) {
  const xor = kec1[i] ^ kec2[i];
  kecDiff += kec2.toString(2).split('1').length - 1;
}

console.log('Input 1:', Array.from(input1));
console.log('Input 2:', Array.from(input2), '(last byte differs)\n');

console.log('SHA-256 differing bits:    ', shaDiff, '/ 256 (' + (shaDiff / 2.56).toFixed(1) + '%)');
console.log('Keccak-256 differing bits: ', kecDiff, '/ 256 (' + (kecDiff / 2.56).toFixed(1) + '%)');
console.log('\nBoth show strong avalanche effect (~50% bits flip)');
console.log();

console.log('=== Comparison Complete ===');
