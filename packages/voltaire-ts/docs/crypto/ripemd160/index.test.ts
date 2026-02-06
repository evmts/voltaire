/**
 * Documentation tests for docs/crypto/ripemd160/index.mdx
 *
 * Tests all code examples from the RIPEMD160 documentation.
 * Validates API usage patterns and expected outputs.
 */

import { describe, expect, it } from "vitest";

describe("docs/crypto/ripemd160/index.mdx", () => {
	describe("Quick Start - Basic Hashing", () => {
		it("should hash string data", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// Hash string data
			const message = "Hello, Bitcoin!";
			const hash = RIPEMD160.hashString(message);
			// Uint8Array(20) [RIPEMD160 hash]

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(20);
		});

		it("should hash bytes", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// Hash bytes
			const data = new Uint8Array([1, 2, 3, 4, 5]);
			const bytesHash = RIPEMD160.hash(data);
			// Uint8Array(20)

			expect(bytesHash).toBeInstanceOf(Uint8Array);
			expect(bytesHash.length).toBe(20);
		});

		it("should support constructor pattern - auto-detects type", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// Constructor pattern - auto-detects type
			const autoHash = RIPEMD160.from("hello");
			// Uint8Array(20)

			expect(autoHash).toBeInstanceOf(Uint8Array);
			expect(autoHash.length).toBe(20);
		});
	});

	describe("Quick Start - Bitcoin Address", () => {
		it("should compute hash160 (SHA256 then RIPEMD160)", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);
			const { sha256 } = await import("@noble/hashes/sha2.js");

			// Bitcoin P2PKH address derivation (simplified)
			// Using a mock 65-byte uncompressed public key
			const publicKey = new Uint8Array(65);
			publicKey[0] = 0x04; // Uncompressed prefix

			// Step 1: SHA256 hash of public key
			const sha256Hash = sha256(publicKey);

			// Step 2: RIPEMD160 hash of SHA256 result (hash160)
			const hash160 = RIPEMD160.hash(sha256Hash);
			// Uint8Array(20) [public key hash for Bitcoin address]

			expect(hash160).toBeInstanceOf(Uint8Array);
			expect(hash160.length).toBe(20);
		});
	});

	describe("API Reference - RIPEMD160.hash", () => {
		it("should hash bytes and return 20-byte result", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// Hash bytes
			const hash1 = RIPEMD160.hash(new Uint8Array([1, 2, 3]));
			expect(hash1.length).toBe(20);
		});

		it("should hash string and return 20-byte result", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// Hash string
			const hash2 = RIPEMD160.hash("hello");
			expect(hash2.length).toBe(20);
		});
	});

	describe("API Reference - RIPEMD160.hashString", () => {
		it("should hash 'message digest' string", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			const hash = RIPEMD160.hashString("message digest");
			expect(hash.length).toBe(20);
		});
	});

	describe("API Reference - RIPEMD160.hashHex", () => {
		it("should hash hex string with 0x prefix", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			const hash = RIPEMD160.hashHex("0xdeadbeef");
			expect(hash.length).toBe(20);
		});
	});

	describe("API Reference - RIPEMD160.from", () => {
		it("should hash string via constructor pattern", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			const hash1 = RIPEMD160.from("hello");
			expect(hash1).toBeInstanceOf(Uint8Array);
			expect(hash1.length).toBe(20);
		});

		it("should hash bytes via constructor pattern", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			const hash2 = RIPEMD160.from(new Uint8Array([1, 2, 3]));
			expect(hash2).toBeInstanceOf(Uint8Array);
			expect(hash2.length).toBe(20);
		});
	});

	describe("Constants", () => {
		it("should export SIZE constant", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// RIPEMD160.SIZE  // 20 - Output size in bytes (160 bits)
			expect(RIPEMD160.SIZE).toBe(20);
		});
	});

	describe("Test Vectors - Official RIPEMD160", () => {
		it("should hash empty string correctly", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// Empty string
			const hash = RIPEMD160.hashString("");
			const expected = new Uint8Array([
				0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54, 0x61, 0x28,
				0x08, 0x97, 0x7e, 0xe8, 0xf5, 0x48, 0xb2, 0x25, 0x8d, 0x31,
			]);

			expect(hash).toEqual(expected);
		});

		it('should hash "a" correctly', async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// "a"
			const hash = RIPEMD160.hashString("a");
			const expected = new Uint8Array([
				0x0b, 0xdc, 0x9d, 0x2d, 0x25, 0x6b, 0x3e, 0xe9, 0xda, 0xae,
				0x34, 0x7b, 0xe6, 0xf4, 0xdc, 0x83, 0x5a, 0x46, 0x7f, 0xfe,
			]);

			expect(hash).toEqual(expected);
		});

		it('should hash "abc" correctly', async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// "abc"
			const hash = RIPEMD160.hashString("abc");
			const expected = new Uint8Array([
				0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a, 0x9b, 0x04,
				0x4a, 0x8e, 0x98, 0xc6, 0xb0, 0x87, 0xf1, 0x5a, 0x0b, 0xfc,
			]);

			expect(hash).toEqual(expected);
		});

		it('should hash "message digest" correctly', async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// "message digest"
			const hash = RIPEMD160.hashString("message digest");
			const expected = new Uint8Array([
				0x5d, 0x06, 0x89, 0xef, 0x49, 0xd2, 0xfa, 0xe5, 0x72, 0xb8,
				0x81, 0xb1, 0x23, 0xa8, 0x5f, 0xfa, 0x21, 0x59, 0x5f, 0x36,
			]);

			expect(hash).toEqual(expected);
		});

		it('should hash "abcdefghijklmnopqrstuvwxyz" correctly', async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// "abcdefghijklmnopqrstuvwxyz"
			const hash = RIPEMD160.hashString("abcdefghijklmnopqrstuvwxyz");
			const expected = new Uint8Array([
				0xf7, 0x1c, 0x27, 0x10, 0x9c, 0x69, 0x2c, 0x1b, 0x56, 0xbb,
				0xdc, 0xeb, 0x5b, 0x9d, 0x28, 0x65, 0xb3, 0x70, 0x8d, 0xbc,
			]);

			expect(hash).toEqual(expected);
		});

		it('should hash "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq" correctly', async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
			const hash = RIPEMD160.hashString(
				"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
			);
			const expected = new Uint8Array([
				0x12, 0xa0, 0x53, 0x38, 0x4a, 0x9c, 0x0c, 0x88, 0xe4, 0x05,
				0xa0, 0x6c, 0x27, 0xdc, 0xf4, 0x9a, 0xda, 0x62, 0xeb, 0x2b,
			]);

			expect(hash).toEqual(expected);
		});

		it('should hash "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" correctly', async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
			const hash = RIPEMD160.hashString(
				"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
			);
			const expected = new Uint8Array([
				0xb0, 0xe2, 0x0b, 0x6e, 0x31, 0x16, 0x64, 0x02, 0x86, 0xed,
				0x3a, 0x87, 0xa5, 0x71, 0x30, 0x79, 0xb2, 0x1f, 0x51, 0x89,
			]);

			expect(hash).toEqual(expected);
		});

		it("should hash eight repetitions of 1234567890 correctly", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// Eight repetitions of "1234567890"
			const hash = RIPEMD160.hashString(
				"12345678901234567890123456789012345678901234567890123456789012345678901234567890"
			);
			const expected = new Uint8Array([
				0x9b, 0x75, 0x2e, 0x45, 0x57, 0x3d, 0x4b, 0x39, 0xf4, 0xdb,
				0xd3, 0x32, 0x3c, 0xab, 0x82, 0xbf, 0x63, 0x32, 0x6b, 0xfb,
			]);

			expect(hash).toEqual(expected);
		});
	});

	describe("Use Cases - Bitcoin P2PKH Address", () => {
		it("should create pubkey hash for P2PKH", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);
			const { sha256 } = await import("@noble/hashes/sha2.js");

			function createPubKeyHash(publicKey: Uint8Array): Uint8Array {
				// Bitcoin uses SHA256 followed by RIPEMD160
				const sha256Hash = sha256(publicKey);
				const pubKeyHash = RIPEMD160.hash(sha256Hash);
				return pubKeyHash; // 20 bytes
			}

			// Test with a mock public key
			const mockPubKey = new Uint8Array(65);
			mockPubKey[0] = 0x04;

			const hash = createPubKeyHash(mockPubKey);
			expect(hash.length).toBe(20);
		});
	});

	describe("Use Cases - Bitcoin P2SH Address", () => {
		it("should create script hash for P2SH", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);
			const { sha256 } = await import("@noble/hashes/sha2.js");

			function createScriptHash(redeemScript: Uint8Array): Uint8Array {
				const sha256Hash = sha256(redeemScript);
				const scriptHash = RIPEMD160.hash(sha256Hash);
				return scriptHash; // 20 bytes
			}

			// Test with a mock redeem script
			const mockRedeemScript = new Uint8Array([
				0x52, 0x21, 0x03, 0x01, 0x02, 0x03,
			]);

			const hash = createScriptHash(mockRedeemScript);
			expect(hash.length).toBe(20);
		});
	});

	describe("API Discrepancies", () => {
		/**
		 * DOCUMENTED API DISCREPANCIES:
		 *
		 * 1. The docs show `RIPEMD160.SIZE` but the actual export is just `SIZE`
		 *    when importing individual exports. The namespace `Ripemd160Hash.SIZE`
		 *    works correctly.
		 *
		 * 2. The docs use `@tevm/voltaire/Ripemd160` import path which is the
		 *    published package path. Tests use relative path to source.
		 *
		 * 3. The docs mention `RIPEMD160.from()` but the actual implementation
		 *    exports both `from` function and `Ripemd160Hash` namespace which
		 *    has `.from()` method.
		 *
		 * 4. HEX_SIZE constant (40) is exported but not documented in the MDX.
		 */

		it("should verify HEX_SIZE constant exists (undocumented)", async () => {
			const RIPEMD160 = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// HEX_SIZE is exported but not documented in MDX
			expect(RIPEMD160.HEX_SIZE).toBe(40);
		});

		it("should verify Ripemd160Hash namespace works", async () => {
			const { Ripemd160Hash } = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// The namespace pattern works
			expect(Ripemd160Hash.SIZE).toBe(20);
			expect(Ripemd160Hash.HEX_SIZE).toBe(40);
			expect(typeof Ripemd160Hash.from).toBe("function");
			expect(typeof Ripemd160Hash.hash).toBe("function");
			expect(typeof Ripemd160Hash.hashString).toBe("function");
			expect(typeof Ripemd160Hash.hashHex).toBe("function");
		});

		it("should verify Ripemd160 alias exists (deprecated)", async () => {
			const { Ripemd160 } = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// Ripemd160 is deprecated alias for Ripemd160Hash
			expect(Ripemd160.SIZE).toBe(20);
			expect(typeof Ripemd160.from).toBe("function");
		});

		it("should verify fromString alias exists (undocumented)", async () => {
			const { Ripemd160Hash } = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// fromString is an alias for hashString (not documented)
			expect(typeof Ripemd160Hash.fromString).toBe("function");
			const hash1 = Ripemd160Hash.fromString("hello");
			const hash2 = Ripemd160Hash.hashString("hello");
			expect(hash1).toEqual(hash2);
		});

		it("should verify fromHex alias exists (undocumented)", async () => {
			const { Ripemd160Hash } = await import(
				"../../../src/crypto/Ripemd160/index.js"
			);

			// fromHex is an alias for hashHex (not documented)
			expect(typeof Ripemd160Hash.fromHex).toBe("function");
			const hash1 = Ripemd160Hash.fromHex("0xdeadbeef");
			const hash2 = Ripemd160Hash.hashHex("0xdeadbeef");
			expect(hash1).toEqual(hash2);
		});
	});
});
