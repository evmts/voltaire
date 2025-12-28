import { Hex, SHA256 } from "voltaire";
// Incremental hashing for streaming data
// Useful when processing large files or streams

// Create incremental hasher
const hasher = SHA256.create();

// Update with multiple chunks
const chunk1 = new TextEncoder().encode("Hello, ");
const chunk2 = new TextEncoder().encode("World!");
hasher.update(chunk1);
hasher.update(chunk2);

// Finalize and get hash
const hash = hasher.digest();

// Should match one-shot hash
const oneShot = SHA256.hashString("Hello, World!");
const matches = hash.every((b, i) => b === oneShot[i]);
const fileHasher = SHA256.create();

const fileChunks = [
	new Uint8Array(1024).fill(0x41), // 1KB of 'A'
	new Uint8Array(1024).fill(0x42), // 1KB of 'B'
	new Uint8Array(1024).fill(0x43), // 1KB of 'C'
];

fileChunks.forEach((chunk, i) => {
	fileHasher.update(chunk);
});

const fileHash = fileHasher.digest();

// Example: Stream processing pattern
function hashStream(chunks: Uint8Array[]): Uint8Array {
	const hasher = SHA256.create();
	for (const chunk of chunks) {
		hasher.update(chunk);
	}
	return hasher.digest();
}

const streamData = [
	new TextEncoder().encode("Part 1: "),
	new TextEncoder().encode("Part 2: "),
	new TextEncoder().encode("Part 3"),
];

const streamHash = hashStream(streamData);
