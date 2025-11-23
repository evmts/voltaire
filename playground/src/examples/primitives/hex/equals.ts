import * as Hex from "../../../primitives/Hex/index.js";

// Compare hex values for equality
const hex1 = "0xdeadbeef";
const hex2 = "0xdeadbeef";
const hex3 = "0xDEADBEEF"; // Different case
const hex4 = "deadbeef"; // No prefix

console.log("Hex 1:", hex1);
console.log("Hex 2:", hex2);
console.log("hex1 === hex2:", Hex.equals(hex1, hex2));

// Case-insensitive comparison
console.log("\nHex 3 (uppercase):", hex3);
console.log("hex1 === hex3:", Hex.equals(hex1, hex3));

// Prefix handling
console.log("\nHex 4 (no prefix):", hex4);
console.log("hex1 === hex4:", Hex.equals(hex1, hex4));

// Different values
const different = "0xcafebabe";
console.log("\nDifferent:", different);
console.log("hex1 === different:", Hex.equals(hex1, different));

// Zero comparisons
const zero1 = "0x00";
const zero2 = "0x0000";
console.log("\nZero 1:", zero1);
console.log("Zero 2:", zero2);
console.log("zero1 === zero2:", Hex.equals(zero1, zero2));
