/**
 * Example 2: RLP Encoding and Decoding
 *
 * Demonstrates:
 * - Encoding different data types to RLP
 * - Decoding RLP data
 * - Working with nested structures
 */

import * as Hex from "../../src/primitives/Hex/index.js";
import * as Rlp from "../../src/primitives/Rlp/index.js";

// RLP works with Uint8Arrays and nested arrays

// Create some data structures
const encoder = new TextEncoder();

// Simple byte arrays
const num1 = new Uint8Array([0]);
const num2 = new Uint8Array([127]);
const num3 = new Uint8Array([0, 128]);

// String as bytes
const str1 = encoder.encode("dog");
const str2 = encoder.encode("cat");

// Lists of byte arrays
const list1 = [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])];
const list2 = [encoder.encode("cat"), encoder.encode("dog")];
const list3 = []; // empty list

// Nested structure: ["hello", [1, 2, 3], "world"]
const nested = [
	encoder.encode("hello"),
	[new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])],
	encoder.encode("world"),
];

const encoded = Rlp.encode(nested);
const decoded = Rlp.decode(encoded);

// Encode and decode a simple list
const original = [
	new Uint8Array([1]),
	Hex.toBytes("0x1234"),
	[new Uint8Array([5]), new Uint8Array([6])],
	encoder.encode("test"),
];

const encodedData = Rlp.encode(original);
const decodedData = Rlp.decode(encodedData);

// Transaction-like data
const txData = [
	new Uint8Array([0]), // nonce: 0
	Hex.toBytes("0x04a817c800"), // gasPrice: 20000000000
	Hex.toBytes("0x5208"), // gasLimit: 21000
	Hex.toBytes("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"), // to address
	Hex.toBytes("0x038d7ea4c68000"), // value: 1000000000000000
	new Uint8Array([]), // data: empty
];

const encodedTx = Rlp.encode(txData);
const decodedTx = Rlp.decode(encodedTx);
