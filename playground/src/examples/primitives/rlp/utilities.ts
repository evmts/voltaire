import * as Hex from "../../../primitives/Hex/index.js";
import * as Rlp from "../../../primitives/RLP/index.js";

// Example: RLP utility functions

// Get encoded length without encoding
const data1 = new Uint8Array([0x01, 0x02, 0x03]);
const length1 = Rlp.getEncodedLength(data1);

const data2 = new Uint8Array(56).fill(0xff);
const length2 = Rlp.getEncodedLength(data2);

// Check if data is list or string
const encoded1 = Rlp.encode(new Uint8Array([0x01, 0x02]));

const encoded2 = Rlp.encode([new Uint8Array([0x01])]);

// Flatten nested structure
const nested = Rlp.from([
	new Uint8Array([0x01]),
	[new Uint8Array([0x02]), new Uint8Array([0x03])],
	[[new Uint8Array([0x04])]],
]);
const flattened = Rlp.flatten(nested);

// Compare RLP data
const data3 = Rlp.from(new Uint8Array([0x01, 0x02, 0x03]));
const data4 = Rlp.from(new Uint8Array([0x01, 0x02, 0x03]));
const data5 = Rlp.from(new Uint8Array([0x01, 0x02, 0x04]));

// Convert to/from JSON
const original = Rlp.from(new Uint8Array([0x01, 0x02, 0x03]));
const json = Rlp.toJSON(original);
const restored = Rlp.fromJSON(json);

// Convert to raw format
const rlpData = Rlp.from([
	new Uint8Array([0x01]),
	new Uint8Array([0x02, 0x03]),
]);
const raw = Rlp.toRaw(rlpData);

// Validate RLP encoding
const valid = Hex.fromHex("0x83010203");
const isValid = Rlp.validate(valid);

const invalid = new Uint8Array([0x83, 0x01]); // Claims 3 bytes, has 1
const isInvalid = Rlp.validate(invalid);

// Get length of encoded data
const encoded = Hex.fromHex("0x83010203");
const dataLength = Rlp.getLength(encoded);
