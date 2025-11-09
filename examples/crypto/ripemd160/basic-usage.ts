import { Ripemd160 } from "../../../src/crypto/Ripemd160/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

/**
 * Basic RIPEMD160 Usage
 *
 * Demonstrates fundamental RIPEMD160 hashing:
 * - Hash raw bytes (20-byte output)
 * - Hash UTF-8 strings
 * - Test vector verification
 * - Legacy Bitcoin address context
 */

console.log("=== Basic RIPEMD160 Usage ===\n");

// 1. Hash raw bytes
console.log("1. Hash Raw Bytes");
console.log("-".repeat(40));
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = Ripemd160.hash(data);
console.log(`Input:  [${Array.from(data).join(", ")}]`);
console.log(`Output: ${Hex.fromBytes(hash)}`);
console.log(`Length: ${hash.length} bytes (always 20 bytes)\n`);

// 2. Hash UTF-8 string
console.log("2. Hash UTF-8 String");
console.log("-".repeat(40));
const message = "hello";
const messageHash = Ripemd160.hashString(message);
console.log(`Input:  "${message}"`);
console.log(`Output: ${Hex.fromBytes(messageHash)}\n`);

// 3. Empty string hash
console.log("3. Empty String Hash");
console.log("-".repeat(40));
const emptyHash = Ripemd160.hashString("");
console.log('Input:  "" (empty string)');
console.log(`Output: ${Hex.fromBytes(emptyHash)}`);

// Verify against official test vector
const expectedEmpty = "0x9c1185a5c5e9fc54612808977ee8f548b2258d31";
const isCorrect = Hex.fromBytes(emptyHash) === expectedEmpty;
console.log(`Matches official test vector: ${isCorrect}\n`);

// 4. Official test vectors
console.log("4. Official Test Vectors");
console.log("-".repeat(40));

const testVectors = [
	{ input: "a", expected: "0x0bdc9d2d256b3ee9daae347be6f4dc835a467ffe" },
	{ input: "abc", expected: "0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc" },
	{
		input: "message digest",
		expected: "0x5d0689ef49d2fae572b881b123a85ffa21595f36",
	},
];

testVectors.forEach(({ input, expected }) => {
	const hash = Ripemd160.hashString(input);
	const matches = Hex.fromBytes(hash) === expected;
	console.log(`Input: "${input}"`);
	console.log(`Hash:  ${Hex.fromBytes(hash)}`);
	console.log(`Match: ${matches ? "✓" : "✗"}\n`);
});

// 5. Determinism
console.log("5. Deterministic Hashing");
console.log("-".repeat(40));
const input = "Bitcoin uses RIPEMD160";
const hash1 = Ripemd160.hashString(input);
const hash2 = Ripemd160.hashString(input);
const hash3 = Ripemd160.hashString(input);

console.log(`Input: "${input}"`);
console.log(`Hash 1: ${Hex.fromBytes(hash1)}`);
console.log(`Hash 2: ${Hex.fromBytes(hash2)}`);
console.log(`Hash 3: ${Hex.fromBytes(hash3)}`);
console.log(
	`All equal: ${
		Hex.fromBytes(hash1) === Hex.fromBytes(hash2) &&
		Hex.fromBytes(hash2) === Hex.fromBytes(hash3)
	}\n`,
);

// 6. Fixed 20-byte output (unlike Blake2)
console.log("6. Fixed 20-Byte Output");
console.log("-".repeat(40));
const shortInput = "a";
const longInput = "The quick brown fox jumps over the lazy dog";

const shortHash = Ripemd160.hashString(shortInput);
const longHash = Ripemd160.hashString(longInput);

console.log(`Short input: "${shortInput}"`);
console.log(`Hash:        ${Hex.fromBytes(shortHash)}`);
console.log(`Length:      ${shortHash.length} bytes`);

console.log(`\nLong input:  "${longInput}"`);
console.log(`Hash:        ${Hex.fromBytes(longHash)}`);
console.log(`Length:      ${longHash.length} bytes`);

console.log("\nRIPEMD160 always produces 20-byte output (160 bits)\n");

// 7. Collision resistance (birthday bound)
console.log("7. Security Level");
console.log("-".repeat(40));
console.log("RIPEMD160 provides:");
console.log("- 160-bit output size");
console.log("- ~80-bit collision resistance (birthday bound)");
console.log("- ~160-bit preimage resistance");
console.log("\nThis is acceptable for Bitcoin addresses because:");
console.log("- Combined with SHA-256 (double hashing)");
console.log("- Address collisions require breaking both algorithms");
console.log("- 20-byte addresses reduce blockchain storage\n");

// 8. Legacy status
console.log("8. Legacy Function (Bitcoin Context)");
console.log("-".repeat(40));
console.log("RIPEMD160 is considered legacy:");
console.log("- Designed in 1996 (pre-SHA-256)");
console.log("- Used in Bitcoin since 2009");
console.log("- Maintained for backward compatibility");
console.log("- Not recommended for new applications");
console.log("\nFor new projects, prefer:");
console.log("- SHA-256 (256-bit, widely supported)");
console.log("- Blake2b (faster, variable output)");
console.log("- Keccak-256 (Ethereum compatibility)\n");

console.log("=== Complete ===");
