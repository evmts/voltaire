import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Universal from() constructor handles multiple input types

// 1. Hash hex string (with 0x prefix)
const hexHash = Keccak256.from("0xdeadbeef");

// 2. Hash UTF-8 string (without 0x prefix)
const stringHash = Keccak256.from("Hello");

// 3. Hash raw bytes
const bytes = new Uint8Array([1, 2, 3]);
const bytesHash = Keccak256.from(bytes);

// Compare with specific methods
const explicitHex = Keccak256.hashHex("0xdeadbeef");
const explicitString = Keccak256.hashString("Hello");
const explicitBytes = Keccak256.hash(bytes);
