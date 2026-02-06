import { Bytes, Hex, Rlp } from "@tevm/voltaire";
// Example: Encode arrays with encodeArray

// Empty array
const empty = Rlp.encodeArray([]);
// Output: 0xc0

// Single element
const single = Rlp.encodeArray([Bytes([0x42])]);
// Output: 0xc142

// Multiple elements
const multiple = Rlp.encodeArray([
	Bytes([0x01, 0x02]),
	Bytes([0x03, 0x04, 0x05]),
	Bytes([0x06]),
]);

// Array with empty elements
const withEmpty = Rlp.encodeArray([
	Bytes.zero(0),
	Bytes([0x01]),
	Bytes.zero(0),
]);

// Nested arrays
const nested = Rlp.encodeArray([Bytes([0x01]), [Bytes([0x02]), Bytes([0x03])]]);

// Deeply nested
const deepNested = Rlp.encodeArray([[[Bytes([0x01])]]]);

// Array with mixed sizes
const mixed = Rlp.encodeArray([
	Bytes([0x01]),
	Bytes.repeat(0x02, 55),
	Bytes.repeat(0x03, 100),
]);

// Large array
const large = Rlp.encodeArray(
	Array.from({ length: 100 }, (_, i) => Bytes([i % 256])),
);
