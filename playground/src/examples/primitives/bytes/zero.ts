import * as Bytes from "../../../primitives/Bytes/index.js";

// Create zero-filled byte arrays
const zeros8 = Bytes.zero(8);
console.log("8 zeros:", zeros8.toHex());
console.log("Size:", Bytes.size(zeros8));

// Different sizes
const zeros32 = Bytes.zero(32);
console.log("32 zeros:", zeros32.toHex());

const zeros1 = Bytes.zero(1);
console.log("1 zero:", zeros1.toHex());

// Empty (0 bytes)
const empty = Bytes.zero(0);
console.log("Empty bytes:", empty.toHex());
console.log("Is empty:", Bytes.isEmpty(empty));

// Use for padding or initialization
const data = Bytes.fromHex("0x1234");
const padded = Bytes.concat(Bytes.zero(2), data);
console.log("Padded with zeros:", padded.toHex());
