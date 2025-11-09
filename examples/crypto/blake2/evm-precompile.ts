import { Blake2 } from "../../../src/crypto/Blake2/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Zcash uses Blake2b with 32-byte output in Equihash PoW
const zcashHeader = new Uint8Array(140); // Zcash block header
zcashHeader.fill(0x01); // Example data

const zcashHash = Blake2.hash(zcashHeader, 32);

// Ethereum uses Keccak-256, but Blake2 is faster for many use cases
const ethereumData = new TextEncoder().encode("Ethereum transaction data");

// Blake2 is ~3x faster than Keccak-256 in software
const blake2Hash = Blake2.hash(ethereumData, 32);

const leaves = [
	new TextEncoder().encode("leaf1"),
	new TextEncoder().encode("leaf2"),
	new TextEncoder().encode("leaf3"),
	new TextEncoder().encode("leaf4"),
];

// Hash leaves with 32-byte output
const hashedLeaves = leaves.map((leaf) => Blake2.hash(leaf, 32));
hashedLeaves.forEach((hash, i) => {});

// Combine pairs and hash
const combined1 = new Uint8Array([...hashedLeaves[0], ...hashedLeaves[1]]);
const combined2 = new Uint8Array([...hashedLeaves[2], ...hashedLeaves[3]]);

const parent1 = Blake2.hash(combined1, 32);
const parent2 = Blake2.hash(combined2, 32);

// Final root
const rootData = new Uint8Array([...parent1, ...parent2]);
const merkleRoot = Blake2.hash(rootData, 32);

// IPFS uses Blake2b for content addressing (faster than SHA-256)
const fileContent = new Uint8Array(1024).fill(0xff);
const contentHash = Blake2.hash(fileContent, 32);

const chunk1 = new Uint8Array(4096).fill(0xaa);
const chunk2 = new Uint8Array(4096).fill(0xbb);
const chunk3 = new Uint8Array(4096).fill(0xaa); // Same as chunk1

// Use 16-byte Blake2 for fast checksums
const checksum1 = Blake2.hash(chunk1, 16);
const checksum2 = Blake2.hash(chunk2, 16);
const checksum3 = Blake2.hash(chunk3, 16);

const password = "secure_password_123";
const salt = new Uint8Array(16).fill(0x42);

// Combine password and salt
const combined = new Uint8Array([
	...new TextEncoder().encode(password),
	...salt,
]);

const derivedKey = Blake2.hash(combined, 32);
