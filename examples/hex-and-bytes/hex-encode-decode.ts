// @title Hex Encoding and Decoding
// @description Convert between hex strings and byte arrays using Voltaire's Hex primitive

// SNIPPET:START
import { Hex } from '../../src/primitives/Hex/index.js';

// Encode bytes to hex string
const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in bytes
const hexString = Hex.fromBytes(bytes);
console.log('Hex from bytes:', hexString);

// Decode hex string back to bytes
const decoded = Hex.toBytes(hexString);
console.log('Bytes from hex:', decoded);

// Create hex directly from string
const directHex = Hex.from('0x48656c6c6f');
console.log('Direct hex:', directHex);
// SNIPPET:END

// Test assertions
import { strict as assert } from 'node:assert';

assert.equal(hexString, '0x48656c6c6f');
assert.equal(decoded.length, 5);
assert.equal(decoded[0], 72);
assert.equal(decoded[1], 101);
assert.equal(directHex, '0x48656c6c6f');

console.log('✅ All assertions passed');
process.exit(0);
