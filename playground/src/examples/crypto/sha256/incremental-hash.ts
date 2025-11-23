import * as SHA256 from "../../../crypto/SHA256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Incremental hashing for streaming data
// Useful when processing large files or streams

// Create incremental hasher
const hasher = SHA256.create();
console.log("Created incremental hasher\n");

// Update with multiple chunks
const chunk1 = new TextEncoder().encode("Hello, ");
const chunk2 = new TextEncoder().encode("World!");

console.log("Adding chunks:");
console.log("Chunk 1:", new TextDecoder().decode(chunk1));
hasher.update(chunk1);

console.log("Chunk 2:", new TextDecoder().decode(chunk2));
hasher.update(chunk2);

// Finalize and get hash
const hash = hasher.digest();
console.log("\nFinal hash:", Hex.fromBytes(hash));

// Should match one-shot hash
const oneShot = SHA256.hashString("Hello, World!");
const matches = hash.every((b, i) => b === oneShot[i]);
console.log("Matches one-shot:", matches);

// Example: Process large file in chunks
console.log("\nProcessing large file:");
const fileHasher = SHA256.create();

const fileChunks = [
	new Uint8Array(1024).fill(0x41), // 1KB of 'A'
	new Uint8Array(1024).fill(0x42), // 1KB of 'B'
	new Uint8Array(1024).fill(0x43), // 1KB of 'C'
];

fileChunks.forEach((chunk, i) => {
	console.log(`Processing chunk ${i + 1} (${chunk.length} bytes)`);
	fileHasher.update(chunk);
});

const fileHash = fileHasher.digest();
console.log("File hash:", Hex.fromBytes(fileHash));

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
console.log("\nStream hash:", Hex.fromBytes(streamHash));
