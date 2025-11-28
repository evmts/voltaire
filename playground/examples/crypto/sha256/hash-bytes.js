// SHA256: Hash raw byte arrays
import * as SHA256 from "../../../../src/crypto/SHA256/index.js";
import * as Hex from "../../../../src/primitives/Hex/index.js";

const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
const hash = SHA256.hash(bytes);

console.log("Input bytes:", Array.from(bytes));
console.log("Hash (hex):", Hex.fromBytes(hash));
console.log("Hash length:", hash.length, "bytes");

// Hash larger byte array
const data = new Uint8Array(100).fill(0x42);
const dataHash = SHA256.hash(data);
console.log("\nLarge data (100 bytes of 0x42)");
console.log("Hash:", Hex.fromBytes(dataHash));

// Hashing is deterministic
const hash2 = SHA256.hash(bytes);
const match = hash.every((byte, i) => byte === hash2[i]);
console.log("\nDeterministic:", match);
