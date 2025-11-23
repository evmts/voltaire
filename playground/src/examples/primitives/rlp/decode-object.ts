import * as Rlp from "../../../primitives/RLP/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Decode objects with schema

// Define transaction schema
interface Transaction {
	nonce: Uint8Array;
	gasPrice: Uint8Array;
	gasLimit: Uint8Array;
	to: Uint8Array;
	value: Uint8Array;
	data: Uint8Array;
}

// Create and encode transaction
const tx: Transaction = {
	nonce: new Uint8Array([0x09]),
	gasPrice: new Uint8Array([0x04, 0xa8, 0x17, 0xc8, 0x00]),
	gasLimit: new Uint8Array([0x52, 0x08]),
	to: new Uint8Array(20).fill(0x01),
	value: new Uint8Array([0x00]),
	data: new Uint8Array([]),
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
console.log("Decoded nonce:", decoded.nonce);
console.log("Decoded gasPrice:", decoded.gasPrice);
console.log("Decoded to address length:", decoded.to.length);

// Simple object decode
interface SimpleData {
	id: Uint8Array;
	value: Uint8Array;
}

const simpleEncoded = Rlp.encodeObject(
	{ id: new Uint8Array([0x01]), value: new Uint8Array([0x42]) },
	["id", "value"],
);
const simpleDecoded = Rlp.decodeObject<SimpleData>(simpleEncoded, [
	"id",
	"value",
]);
console.log("Simple decoded id:", simpleDecoded.id);
console.log("Simple decoded value:", simpleDecoded.value);

// Nested object decode
interface NestedData {
	header: Uint8Array;
	items: Uint8Array[];
}

const nested: NestedData = {
	header: new Uint8Array([0xff]),
	items: [new Uint8Array([0x01]), new Uint8Array([0x02])],
};
const nestedEncoded = Rlp.encodeObject(nested, ["header", "items"]);
const nestedDecoded = Rlp.decodeObject<NestedData>(nestedEncoded, [
	"header",
	"items",
]);
console.log("Nested header:", nestedDecoded.header);
console.log("Nested items:", nestedDecoded.items);

// Round-trip validation
const original = {
	field1: new Uint8Array([0x01, 0x02]),
	field2: new Uint8Array([0x03, 0x04, 0x05]),
	field3: new Uint8Array([]),
};
const testSchema: (keyof typeof original)[] = ["field1", "field2", "field3"];
const testEncoded = Rlp.encodeObject(original, testSchema);
const testDecoded = Rlp.decodeObject(testEncoded, testSchema);
console.log(
	"Round-trip field1 matches:",
	Hex.toHex(testDecoded.field1) === Hex.toHex(original.field1),
);
console.log(
	"Round-trip field2 matches:",
	Hex.toHex(testDecoded.field2) === Hex.toHex(original.field2),
);
