import * as Bytes from "../../../primitives/Bytes/index.js";

// Create independent copy
const original = Bytes.fromHex("0x1234");
const copy = Bytes.clone(original);

console.log("Original:", original.toHex());
console.log("Copy:", copy.toHex());
console.log("Equal:", original.equals(copy));

// Modify original - copy unaffected
original[0] = 0xff;
console.log("After modifying original:");
console.log("  Original:", original.toHex());
console.log("  Copy:", copy.toHex());
console.log("  Still equal:", original.equals(copy));

// Clone for safe mutations
const base = Bytes.fromString("Hello");
const mutation1 = Bytes.clone(base);
const mutation2 = Bytes.clone(base);

console.log(
	"Independent clones:",
	Bytes.toString(base),
	Bytes.toString(mutation1),
	Bytes.toString(mutation2),
);
