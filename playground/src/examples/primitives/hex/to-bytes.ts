import * as Hex from "../../../primitives/Hex/index.js";

// Convert hex string to Uint8Array
const hex = "0x123456789abcdef0";
const bytes = Hex.toBytes(hex);
console.log("Hex:", hex);
console.log("Bytes:", bytes);
console.log("Bytes length:", bytes.length);

// With prefix and without
const withPrefix = "0xdeadbeef";
const withoutPrefix = "deadbeef";
console.log("\nWith prefix:", Hex.toBytes(withPrefix));
console.log("Without prefix:", Hex.toBytes(withoutPrefix));

// Round-trip conversion
const original = new Uint8Array([1, 2, 3, 4, 5]);
const hexString = Hex.fromBytes(original);
const restored = Hex.toBytes(hexString);
console.log("\nOriginal bytes:", original);
console.log("Hex representation:", hexString);
console.log("Restored bytes:", restored);
console.log(
	"Arrays equal:",
	original.every((b, i) => b === restored[i]),
);
