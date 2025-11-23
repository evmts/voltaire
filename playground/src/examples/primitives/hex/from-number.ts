import * as Hex from "../../../primitives/Hex/index.js";

// Convert numbers to hex
const num1 = 255;
const hex1 = Hex.fromNumber(num1);
console.log("Number:", num1);
console.log("Hex:", hex1);
console.log("Size:", Hex.size(hex1), "bytes");

// Larger numbers
const num2 = 1000000;
const hex2 = Hex.fromNumber(num2);
console.log("\nNumber:", num2);
console.log("Hex:", hex2);

// Fixed size padding
const num3 = 42;
const hex3_32 = Hex.fromNumber(num3, 32);
console.log("\nNumber:", num3);
console.log("Hex (32 bytes):", hex3_32);
console.log("Size:", Hex.size(hex3_32), "bytes");

// Zero
const zero = Hex.fromNumber(0);
console.log("\nZero:", zero);

// Max safe integer
const maxSafe = Number.MAX_SAFE_INTEGER;
const hexMax = Hex.fromNumber(maxSafe);
console.log("\nMax safe integer:", maxSafe);
console.log("Hex:", hexMax);
