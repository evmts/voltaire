import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

/**
 * Content Addressing with Keccak256
 *
 * Demonstrates using Keccak256 for content-addressed storage:
 * - Immutable content identification
 * - Data integrity verification
 * - Deduplication
 * - IPFS-style addressing patterns
 */

console.log("=== Content Addressing with Keccak256 ===\n");

// 1. Basic Content Addressing
console.log("1. Basic Content Addressing");
console.log("-".repeat(40));
console.log("Content hash = unique identifier for data\n");

const content1 = "Hello, World!";
const content2 = "Hello, World!";
const content3 = "Hello, World?"; // Slightly different

const hash1 = Keccak256.hashString(content1);
const hash2 = Keccak256.hashString(content2);
const hash3 = Keccak256.hashString(content3);

console.log(`Content 1: "${content1}"`);
console.log(`Hash:      ${Hex.fromBytes(hash1)}\n`);

console.log(`Content 2: "${content2}"`);
console.log(`Hash:      ${Hex.fromBytes(hash2)}`);
console.log(`Same as 1: ${Hex.fromBytes(hash1) === Hex.fromBytes(hash2)}\n`);

console.log(`Content 3: "${content3}"`);
console.log(`Hash:      ${Hex.fromBytes(hash3)}`);
console.log(`Same as 1: ${Hex.fromBytes(hash1) === Hex.fromBytes(hash3)}\n`);

// 2. Content Store Implementation
console.log("2. Content Store Implementation");
console.log("-".repeat(40));

class ContentStore {
	private store = new Map<string, Uint8Array>();

	// Store content by its hash
	put(content: Uint8Array): string {
		const hash = Keccak256.hash(content);
		const key = Hex.fromBytes(hash);
		this.store.set(key, content);
		return key;
	}

	// Retrieve content by hash
	get(hash: string): Uint8Array | undefined {
		return this.store.get(hash);
	}

	// Verify content matches hash
	verify(hash: string, content: Uint8Array): boolean {
		const computedHash = Hex.fromBytes(Keccak256.hash(content));
		return computedHash === hash;
	}

	size(): number {
		return this.store.size;
	}
}

const store = new ContentStore();

// Add content
const data1 = new TextEncoder().encode("First piece of data");
const data2 = new TextEncoder().encode("Second piece of data");
const data3 = new TextEncoder().encode("First piece of data"); // Duplicate

const hash1Key = store.put(data1);
const hash2Key = store.put(data2);
const hash3Key = store.put(data3);

console.log("Stored content:");
console.log(`  Data 1: ${hash1Key.slice(0, 20)}...`);
console.log(`  Data 2: ${hash2Key.slice(0, 20)}...`);
console.log(`  Data 3: ${hash3Key.slice(0, 20)}... (duplicate)\n`);

console.log(`Total unique items: ${store.size()}`);
console.log("Automatic deduplication: data1 and data3 have same hash\n");

// Retrieve and verify
const retrieved = store.get(hash1Key);
if (retrieved) {
	const isValid = store.verify(hash1Key, retrieved);
	console.log(`Retrieved data: "${new TextDecoder().decode(retrieved)}"`);
	console.log(`Integrity check: ${isValid}\n`);
}

// 3. Smart Contract Code Storage
console.log("3. Smart Contract Code Storage");
console.log("-".repeat(40));
console.log("Ethereum stores contract code by hash\n");

// Simulate contract bytecode
const contractCode1 = new Uint8Array([
	0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15, 0x61, 0x00, 0x0f, 0x57, 0x60,
	0x00, 0x80, 0xfd,
]);

const contractCode2 = new Uint8Array([
	0x60,
	0x80,
	0x60,
	0x40,
	0x52,
	0x34,
	0x80,
	0x15,
	0x61,
	0x00,
	0x10,
	0x57,
	0x60,
	0x00,
	0x80,
	0xfd, // Slightly different
]);

const codeHash1 = Keccak256.hash(contractCode1);
const codeHash2 = Keccak256.hash(contractCode2);

console.log("Contract 1 code:", Hex.fromBytes(contractCode1));
console.log("Code hash:      ", Hex.fromBytes(codeHash1), "\n");

console.log("Contract 2 code:", Hex.fromBytes(contractCode2));
console.log("Code hash:      ", Hex.fromBytes(codeHash2), "\n");

console.log("Different code -> different hash (even 1 byte)");
console.log("Ethereum stores account.codeHash for verification\n");

// 4. File Integrity Verification
console.log("4. File Integrity Verification");
console.log("-".repeat(40));

