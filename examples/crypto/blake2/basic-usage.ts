import { Blake2 } from '../../../src/crypto/Blake2/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

/**
 * Basic Blake2 Usage
 *
 * Demonstrates fundamental Blake2b hashing operations:
 * - Hash with default 64-byte output
 * - Hash with custom output lengths (1-64 bytes)
 * - Hash strings and raw bytes
 * - Variable-length output flexibility
 */

console.log('=== Basic Blake2 Usage ===\n');

// 1. Hash with default 64-byte output
console.log('1. Default 64-Byte Output');
console.log('-'.repeat(40));
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash64 = Blake2.hash(data);
console.log(`Input:  [${Array.from(data).join(', ')}]`);
console.log(`Output: ${Hex.fromBytes(hash64)}`);
console.log(`Length: ${hash64.length} bytes (default)\n`);

// 2. Hash with custom 32-byte output (BLAKE2b-256)
console.log('2. Custom 32-Byte Output (SHA-256 equivalent)');
console.log('-'.repeat(40));
const hash32 = Blake2.hash(data, 32);
console.log(`Input:  [${Array.from(data).join(', ')}]`);
console.log(`Output: ${Hex.fromBytes(hash32)}`);
console.log(`Length: ${hash32.length} bytes\n`);

// 3. Hash UTF-8 string
console.log('3. Hash UTF-8 String');
console.log('-'.repeat(40));
const message = 'hello';
const messageHash = Blake2.hashString(message);
console.log(`Input:  "${message}"`);
console.log(`Output: ${Hex.fromBytes(messageHash)}`);
console.log(`Length: ${messageHash.length} bytes\n`);

// 4. Variable output lengths
console.log('4. Variable Output Lengths (1-64 bytes)');
console.log('-'.repeat(40));
const input = 'test';
const hash1 = Blake2.hashString(input, 1);   // Minimal
const hash20 = Blake2.hashString(input, 20); // Address-sized
const hash48 = Blake2.hashString(input, 48); // Custom

console.log(`Input: "${input}"`);
console.log(`\n1-byte:  ${Hex.fromBytes(hash1)}`);
console.log(`20-byte: ${Hex.fromBytes(hash20)}`);
console.log(`32-byte: ${Hex.fromBytes(Blake2.hashString(input, 32))}`);
console.log(`48-byte: ${Hex.fromBytes(hash48)}`);
console.log(`64-byte: ${Hex.fromBytes(Blake2.hashString(input))}\n`);

console.log('Note: Each length produces a completely different hash');
console.log('(NOT just truncation of longer output)\n');

// 5. Empty input
console.log('5. Empty Input Hash');
console.log('-'.repeat(40));
const emptyHash = Blake2.hashString('');
console.log('Input:  "" (empty string)');
console.log(`Output: ${Hex.fromBytes(emptyHash)}`);

// Verify against RFC 7693 test vector
const expectedEmpty = '0x786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce';
console.log(`Matches RFC 7693: ${Hex.fromBytes(emptyHash) === expectedEmpty}\n`);

// 6. Determinism - same input always produces same output
console.log('6. Deterministic Hashing');
console.log('-'.repeat(40));
const testInput = 'Blake2 is fast';
const testHash1 = Blake2.hashString(testInput, 32);
const testHash2 = Blake2.hashString(testInput, 32);
const testHash3 = Blake2.hashString(testInput, 32);

console.log(`Input: "${testInput}"`);
console.log(`Hash 1: ${Hex.fromBytes(testHash1)}`);
console.log(`Hash 2: ${Hex.fromBytes(testHash2)}`);
console.log(`Hash 3: ${Hex.fromBytes(testHash3)}`);
console.log(`All equal: ${
  Hex.fromBytes(testHash1) === Hex.fromBytes(testHash2) &&
  Hex.fromBytes(testHash2) === Hex.fromBytes(testHash3)
}\n`);

// 7. Avalanche effect - small input change causes large output change
console.log('7. Avalanche Effect');
console.log('-'.repeat(40));
const original = 'The quick brown fox';
const modified = 'The quick brown foy'; // Changed last letter

const originalHash = Blake2.hashString(original, 32);
const modifiedHash = Blake2.hashString(modified, 32);

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

// 8. Performance advantage - multiple custom sizes
console.log('8. Flexible Output Sizes for Different Use Cases');
console.log('-'.repeat(40));
const sampleData = new Uint8Array(100).fill(0xAB);

const checksum = Blake2.hash(sampleData, 16);     // Fast 16-byte checksum
const addressHash = Blake2.hash(sampleData, 20);  // Address-sized (like RIPEMD160)
const standardHash = Blake2.hash(sampleData, 32); // Standard 32-byte (like SHA-256)
const maxHash = Blake2.hash(sampleData, 64);      // Maximum security

console.log(`Input: 100 bytes of 0xAB`);
console.log(`\n16-byte checksum:       ${Hex.fromBytes(checksum).slice(0, 42)}...`);
console.log(`20-byte address hash:   ${Hex.fromBytes(addressHash).slice(0, 46)}...`);
console.log(`32-byte standard hash:  ${Hex.fromBytes(standardHash).slice(0, 66)}...`);
console.log(`64-byte maximum hash:   ${Hex.fromBytes(maxHash).slice(0, 66)}...\n`);

console.log('=== Complete ===');
