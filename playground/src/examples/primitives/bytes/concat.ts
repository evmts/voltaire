import * as Bytes from "../../../primitives/Bytes/index.js";

// Concatenate multiple byte arrays
const a = Bytes.fromHex("0x1234");
const b = Bytes.fromHex("0x5678");
const c = Bytes.fromHex("0x9abc");

const combined = Bytes.concat(a, b, c);
console.log("Combined:", Bytes.toHex(combined));
console.log("Total size:", Bytes.size(combined), "bytes");

// Concat with strings
const hello = Bytes.fromString("Hello");
const space = Bytes.fromString(" ");
const world = Bytes.fromString("World");

const sentence = Bytes.concat(hello, space, world);
console.log("Sentence:", Bytes.toString(sentence));

// Empty arrays
const empty1 = Bytes.zero(0);
const empty2 = Bytes.fromHex("0x");
const withEmpty = Bytes.concat(a, empty1, b, empty2);
console.log("With empty:", Bytes.toHex(withEmpty));
