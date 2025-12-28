import { Bytes, Hex, SHA256 } from "@tevm/voltaire";
// Double SHA256 (Bitcoin-style: SHA256(SHA256(data)))
// Used in Bitcoin for block headers and transaction IDs

const message = "Bitcoin uses double SHA256";

// First hash
const hash1 = SHA256.hashString(message);

// Second hash (hash the hash)
const hash2 = SHA256.hash(hash1);

// Helper function for double SHA256
function doubleSha256(data: Uint8Array): Uint8Array {
	return SHA256.hash(SHA256.hash(data));
}

const doubleHash = doubleSha256(new TextEncoder().encode(message));

// Bitcoin example: Block header structure
const blockHeader = Bytes.zero(80);
const blockHash = doubleSha256(blockHeader);

// Transaction ID simulation
const txData = new TextEncoder().encode("Alice sends 1 BTC to Bob");
const txid = doubleSha256(txData);
