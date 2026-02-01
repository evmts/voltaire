/**
 * Tests for docs/crypto/sha256/index.mdx
 *
 * Validates that all code examples in the SHA256 documentation work correctly.
 */
import { describe, expect, it } from "vitest";

describe("SHA256 Documentation - index.mdx", () => {
	describe("Quick Start - Basic Hashing", () => {
		it("should hash bytes", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");

			const data = new Uint8Array([1, 2, 3, 4, 5]);
			const hash = SHA256.hash(data);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("should hash string (UTF-8 encoded)", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const stringHash = SHA256.hashString("hello world");

			expect(stringHash.length).toBe(32);
			// Known SHA256 hash of "hello world"
			expect(Hex.fromBytes(stringHash)).toBe(
				"0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
			);
		});
	});

	describe("Test Vectors (NIST FIPS 180-4)", () => {
		it("empty string hash", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = SHA256.hashString("");

			expect(Hex.fromBytes(hash)).toBe(
				"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			);
		});

		it("'abc' hash", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = SHA256.hashString("abc");

			expect(Hex.fromBytes(hash)).toBe(
				"0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
			);
		});

		it("'hello world' hash", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = SHA256.hashString("hello world");

			expect(Hex.fromBytes(hash)).toBe(
				"0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
			);
		});

		it("448-bit message hash", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = SHA256.hashString(
				"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
			);

			expect(Hex.fromBytes(hash)).toBe(
				"0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
			);
		});

		it("896-bit message hash", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = SHA256.hashString(
				"abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
			);

			expect(Hex.fromBytes(hash)).toBe(
				"0xcf5b16a778af8380036ce59e7b049237" +
					"0b249b11e8f07a51afac45037afee9d1",
			);
		});
	});

	describe("Use Cases", () => {
		it("double SHA256 (Bitcoin style)", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");

			function doubleSha256(data: Uint8Array): Uint8Array {
				return SHA256.hash(SHA256.hash(data));
			}

			const data = new Uint8Array([1, 2, 3, 4, 5]);
			const doubleHash = doubleSha256(data);

			expect(doubleHash.length).toBe(32);
		});
	});

	describe("API Methods", () => {
		it("SHA256.hash should work", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");

			const hash = SHA256.hash(new Uint8Array([1, 2, 3]));
			expect(hash.length).toBe(32);
		});

		it("SHA256.hashString should work", async () => {
			const { SHA256 } = await import("../../../src/crypto/SHA256/index.js");

			const hash = SHA256.hashString("test");
			expect(hash.length).toBe(32);
		});
	});
});
