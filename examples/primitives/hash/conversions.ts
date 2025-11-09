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

console.log("\n=== Hash Conversions and Formatting Example ===\n");

// ============================================================
// Creating Hashes from Different Sources
// ============================================================

console.log("--- Creating Hashes ---\n");

// From hex string
const hashFromHex = Hash.fromHex(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);
console.log("From hex:", hashFromHex.format());

// From bytes
const bytes = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	bytes[i] = i;
}
const hashFromBytes = Hash.fromBytes(bytes);
console.log("From bytes:", hashFromBytes.format());

// From Keccak-256 hash
const hashFromKeccak = Hash.keccak256String("hello");
console.log("From keccak256:", hashFromKeccak.format());

// ============================================================
// Converting to Different Formats
// ============================================================

console.log("\n--- Converting to Formats ---\n");

const hash = Hash.keccak256String("example");

// To hex string (lowercase with 0x prefix)
const hex = hash.toHex();
console.log("toHex():", hex);

// To string (alias for toHex)
const str = hash.toString();
console.log("toString():", str);

// To bytes (returns copy)
const hashBytes = hash.toBytes();
console.log("toBytes():", `Uint8Array(${hashBytes.length})`);
console.log(
	"  First 8 bytes:",
	Array.from(hashBytes.slice(0, 8))
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(" "),
);

// ============================================================
// Display Formatting
// ============================================================

console.log("\n--- Display Formatting ---\n");

const displayHash = Hash.keccak256String(
	"This is a long message that will be hashed",
);

// Default formatting (6 prefix + 4 suffix)
console.log("Default format():", displayHash.format());

// Custom formatting
console.log("format(4, 4):", displayHash.format(4, 4));
console.log("format(8, 6):", displayHash.format(8, 6));
console.log("format(10, 8):", displayHash.format(10, 8));
console.log("format(16, 16):", displayHash.format(16, 16));

// Very short prefix/suffix
console.log("format(2, 2):", displayHash.format(2, 2));

// Full hash (no formatting needed)
console.log("Full hash:", displayHash.toHex());

// ============================================================
// Format Comparison
// ============================================================

console.log("\n--- Format Comparison ---\n");

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
console.log("Sample hash in different formats:");
formats.forEach(({ name, format }) => {
	console.log(`  ${name.padEnd(20)}: ${format(sampleHash)}`);
});

// ============================================================
// String Interpolation
// ============================================================

console.log("\n--- String Interpolation ---\n");

const txHash = Hash.random();

// toString() called automatically
console.log(`Transaction hash: ${txHash}`);
console.log(`Shortened: ${txHash.format()}`);

// Template literals
const message = `
Transaction submitted:
  Hash: ${txHash}
  Formatted: ${txHash.format(8, 8)}
`;
console.log(message);

// ============================================================
// Cloning Hashes
// ============================================================

console.log("\n--- Cloning Hashes ---\n");

const original = Hash.keccak256String("original");
const cloned = original.clone();

console.log("Original:", original.format());
console.log("Cloned:", cloned.format());
console.log("Are equal:", original.equals(cloned)); // true

// Modifying clone doesn't affect original
cloned[0] = 0xff;
console.log("\nAfter modifying clone:");
console.log(
	"Original first byte:",
	`0x${original[0].toString(16).padStart(2, "0")}`,
);
console.log(
	"Cloned first byte:",
	`0x${cloned[0].toString(16).padStart(2, "0")}`,
);
console.log("Still equal:", original.equals(cloned)); // false

// ============================================================
// Slicing Hashes
// ============================================================

console.log("\n--- Slicing Hashes ---\n");

const fullHash = Hash.keccak256String("transfer(address,uint256)");

// Get function selector (first 4 bytes)
const selector = Uint8Array.prototype.slice.call(fullHash, 0, 4);
console.log(
	"Function selector:",
	"0x" +
		Array.from(selector)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join(""),
);

// Get last 4 bytes
const suffix = Uint8Array.prototype.slice.call(fullHash, -4);
console.log(
	"Last 4 bytes:",
	"0x" +
		Array.from(suffix)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join(""),
);

// Get middle bytes
const middle = Uint8Array.prototype.slice.call(fullHash, 8, 24);
console.log("Middle bytes (8-24):", `Uint8Array(${middle.length})`);

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

