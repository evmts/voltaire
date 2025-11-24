import * as Blake2 from "../../../crypto/Blake2/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Blake2b is optimized for speed - ideal for checksums

// Fast 16-byte checksum for data deduplication
function fastChecksum(data: Uint8Array): Uint8Array {
	return Blake2.hash(data, 16);
}

// 32-byte cryptographic checksum (SHA-256 equivalent security)
function cryptoChecksum(data: Uint8Array): Uint8Array {
	return Blake2.hash(data, 32);
}

const file1 = new Uint8Array(1024).fill(0x41); // 1KB of 'A'
const file2 = new Uint8Array(1024).fill(0x42); // 1KB of 'B'

const checksum1 = fastChecksum(file1);

const checksum2 = fastChecksum(file2);

const crypto1 = cryptoChecksum(file1);

const crypto2 = cryptoChecksum(file2);
