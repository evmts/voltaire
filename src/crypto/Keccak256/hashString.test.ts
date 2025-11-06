import { describe, expect, it } from "vitest";
import { keccak_256 } from "@noble/hashes/sha3";
import { hashString } from "./hashString.js";
import { hash } from "./hash.js";

describe("Keccak256.hashString", () => {
	describe("basic functionality", () => {
		it("should hash empty string", () => {
			const result = hashString("");

			// Should match hash of empty bytes
			const expected = hash(new Uint8Array(0));
			expect(result).toEqual(expected);
		});

		it("should hash single character", () => {
			const result = hashString("a");
			expect(result.length).toBe(32);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should hash ASCII string", () => {
			const result = hashString("hello world");
			expect(result.length).toBe(32);
		});

		it("should hash UTF-8 string", () => {
			const result = hashString("Hello, 世界!");
			expect(result.length).toBe(32);
		});
	});

	describe("UTF-8 encoding", () => {
		it("should properly encode emoji", () => {
			const str = "Hello 👋";
			const result = hashString(str);

			// Should match manual UTF-8 encoding
			const encoded = new TextEncoder().encode(str);
			const expected = hash(encoded);

			expect(result).toEqual(expected);
		});

		it("should properly encode multi-byte characters", () => {
			const str = "日本語";
			const result = hashString(str);

			const encoded = new TextEncoder().encode(str);
			const expected = hash(encoded);

			expect(result).toEqual(expected);
		});

		it("should handle various Unicode ranges", () => {
			const strings = [
				"ASCII",
				"Héllo", // Latin extended
				"Привет", // Cyrillic
				"你好", // Chinese
				"مرحبا", // Arabic
				"🚀🌟", // Emoji
			];

			for (const str of strings) {
				const result = hashString(str);
				expect(result.length).toBe(32);

				// Verify UTF-8 encoding
				const encoded = new TextEncoder().encode(str);
				const expected = hash(encoded);
				expect(result).toEqual(expected);
			}
		});
	});

	describe("known test vectors", () => {
		it("should hash 'abc' correctly", () => {
			const result = hashString("abc");

			// Official Keccak-256("abc")
			const expected = new Uint8Array([
				0x4e, 0x03, 0x65, 0x7a, 0xea, 0x45, 0xa9, 0x4f, 0xc7, 0xd4, 0x7b, 0xa8,
				0x26, 0xc8, 0xd6, 0x67, 0xc0, 0xd1, 0xe6, 0xe3, 0x3a, 0x64, 0xa0, 0x36,
				0xec, 0x44, 0xf5, 0x8f, 0xa1, 0x2d, 0x6c, 0x45,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash Ethereum function signature", () => {
			const result = hashString("transfer(address,uint256)");
			expect(result.length).toBe(32);

			// First 4 bytes are the selector 0xa9059cbb
			expect(result[0]).toBe(0xa9);
			expect(result[1]).toBe(0x05);
			expect(result[2]).toBe(0x9c);
			expect(result[3]).toBe(0xbb);
		});

		it("should hash Ethereum event signature", () => {
			const result = hashString("Transfer(address,address,uint256)");
			expect(result.length).toBe(32);

			// This is the Transfer event topic
			expect(result[0]).toBe(0xdd);
			expect(result[1]).toBe(0xf2);
			expect(result[2]).toBe(0x52);
			expect(result[3]).toBe(0xad);
		});
	});

	describe("determinism", () => {
		it("should produce same hash for same string", () => {
			const str = "test string";

			const hash1 = hashString(str);
			const hash2 = hashString(str);

			expect(hash1).toEqual(hash2);
		});

		it("should produce different hashes for different strings", () => {
			const hash1 = hashString("test1");
			const hash2 = hashString("test2");

			expect(hash1).not.toEqual(hash2);
		});

		it("should be case-sensitive", () => {
			const hash1 = hashString("test");
			const hash2 = hashString("Test");
			const hash3 = hashString("TEST");

			expect(hash1).not.toEqual(hash2);
			expect(hash1).not.toEqual(hash3);
			expect(hash2).not.toEqual(hash3);
		});
	});

	describe("various string lengths", () => {
		it("should hash short string", () => {
			const result = hashString("a");
			expect(result.length).toBe(32);
		});

		it("should hash medium string", () => {
			const result = hashString("The quick brown fox jumps over the lazy dog");
			expect(result.length).toBe(32);
		});

		it("should hash long string", () => {
			const longStr = "a".repeat(1000);
			const result = hashString(longStr);
			expect(result.length).toBe(32);
		});

		it("should hash very long string", () => {
			const veryLongStr = "Hello, World! ".repeat(1000);
			const result = hashString(veryLongStr);
			expect(result.length).toBe(32);
		});
	});

	describe("special characters", () => {
		it("should hash string with newlines", () => {
			const result = hashString("line1\nline2\nline3");
			expect(result.length).toBe(32);
		});

		it("should hash string with tabs", () => {
			const result = hashString("col1\tcol2\tcol3");
			expect(result.length).toBe(32);
		});

		it("should hash string with null bytes", () => {
			const result = hashString("before\x00after");
			expect(result.length).toBe(32);
		});

		it("should hash string with escape sequences", () => {
			const result = hashString('test\\n\\t\\r"');
			expect(result.length).toBe(32);
		});
	});

	describe("cross-validation with @noble/hashes", () => {
		it("should match @noble for various strings", () => {
			const testStrings = [
				"",
				"a",
				"hello",
				"The quick brown fox jumps over the lazy dog",
				"Ethereum",
				"Hello, 世界!",
				"🚀🌟💻",
			];

			for (const str of testStrings) {
				const ourHash = hashString(str);
				const encoded = new TextEncoder().encode(str);
				const nobleHash = keccak_256(encoded);

				expect(ourHash).toEqual(nobleHash);
			}
		});
	});

	describe("Ethereum use cases", () => {
		it("should hash Solidity function signatures", () => {
			const signatures = [
				"transfer(address,uint256)",
				"approve(address,uint256)",
				"balanceOf(address)",
				"totalSupply()",
			];

			for (const sig of signatures) {
				const result = hashString(sig);
				expect(result.length).toBe(32);
			}
		});

		it("should hash Solidity event signatures", () => {
			const signatures = [
				"Transfer(address,address,uint256)",
				"Approval(address,address,uint256)",
			];

			for (const sig of signatures) {
				const result = hashString(sig);
				expect(result.length).toBe(32);
			}
		});

		it("should hash personal sign messages", () => {
			const message = "I agree to the terms and conditions";
			const result = hashString(message);
			expect(result.length).toBe(32);
		});

		it("should hash EIP-712 domain separators", () => {
			const domain = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
			const result = hashString(domain);
			expect(result.length).toBe(32);
		});
	});

	describe("whitespace handling", () => {
		it("should distinguish leading whitespace", () => {
			const hash1 = hashString("test");
			const hash2 = hashString(" test");
			const hash3 = hashString("  test");

			expect(hash1).not.toEqual(hash2);
			expect(hash1).not.toEqual(hash3);
			expect(hash2).not.toEqual(hash3);
		});

		it("should distinguish trailing whitespace", () => {
			const hash1 = hashString("test");
			const hash2 = hashString("test ");
			const hash3 = hashString("test  ");

			expect(hash1).not.toEqual(hash2);
			expect(hash1).not.toEqual(hash3);
			expect(hash2).not.toEqual(hash3);
		});

		it("should distinguish internal whitespace", () => {
			const hash1 = hashString("hello world");
			const hash2 = hashString("hello  world");
			const hash3 = hashString("helloworld");

			expect(hash1).not.toEqual(hash2);
			expect(hash1).not.toEqual(hash3);
			expect(hash2).not.toEqual(hash3);
		});
	});
});
