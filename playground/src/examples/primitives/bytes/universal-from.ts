import * as Bytes from "../../../primitives/Bytes/index.js";

// Universal constructor handles multiple types

// From Uint8Array
const raw = new Uint8Array([0x12, 0x34, 0x56]);
const fromArray = Bytes.from(raw);
console.log("From Uint8Array:", Bytes.toHex(fromArray));

// From hex string (0x prefix)
const fromHexStr = Bytes.from("0xabcdef");
console.log("From hex string:", Bytes.toHex(fromHexStr));

// From UTF-8 string (no 0x prefix)
const fromUtf8 = Bytes.from("Hello");
console.log("From UTF-8:", Bytes.toString(fromUtf8));

// Auto-detection based on input
const inputs = [new Uint8Array([0xff]), "0x1234", "test"];

console.log("Auto-converted:");
inputs.forEach((input) => {
	const bytes = Bytes.from(input);
	console.log("  Input:", input, "-> Hex:", Bytes.toHex(bytes));
});
