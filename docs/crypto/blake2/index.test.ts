/**
 * Colocated tests for docs/crypto/blake2/index.mdx
 *
 * Tests all code examples from the documentation to ensure they work correctly.
 * Documents API discrepancies between docs and actual implementation.
 */

import { describe, expect, it } from "vitest";

// API DISCREPANCY NOTE:
// The docs use: import { Blake2 } from '@tevm/voltaire/Blake2';
// The actual import path is: ../../../src/crypto/Blake2/index.js

describe("docs/crypto/blake2/index.mdx", () => {
	describe("Quick Start - Basic Hashing Tab", () => {
		it("should hash bytes with default 64-byte output", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			// Hash bytes with default 64-byte output - constructor pattern
			const data = Hex("0x0102030405");
			const hash = Blake2(data);

			// BrandedBlake2 (Uint8Array(64))
			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(64);
		});

		it("should hash with custom output length (32 bytes)", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			// Hash with custom output length (32 bytes)
			const data = Hex("0x0102030405");
			const hash32 = Blake2(data, 32);

			// Uint8Array(32) with Blake2b-256
			expect(hash32).toBeInstanceOf(Uint8Array);
			expect(hash32.length).toBe(32);
		});

		it("should hash with 20-byte output (same size as RIPEMD160)", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			// Hash with 20-byte output (same size as RIPEMD160)
			const data = Hex("0x0102030405");
			const hash20 = Blake2(data, 20);

			// Uint8Array(20)
			expect(hash20).toBeInstanceOf(Uint8Array);
			expect(hash20.length).toBe(20);
		});
	});

	describe("Quick Start - String Hashing Tab", () => {
		it("should hash string with default 64-byte output", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// Hash string with default 64-byte output
			const hash = Blake2("hello world");

			// BrandedBlake2 (Uint8Array(64))
			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(64);
		});

		it("should hash string with 32-byte output (BLAKE2b-256)", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// Hash string with 32-byte output (BLAKE2b-256)
			const hash32 = Blake2("hello", 32);

			// Uint8Array(32)
			expect(hash32).toBeInstanceOf(Uint8Array);
			expect(hash32.length).toBe(32);
		});

		it("should accept both Uint8Array and strings", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// Constructor accepts both Uint8Array and strings
			const directHash = Blake2("hello world", 48);

			// Uint8Array(48)
			expect(directHash).toBeInstanceOf(Uint8Array);
			expect(directHash.length).toBe(48);
		});
	});

	describe("Quick Start - Variable Output Tab", () => {
		it("should produce different output lengths for different use cases", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const data = Hex("0x010203");

			// Different output lengths for different use cases
			const hash1 = Blake2(data, 1); // 1 byte (minimal)
			const hash20 = Blake2(data, 20); // 20 bytes (address-sized)
			const hash32 = Blake2(data, 32); // 32 bytes (SHA256-equivalent)
			const hash48 = Blake2(data, 48); // 48 bytes
			const hash64 = Blake2(data, 64); // 64 bytes (maximum/default)

			expect(hash1.length).toBe(1);
			expect(hash20.length).toBe(20);
			expect(hash32.length).toBe(32);
			expect(hash48.length).toBe(48);
			expect(hash64.length).toBe(64);

			// Each length produces a completely different hash
			// NOT just truncation of longer output
			// Verify by checking the first bytes don't match truncated versions
			expect(hash20.slice(0, 1)).not.toEqual(hash64.slice(0, 1));
		});
	});

	describe("API Reference - Blake2(data, outputLength?)", () => {
		it("should hash with default 64-byte output", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			// Default 64-byte output
			const hash64 = Blake2(Hex("0x010203"));
			expect(hash64.length).toBe(64);
		});

		it("should hash with 32-byte output (BLAKE2b-256)", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			// 32-byte output (BLAKE2b-256)
			const hash32 = Blake2(Hex("0x010203"), 32);
			expect(hash32.length).toBe(32);
		});

		it("should hash string input", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// String input
			const stringHash = Blake2("hello", 20);
			expect(stringHash.length).toBe(20);
		});

		it("should throw error if outputLength is not between 1 and 64", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			expect(() => Blake2("hello", 0)).toThrow();
			expect(() => Blake2("hello", 65)).toThrow();
		});
	});

	describe("API Reference - Blake2.hash(data, outputLength?)", () => {
		it("should be equivalent to Blake2(data) constructor", async () => {
			const Blake2Module = await import("../../../src/crypto/Blake2/index.js");
			const { Blake2 } = Blake2Module;

			// Equivalent to Blake2(data) constructor
			const hash = Blake2.hash("message", 32);
			expect(hash.length).toBe(32);

			// Verify it matches the constructor
			const constructorHash = Blake2("message", 32);
			expect(hash).toEqual(constructorHash);
		});
	});

	describe("Test Vectors - RFC 7693", () => {
		it("should hash empty input (64-byte output)", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// Empty input (64-byte output)
			const hash = Blake2(new Uint8Array(0));

			const expected = new Uint8Array([
				0x78, 0x6a, 0x02, 0xf7, 0x42, 0x01, 0x59, 0x03, 0xc6, 0xc6, 0xfd, 0x85,
				0x25, 0x52, 0xd2, 0x72, 0x91, 0x2f, 0x47, 0x40, 0xe1, 0x58, 0x47, 0x61,
				0x8a, 0x86, 0xe2, 0x17, 0xf7, 0x1f, 0x54, 0x19, 0xd2, 0x5e, 0x10, 0x31,
				0xaf, 0xee, 0x58, 0x53, 0x13, 0x89, 0x64, 0x44, 0x93, 0x4e, 0xb0, 0x4b,
				0x90, 0x3a, 0x68, 0x5b, 0x14, 0x48, 0xb7, 0x55, 0xd5, 0x6f, 0x70, 0x1a,
				0xfe, 0x9b, 0xe2, 0xce,
			]);

			expect(hash).toEqual(expected);
		});

		it('should hash "abc" (64-byte output)', async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// "abc" (64-byte output)
			const hash = Blake2(new Uint8Array([0x61, 0x62, 0x63]));

			const expected = new Uint8Array([
				0xba, 0x80, 0xa5, 0x3f, 0x98, 0x1c, 0x4d, 0x0d, 0x6a, 0x27, 0x97, 0xb6,
				0x9f, 0x12, 0xf6, 0xe9, 0x4c, 0x21, 0x2f, 0x14, 0x68, 0x5a, 0xc4, 0xb7,
				0x4b, 0x12, 0xbb, 0x6f, 0xdb, 0xff, 0xa2, 0xd1, 0x7d, 0x87, 0xc5, 0x39,
				0x2a, 0xab, 0x79, 0x2d, 0xc2, 0x52, 0xd5, 0xde, 0x45, 0x33, 0xcc, 0x95,
				0x18, 0xd3, 0x8a, 0xa8, 0xdb, 0xf1, 0x92, 0x5a, 0xb9, 0x23, 0x86, 0xed,
				0xd4, 0x00, 0x99, 0x23,
			]);

			expect(hash).toEqual(expected);
		});

		it("should hash empty input (32-byte output, BLAKE2b-256)", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// Empty input (32-byte output, BLAKE2b-256)
			const hash = Blake2(new Uint8Array(0), 32);

			const expected = new Uint8Array([
				0x0e, 0x57, 0x51, 0xc0, 0x26, 0xe5, 0x43, 0xb2, 0xe8, 0xab, 0x2e, 0xb0,
				0x60, 0x99, 0xda, 0xa1, 0xd1, 0xe5, 0xdf, 0x47, 0x77, 0x8f, 0x77, 0x87,
				0xfa, 0xab, 0x45, 0xcd, 0xf1, 0x2f, 0xe3, 0xa8,
			]);

			expect(hash).toEqual(expected);
		});

		it("should hash single byte 0x00 (64-byte output)", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// Single byte 0x00 (64-byte output)
			const hash = Blake2(new Uint8Array([0x00]));

			const expected = new Uint8Array([
				0x2f, 0xa3, 0xf6, 0x86, 0xdf, 0x87, 0x69, 0x95, 0x16, 0x7e, 0x7c, 0x2e,
				0x5d, 0x74, 0xc4, 0xc7, 0xb6, 0xe4, 0x8f, 0x80, 0x68, 0xfe, 0x0e, 0x44,
				0x20, 0x83, 0x44, 0xd4, 0x80, 0xf7, 0x90, 0x4c, 0x36, 0x96, 0x3e, 0x44,
				0x11, 0x5f, 0xe3, 0xeb, 0x2a, 0x3a, 0xc8, 0x69, 0x4c, 0x28, 0xbc, 0xb4,
				0xf5, 0xa0, 0xf3, 0x27, 0x6f, 0x2e, 0x79, 0x48, 0x7d, 0x82, 0x19, 0x05,
				0x7a, 0x50, 0x6e, 0x4b,
			]);

			expect(hash).toEqual(expected);
		});

		it("should hash two bytes 0x00 0x01 (64-byte output)", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// Two bytes 0x00 0x01 (64-byte output)
			const hash = Blake2(new Uint8Array([0x00, 0x01]));

			const expected = new Uint8Array([
				0x1c, 0x08, 0x79, 0x8d, 0xc6, 0x41, 0xab, 0xa9, 0xde, 0xe4, 0x35, 0xe2,
				0x25, 0x19, 0xa4, 0x72, 0x9a, 0x09, 0xb2, 0xbf, 0xe0, 0xff, 0x00, 0xef,
				0x2d, 0xcd, 0x8e, 0xd6, 0xf8, 0xa0, 0x7d, 0x15, 0xea, 0xf4, 0xae, 0xe5,
				0x2b, 0xbf, 0x18, 0xab, 0x56, 0x08, 0xa6, 0x19, 0x0f, 0x70, 0xb9, 0x04,
				0x86, 0xc8, 0xa7, 0xd4, 0x87, 0x37, 0x10, 0xb1, 0x11, 0x5d, 0x3d, 0xeb,
				0xbb, 0x43, 0x27, 0xb5,
			]);

			expect(hash).toEqual(expected);
		});
	});

	describe("Use Cases - Fast File Integrity (conceptual test)", () => {
		it("should hash Uint8Array chunks for file integrity", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// Simulating file chunks
			const chunks: Uint8Array[] = [
				new Uint8Array([1, 2, 3]),
				new Uint8Array([4, 5, 6]),
				new Uint8Array([7, 8, 9]),
			];

			// Concatenate chunks (simplified from docs example)
			const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
			const combined = new Uint8Array(totalLength);
			let position = 0;
			for (const chunk of chunks) {
				combined.set(chunk, position);
				position += chunk.length;
			}

			const hash = Blake2(combined, 32);
			expect(hash.length).toBe(32);
			expect(hash).toBeInstanceOf(Uint8Array);
		});
	});

	describe("Use Cases - Content Addressing (IPFS-style)", () => {
		it("should create 32-byte content hash", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			const data = new Uint8Array([1, 2, 3, 4, 5]);
			const hash = Blake2(data, 32); // 32-byte output

			expect(hash.length).toBe(32);
			expect(hash).toBeInstanceOf(Uint8Array);
		});
	});

	describe("Use Cases - Merkle Trees with Custom Size", () => {
		it("should build merkle tree with Blake2", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			const outputSize = 32;

			// Simplified merkle root calculation from docs
			const leaves = [
				new Uint8Array([1, 2, 3]),
				new Uint8Array([4, 5, 6]),
				new Uint8Array([7, 8, 9]),
				new Uint8Array([10, 11, 12]),
			];

			// Hash leaves
			const hashes = leaves.map((leaf) => Blake2(leaf, outputSize));

			// Combine pairs
			const nextLevel: Uint8Array[] = [];
			for (let i = 0; i < hashes.length; i += 2) {
				const left = hashes[i];
				const right = hashes[i + 1] || left;
				const combined = new Uint8Array(outputSize * 2);
				combined.set(left, 0);
				combined.set(right, outputSize);
				nextLevel.push(Blake2(combined, outputSize));
			}

			// Final root
			const rootCombined = new Uint8Array(outputSize * 2);
			rootCombined.set(nextLevel[0], 0);
			rootCombined.set(nextLevel[1], outputSize);
			const merkleRoot = Blake2(rootCombined, outputSize);

			expect(merkleRoot.length).toBe(outputSize);
			expect(merkleRoot).toBeInstanceOf(Uint8Array);
		});
	});

	describe("Use Cases - Fast Checksums", () => {
		it("should create 16-byte checksum for data deduplication", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			const data = new Uint8Array([1, 2, 3, 4, 5]);

			// 16-byte checksum for data deduplication
			const checksum = Blake2(data, 16); // Faster than full 64-byte hash

			expect(checksum.length).toBe(16);
		});

		it("should create 32-byte cryptographic checksum", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			const data = new Uint8Array([1, 2, 3, 4, 5]);

			// 32-byte cryptographic checksum
			const cryptoChecksum = Blake2(data, 32); // SHA-256 equivalent security

			expect(cryptoChecksum.length).toBe(32);
		});
	});

	describe("Use Cases - Variable-Length Hashes", () => {
		it("should produce custom output sizes for different purposes", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			const data = new Uint8Array([1, 2, 3, 4, 5]);

			// Custom output sizes for different purposes
			const addressHash = Blake2(data, 20); // 20 bytes (address-sized)
			const signatureHash = Blake2(data, 32); // 32 bytes (signature)
			const fullHash = Blake2(data, 64); // 64 bytes (maximum security)

			expect(addressHash.length).toBe(20);
			expect(signatureHash.length).toBe(32);
			expect(fullHash.length).toBe(64);
		});
	});

	describe("Use Cases - Zcash-style usage", () => {
		it("should hash header-like data with 32-byte output", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			// Simplified Zcash-style usage
			const header = new Uint8Array(140);
			const hash = Blake2(header, 32);

			expect(hash.length).toBe(32);
			expect(hash).toBeInstanceOf(Uint8Array);
		});
	});

	describe("Constants (if exposed)", () => {
		it("should expose SIZE constant", async () => {
			const Blake2Module = await import("../../../src/crypto/Blake2/index.js");

			// API DISCREPANCY NOTE:
			// Docs mention: Blake2.MAX_OUTPUT_SIZE, Blake2.MIN_OUTPUT_SIZE, Blake2.BLOCK_SIZE
			// Actual implementation exports: SIZE (which equals 64)

			// Check what's actually exported
			expect(Blake2Module.SIZE).toBe(64);

			// The following constants mentioned in docs may not exist:
			// Blake2.MAX_OUTPUT_SIZE  // 64 - Maximum output size in bytes
			// Blake2.MIN_OUTPUT_SIZE  // 1 - Minimum output size in bytes
			// Blake2.BLOCK_SIZE       // 128 - Internal block size in bytes

			// Verify Blake2.SIZE is accessible via the namespace
			const { Blake2 } = Blake2Module;
			expect(Blake2.SIZE).toBe(64);
		});
	});

	describe("Type safety - BrandedBlake2", () => {
		it("should return branded type for 64-byte output", async () => {
			const { Blake2 } = await import("../../../src/crypto/Blake2/index.js");

			const hash = Blake2("test");

			// TypeScript would check the brand at compile time
			// At runtime, it's just a Uint8Array
			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(64);
		});
	});
});
