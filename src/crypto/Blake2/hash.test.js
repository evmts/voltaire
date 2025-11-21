/**
 * Blake2.hash tests
 *
 * Tests for the hash function covering:
 * - Variable output length (1-64 bytes)
 * - Known RFC 7693 test vectors
 * - String and Uint8Array inputs
 * - Edge cases and validation
 * - Cross-validation against @noble/hashes
 */

import { blake2b } from "@noble/hashes/blake2.js";
import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";

describe("Blake2 hash function", () => {
	describe("default 64-byte output", () => {
		it("should hash empty input with default 64-byte output", () => {
			const result = hash(new Uint8Array([]));
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);

			const expected = new Uint8Array([
				0x78, 0x6a, 0x02, 0xf7, 0x42, 0x01, 0x59, 0x03, 0xc6, 0xc6, 0xfd, 0x85,
				0x25, 0x52, 0xd2, 0x72, 0x91, 0x2f, 0x47, 0x40, 0xe1, 0x58, 0x47, 0x61,
				0x8a, 0x86, 0xe2, 0x17, 0xf7, 0x1f, 0x54, 0x19, 0xd2, 0x5e, 0x10, 0x31,
				0xaf, 0xee, 0x58, 0x53, 0x13, 0x89, 0x64, 0x44, 0x93, 0x4e, 0xb0, 0x4b,
				0x90, 0x3a, 0x68, 0x5b, 0x14, 0x48, 0xb7, 0x55, 0xd5, 0x6f, 0x70, 0x1a,
				0xfe, 0x9b, 0xe2, 0xce,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash 'abc' with 64-byte output", () => {
			const result = hash(new Uint8Array([0x61, 0x62, 0x63]));
			expect(result.length).toBe(64);

			const expected = new Uint8Array([
				0xba, 0x80, 0xa5, 0x3f, 0x98, 0x1c, 0x4d, 0x0d, 0x6a, 0x27, 0x97, 0xb6,
				0x9f, 0x12, 0xf6, 0xe9, 0x4c, 0x21, 0x2f, 0x14, 0x68, 0x5a, 0xc4, 0xb7,
				0x4b, 0x12, 0xbb, 0x6f, 0xdb, 0xff, 0xa2, 0xd1, 0x7d, 0x87, 0xc5, 0x39,
				0x2a, 0xab, 0x79, 0x2d, 0xc2, 0x52, 0xd5, 0xde, 0x45, 0x33, 0xcc, 0x95,
				0x18, 0xd3, 0x8a, 0xa8, 0xdb, 0xf1, 0x92, 0x5a, 0xb9, 0x23, 0x86, 0xed,
				0xd4, 0x00, 0x99, 0x23,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash Uint8Array input", () => {
			const input = new Uint8Array([1, 2, 3, 4, 5]);
			const result = hash(input);

			expect(result.length).toBe(64);
			expect(result).toEqual(blake2b(input, { dkLen: 64 }));
		});
	});

	describe("string input", () => {
		it("should hash string input", () => {
			const result = hash("abc");
			expect(result.length).toBe(64);

			const hashFromBytes = hash(new Uint8Array([0x61, 0x62, 0x63]));
			expect(result).toEqual(hashFromBytes);
		});

		it("should hash empty string", () => {
			const result = hash("");
			expect(result.length).toBe(64);

			const hashEmpty = hash(new Uint8Array([]));
			expect(result).toEqual(hashEmpty);
		});

		it("should hash UTF-8 string", () => {
			const result = hash("Hello 世界 🌍");

			const manualBytes = new TextEncoder().encode("Hello 世界 🌍");
			const hashFromBytes = hash(manualBytes);

			expect(result).toEqual(hashFromBytes);
		});

		it("should hash long string", () => {
			const longString = "The quick brown fox jumps over the lazy dog";
			const result = hash(longString);

			expect(result.length).toBe(64);

			const result2 = hash(longString);
			expect(result).toEqual(result2);
		});
	});

	describe("variable output length", () => {
		it("should hash with 32-byte output (BLAKE2b-256)", () => {
			const result = hash(new Uint8Array([]), 32);
			expect(result.length).toBe(32);

			const expected = new Uint8Array([
				0x0e, 0x57, 0x51, 0xc0, 0x26, 0xe5, 0x43, 0xb2, 0xe8, 0xab, 0x2e, 0xb0,
				0x60, 0x99, 0xda, 0xa1, 0xd1, 0xe5, 0xdf, 0x47, 0x77, 0x8f, 0x77, 0x87,
				0xfa, 0xab, 0x45, 0xcd, 0xf1, 0x2f, 0xe3, 0xa8,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash with 48-byte output", () => {
			const result = hash(new Uint8Array([]), 48);
			expect(result.length).toBe(48);

			const hash32 = hash(new Uint8Array([]), 32);
			const hash64 = hash(new Uint8Array([]), 64);

			expect(result).not.toEqual(hash32);
			expect(result).not.toEqual(hash64.slice(0, 48));
		});

		it("should hash with minimum output length (1 byte)", () => {
			const result = hash(new Uint8Array([0x61, 0x62, 0x63]), 1);
			expect(result.length).toBe(1);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should hash with maximum output length (64 bytes)", () => {
			const result = hash(new Uint8Array([0x61, 0x62, 0x63]), 64);
			expect(result.length).toBe(64);
		});

		it("should produce different hashes for different output lengths", () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]);

			const hash20 = hash(input, 20);
			const hash32 = hash(input, 32);
			const hash48 = hash(input, 48);
			const hash64 = hash(input, 64);

			expect(hash20.length).toBe(20);
			expect(hash32.length).toBe(32);
			expect(hash48.length).toBe(48);
			expect(hash64.length).toBe(64);

			expect(hash20).not.toEqual(hash32.slice(0, 20));
			expect(hash32).not.toEqual(hash48.slice(0, 32));
			expect(hash48).not.toEqual(hash64.slice(0, 48));
		});
	});

	describe("output length validation", () => {
		it("should throw error for invalid output length (too small)", () => {
			expect(() => hash(new Uint8Array([]), 0)).toThrow(
				"Invalid output length: 0. Must be between 1 and 64 bytes.",
			);

			expect(() => hash(new Uint8Array([]), -1)).toThrow(
				"Invalid output length: -1. Must be between 1 and 64 bytes.",
			);
		});

		it("should throw error for invalid output length (too large)", () => {
			expect(() => hash(new Uint8Array([]), 65)).toThrow(
				"Invalid output length: 65. Must be between 1 and 64 bytes.",
			);

			expect(() => hash(new Uint8Array([]), 100)).toThrow(
				"Invalid output length: 100. Must be between 1 and 64 bytes.",
			);
		});

		it("should accept all valid output lengths (1-64)", () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]);

			for (let len = 1; len <= 64; len++) {
				const result = hash(input, len);
				expect(result.length).toBe(len);
			}
		});
	});

	describe("RFC 7693 test vectors", () => {
		it("should match RFC 7693 vector for empty input", () => {
			const result = hash(new Uint8Array([]), 64);

			const expected = new Uint8Array([
				0x78, 0x6a, 0x02, 0xf7, 0x42, 0x01, 0x59, 0x03, 0xc6, 0xc6, 0xfd, 0x85,
				0x25, 0x52, 0xd2, 0x72, 0x91, 0x2f, 0x47, 0x40, 0xe1, 0x58, 0x47, 0x61,
				0x8a, 0x86, 0xe2, 0x17, 0xf7, 0x1f, 0x54, 0x19, 0xd2, 0x5e, 0x10, 0x31,
				0xaf, 0xee, 0x58, 0x53, 0x13, 0x89, 0x64, 0x44, 0x93, 0x4e, 0xb0, 0x4b,
				0x90, 0x3a, 0x68, 0x5b, 0x14, 0x48, 0xb7, 0x55, 0xd5, 0x6f, 0x70, 0x1a,
				0xfe, 0x9b, 0xe2, 0xce,
			]);

			expect(result).toEqual(expected);
		});

		it("should match RFC 7693 vector for 'abc'", () => {
			const result = hash(new Uint8Array([0x61, 0x62, 0x63]), 64);

			const expected = new Uint8Array([
				0xba, 0x80, 0xa5, 0x3f, 0x98, 0x1c, 0x4d, 0x0d, 0x6a, 0x27, 0x97, 0xb6,
				0x9f, 0x12, 0xf6, 0xe9, 0x4c, 0x21, 0x2f, 0x14, 0x68, 0x5a, 0xc4, 0xb7,
				0x4b, 0x12, 0xbb, 0x6f, 0xdb, 0xff, 0xa2, 0xd1, 0x7d, 0x87, 0xc5, 0x39,
				0x2a, 0xab, 0x79, 0x2d, 0xc2, 0x52, 0xd5, 0xde, 0x45, 0x33, 0xcc, 0x95,
				0x18, 0xd3, 0x8a, 0xa8, 0xdb, 0xf1, 0x92, 0x5a, 0xb9, 0x23, 0x86, 0xed,
				0xd4, 0x00, 0x99, 0x23,
			]);

			expect(result).toEqual(expected);
		});

		it("should match test vector for single byte 0x00", () => {
			const result = hash(new Uint8Array([0x00]), 64);

			const expected = new Uint8Array([
				0x2f, 0xa3, 0xf6, 0x86, 0xdf, 0x87, 0x69, 0x95, 0x16, 0x7e, 0x7c, 0x2e,
				0x5d, 0x74, 0xc4, 0xc7, 0xb6, 0xe4, 0x8f, 0x80, 0x68, 0xfe, 0x0e, 0x44,
				0x20, 0x83, 0x44, 0xd4, 0x80, 0xf7, 0x90, 0x4c, 0x36, 0x96, 0x3e, 0x44,
				0x11, 0x5f, 0xe3, 0xeb, 0x2a, 0x3a, 0xc8, 0x69, 0x4c, 0x28, 0xbc, 0xb4,
				0xf5, 0xa0, 0xf3, 0x27, 0x6f, 0x2e, 0x79, 0x48, 0x7d, 0x82, 0x19, 0x05,
				0x7a, 0x50, 0x6e, 0x4b,
			]);

			expect(result).toEqual(expected);
		});

		it("should match test vector for two bytes 0x00 0x01", () => {
			const result = hash(new Uint8Array([0x00, 0x01]), 64);

			const expected = new Uint8Array([
				0x1c, 0x08, 0x79, 0x8d, 0xc6, 0x41, 0xab, 0xa9, 0xde, 0xe4, 0x35, 0xe2,
				0x25, 0x19, 0xa4, 0x72, 0x9a, 0x09, 0xb2, 0xbf, 0xe0, 0xff, 0x00, 0xef,
				0x2d, 0xcd, 0x8e, 0xd6, 0xf8, 0xa0, 0x7d, 0x15, 0xea, 0xf4, 0xae, 0xe5,
				0x2b, 0xbf, 0x18, 0xab, 0x56, 0x08, 0xa6, 0x19, 0x0f, 0x70, 0xb9, 0x04,
				0x86, 0xc8, 0xa7, 0xd4, 0x87, 0x37, 0x10, 0xb1, 0x11, 0x5d, 0x3d, 0xeb,
				0xbb, 0x43, 0x27, 0xb5,
			]);

			expect(result).toEqual(expected);
		});
	});

	describe("determinism", () => {
		it("should be deterministic", () => {
			const input = new Uint8Array([1, 2, 3, 4, 5]);
			const hash1 = hash(input);
			const hash2 = hash(input);

			expect(hash1).toEqual(hash2);
		});

		it("should be deterministic with custom output length", () => {
			const input = new Uint8Array([1, 2, 3]);
			const hash1 = hash(input, 32);
			const hash2 = hash(input, 32);

			expect(hash1).toEqual(hash2);
		});

		it("should produce different hashes for different inputs", () => {
			const hash1 = hash(new Uint8Array([0x00]));
			const hash2 = hash(new Uint8Array([0x01]));
			const hash3 = hash(new Uint8Array([0x00, 0x00]));

			expect(hash1).not.toEqual(hash2);
			expect(hash1).not.toEqual(hash3);
			expect(hash2).not.toEqual(hash3);
		});
	});

	describe("large inputs", () => {
		it("should hash 1000-byte input", () => {
			const input = new Uint8Array(1000).fill(0x42);
			const result = hash(input);

			expect(result.length).toBe(64);

			const result2 = hash(input);
			expect(result).toEqual(result2);
		});

		it("should hash 1MB input", () => {
			const largeInput = new Uint8Array(1024 * 1024);
			for (let i = 0; i < largeInput.length; i++) {
				largeInput[i] = i & 0xff;
			}

			const result = hash(largeInput);
			expect(result.length).toBe(64);

			const result2 = hash(largeInput);
			expect(result).toEqual(result2);
		});
	});

	describe("edge cases", () => {
		it("should exhibit avalanche effect", () => {
			const input1 = new Uint8Array(100).fill(0);
			const input2 = new Uint8Array(100).fill(0);
			input2[99] = 1;

			const hash1 = hash(input1);
			const hash2 = hash(input2);

			expect(hash1).not.toEqual(hash2);

			let differentBytes = 0;
			for (let i = 0; i < hash1.length; i++) {
				if (hash1[i] !== hash2[i]) differentBytes++;
			}

			expect(differentBytes).toBeGreaterThanOrEqual(16);
		});

		it("should hash all-zero input", () => {
			const input = new Uint8Array(64).fill(0);
			const result = hash(input);

			expect(result.length).toBe(64);
			expect(result).toEqual(blake2b(input, { dkLen: 64 }));
		});

		it("should hash all-ones input", () => {
			const input = new Uint8Array(64).fill(0xff);
			const result = hash(input);

			expect(result.length).toBe(64);
			expect(result).toEqual(blake2b(input, { dkLen: 64 }));
		});
	});

	describe("cross-validation with @noble/hashes", () => {
		it("should match @noble for empty input", () => {
			const input = new Uint8Array([]);
			expect(hash(input)).toEqual(blake2b(input, { dkLen: 64 }));
		});

		it("should match @noble for various input sizes", () => {
			const sizes = [1, 10, 32, 64, 100, 128, 256, 512, 1024];

			for (const size of sizes) {
				const input = new Uint8Array(size);
				for (let i = 0; i < size; i++) {
					input[i] = (i * 7) & 0xff;
				}

				expect(hash(input)).toEqual(blake2b(input, { dkLen: 64 }));
			}
		});

		it("should match @noble for various output lengths", () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]);

			for (const len of [1, 20, 32, 48, 64]) {
				expect(hash(input, len)).toEqual(blake2b(input, { dkLen: len }));
			}
		});

		it("should match @noble for string inputs", () => {
			const strings = ["", "a", "abc", "hello world"];

			for (const str of strings) {
				const strBytes = new TextEncoder().encode(str);
				expect(hash(str)).toEqual(blake2b(strBytes, { dkLen: 64 }));
			}
		});
	});
});
