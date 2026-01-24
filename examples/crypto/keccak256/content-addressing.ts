import { Bytecode, Hex, Keccak256 } from "@tevm/voltaire";

const content1 = "Hello, World!";
const content2 = "Hello, World!";
const content3 = "Hello, World?"; // Slightly different

const hash1 = Keccak256(content1);
const hash2 = Keccak256(content2);
const hash3 = Keccak256(content3);

class ContentStore {
	private store = new Map<string, Uint8Array>();

	// Store content by its hash
	put(content: Uint8Array): string {
		const hash = Keccak256(content);
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
		const computedHash = Hex.fromBytes(Keccak256(content));
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
const contractCode1 = Bytecode("0x60806040523480156100105760008000fd");

const contractCode2 = Bytecode("0x608060405234801561001057600080fd"); // Slightly different

const codeHash1 = Keccak256(contractCode1);
const codeHash2 = Keccak256(contractCode2);

// Simulate downloading a file in chunks
const pngHeader = Hex("0x89504e47");
const pngData = Hex("0x0d0a1a0a");
const contentBytes = Hex(
	`0x${Array.from({ length: 100 }, (_, i) =>
		(i % 256).toString(16).padStart(2, "0"),
	).join("")}`,
);

const fileChunks = [pngHeader, pngData, contentBytes];

// Compute hash before "sending"
const originalFile = Hex.concat(...fileChunks);
const expectedHash = Keccak256(originalFile);

// Simulate receiving and verifying
const receivedFile = Hex.concat(...fileChunks);
const receivedHash = Keccak256(receivedFile);

// Simulate corruption
const receivedBytes = Hex.toBytes(receivedFile);
receivedBytes[50] ^= 0xff; // Flip bits
const corruptedFile = Hex.fromBytes(receivedBytes);
const corruptedHash = Keccak256(corruptedFile);

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
	return Hex.fromBytes(Keccak256(encoded));
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
const largeFileBytes = new Uint8Array(largeFileSize);
crypto.getRandomValues(largeFileBytes);
const largeFile = Hex.fromBytes(largeFileBytes);

// Create chunks as hex strings
const chunks: ReturnType<typeof Hex>[] = [];
for (let i = 0; i < largeFileSize * 2; i += chunkSize * 2) {
	chunks.push(Hex(`0x${largeFile.slice(2 + i, 2 + i + chunkSize * 2)}`));
}

// Hash each chunk
const chunkHashes = chunks.map((chunk) => Keccak256(chunk));
for (let i = 0; i < chunkHashes.length; i++) {}

// Build root hash from all chunk hashes
const allChunkHashes = Hex.concat(...chunkHashes.map((h) => Hex.fromBytes(h)));
const rootHash = Keccak256(allChunkHashes);
