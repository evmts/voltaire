// @title RLP Encode List
// @description Encode a list of values using Recursive Length Prefix (RLP) encoding

// SNIPPET:START
import { Rlp } from '../../src/primitives/Rlp/index.js';
import { Hex } from '../../src/primitives/Hex/index.js';

// Encode a simple list of strings
const list = ['dog', 'cat', 'bird'];
const encoded = Rlp.encode(list.map(s => new TextEncoder().encode(s)));
const hexEncoded = Hex.fromBytes(encoded);
console.log('RLP encoded list:', hexEncoded);

// Encode nested lists
const nestedList = [
  new TextEncoder().encode('hello'),
  [new TextEncoder().encode('world')]
];
const encodedNested = Rlp.encode(nestedList);
const hexNested = Hex.fromBytes(encodedNested);
console.log('RLP nested list:', hexNested);

// Encode empty list
const emptyList = Rlp.encode([]);
const hexEmpty = Hex.fromBytes(emptyList);
console.log('RLP empty list:', hexEmpty);
// SNIPPET:END

// Test assertions
import { strict as assert } from 'node:assert';

assert.equal(hexEncoded, '0xcd83646f67836361748462697264');
assert.equal(hexEmpty, '0xc0');

console.log('✅ All assertions passed');
process.exit(0);
