import { Hex, Rlp } from "voltaire";
// Example: Encode lists with RLP

// Empty list
const empty = Rlp.encodeList([]);
// Output: 0xc0

// Single item list
const singleItem = Rlp.encodeList([new Uint8Array([0x01])]);
// Output: 0xc101 (0xc1 = 0xc0 + 1)

// Multiple items
const multipleItems = Rlp.encodeList([
	new Uint8Array([0x01]),
	new Uint8Array([0x02]),
	new Uint8Array([0x03]),
]);
// Output: 0xc3010203 (0xc3 = 0xc0 + 3)

// List with empty bytes
const withEmpty = Rlp.encodeList([new Uint8Array([]), new Uint8Array([0x01])]);
// Output: 0xc28001 (empty encodes as 0x80)

// Nested list
const nested = Rlp.encodeList([
	new Uint8Array([0x01]),
	[new Uint8Array([0x02]), new Uint8Array([0x03])],
]);
// Output: 0xc501c20203

// Deeply nested
const deepNested = Rlp.encodeList([[[new Uint8Array([0x01])]]]);
// Output: 0xc3c2c101

// List with string data
const textEncoder = new TextEncoder();
const withStrings = Rlp.encodeList([
	textEncoder.encode("cat"),
	textEncoder.encode("dog"),
]);
// Output: 0xc88363617483646f67
