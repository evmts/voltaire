/**
 * SHA256.hashString tests
 *
 * Tests for the hashString function covering:
 * - String input handling
 * - UTF-8 encoding correctness
 * - Cross-validation with hash() function
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";

describe("SHA256 hashString function", () => {
	describe("basic string hashing", () => {
		it("should hash empty string", () => {
			const result = hashString("");
			expect(result.length).toBe(32);

			const hashEmpty = hash(new Uint8Array([]));
			expect(result).toEqual(hashEmpty);
		});

		it("should hash 'hello world'", () => {
			const result = hashString("hello world");

			const expected = new Uint8Array([
				0xb9, 0x4d, 0x27, 0xb9, 0x93, 0x4d, 0x3e, 0x08, 0xa5, 0x2e, 0x52, 0xd7,
				0xda, 0x7d, 0xab, 0xfa, 0xc4, 0x84, 0xef, 0xe3, 0x7a, 0x53, 0x80, 0xee,
				0x90, 0x88, 0xf7, 0xac, 0xe2, 0xef, 0xcd, 0xe9,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash 'abc'", () => {
			const result = hashString("abc");

			const expected = new Uint8Array([
				0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde,
				0x5d, 0xae, 0x22, 0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c,
				0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash 'The quick brown fox jumps over the lazy dog'", () => {
			const result = hashString("The quick brown fox jumps over the lazy dog");

			const expected = new Uint8Array([
				0xd7, 0xa8, 0xfb, 0xb3, 0x07, 0xd7, 0x80, 0x94, 0x69, 0xca, 0x9a, 0xbc,
				0xb0, 0x08, 0x2e, 0x4f, 0x8d, 0x56, 0x51, 0xe4, 0x6d, 0x3c, 0xdb, 0x76,
				0x2d, 0x02, 0xd0, 0xbf, 0x37, 0xc9, 0xe5, 0x92,
			]);

			expect(result).toEqual(expected);
		});
	});

	describe("UTF-8 encoding", () => {
		it("should handle UTF-8 strings correctly", () => {
			const result = hashString("Hello 世界 🌍");

			const manualBytes = new TextEncoder().encode("Hello 世界 🌍");
			const hashFromBytes = hash(manualBytes);

			expect(result).toEqual(hashFromBytes);
		});

		it("should handle emoji", () => {
			const result = hashString("🚀🔥💯");
			const manualBytes = new TextEncoder().encode("🚀🔥💯");

			expect(result).toEqual(hash(manualBytes));
		});

		it("should handle Chinese characters", () => {
			const result = hashString("中文测试");
			const manualBytes = new TextEncoder().encode("中文测试");

			expect(result).toEqual(hash(manualBytes));
		});

		it("should handle Arabic characters", () => {
			const result = hashString("مرحبا");
			const manualBytes = new TextEncoder().encode("مرحبا");

			expect(result).toEqual(hash(manualBytes));
		});

		it("should handle mixed Unicode", () => {
			const result = hashString("Hello世界🌍مرحبا");
			const manualBytes = new TextEncoder().encode("Hello世界🌍مرحبا");

			expect(result).toEqual(hash(manualBytes));
		});
	});

	describe("determinism", () => {
		it("should be deterministic", () => {
			const str = "test string";
			const hash1 = hashString(str);
			const hash2 = hashString(str);

			expect(hash1).toEqual(hash2);
		});

		it("should produce different hashes for different strings", () => {
			const hash1 = hashString("test1");
			const hash2 = hashString("test2");
			const hash3 = hashString("test12");

			expect(hash1).not.toEqual(hash2);
			expect(hash1).not.toEqual(hash3);
			expect(hash2).not.toEqual(hash3);
		});
	});

	describe("special characters", () => {
		it("should hash newline characters", () => {
			const result = hashString("line1\nline2");
			const manualBytes = new TextEncoder().encode("line1\nline2");

			expect(result).toEqual(hash(manualBytes));
		});

		it("should hash tab characters", () => {
			const result = hashString("col1\tcol2");
			const manualBytes = new TextEncoder().encode("col1\tcol2");

			expect(result).toEqual(hash(manualBytes));
		});

		it("should hash null byte (U+0000)", () => {
			const result = hashString("before\u0000after");
			const manualBytes = new TextEncoder().encode("before\u0000after");

			expect(result).toEqual(hash(manualBytes));
		});

		it("should hash control characters", () => {
			const result = hashString("\x01\x02\x03");
			const manualBytes = new TextEncoder().encode("\x01\x02\x03");

			expect(result).toEqual(hash(manualBytes));
		});
	});

	describe("cross-validation", () => {
		it("should match @noble for various strings", () => {
			const strings = [
				"",
				"a",
				"abc",
				"hello world",
				"The quick brown fox jumps over the lazy dog",
				"Hello 世界 🌍",
			];

			for (const str of strings) {
				const result = hashString(str);
				const expected = sha256(new TextEncoder().encode(str));
				expect(result).toEqual(expected);
			}
		});

		it("should match hash() for string inputs", () => {
			const testStrings = ["test", "hello", "", "a", "The quick brown fox"];

			for (const str of testStrings) {
				const result = hashString(str);
				const expected = hash(new TextEncoder().encode(str));
				expect(result).toEqual(expected);
			}
		});
	});

	describe("edge cases", () => {
		it("should hash very long string", () => {
			const longString = "a".repeat(10000);
			const result = hashString(longString);

			expect(result.length).toBe(32);

			const result2 = hashString(longString);
			expect(result).toEqual(result2);
		});

		it("should hash string with only spaces", () => {
			const result = hashString("   ");
			const manualBytes = new TextEncoder().encode("   ");

			expect(result).toEqual(hash(manualBytes));
		});

		it("should distinguish similar strings", () => {
			const hash1 = hashString("test ");
			const hash2 = hashString(" test");
			const hash3 = hashString("test");

			expect(hash1).not.toEqual(hash2);
			expect(hash1).not.toEqual(hash3);
			expect(hash2).not.toEqual(hash3);
		});
	});
});