console.log("\nSlice examples:");
ranges.forEach(({ name, slice }) => {
	const hex =
		"0x" +
		Array.from(slice)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	console.log(`  ${name.padEnd(20)}: ${hex}`);
});

// ============================================================
// Working with Hash as Uint8Array
// ============================================================

console.log("\n--- Hash as Uint8Array ---\n");

const hash1 = Hash.keccak256String("data1");

// Direct byte access
console.log("First byte:", `0x${hash1[0].toString(16).padStart(2, "0")}`);
console.log("Last byte:", `0x${hash1[31].toString(16).padStart(2, "0")}`);

// Iterate over bytes
console.log("\nFirst 8 bytes:");
for (let i = 0; i < 8; i++) {
	console.log(`  [${i}]: 0x${hash1[i].toString(16).padStart(2, "0")}`);
}

// Array operations
const allZero = hash1.every((byte) => byte === 0);
console.log("\nAll bytes zero:", allZero);

const hasNonZero = hash1.some((byte) => byte !== 0);
console.log("Has non-zero byte:", hasNonZero);

// Map bytes
const incremented = new Uint8Array(hash1.map((byte) => (byte + 1) & 0xff));
console.log("\nIncremented hash:", Hash.fromBytes(incremented).format());

// ============================================================
// Combining Hashes
// ============================================================

console.log("\n--- Combining Hashes ---\n");

const left = Hash.keccak256String("left");
const right = Hash.keccak256String("right");

// Concatenate two hashes
const combined = new Uint8Array(64);
combined.set(left, 0);
combined.set(right, 32);

// Hash the combination
const merkleNode = Hash.keccak256(combined);

console.log("Left hash:", left.format());
console.log("Right hash:", right.format());
console.log("Merkle node:", merkleNode.format());

// ============================================================
// Converting to/from Different Representations
// ============================================================

console.log("\n--- Different Representations ---\n");

const dataHash = Hash.keccak256String("data");

// Hex string
const hexRep = dataHash.toHex();
console.log("Hex:", hexRep);

// Uppercase hex (custom)
const upperHex =
	"0x" +
	Array.from(dataHash)
		.map((b) => b.toString(16).padStart(2, "0").toUpperCase())
		.join("");
console.log("Uppercase hex:", upperHex);

// Base64 (custom encoding)
const base64 = Buffer.from(dataHash).toString("base64");
console.log("Base64:", base64);

// Decimal bytes
const decimalBytes = Array.from(
	Uint8Array.prototype.slice.call(dataHash, 0, 8),
);
console.log("First 8 bytes (decimal):", decimalBytes);

// ============================================================
// Formatting for Different Contexts
// ============================================================

console.log("\n--- Context-Specific Formatting ---\n");

const contextHash = Hash.random();

// For logs
const logFormat = `Hash: ${contextHash.format(8, 8)}`;
console.log("Log format:", logFormat);

// For API responses
const apiFormat = {
	hash: contextHash.toHex(),
	short: contextHash.format(),
};
console.log("API format:", JSON.stringify(apiFormat, null, 2));

// For UI display (table)
console.log("\nUI table format:");
console.log("┌──────────────────┬───────────────┐");
console.log("│ Field            │ Value         │");
console.log("├──────────────────┼───────────────┤");
console.log(`│ Transaction Hash │ ${contextHash.format()} │`);
console.log("└──────────────────┴───────────────┘");

// For clipboard/sharing (full hash)
const shareFormat = contextHash.toHex();
console.log("\nShare format:", shareFormat);

// ============================================================
// Byte Order and Endianness
// ============================================================

console.log("\n--- Byte Order ---\n");

const hash2 = Hash.fromHex(
	"0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
);

console.log("Hash bytes in order:");
console.log("  Hex:", hash2.toHex());
console.log("  Bytes:");
for (let i = 0; i < 8; i++) {
	console.log(`    [${i}]: 0x${hash2[i].toString(16).padStart(2, "0")}`);
}

// Note: Hash is stored in big-endian byte order
console.log("\nNote: Hashes are stored in big-endian byte order");
console.log("  First byte in hex: 0x01");
console.log("  First byte in array: hash[0] = 0x01");

console.log("\n=== Example Complete ===\n");
