import * as SHA256 from "../../../crypto/SHA256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Double SHA256 (Bitcoin-style: SHA256(SHA256(data)))
// Used in Bitcoin for block headers and transaction IDs

const message = "Bitcoin uses double SHA256";
console.log("Original message:", message);

// First hash
const hash1 = SHA256.hashString(message);
console.log("\nFirst SHA256:", Hex.fromBytes(hash1));

// Second hash (hash the hash)
const hash2 = SHA256.hash(hash1);
console.log("Second SHA256:", Hex.fromBytes(hash2));

// Helper function for double SHA256
function doubleSha256(data: Uint8Array): Uint8Array {
	return SHA256.hash(SHA256.hash(data));
}

const doubleHash = doubleSha256(new TextEncoder().encode(message));
console.log(
	"\nDouble hash matches:",
	hash2.every((b, i) => b === doubleHash[i]),
);

// Bitcoin example: Block header structure
const blockHeader = new Uint8Array(80).fill(0x00);
const blockHash = doubleSha256(blockHeader);
console.log("\nBlock header hash:", Hex.fromBytes(blockHash));

// Transaction ID simulation
const txData = new TextEncoder().encode("Alice sends 1 BTC to Bob");
const txid = doubleSha256(txData);
console.log("\nTransaction ID:", Hex.fromBytes(txid));
