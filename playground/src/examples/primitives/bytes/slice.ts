import * as Bytes from "../../../primitives/Bytes/index.js";

// Slice byte arrays
const data = Bytes.fromHex("0x0123456789abcdef");
console.log("Original:", data.toHex());

// Extract portion
const middle = data.slice( 2, 6);
console.log("Slice [2:6]:", middle.toHex());

// From start position
const fromThree = data.slice( 3);
console.log("Slice [3:]:", fromThree.toHex());

// First N bytes
const first4 = data.slice( 0, 4);
console.log("First 4:", first4.toHex());

// Last N bytes (negative indexing alternative)
const length = Bytes.size(data);
const last4 = data.slice( length - 4);
console.log("Last 4:", last4.toHex());
