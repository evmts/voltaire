import { Bytes } from "@tevm/voltaire";
// Compare byte arrays for equality
const a = Bytes.fromHex("0x1234");
const b = Bytes.fromHex("0x1234");
const c = Bytes.fromHex("0x5678");

// Different lengths are not equal
const short = Bytes.fromHex("0x12");
const long = Bytes.fromHex("0x1234");

// Empty bytes
const empty1 = Bytes.zero(0);
const empty2 = Bytes.fromHex("0x");

// String equality check
const str1 = Bytes.fromString("test");
const str2 = Bytes.fromString("test");
const str3 = Bytes.fromString("Test");
