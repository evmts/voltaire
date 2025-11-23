import * as Bytes from "../../../primitives/Bytes/index.js";

// Compare byte arrays for equality
const a = Bytes.fromHex("0x1234");
const b = Bytes.fromHex("0x1234");
const c = Bytes.fromHex("0x5678");

console.log("a == b:", Bytes.equals(a, b));
console.log("a == c:", Bytes.equals(a, c));

// Different lengths are not equal
const short = Bytes.fromHex("0x12");
const long = Bytes.fromHex("0x1234");
console.log("Different lengths:", Bytes.equals(short, long));

// Empty bytes
const empty1 = Bytes.zero(0);
const empty2 = Bytes.fromHex("0x");
console.log("Empty bytes equal:", Bytes.equals(empty1, empty2));

// String equality check
const str1 = Bytes.fromString("test");
const str2 = Bytes.fromString("test");
const str3 = Bytes.fromString("Test");
console.log("String bytes equal:", Bytes.equals(str1, str2));
console.log("Case sensitive:", Bytes.equals(str1, str3));
