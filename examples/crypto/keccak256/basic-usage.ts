import { Keccak256 } from '../../../src/crypto/Keccak256/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

/**
 * Basic Keccak256 Usage
 *
 * Demonstrates fundamental hashing operations:
 * - Hash raw bytes
 * - Hash UTF-8 strings
 * - Hash hex-encoded data
 * - Convert outputs to hex strings
 */

console.log('=== Basic Keccak256 Usage ===\n');

// 1. Hash raw bytes
console.log('1. Hash Raw Bytes');
console.log('-'.repeat(40));
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = Keccak256.hash(data);
console.log(`Input:  [${Array.from(data).join(', ')}]`);
console.log(`Output: ${Hex.fromBytes(hash)}`);
console.log(`Length: ${hash.length} bytes\n`);

// 2. Hash UTF-8 string
console.log('2. Hash UTF-8 String');
console.log('-'.repeat(40));
const message = 'hello';
const messageHash = Keccak256.hashString(message);
console.log(`Input:  "${message}"`);
console.log(`Output: ${Hex.fromBytes(messageHash)}`);

// Verify against known test vector
const expectedHello = '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8';
const isCorrect = Hex.fromBytes(messageHash) === expectedHello;
console.log(`Matches expected: ${isCorrect}\n`);

// 3. Hash hex-encoded data
console.log('3. Hash Hex-Encoded Data');
console.log('-'.repeat(40));
const hexInput = '0xdeadbeef';
const hexHash = Keccak256.hashHex(hexInput);
console.log(`Input:  ${hexInput}`);
console.log(`Output: ${Hex.fromBytes(hexHash)}\n`);

// 4. Empty input (produces known constant)
console.log('4. Empty Input Hash');
console.log('-'.repeat(40));
const emptyHash = Keccak256.hashString('');
console.log('Input:  "" (empty string)');
console.log(`Output: ${Hex.fromBytes(emptyHash)}`);

// This is the EMPTY_KECCAK256 constant used throughout Ethereum
const expectedEmpty = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';
console.log(`This is EMPTY_KECCAK256: ${Hex.fromBytes(emptyHash) === expectedEmpty}\n`);

// 5. Determinism - same input always produces same output
console.log('5. Deterministic Hashing');
console.log('-'.repeat(40));
const input = 'test';
const hash1 = Keccak256.hashString(input);
const hash2 = Keccak256.hashString(input);
const hash3 = Keccak256.hashString(input);

console.log(`Input: "${input}"`);
console.log(`Hash 1: ${Hex.fromBytes(hash1)}`);
console.log(`Hash 2: ${Hex.fromBytes(hash2)}`);
console.log(`Hash 3: ${Hex.fromBytes(hash3)}`);
console.log(`All equal: ${
  Hex.fromBytes(hash1) === Hex.fromBytes(hash2) &&
  Hex.fromBytes(hash2) === Hex.fromBytes(hash3)
}\n`);

// 6. Avalanche effect - small input change causes large output change
console.log('6. Avalanche Effect');
console.log('-'.repeat(40));
const original = 'The quick brown fox jumps over the lazy dog';
const modified = 'The quick brown fox jumps over the lazy doh'; // Changed last letter

const originalHash = Keccak256.hashString(original);
const modifiedHash = Keccak256.hashString(modified);

console.log(`Original: "${original}"`);
console.log(`Hash:     ${Hex.fromBytes(originalHash)}`);
console.log(`\nModified: "${modified}"`);
console.log(`Hash:     ${Hex.fromBytes(modifiedHash)}`);

// Count differing bits
let differentBits = 0;
for (let i = 0; i < 32; i++) {
  const xor = originalHash[i] ^ modifiedHash[i];
  differentBits += xor.toString(2).split('1').length - 1;
}
console.log(`\nDifferent bits: ${differentBits}/256 (${(differentBits/256*100).toFixed(1)}%)`);
console.log('Small input change causes ~50% of output bits to flip\n');

console.log('=== Complete ===');