// Simulate downloading a file in chunks
const fileChunks = [
	new Uint8Array([0x89, 0x50, 0x4e, 0x47]), // PNG header
	new Uint8Array([0x0d, 0x0a, 0x1a, 0x0a]),
	new Uint8Array(Array.from({ length: 100 }, (_, i) => i % 256)),
];

// Compute hash before "sending"
const originalFile = new Uint8Array([
	...fileChunks[0],
	...fileChunks[1],
	...fileChunks[2],
]);
const expectedHash = Keccak256.hash(originalFile);

console.log(`Expected hash: ${Hex.fromBytes(expectedHash)}`);
console.log(`File size:     ${originalFile.length} bytes\n`);

// Simulate receiving and verifying
const receivedFile = new Uint8Array([
	...fileChunks[0],
	...fileChunks[1],
	...fileChunks[2],
]);
const receivedHash = Keccak256.hash(receivedFile);

console.log(`Received hash: ${Hex.fromBytes(receivedHash)}`);
console.log(
	`Verified:      ${Hex.fromBytes(expectedHash) === Hex.fromBytes(receivedHash)}`,
);

// Simulate corruption
receivedFile[50] ^= 0xff; // Flip bits
const corruptedHash = Keccak256.hash(receivedFile);
console.log(`\nCorrupted hash: ${Hex.fromBytes(corruptedHash)}`);
console.log(
	`Verified:       ${Hex.fromBytes(expectedHash) === Hex.fromBytes(corruptedHash)}\n`,
);

// 5. Version Control / Git-like System
console.log("5. Version Control Pattern");
console.log("-".repeat(40));

interface Commit {
	parent?: string;
	author: string;
	message: string;
	content: string;
}

function hashCommit(commit: Commit): string {
	const encoded = new TextEncoder().encode(
		JSON.stringify(commit, null, 0), // No whitespace for deterministic hash
	);
	return Hex.fromBytes(Keccak256.hash(encoded));
}

const commit1: Commit = {
	author: "Alice",
	message: "Initial commit",
	content: "Hello, World!",
};
const commit1Hash = hashCommit(commit1);

const commit2: Commit = {
	parent: commit1Hash,
	author: "Bob",
	message: "Update greeting",
	content: "Hello, Ethereum!",
};
const commit2Hash = hashCommit(commit2);

const commit3: Commit = {
	parent: commit2Hash,
	author: "Alice",
	message: "Add punctuation",
	content: "Hello, Ethereum!!!",
};
const commit3Hash = hashCommit(commit3);

console.log("Commit chain:\n");
console.log(`Commit 1: ${commit1Hash.slice(0, 16)}...`);
console.log(`  Parent: none`);
console.log(`  "${commit1.message}"\n`);

console.log(`Commit 2: ${commit2Hash.slice(0, 16)}...`);
console.log(`  Parent: ${commit1Hash.slice(0, 16)}...`);
console.log(`  "${commit2.message}"\n`);

console.log(`Commit 3: ${commit3Hash.slice(0, 16)}...`);
console.log(`  Parent: ${commit2Hash.slice(0, 16)}...`);
console.log(`  "${commit3.message}"\n`);

console.log("Each commit references its parent by hash");
console.log("Tamper-proof history: changing any commit breaks chain\n");

// 6. Merkle DAG for Large Files
console.log("6. Merkle DAG for Large Files");
console.log("-".repeat(40));

// Split large file into chunks and build DAG
const chunkSize = 256;
const largeFileSize = 1024;
const largeFile = new Uint8Array(largeFileSize);
crypto.getRandomValues(largeFile);

// Create chunks
const chunks: Uint8Array[] = [];
for (let i = 0; i < largeFileSize; i += chunkSize) {
	chunks.push(largeFile.slice(i, i + chunkSize));
}

// Hash each chunk
const chunkHashes = chunks.map((chunk) => Keccak256.hash(chunk));

console.log(`File size:    ${largeFileSize} bytes`);
console.log(`Chunk size:   ${chunkSize} bytes`);
console.log(`Chunk count:  ${chunks.length}\n`);

console.log("Chunk hashes:");
for (let i = 0; i < chunkHashes.length; i++) {
	console.log(`  Chunk ${i}: ${Hex.fromBytes(chunkHashes[i]).slice(0, 20)}...`);
}

// Build root hash from all chunk hashes
const allChunkHashes = new Uint8Array(chunkHashes.length * 32);
for (let i = 0; i < chunkHashes.length; i++) {
	allChunkHashes.set(chunkHashes[i], i * 32);
}
const rootHash = Keccak256.hash(allChunkHashes);

console.log(`\nRoot hash: ${Hex.fromBytes(rootHash)}`);
console.log("\nBenefit: Can verify individual chunks without full file\n");

console.log("=== Complete ===");
