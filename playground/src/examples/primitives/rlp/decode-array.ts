import * as Rlp from "../../../primitives/RLP/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Decode arrays with schema

// Decode to typed array
const encoded1 = Hex.fromHex("0xc20102");
const decoded1 = Rlp.decodeArray(encoded1);
console.log("Decoded array:", decoded1);
// Output: [Uint8Array([0x01]), Uint8Array([0x02])]

// Decode empty array
const encoded2 = Hex.fromHex("0xc0");
const decoded2 = Rlp.decodeArray(encoded2);
console.log("Empty array length:", decoded2.length);
// Output: 0

// Decode with nested arrays
const encoded3 = Hex.fromHex("0xc501c20203");
const decoded3 = Rlp.decodeArray(encoded3);
console.log("Nested array:", decoded3);
console.log("First item:", decoded3[0]);
console.log("Second item (nested):", decoded3[1]);

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
console.log("Transaction fields:", txDecoded.length);
console.log("Nonce:", txDecoded[0]);
console.log("GasPrice:", txDecoded[1]);
console.log("GasLimit:", txDecoded[2]);

// Decode with validation
try {
	const invalid = new Uint8Array([0xc3, 0x01]); // Claims 3 bytes, has 1
	const result = Rlp.decodeArray(invalid);
	console.log("Should not reach here");
} catch (error) {
	console.log(
		"Caught decoding error:",
		error instanceof Error ? error.message : "Unknown error",
	);
}

// Round-trip with decodeArray
const original = [
	new Uint8Array([0x01, 0x02]),
	new Uint8Array([0x03, 0x04, 0x05]),
];
const encoded = Rlp.encodeArray(original);
const decoded = Rlp.decodeArray(encoded);
console.log("Round-trip matches:", decoded.length === original.length);
