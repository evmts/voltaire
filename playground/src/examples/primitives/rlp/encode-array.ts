import * as Rlp from "../../../primitives/RLP/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Encode arrays with encodeArray

// Empty array
const empty = Rlp.encodeArray([]);
console.log("Empty array:", Hex.toHex(empty));
// Output: 0xc0

// Single element
const single = Rlp.encodeArray([new Uint8Array([0x42])]);
console.log("Single element:", Hex.toHex(single));
// Output: 0xc142

// Multiple elements
const multiple = Rlp.encodeArray([
	new Uint8Array([0x01, 0x02]),
	new Uint8Array([0x03, 0x04, 0x05]),
	new Uint8Array([0x06]),
]);
console.log("Multiple elements:", Hex.toHex(multiple));

// Array with empty elements
const withEmpty = Rlp.encodeArray([
	new Uint8Array([]),
	new Uint8Array([0x01]),
	new Uint8Array([]),
]);
console.log("With empty elements:", Hex.toHex(withEmpty));

// Nested arrays
const nested = Rlp.encodeArray([
	new Uint8Array([0x01]),
	[new Uint8Array([0x02]), new Uint8Array([0x03])],
]);
console.log("Nested arrays:", Hex.toHex(nested));

// Deeply nested
const deepNested = Rlp.encodeArray([[[new Uint8Array([0x01])]]]);
console.log("Deeply nested:", Hex.toHex(deepNested));

// Array with mixed sizes
const mixed = Rlp.encodeArray([
	new Uint8Array([0x01]),
	new Uint8Array(55).fill(0x02),
	new Uint8Array(100).fill(0x03),
]);
console.log("Mixed sizes - total length:", mixed.length);

// Large array
const large = Rlp.encodeArray(
	Array.from({ length: 100 }, (_, i) => new Uint8Array([i % 256])),
);
console.log("100 elements - total length:", large.length);
