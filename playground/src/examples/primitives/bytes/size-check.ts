import * as Bytes from "../../../primitives/Bytes/index.js";

// Get byte array size
const small = Bytes.fromHex("0x1234");

const large = Bytes.fromHex(`0x${"00".repeat(32)}`);

// Check if empty
const empty = Bytes.zero(0);

// Size after operations
const a = Bytes.fromHex("0x1234");
const b = Bytes.fromHex("0x5678");
const concat = Bytes.concat(a, b);

const slice = concat.slice(1, 3);

// String sizes (UTF-8 encoding)
const ascii = Bytes.fromString("Hello");

const emoji = Bytes.fromString("🚀");
