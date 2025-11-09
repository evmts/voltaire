import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const content1 = "Hello, World!";
const content2 = "Hello, World!";
const content3 = "Hello, World?"; // Slightly different

const hash1 = Keccak256.hashString(content1);
const hash2 = Keccak256.hashString(content2);
const hash3 = Keccak256.hashString(content3);

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

// Retrieve and verify
const retrieved = store.get(hash1Key);
if (retrieved) {
	const isValid = store.verify(hash1Key, retrieved);
}

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

// Simulate receiving and verifying
const receivedFile = new Uint8Array([
	...fileChunks[0],
	...fileChunks[1],
	...fileChunks[2],
]);
const receivedHash = Keccak256.hash(receivedFile);

// Simulate corruption
receivedFile[50] ^= 0xff; // Flip bits
const corruptedHash = Keccak256.hash(receivedFile);

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
for (let i = 0; i < chunkHashes.length; i++) {}

// Build root hash from all chunk hashes
const allChunkHashes = new Uint8Array(chunkHashes.length * 32);
for (let i = 0; i < chunkHashes.length; i++) {
	allChunkHashes.set(chunkHashes[i], i * 32);
}
const rootHash = Keccak256.hash(allChunkHashes);
