/**
 * Hash Conversions and Formatting Example
 *
 * Demonstrates:
 * - Converting between hex, bytes, and string formats
 * - Display formatting for UIs
 * - Cloning and slicing hashes
 * - Working with hash as Uint8Array
 */

import { Hash } from "../../../src/primitives/Hash/index.js";

// From hex string
const hashFromHex = Hash.fromHex(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

// From bytes
const bytes = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	bytes[i] = i;
}
const hashFromBytes = Hash.fromBytes(bytes);

// From Keccak-256 hash
const hashFromKeccak = Hash.keccak256String("hello");

const hash = Hash.keccak256String("example");

// To hex string (lowercase with 0x prefix)
const hex = hash.toHex();

// To string (alias for toHex)
const str = hash.toString();

// To bytes (returns copy)
const hashBytes = hash.toBytes();

const displayHash = Hash.keccak256String(
	"This is a long message that will be hashed",
);

interface FormattingOption {
	name: string;
	format: (hash: Hash) => string;
}

const formats: FormattingOption[] = [
	{ name: "Full hex", format: (h) => h.toHex() },
	{ name: "Default (6+4)", format: (h) => h.format() },
	{ name: "Short (4+4)", format: (h) => h.format(4, 4) },
	{ name: "Medium (8+6)", format: (h) => h.format(8, 6) },
	{ name: "Long (12+8)", format: (h) => h.format(12, 8) },
];

const sampleHash = Hash.keccak256String("sample data");
formats.forEach(({ name, format }) => {});

const txHash = Hash.random();

// Template literals
const message = `
Transaction submitted:
  Hash: ${txHash}
  Formatted: ${txHash.format(8, 8)}
`;

const original = Hash.keccak256String("original");
const cloned = original.clone();

// Modifying clone doesn't affect original
cloned[0] = 0xff;

const fullHash = Hash.keccak256String("transfer(address,uint256)");

// Get function selector (first 4 bytes)
const selector = Uint8Array.prototype.slice.call(fullHash, 0, 4);

// Get last 4 bytes
const suffix = Uint8Array.prototype.slice.call(fullHash, -4);

// Get middle bytes
const middle = Uint8Array.prototype.slice.call(fullHash, 8, 24);

// Slice ranges
const ranges = [
	{
		name: "First 8 bytes",
		slice: Uint8Array.prototype.slice.call(fullHash, 0, 8),
	},
	{
		name: "Bytes 8-16",
		slice: Uint8Array.prototype.slice.call(fullHash, 8, 16),
	},
	{
		name: "Last 8 bytes",
		slice: Uint8Array.prototype.slice.call(fullHash, -8),
	},
];
ranges.forEach(({ name, slice }) => {
	const hex = `0x${Array.from(slice)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
});

const hash1 = Hash.keccak256String("data1");
for (let i = 0; i < 8; i++) {}

// Array operations
const allZero = hash1.every((byte) => byte === 0);

const hasNonZero = hash1.some((byte) => byte !== 0);

// Map bytes
const incremented = new Uint8Array(hash1.map((byte) => (byte + 1) & 0xff));

const left = Hash.keccak256String("left");
const right = Hash.keccak256String("right");

// Concatenate two hashes
const combined = new Uint8Array(64);
combined.set(left, 0);
combined.set(right, 32);

// Hash the combination
const merkleNode = Hash.keccak256(combined);

const dataHash = Hash.keccak256String("data");

// Hex string
const hexRep = dataHash.toHex();

// Uppercase hex (custom)
const upperHex = `0x${Array.from(dataHash)
	.map((b) => b.toString(16).padStart(2, "0").toUpperCase())
	.join("")}`;

// Base64 (custom encoding)
const base64 = Buffer.from(dataHash).toString("base64");

// Decimal bytes
const decimalBytes = Array.from(
	Uint8Array.prototype.slice.call(dataHash, 0, 8),
);

const contextHash = Hash.random();

// For logs
const logFormat = `Hash: ${contextHash.format(8, 8)}`;

// For API responses
const apiFormat = {
	hash: contextHash.toHex(),
	short: contextHash.format(),
};

// For clipboard/sharing (full hash)
const shareFormat = contextHash.toHex();

const hash2 = Hash.fromHex(
	"0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
);
for (let i = 0; i < 8; i++) {}
