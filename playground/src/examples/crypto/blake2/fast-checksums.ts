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

console.log("Fast Checksums:\n");

const checksum1 = fastChecksum(file1);
console.log("File 1 (16-byte):", Hex.fromBytes(checksum1));

const checksum2 = fastChecksum(file2);
console.log("File 2 (16-byte):", Hex.fromBytes(checksum2));

console.log("\nCryptographic Checksums:\n");

const crypto1 = cryptoChecksum(file1);
console.log("File 1 (32-byte):", Hex.fromBytes(crypto1));

const crypto2 = cryptoChecksum(file2);
console.log("File 2 (32-byte):", Hex.fromBytes(crypto2));

// Different files produce different checksums
console.log(
	"\nChecksums differ:",
	Hex.fromBytes(checksum1) !== Hex.fromBytes(checksum2),
);
