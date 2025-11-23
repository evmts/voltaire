import * as SHA256 from "../../../crypto/SHA256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Hash raw byte arrays
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

// Hash with from() constructor (accepts Uint8Array)
const fromHash = SHA256.from(bytes);
console.log(
	"from() matches hash():",
	hash.every((b, i) => b === fromHash[i]),
);
