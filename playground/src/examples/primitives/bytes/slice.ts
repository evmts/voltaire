import * as Bytes from "../../../primitives/Bytes/index.js";

// Slice byte arrays
const data = Bytes.fromHex("0x0123456789abcdef");
console.log("Original:", Bytes.toHex(data));

// Extract portion
const middle = Bytes.slice(data, 2, 6);
console.log("Slice [2:6]:", Bytes.toHex(middle));

// From start position
const fromThree = Bytes.slice(data, 3);
console.log("Slice [3:]:", Bytes.toHex(fromThree));

// First N bytes
const first4 = Bytes.slice(data, 0, 4);
console.log("First 4:", Bytes.toHex(first4));

// Last N bytes (negative indexing alternative)
const length = Bytes.size(data);
const last4 = Bytes.slice(data, length - 4);
console.log("Last 4:", Bytes.toHex(last4));
