import { Hex, Rlp, Bytes, type BytesType } from "@tevm/voltaire";
// Example: Decode objects with schema

// Define transaction schema
interface Transaction {
	nonce: BytesType;
	gasPrice: BytesType;
	gasLimit: BytesType;
	to: BytesType;
	value: BytesType;
	data: BytesType;
}

// Create and encode transaction
const tx: Transaction = {
	nonce: Bytes([0x09]),
	gasPrice: Bytes([0x04, 0xa8, 0x17, 0xc8, 0x00]),
	gasLimit: Bytes([0x52, 0x08]),
	to: Bytes.repeat(0x01, 20),
	value: Bytes([0x00]),
	data: Bytes.zero(0),
};

const schema: (keyof Transaction)[] = [
	"nonce",
	"gasPrice",
	"gasLimit",
	"to",
	"value",
	"data",
];
const encoded = Rlp.encodeObject(tx, schema);

// Decode back to object
const decoded = Rlp.decodeObject<Transaction>(encoded, schema);

// Simple object decode
interface SimpleData {
	id: BytesType;
	value: BytesType;
}

const simpleEncoded = Rlp.encodeObject(
	{ id: Bytes([0x01]), value: Bytes([0x42]) },
	["id", "value"],
);
const simpleDecoded = Rlp.decodeObject<SimpleData>(simpleEncoded, [
	"id",
	"value",
]);

// Nested object decode
interface NestedData {
	header: BytesType;
	items: BytesType[];
}

const nested: NestedData = {
	header: Bytes([0xff]),
	items: [Bytes([0x01]), Bytes([0x02])],
};
const nestedEncoded = Rlp.encodeObject(nested, ["header", "items"]);
const nestedDecoded = Rlp.decodeObject<NestedData>(nestedEncoded, [
	"header",
	"items",
]);

// Round-trip validation
const original = {
	field1: Bytes([0x01, 0x02]),
	field2: Bytes([0x03, 0x04, 0x05]),
	field3: Bytes.zero(0),
};
const testSchema: (keyof typeof original)[] = ["field1", "field2", "field3"];
const testEncoded = Rlp.encodeObject(original, testSchema);
const testDecoded = Rlp.decodeObject(testEncoded, testSchema);
