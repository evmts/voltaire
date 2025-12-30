import { Bytes, Hex } from "@tevm/voltaire";

// === Hex Creation ===
// From string
const hex1 = Hex("0x1234567890abcdef");

// From bytes
const bytes = Bytes([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);
const hexFromBytes = bytes.toHex();

// From number/bigint
const hexFromNumber = Hex.fromNumber(255);
const hexFromBigInt = Hex.fromBigInt(1000000000000000000n);

// From boolean
const hexTrue = Hex.fromBoolean(true);
const hexFalse = Hex.fromBoolean(false);

// === String Operations ===
// Concatenation
const concat = Hex.concat("0x1234", "0x5678", "0x9abc");

// Slicing
const sliced = Hex.slice("0x1234567890abcdef", 2, 6);

// Padding (left-pads with zeros)
const padded = Hex.pad("0x1234", 8);
const padRight = Hex.padRight("0x1234", 8);

// Trimming (removes leading zeros)
const trimmed = Hex.trim("0x00001234");

// === Utilities ===
const random = Hex.random(32);

const zero = Hex.zero(20);

// XOR operation
const xored = Hex.xor("0xff00", "0x00ff");
