import { Hex, Rlp } from "voltaire";
// Example: Encode objects with schema

// Define schema for encoding
interface Transaction {
	nonce: Uint8Array;
	gasPrice: Uint8Array;
	gasLimit: Uint8Array;
	to: Uint8Array;
	value: Uint8Array;
	data: Uint8Array;
}

// Create transaction object
const tx: Transaction = {
	nonce: new Uint8Array([0x09]),
	gasPrice: new Uint8Array([0x04, 0xa8, 0x17, 0xc8, 0x00]),
	gasLimit: new Uint8Array([0x52, 0x08]),
	to: new Uint8Array(20).fill(0x01),
	value: new Uint8Array([0x00]),
	data: new Uint8Array([]),
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
	id: Uint8Array;
	value: Uint8Array;
}

const simple: SimpleData = {
	id: new Uint8Array([0x01]),
	value: new Uint8Array([0x42, 0x43]),
};

const simpleEncoded = Rlp.encodeObject(simple, ["id", "value"]);

// Nested object encoding
interface NestedData {
	header: Uint8Array;
	items: Uint8Array[];
}

const nested: NestedData = {
	header: new Uint8Array([0xff]),
	items: [new Uint8Array([0x01]), new Uint8Array([0x02])],
};

const nestedEncoded = Rlp.encodeObject(nested, ["header", "items"]);

// Schema with optional fields (use empty bytes for missing)
interface WithOptional {
	required: Uint8Array;
	optional: Uint8Array;
}

const withOptional: WithOptional = {
	required: new Uint8Array([0x42]),
	optional: new Uint8Array([]), // Empty for optional
};

const optionalEncoded = Rlp.encodeObject(withOptional, [
	"required",
	"optional",
]);
