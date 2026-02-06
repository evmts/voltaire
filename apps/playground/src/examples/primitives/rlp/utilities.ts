import { Bytes, Hex, Rlp } from "@tevm/voltaire";
// Example: RLP utility functions

// Get encoded length without encoding
const data1 = Bytes([0x01, 0x02, 0x03]);
const length1 = Rlp.getEncodedLength(data1);

const data2 = Bytes.repeat(0xff, 56);
const length2 = Rlp.getEncodedLength(data2);

// Check if data is list or string
const encoded1 = Rlp.encode(Bytes([0x01, 0x02]));

const encoded2 = Rlp.encode([Bytes([0x01])]);

// Flatten nested structure
const nested = Rlp([
	Bytes([0x01]),
	[Bytes([0x02]), Bytes([0x03])],
	[[Bytes([0x04])]],
]);
const flattened = Rlp.flatten(nested);

// Compare RLP data
const data3 = Rlp(Bytes([0x01, 0x02, 0x03]));
const data4 = Rlp(Bytes([0x01, 0x02, 0x03]));
const data5 = Rlp(Bytes([0x01, 0x02, 0x04]));

// Convert to/from JSON
const original = Rlp(Bytes([0x01, 0x02, 0x03]));
const json = Rlp.toJSON(original);
const restored = Rlp.fromJSON(json);

// Convert to raw format
const rlpData = Rlp([Bytes([0x01]), Bytes([0x02, 0x03])]);
const raw = Rlp.toRaw(rlpData);

// Validate RLP encoding
const valid = Hex.fromHex("0x83010203");
const isValid = Rlp.validate(valid);

const invalid = Bytes([0x83, 0x01]); // Claims 3 bytes, has 1
const isInvalid = Rlp.validate(invalid);

// Get length of encoded data
const encoded = Hex.fromHex("0x83010203");
const dataLength = Rlp.getLength(encoded);
