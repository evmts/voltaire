// @title RLP Encode List
// @description Encode a list of values using Recursive Length Prefix (RLP) encoding

// SNIPPET:START
import { Hex, Rlp } from "@tevm/voltaire";

// Encode a simple list of strings
const list = ["dog", "cat", "bird"];
const encoded = Rlp.encode(list.map((s) => new TextEncoder().encode(s)));
const hexEncoded = Hex.fromBytes(encoded);

// Encode nested lists
const nestedList = [
	new TextEncoder().encode("hello"),
	[new TextEncoder().encode("world")],
];
const encodedNested = Rlp.encode(nestedList);
const hexNested = Hex.fromBytes(encodedNested);

// Encode empty list
const emptyList = Rlp.encode([]);
const hexEmpty = Hex.fromBytes(emptyList);
// SNIPPET:END

// Test assertions
import { strict as assert } from "node:assert";

assert.equal(hexEncoded, "0xcd83646f67836361748462697264");
assert.equal(hexEmpty, "0xc0");
process.exit(0);
