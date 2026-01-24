/**
 * SHA256 Streaming API Example
 *
 * Demonstrates incremental hashing for:
 * - Large files that don't fit in memory
 * - Data arriving in chunks
 * - Memory-efficient processing
 * - Progress tracking
 */

import { Bytes, SHA256 } from "@tevm/voltaire";

const data = Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

// One-shot hashing
const oneShotHash = SHA256.hash(data);

// Streaming hashing (same result)
const hasher = SHA256.create();
hasher.update(Bytes.from([1, 2, 3]));
hasher.update(Bytes.from([4, 5, 6]));
hasher.update(Bytes.from([7, 8, 9, 10]));
const streamHash = hasher.digest();

const testData = Bytes.from(Array.from({ length: 100 }, (_, i) => i & 0xff));

// Various chunk sizes
const chunkSizes = [1, 7, 16, 32, 64, 100];
const hashes: string[] = [];

for (const chunkSize of chunkSizes) {
	const h = SHA256.create();
	for (let i = 0; i < testData.length; i += chunkSize) {
		const chunk = testData.slice(i, i + chunkSize);
		h.update(chunk);
	}
	const hash = h.digest();
	hashes.push(SHA256.toHex(hash));
}

const allSame = hashes.every((h) => h === hashes[0]);

function hashFileWithProgress(fileSize: number, chunkSize: number): Uint8Array {
	const hasher = SHA256.create();
	let processed = 0;

	while (processed < fileSize) {
		const remaining = fileSize - processed;
		const currentChunk = Math.min(chunkSize, remaining);

		// Simulate chunk data
		const chunk = Bytes.from(
			Array.from({ length: currentChunk }, (_, i) => (processed + i) & 0xff),
		);

		hasher.update(chunk);
		processed += currentChunk;

		// Report progress
		const progress = (processed / fileSize) * 100;
		if (processed === fileSize || processed % (chunkSize * 10) === 0) {
		}
	}

	return hasher.digest();
}

const largeFileHash = hashFileWithProgress(1024 * 1024, 64 * 1024); // 1MB file, 64KB chunks

// Demonstrate block size alignment
const blockAlignedChunks = [
	SHA256.BLOCK_SIZE, // 64 bytes
	SHA256.BLOCK_SIZE * 16, // 1 KB
	SHA256.BLOCK_SIZE * 256, // 16 KB
	SHA256.BLOCK_SIZE * 1024, // 64 KB
];
for (const size of blockAlignedChunks) {
	const blocks = size / SHA256.BLOCK_SIZE;
}

interface MessagePart {
	type: string;
	data: string;
}

function hashMultiPartMessage(parts: MessagePart[]): Uint8Array {
	const hasher = SHA256.create();

	for (const part of parts) {
		const encoded = new TextEncoder().encode(part.data);
		hasher.update(encoded);
	}

	return hasher.digest();
}

const multiPartMessage: MessagePart[] = [
	{ type: "header", data: "Subject: Important Message" },
	{ type: "body", data: "This is the message body." },
	{ type: "footer", data: "Sent from my device" },
];

const multiPartHash = hashMultiPartMessage(multiPartMessage);

// Inefficient: Concatenate then hash
function inefficientHash(parts: Uint8Array[]): Uint8Array {
	const combined = Bytes.concat(parts);
	return SHA256.hash(combined); // Single allocation of full size
}

// Efficient: Stream without concatenation
function efficientHash(parts: Uint8Array[]): Uint8Array {
	const hasher = SHA256.create();
	for (const part of parts) {
		hasher.update(part); // No concatenation needed
	}
	return hasher.digest();
}

const parts = [
	Bytes.from([1, 2, 3]),
	Bytes.from([4, 5, 6]),
	Bytes.from([7, 8, 9]),
];

const hash1 = inefficientHash(parts);
const hash2 = efficientHash(parts);

const h = SHA256.create();
h.update(Bytes.from([1, 2, 3]));

const digest = h.digest();
const newHasher = SHA256.create();
