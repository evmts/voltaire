import * as Hex from "../../../primitives/Hex/index.js";
import * as Rlp from "../../../primitives/RLP/index.js";

// Example: Batch encoding and decoding

// Encode multiple items in batch
const items = [
	new Uint8Array([0x01]),
	new Uint8Array([0x02, 0x03]),
	new Uint8Array([0x04, 0x05, 0x06]),
];

const batchEncoded = Rlp.encodeBatch(items);
// Each item encoded separately: ['0x01', '0x820203', '0x83040506']

// Decode multiple items in batch
const encodedItems = [
	Hex.fromHex("0x01"),
	Hex.fromHex("0x820203"),
	Hex.fromHex("0x83040506"),
];

const batchDecoded = Rlp.decodeBatch(encodedItems);

// Round-trip batch operations
const original = [
	new Uint8Array([0xff]),
	new Uint8Array([0xaa, 0xbb]),
	new Uint8Array([]),
	new Uint8Array(55).fill(0x42),
];

const encoded = Rlp.encodeBatch(original);

const decoded = Rlp.decodeBatch(encoded);

// Batch encode with lists
const mixedItems = [
	new Uint8Array([0x01]),
	[new Uint8Array([0x02]), new Uint8Array([0x03])],
	new Uint8Array([0x04]),
];

const mixedEncoded = Rlp.encodeBatch(mixedItems);

// Process large batch
const largeItems = Array.from(
	{ length: 1000 },
	(_, i) => new Uint8Array([i % 256]),
);

const largeEncoded = Rlp.encodeBatch(largeItems);

const largeDecoded = Rlp.decodeBatch(largeEncoded);
