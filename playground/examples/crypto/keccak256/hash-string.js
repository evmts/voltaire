// Keccak256: Ethereum's primary hash function
import * as Keccak256 from "../../../../src/crypto/Keccak256/index.js";
import * as Hex from "../../../../src/primitives/Hex/index.js";

// Hash a string - returns 32-byte Uint8Array
const hash = Keccak256.hashString("Hello Voltaire!");
console.log("Keccak256 hash:", Hex.fromBytes(hash));
console.log("Hash length:", hash.length, "bytes (always 32)");

// Hash raw bytes
const data = new TextEncoder().encode("Test");
const bytesHash = Keccak256.hash(data);
console.log("\nBytes hash:", Hex.fromBytes(bytesHash));

// Hash empty data
const emptyHash = Keccak256.hash(new Uint8Array(0));
console.log("\nEmpty hash:", Hex.fromBytes(emptyHash));
