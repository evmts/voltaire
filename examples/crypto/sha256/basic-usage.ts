/**
 * SHA256 Basic Usage Examples
 *
 * Demonstrates fundamental SHA-256 operations:
 * - Hashing raw bytes
 * - Hashing strings
 * - Hashing hex strings
 * - Converting output to hex
 */

import { SHA256 } from '../../../src/crypto/sha256/SHA256.js';

console.log('=== SHA256 Basic Usage ===\n');

// Example 1: Hash raw bytes
console.log('1. Hashing Raw Bytes');
console.log('-'.repeat(50));
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash1 = SHA256.hash(data);
console.log('Input:', Array.from(data));
console.log('Hash (32 bytes):', Array.from(hash1).slice(0, 8), '...');
console.log('Hash (hex):', SHA256.toHex(hash1));
console.log();

// Example 2: Hash UTF-8 strings
console.log('2. Hashing Strings');
console.log('-'.repeat(50));
const message = 'hello world';
const hash2 = SHA256.hashString(message);
console.log('Input:', message);
console.log('Hash:', SHA256.toHex(hash2));
console.log();

// Verify NIST test vector
const abcHash = SHA256.hashString('abc');
const expectedAbc = '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
console.log('NIST test vector "abc":', SHA256.toHex(abcHash));
console.log('Expected:', expectedAbc);
console.log('Match:', SHA256.toHex(abcHash) === expectedAbc);
console.log();

// Example 3: Hash hex-encoded data
console.log('3. Hashing Hex Strings');
console.log('-'.repeat(50));
const hexData = '0xdeadbeef';
const hash3 = SHA256.hashHex(hexData);
console.log('Input (hex):', hexData);
console.log('Hash:', SHA256.toHex(hash3));
console.log();

// Also works without 0x prefix
const hash4 = SHA256.hashHex('DEADBEEF');
console.log('Input (hex, no prefix):', 'DEADBEEF');
console.log('Hash:', SHA256.toHex(hash4));
console.log('Same as with prefix:', SHA256.toHex(hash3) === SHA256.toHex(hash4));
console.log();

// Example 4: Empty string (produces known constant)
console.log('4. Empty String Hash');
console.log('-'.repeat(50));
const emptyHash = SHA256.hashString('');
const expectedEmpty = '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
console.log('Empty string hash:', SHA256.toHex(emptyHash));
console.log('Expected:', expectedEmpty);
console.log('Match:', SHA256.toHex(emptyHash) === expectedEmpty);
console.log();

// Example 5: Unicode handling
console.log('5. Unicode Strings');
console.log('-'.repeat(50));
const emoji = SHA256.hashString('🚀');
const chinese = SHA256.hashString('你好');
console.log('Emoji "🚀":', SHA256.toHex(emoji));
console.log('Chinese "你好":', SHA256.toHex(chinese));
console.log();

// Example 6: Determinism - same input always produces same hash
console.log('6. Deterministic Output');
console.log('-'.repeat(50));
const input = new Uint8Array([42, 42, 42]);
const hashA = SHA256.hash(input);
const hashB = SHA256.hash(input);
const hashC = SHA256.hash(input);
console.log('Input:', Array.from(input));
console.log('Hash 1:', SHA256.toHex(hashA));
console.log('Hash 2:', SHA256.toHex(hashB));
console.log('Hash 3:', SHA256.toHex(hashC));
console.log('All identical:',
  SHA256.toHex(hashA) === SHA256.toHex(hashB) &&
  SHA256.toHex(hashB) === SHA256.toHex(hashC)
);
console.log();

// Example 7: Avalanche effect - small change = big difference
console.log('7. Avalanche Effect');
console.log('-'.repeat(50));
const input1 = new Uint8Array([1, 2, 3, 4, 5]);
const input2 = new Uint8Array([1, 2, 3, 4, 6]); // Last byte different
const hashInput1 = SHA256.hash(input1);
const hashInput2 = SHA256.hash(input2);

console.log('Input 1:', Array.from(input1));
console.log('Hash 1: ', SHA256.toHex(hashInput1));
console.log('Input 2:', Array.from(input2), '(last byte different)');
console.log('Hash 2: ', SHA256.toHex(hashInput2));

// Count differing bits
let differingBits = 0;
for (let i = 0; i < 32; i++) {
  const xor = hashInput1[i] ^ hashInput2[i];
  differingBits += xor.toString(2).split('1').length - 1;
}
console.log('Differing bits:', differingBits, '/ 256 (~50% expected)');
console.log();

console.log('=== Basic Usage Complete ===');
