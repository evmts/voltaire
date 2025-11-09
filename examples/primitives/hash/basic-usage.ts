/**
 * Basic Hash Usage Example
 *
 * Demonstrates:
 * - Creating hashes from various input types (hex, bytes)
 * - Basic conversions (hex, bytes, string)
 * - Validation and type checking
 * - Basic comparisons
 */

import { Hash } from '../../../src/primitives/Hash/index.js';

console.log('=== Basic Hash Usage ===\n');

// ============================================================
// 1. Creating Hashes
// ============================================================

console.log('1. Creating Hashes\n');

// From hex string (most common)
const hash1 = new Hash("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
console.log(`From hex: ${hash1.format()}`);

// From hex using static method
const hash2 = Hash.fromHex("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
console.log(`From fromHex(): ${hash2.format()}`);

// From bytes
const bytes = new Uint8Array(32);
bytes[0] = 0x12;
bytes[1] = 0x34;
bytes[31] = 0xff;
const hash3 = Hash.fromBytes(bytes);
console.log(`From bytes: ${hash3.format()}`);

// Random hash (cryptographically secure)
const randomHash = Hash.random();
console.log(`Random hash: ${randomHash.format()}\n`);

// ============================================================
// 2. Format Conversions
// ============================================================

console.log('2. Format Conversions\n');

const hash = Hash.fromHex("0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8");

// Convert to hex string
console.log(`toHex():     ${hash.toHex()}`);

// Convert to string (alias for toHex)
console.log(`toString():  ${hash.toString()}`);

// Convert to bytes
const hashBytes = hash.toBytes();
console.log(`toBytes():   Uint8Array(${hashBytes.length})`);

// Display format (shortened for UIs)
console.log(`format():    ${hash.format()}`); // Default: 6 prefix + 4 suffix
console.log(`format(8,6): ${hash.format(8, 6)}\n`); // Custom: 8 prefix + 6 suffix

// ============================================================
// 3. Validation
// ============================================================

console.log('3. Validation\n');

// Valid hex strings
const validHex1 = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const validHex2 = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // No 0x prefix
const invalidHex = "0x1234"; // Too short

console.log(`Valid (with 0x):    ${Hash.isValidHex(validHex1)}`);
console.log(`Valid (without 0x): ${Hash.isValidHex(validHex2)}`);
console.log(`Invalid (too short): ${Hash.isValidHex(invalidHex)}`);

// Safe parsing with validation
function parseHash(input: string): Hash | null {
  if (!Hash.isValidHex(input)) {
    console.log(`  ✗ Invalid format: ${input}`);
    return null;
  }
  try {
    return Hash.fromHex(input);
  } catch (error) {
    console.log(`  ✗ Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

console.log('\nSafe parsing:');
parseHash(validHex1);
parseHash(invalidHex);
console.log();

// ============================================================
// 4. Type Guards
// ============================================================

console.log('4. Type Guards\n');

function processValue(value: unknown) {
  if (Hash.isHash(value)) {
    console.log(`  ✓ Valid Hash: ${Hash.format(value)}`);
  } else {
    console.log(`  ✗ Not a Hash: ${typeof value}`);
  }
}

processValue(hash);
processValue(new Uint8Array(32)); // Valid 32-byte array
processValue(new Uint8Array(20)); // Wrong length
processValue("0x1234"); // String, not Hash
console.log();

// ============================================================
// 5. Basic Comparisons
// ============================================================

console.log('5. Basic Comparisons\n');

// Create test hashes
const hashA = Hash.keccak256String("hello");
const hashB = Hash.keccak256String("hello");
const hashC = Hash.keccak256String("world");
const zeroHash = Hash.fromBytes(new Uint8Array(32));

console.log(`Hash A: ${hashA.format()}`);
console.log(`Hash B: ${hashB.format()}`);
console.log(`Hash C: ${hashC.format()}`);

// Equality (constant-time comparison)
console.log(`\nA equals B: ${hashA.equals(hashB)}`); // true - same content
console.log(`A equals C: ${hashA.equals(hashC)}`); // false - different content

// Zero check
console.log(`\nZero hash: ${zeroHash.format()}`);
console.log(`Zero check: ${zeroHash.isZero()}`); // true
console.log(`A is zero: ${hashA.isZero()}`); // false

// Compare with ZERO constant
console.log(`\nEquals ZERO constant: ${zeroHash.equals(Hash.ZERO)}\n`);

// ============================================================
// 6. Working with Hash as Uint8Array
// ============================================================

console.log('6. Hash as Uint8Array\n');

const hash4 = Hash.keccak256String("example");

// Direct byte access (Hash extends Uint8Array)
console.log(`Length:      ${hash4.length} bytes`);
console.log(`First byte:  0x${hash4[0].toString(16).padStart(2, '0')}`);
console.log(`Last byte:   0x${hash4[31].toString(16).padStart(2, '0')}`);

// Iterate over bytes
console.log('\nFirst 8 bytes:');
for (let i = 0; i < 8; i++) {
  console.log(`  [${i}]: 0x${hash4[i].toString(16).padStart(2, '0')}`);
}
console.log();

// ============================================================
// 7. Cloning and Slicing
// ============================================================

console.log('7. Cloning and Slicing\n');

const original = Hash.keccak256String("data");

// Clone creates independent copy
const cloned = original.clone();
console.log(`Original: ${original.format()}`);
console.log(`Cloned:   ${cloned.format()}`);
console.log(`Equal:    ${original.equals(cloned)}`);

// Modifying clone doesn't affect original
cloned[0] = 0xff;
console.log(`\nAfter modifying clone:`);
console.log(`Equal:    ${original.equals(cloned)}`); // false

// Slicing (get portion of hash)
const functionSignature = Hash.keccak256String("transfer(address,uint256)");
const selector = Uint8Array.prototype.slice.call(functionSignature, 0, 4);
console.log(`\nFunction selector: 0x${Array.from(selector).map(b => b.toString(16).padStart(2, '0')).join('')}\n`);

// ============================================================
// 8. Constants
// ============================================================

console.log('8. Hash Constants\n');

console.log(`Hash.SIZE:  ${Hash.SIZE} bytes`);
console.log(`Hash.ZERO:  ${Hash.format(Hash.ZERO)}`);

// Using constants for validation
const buffer = new Uint8Array(Hash.SIZE); // Correct size
console.log(`\nBuffer size: ${buffer.length} (matches Hash.SIZE)`);

// Zero hash comparison
const testHash = Hash.fromBytes(new Uint8Array(32));
console.log(`Is zero: ${Hash.equals(testHash, Hash.ZERO)}\n`);

console.log('=== Example Complete ===\n');
