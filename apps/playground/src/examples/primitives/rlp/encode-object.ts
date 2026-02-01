import { Bytes, type BytesType, Hex, Rlp } from "@tevm/voltaire";
// Example: Encode objects with schema

// Define schema for encoding
interface Transaction {
	nonce: BytesType;
	gasPrice: BytesType;
	gasLimit: BytesType;
	to: BytesType;
	value: BytesType;
	data: BytesType;
}

// Create transaction object
const tx: Transaction = {
	nonce: Bytes([0x09]),
	gasPrice: Bytes([0x04, 0xa8, 0x17, 0xc8, 0x00]),
	gasLimit: Bytes([0x52, 0x08]),
	to: Bytes.repeat(0x01, 20),
	value: Bytes([0x00]),
	data: Bytes.zero(0),
};

// Encode with schema
const schema: (keyof Transaction)[] = [
	"nonce",
	"gasPrice",
	"gasLimit",
	"to",
	"value",
	"data",
];
const encoded = Rlp.encodeObject(tx, schema);

// Simple object encoding
interface SimpleData {
	id: BytesType;
	value: BytesType;
}

const simple: SimpleData = {
	id: Bytes([0x01]),
	value: Bytes([0x42, 0x43]),
};

const simpleEncoded = Rlp.encodeObject(simple, ["id", "value"]);

// Nested object encoding
interface NestedData {
	header: BytesType;
	items: BytesType[];
}

const nested: NestedData = {
	header: Bytes([0xff]),
	items: [Bytes([0x01]), Bytes([0x02])],
};

const nestedEncoded = Rlp.encodeObject(nested, ["header", "items"]);

// Schema with optional fields (use empty bytes for missing)
interface WithOptional {
	required: BytesType;
	optional: BytesType;
}

const withOptional: WithOptional = {
	required: Bytes([0x42]),
	optional: Bytes.zero(0), // Empty for optional
};

const optionalEncoded = Rlp.encodeObject(withOptional, [
	"required",
	"optional",
]);
