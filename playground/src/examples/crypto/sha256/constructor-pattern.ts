import { Hex, SHA256 } from "voltaire";
// 1. from() - Universal constructor (accepts Uint8Array, hex, or string)
const fromBytes = SHA256.from(new Uint8Array([1, 2, 3]));

// 2. fromString() - Type-safe string constructor
const fromString = SHA256.fromString("Hello, World!");

// 3. fromHex() - Type-safe hex constructor
const fromHex = SHA256.fromHex("0xdeadbeef");

// hash() - Hash raw bytes
const hashBytes = SHA256.hash(new Uint8Array([1, 2, 3]));

// hashString() - Hash UTF-8 string
const hashStr = SHA256.hashString("Hello, World!");

// hashHex() - Hash hex string
const hashHex = SHA256.hashHex("0xdeadbeef");
