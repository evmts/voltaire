// @title Hash String with Keccak256
// @description Hash a UTF-8 string using Keccak256 and get the result as hex

// SNIPPET:START
import { Keccak256 } from '../../src/crypto/Keccak256/index.js';
import { Hex } from '../../src/primitives/Hex/index.js';

// Hash a simple string
const message = 'Hello, World!';
const hash = Keccak256.hashString(message);
const hexHash = Hex.fromBytes(hash);
console.log('Keccak256 hash:', hexHash);

// Hash an empty string
const emptyHash = Keccak256.hashString('');
const emptyHexHash = Hex.fromBytes(emptyHash);
console.log('Empty string hash:', emptyHexHash);

// Hash is always 32 bytes (256 bits)
console.log('Hash length:', hash.length, 'bytes');
// SNIPPET:END

// Test assertions
import { strict as assert } from 'node:assert';

assert.equal(
  hexHash,
  '0xacaf3289d7b601cbd114fb36c4d29c85bbfd5e133f14cb355c3fd8d99367964f'
);
assert.equal(hash.length, 32);
assert.equal(
  emptyHexHash,
  '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
);

console.log('✅ All assertions passed');
process.exit(0);
