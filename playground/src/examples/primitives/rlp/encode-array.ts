import { Hex, Rlp } from "voltaire";
// Example: Encode arrays with encodeArray

// Empty array
const empty = Rlp.encodeArray([]);
// Output: 0xc0

// Single element
const single = Rlp.encodeArray([new Uint8Array([0x42])]);
// Output: 0xc142

// Multiple elements
const multiple = Rlp.encodeArray([
	new Uint8Array([0x01, 0x02]),
	new Uint8Array([0x03, 0x04, 0x05]),
	new Uint8Array([0x06]),
]);

// Array with empty elements
const withEmpty = Rlp.encodeArray([
	new Uint8Array([]),
	new Uint8Array([0x01]),
	new Uint8Array([]),
]);

// Nested arrays
const nested = Rlp.encodeArray([
	new Uint8Array([0x01]),
	[new Uint8Array([0x02]), new Uint8Array([0x03])],
]);

// Deeply nested
const deepNested = Rlp.encodeArray([[[new Uint8Array([0x01])]]]);

// Array with mixed sizes
const mixed = Rlp.encodeArray([
	new Uint8Array([0x01]),
	new Uint8Array(55).fill(0x02),
	new Uint8Array(100).fill(0x03),
]);

// Large array
const large = Rlp.encodeArray(
	Array.from({ length: 100 }, (_, i) => new Uint8Array([i % 256])),
);
