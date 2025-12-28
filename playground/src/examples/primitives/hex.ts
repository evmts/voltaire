import { Hex, Bytes } from "@tevm/voltaire";

// === Hex Creation ===
// From string
const hex1 = Hex("0x1234567890abcdef");
console.log("Hex from string:", hex1);

// From bytes
const bytes = Bytes([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);
const hexFromBytes = bytes.toHex();
console.log("Hex from bytes:", hexFromBytes);

// From number/bigint
const hexFromNumber = Hex.fromNumber(255);
const hexFromBigInt = Hex.fromBigInt(1000000000000000000n);
console.log("From number:", hexFromNumber);
console.log("From bigint:", hexFromBigInt);

// From boolean
const hexTrue = Hex.fromBoolean(true);
const hexFalse = Hex.fromBoolean(false);
console.log("True:", hexTrue, "False:", hexFalse);

// === Conversions ===
console.log("To bytes:", Hex.toBytes("0x1234"));
console.log("To number:", Hex.toNumber("0xff"));
console.log("To bigint:", Hex.toBigInt("0xde0b6b3a7640000"));
console.log("To boolean:", Hex.toBoolean("0x01"));

// === String Operations ===
// Concatenation
const concat = Hex.concat("0x1234", "0x5678", "0x9abc");
console.log("Concatenated:", concat);

// Slicing
const sliced = Hex.slice("0x1234567890abcdef", 2, 6);
console.log("Sliced [2:6]:", sliced);

// Padding
const padLeft = Hex.padLeft("0x1234", 8);
const padRight = Hex.padRight("0x1234", 8);
console.log("Pad left:", padLeft);
console.log("Pad right:", padRight);

// Trimming
const trimLeft = Hex.trimLeft("0x00001234");
const trimRight = Hex.trimRight("0x12340000");
console.log("Trim left:", trimLeft);
console.log("Trim right:", trimRight);

// === Comparison ===
console.log("Equals:", Hex.equals("0x1234", "0x1234"));
console.log("Size:", Hex.size("0x1234567890")); // in bytes

// === Utilities ===
const random = Hex.random(32);
console.log("Random 32 bytes:", random);

const zero = Hex.zero(20);
console.log("Zero 20 bytes:", zero);

// XOR operation
const xored = Hex.xor("0xff00", "0x00ff");
console.log("XOR result:", xored);

// Validation
console.log("Is valid:", Hex.isValid("0x1234"));
console.log("Is valid:", Hex.isValid("not hex"));
