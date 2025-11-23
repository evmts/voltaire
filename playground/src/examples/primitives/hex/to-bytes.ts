import * as Hex from "../../../primitives/Hex/index.js";

// Convert hex string to Uint8Array
const hex = "0x123456789abcdef0";
const bytes = hex.toBytes();
console.log("Hex:", hex);
console.log("Bytes:", bytes);
console.log("Bytes length:", bytes.length);

// With prefix and without
const withPrefix = "0xdeadbeef";
const withoutPrefix = "deadbeef";
console.log("\nWith prefix:", withPrefix.toBytes());
console.log("Without prefix:", withoutPrefix.toBytes());

// Round-trip conversion
const original = new Uint8Array([1, 2, 3, 4, 5]);
const hexString = Hex.fromBytes(original);
const restored = hexString.toBytes();
console.log("\nOriginal bytes:", original);
console.log("Hex representation:", hexString);
console.log("Restored bytes:", restored);
console.log(
	"Arrays equal:",
	original.every((b, i) => b === restored[i]),
);
