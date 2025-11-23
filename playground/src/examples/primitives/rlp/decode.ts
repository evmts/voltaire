import * as Rlp from "../../../primitives/RLP/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Decode RLP-encoded data

// Decode single byte
const encoded1 = new Uint8Array([0x42]);
const decoded1 = Rlp.decode(encoded1);
console.log("Single byte:", decoded1.data);
// Output: { type: 'bytes', value: Uint8Array([0x42]) }

// Decode empty bytes
const encoded2 = new Uint8Array([0x80]);
const decoded2 = Rlp.decode(encoded2);
console.log("Empty bytes:", decoded2.data);
// Output: { type: 'bytes', value: Uint8Array([]) }

// Decode short string
const encoded3 = Hex.fromHex("0x83646f67"); // "dog"
const decoded3 = Rlp.decode(encoded3);
if (decoded3.data.type === "bytes") {
	const text = new TextDecoder().decode(decoded3.data.value);
	console.log("Decoded string:", text);
	// Output: dog
}

// Decode list
const encoded4 = Hex.fromHex("0xc20102");
const decoded4 = Rlp.decode(encoded4);
console.log("List:", decoded4.data);
// Output: { type: 'list', value: [...] }

// Decode nested list
const encoded5 = Hex.fromHex("0xc501c20203");
const decoded5 = Rlp.decode(encoded5);
console.log("Nested list type:", decoded5.data.type);
if (decoded5.data.type === "list") {
	console.log("List items:", decoded5.data.value.length);
	console.log("Second item type:", decoded5.data.value[1]?.type);
}

// Decode with remainder (stream mode)
const stream = new Uint8Array([0x01, 0x02, 0x03]);
const result = Rlp.decode(stream, true); // stream mode = true
console.log("Decoded first:", result.data);
console.log("Remainder:", result.remainder);
// Decodes first byte, leaves [0x02, 0x03] as remainder

// Round-trip encoding/decoding
const original = [new Uint8Array([0x01]), new Uint8Array([0x02, 0x03])];
const encoded = Rlp.encode(original);
const decoded = Rlp.decode(encoded);
console.log("Round-trip successful:", decoded.data.type === "list");
