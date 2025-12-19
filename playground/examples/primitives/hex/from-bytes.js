// Hex: Convert Uint8Array to hex string
import * as Hex from "../../../../src/primitives/Hex/index.js";

const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);
const hex = Hex.fromBytes(bytes);

// Zero bytes
const zeros = new Uint8Array(32);
const zeroHex = Hex.fromBytes(zeros);

// Single byte
const single = Hex.fromBytes(new Uint8Array([0xff]));
