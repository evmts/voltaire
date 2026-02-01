import { Bytes, Hex, Rlp } from "@tevm/voltaire";
// Example: Decode arrays with schema

// Decode to typed array
const encoded1 = Hex.fromHex("0xc20102");
const decoded1 = Rlp.decodeArray(encoded1);
// Output: [Bytes([0x01]), Bytes([0x02])]

// Decode empty array
const encoded2 = Hex.fromHex("0xc0");
const decoded2 = Rlp.decodeArray(encoded2);
// Output: 0

// Decode with nested arrays
const encoded3 = Hex.fromHex("0xc501c20203");
const decoded3 = Rlp.decodeArray(encoded3);

// Decode transaction-like structure
const txHex = Rlp.encode([
	Bytes([0x09]),
	Bytes([0x04, 0xa8, 0x17, 0xc8, 0x00]),
	Bytes([0x52, 0x08]),
	Bytes.repeat(0x01, 20),
	Bytes([0x00]),
	Bytes.zero(0),
]);
const txDecoded = Rlp.decodeArray(txHex);

// Decode with validation
try {
	const invalid = Bytes([0xc3, 0x01]); // Claims 3 bytes, has 1
	const result = Rlp.decodeArray(invalid);
} catch (error) {}

// Round-trip with decodeArray
const original = [Bytes([0x01, 0x02]), Bytes([0x03, 0x04, 0x05])];
const encoded = Rlp.encodeArray(original);
const decoded = Rlp.decodeArray(encoded);
