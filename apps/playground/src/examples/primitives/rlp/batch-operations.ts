import { Bytes, Hex, Rlp } from "@tevm/voltaire";
// Example: Batch encoding and decoding

// Encode multiple items in batch
const items = [Bytes([0x01]), Bytes([0x02, 0x03]), Bytes([0x04, 0x05, 0x06])];

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
	Bytes([0xff]),
	Bytes([0xaa, 0xbb]),
	Bytes.zero(0),
	Bytes.repeat(0x42, 55),
];

const encoded = Rlp.encodeBatch(original);

const decoded = Rlp.decodeBatch(encoded);

// Batch encode with lists
const mixedItems = [
	Bytes([0x01]),
	[Bytes([0x02]), Bytes([0x03])],
	Bytes([0x04]),
];

const mixedEncoded = Rlp.encodeBatch(mixedItems);

// Process large batch
const largeItems = Array.from({ length: 1000 }, (_, i) => Bytes([i % 256]));

const largeEncoded = Rlp.encodeBatch(largeItems);

const largeDecoded = Rlp.decodeBatch(largeEncoded);
