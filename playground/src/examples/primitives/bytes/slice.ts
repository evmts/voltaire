import { Bytes } from "voltaire";
// Slice byte arrays
const data = Bytes.fromHex("0x0123456789abcdef");

// Extract portion
const middle = data.slice(2, 6);

// From start position
const fromThree = data.slice(3);

// First N bytes
const first4 = data.slice(0, 4);

// Last N bytes (negative indexing alternative)
const length = Bytes.size(data);
const last4 = data.slice(length - 4);
