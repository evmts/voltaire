import { AesGcm } from "voltaire";
const key = await AesGcm.generateKey(256);

const singleMessage = new Uint8Array(1024 * 100); // 100 KB
for (let i = 0; i < singleMessage.length; i++) {
	singleMessage[i] = i % 256;
}

const singleNonce = AesGcm.generateNonce();
const singleCt = await AesGcm.encrypt(singleMessage, key, singleNonce);

const chunkSize = 1024 * 16; // 16 KB chunks
const totalSize = 1024 * 100; // 100 KB total
const numChunks = Math.ceil(totalSize / chunkSize);

// Encrypt each chunk
const chunks: { nonce: Uint8Array; ciphertext: Uint8Array }[] = [];

for (let i = 0; i < numChunks; i++) {
	const start = i * chunkSize;
	const end = Math.min(start + chunkSize, totalSize);
	const chunk = new Uint8Array(end - start);

	// Fill with data
	for (let j = 0; j < chunk.length; j++) {
		chunk[j] = (start + j) % 256;
	}

	// Each chunk gets unique nonce
	const nonce = AesGcm.generateNonce();
	const ciphertext = await AesGcm.encrypt(chunk, key, nonce);

	chunks.push({ nonce, ciphertext });
}

const totalEncrypted = chunks.reduce(
	(sum, c) => sum + c.ciphertext.length + c.nonce.length,
	0,
);

const decryptedChunks: Uint8Array[] = [];

for (const chunk of chunks) {
	const decrypted = await AesGcm.decrypt(chunk.ciphertext, key, chunk.nonce);
	decryptedChunks.push(decrypted);
}

// Verify
let allMatch = true;
let offset = 0;
for (const chunk of decryptedChunks) {
	for (let i = 0; i < chunk.length; i++) {
		if (chunk[i] !== offset % 256) {
			allMatch = false;
			break;
		}
		offset++;
	}
	if (!allMatch) break;
}

// Demonstrate random access
const randomIndex = Math.floor(numChunks / 2);
const randomChunk = chunks[randomIndex];
const randomDecrypted = await AesGcm.decrypt(
	randomChunk.ciphertext,
	key,
	randomChunk.nonce,
);

interface ChunkMetadata {
	index: number;
	totalChunks: number;
	nonce: Uint8Array;
	ciphertext: Uint8Array;
}

const metadataChunks: ChunkMetadata[] = chunks.map((chunk, index) => ({
	index,
	totalChunks: chunks.length,
	nonce: chunk.nonce,
	ciphertext: chunk.ciphertext,
}));
