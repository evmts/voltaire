import * as Hex from "../../../primitives/Hex/index.js";

// Validate hex strings
const valid1 = "0x1234";
const valid2 = "0xdeadbeef";
const valid3 = "abcdef"; // No prefix is valid

console.log("Valid hex 1:", valid1);
console.log("Is valid:", Hex.isHex(valid1));

console.log("\nValid hex 2:", valid2);
console.log("Is valid:", Hex.isHex(valid2));

console.log("\nValid hex 3 (no prefix):", valid3);
console.log("Is valid:", Hex.isHex(valid3));

// Invalid hex
const invalid1 = "0xghij"; // Invalid characters
const invalid2 = "0x123"; // Odd length
const invalid3 = "not hex";

console.log("\nInvalid hex 1:", invalid1);
console.log("Is valid:", Hex.isHex(invalid1));

console.log("\nInvalid hex 2 (odd length):", invalid2);
console.log("Is valid:", Hex.isHex(invalid2));

console.log("\nInvalid hex 3:", invalid3);
console.log("Is valid:", Hex.isHex(invalid3));

// Size validation
const hex32 = "0x" + "00".repeat(32);
console.log("\n32-byte hex:", hex32);
console.log("Is 32 bytes:", Hex.isSized(hex32, 32));
console.log("Is 16 bytes:", Hex.isSized(hex32, 16));

// Assert size (throws on mismatch)
try {
	Hex.assertSize(hex32, 32);
	console.log("\nSize assertion passed for 32 bytes");
} catch (err) {
	console.log("Error:", err.message);
}

try {
	Hex.assertSize(hex32, 16);
	console.log("\nSize assertion passed for 16 bytes");
} catch (err) {
	console.log("Error: Size mismatch detected");
}
