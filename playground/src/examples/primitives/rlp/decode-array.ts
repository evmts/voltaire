import * as Hex from "../../../primitives/Hex/index.js";
import * as Rlp from "../../../primitives/RLP/index.js";

// Example: Decode arrays with schema

// Decode to typed array
const encoded1 = Hex.fromHex("0xc20102");
const decoded1 = Rlp.decodeArray(encoded1);
// Output: [Uint8Array([0x01]), Uint8Array([0x02])]

// Decode empty array
const encoded2 = Hex.fromHex("0xc0");
const decoded2 = Rlp.decodeArray(encoded2);
// Output: 0

// Decode with nested arrays
const encoded3 = Hex.fromHex("0xc501c20203");
const decoded3 = Rlp.decodeArray(encoded3);

// Decode transaction-like structure
const txHex = Rlp.encode([
	new Uint8Array([0x09]),
	new Uint8Array([0x04, 0xa8, 0x17, 0xc8, 0x00]),
	new Uint8Array([0x52, 0x08]),
	new Uint8Array(20).fill(0x01),
	new Uint8Array([0x00]),
	new Uint8Array([]),
]);
const txDecoded = Rlp.decodeArray(txHex);

// Decode with validation
try {
	const invalid = new Uint8Array([0xc3, 0x01]); // Claims 3 bytes, has 1
	const result = Rlp.decodeArray(invalid);
} catch (error) {}

// Round-trip with decodeArray
const original = [
	new Uint8Array([0x01, 0x02]),
	new Uint8Array([0x03, 0x04, 0x05]),
];
const encoded = Rlp.encodeArray(original);
const decoded = Rlp.decodeArray(encoded);
