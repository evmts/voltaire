import * as Hex from "../../../primitives/Hex/index.js";

// Compare hex values for equality
const hex1 = Hex.from("0xdeadbeef");
const hex2 = Hex.from("0xdeadbeef");
const hex3 = Hex.from("0xDEADBEEF"); // Different case
const hex4 = Hex.from("deadbeef"); // No prefix

console.log("Hex 1:", hex1.toString());
console.log("Hex 2:", hex2.toString());
console.log("hex1 === hex2:", hex1.equals(hex2));

// Case-insensitive comparison
console.log("\nHex 3 (uppercase):", hex3.toString());
console.log("hex1 === hex3:", hex1.equals(hex3));

// Prefix handling
console.log("\nHex 4 (no prefix):", hex4.toString());
console.log("hex1 === hex4:", hex1.equals(hex4));

// Different values
const different = Hex.from("0xcafebabe");
console.log("\nDifferent:", different.toString());
console.log("hex1 === different:", hex1.equals(different));

// Zero comparisons
const zero1 = Hex.from("0x00");
const zero2 = Hex.from("0x0000");
console.log("\nZero 1:", zero1.toString());
console.log("Zero 2:", zero2.toString());
console.log("zero1 === zero2:", zero1.equals(zero2));
