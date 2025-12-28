import { Hex, Bytes } from "@tevm/voltaire";
// Convert Bytes to hex string
const bytes = Bytes([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);
const hex = Hex.fromBytes(bytes);

// Zero bytes
const zeros = Bytes.zero(32);
const zeroHex = Hex.fromBytes(zeros);

// Single byte
const single = Hex.fromBytes(Bytes([0xff]));
