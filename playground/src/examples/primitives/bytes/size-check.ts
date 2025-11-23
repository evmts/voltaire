import * as Bytes from "../../../primitives/Bytes/index.js";

// Get byte array size
const small = Bytes.fromHex("0x1234");
console.log("Small size:", Bytes.size(small), "bytes");

const large = Bytes.fromHex("0x" + "00".repeat(32));
console.log("Large size:", Bytes.size(large), "bytes");

// Check if empty
const empty = Bytes.zero(0);
console.log("Empty size:", Bytes.size(empty));
console.log("Is empty:", Bytes.isEmpty(empty));

// Size after operations
const a = Bytes.fromHex("0x1234");
const b = Bytes.fromHex("0x5678");
const concat = Bytes.concat(a, b);
console.log("Concat size:", Bytes.size(concat), "bytes");

const slice = Bytes.slice(concat, 1, 3);
console.log("Slice size:", Bytes.size(slice), "bytes");

// String sizes (UTF-8 encoding)
const ascii = Bytes.fromString("Hello");
console.log("ASCII string:", Bytes.size(ascii), "bytes");

const emoji = Bytes.fromString("🚀");
console.log("Emoji:", Bytes.size(emoji), "bytes");
