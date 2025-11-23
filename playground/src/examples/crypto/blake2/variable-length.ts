import * as Blake2 from "../../../crypto/Blake2/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

const message = "Voltaire";

// Blake2b supports variable output length (1-64 bytes)
console.log("Blake2b Variable Output Lengths:\n");

// 20 bytes (address-sized, 160 bits)
const hash20 = Blake2.hash(message, 20);
console.log("20-byte hash:", Hex.fromBytes(hash20));
console.log("Length:", hash20.length, "bytes");

// 32 bytes (SHA-256 equivalent, 256 bits)
const hash32 = Blake2.hash(message, 32);
console.log("\n32-byte hash:", Hex.fromBytes(hash32));
console.log("Length:", hash32.length, "bytes");

// 48 bytes (384 bits)
const hash48 = Blake2.hash(message, 48);
console.log("\n48-byte hash:", Hex.fromBytes(hash48));
console.log("Length:", hash48.length, "bytes");

// 64 bytes (default, 512 bits - maximum security)
const hash64 = Blake2.hash(message, 64);
console.log("\n64-byte hash:", Hex.fromBytes(hash64));
console.log("Length:", hash64.length, "bytes");

// Each length produces completely different hash (not truncation)
console.log("\nDifferent lengths produce different hashes:");
console.log(
	"32-byte != 64-byte truncated:",
	Hex.fromBytes(hash32) !== Hex.fromBytes(hash64.slice(0, 32)),
);
