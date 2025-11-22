/**
 * Ripemd160.hash tests
 *
 * Tests for the hash function covering:
 * - Official RIPEMD160 test vectors
 * - String and Uint8Array inputs
 * - Edge cases and boundary conditions
 * - Bitcoin use cases (hash160)
 * - Cross-validation against @noble/hashes
 */

import { ripemd160 } from "@noble/hashes/legacy.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";

describe("Ripemd160 hash function", () => {
	describe("official test vectors", () => {
		it("should hash empty input", () => {
			const result = hash(new Uint8Array([]));
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(20);

			const expected = new Uint8Array([
				0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54, 0x61, 0x28, 0x08, 0x97,
				0x7e, 0xe8, 0xf5, 0x48, 0xb2, 0x25, 0x8d, 0x31,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash single byte 'a'", () => {
			const input = new Uint8Array([0x61]);
			const result = hash(input);

			const expected = new Uint8Array([
				0x0b, 0xdc, 0x9d, 0x2d, 0x25, 0x6b, 0x3e, 0xe9, 0xda, 0xae, 0x34, 0x7b,
				0xe6, 0xf4, 0xdc, 0x83, 0x5a, 0x46, 0x7f, 0xfe,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash 'abc'", () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]);
			const result = hash(input);

			const expected = new Uint8Array([
				0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a, 0x9b, 0x04, 0x4a, 0x8e,
				0x98, 0xc6, 0xb0, 0x87, 0xf1, 0x5a, 0x0b, 0xfc,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash 'message digest'", () => {
			const input = new TextEncoder().encode("message digest");
			const result = hash(input);

			const expected = new Uint8Array([
				0x5d, 0x06, 0x89, 0xef, 0x49, 0xd2, 0xfa, 0xe5, 0x72, 0xb8, 0x81, 0xb1,
				0x23, 0xa8, 0x5f, 0xfa, 0x21, 0x59, 0x5f, 0x36,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash lowercase alphabet", () => {
			const input = new TextEncoder().encode("abcdefghijklmnopqrstuvwxyz");
			const result = hash(input);

			const expected = new Uint8Array([
				0xf7, 0x1c, 0x27, 0x10, 0x9c, 0x69, 0x2c, 0x1b, 0x56, 0xbb, 0xdc, 0xeb,
				0x5b, 0x9d, 0x28, 0x65, 0xb3, 0x70, 0x8d, 0xbc,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash alphanumeric string", () => {
			const input = new TextEncoder().encode(
				"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
			);
			const result = hash(input);

			const expected = new Uint8Array([
				0x12, 0xa0, 0x53, 0x38, 0x4a, 0x9c, 0x0c, 0x88, 0xe4, 0x05, 0xa0, 0x6c,
				0x27, 0xdc, 0xf4, 0x9a, 0xda, 0x62, 0xeb, 0x2b,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash mixed case alphanumeric", () => {
			const input = new TextEncoder().encode(
				"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			);
			const result = hash(input);

			const expected = new Uint8Array([
				0xb0, 0xe2, 0x0b, 0x6e, 0x31, 0x16, 0x64, 0x02, 0x86, 0xed, 0x3a, 0x87,
				0xa5, 0x71, 0x30, 0x79, 0xb2, 0x1f, 0x51, 0x89,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash repeated digits (80 bytes)", () => {
			const input = new TextEncoder().encode(
				"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			);
			const result = hash(input);

			const expected = new Uint8Array([
				0x9b, 0x75, 0x2e, 0x45, 0x57, 0x3d, 0x4b, 0x39, 0xf4, 0xdb, 0xd3, 0x32,
				0x3c, 0xab, 0x82, 0xbf, 0x63, 0x32, 0x6b, 0xfb,
			]);

			expect(result).toEqual(expected);
		});

		it("should hash 'The quick brown fox jumps over the lazy dog'", () => {
			const input = new TextEncoder().encode(
				"The quick brown fox jumps over the lazy dog",
			);
			const result = hash(input);

			const expected = new Uint8Array([
				0x37, 0xf3, 0x32, 0xf6, 0x8d, 0xb7, 0x7b, 0xd9, 0xd7, 0xed, 0xd4, 0x96,
				0x95, 0x71, 0xad, 0x67, 0x1c, 0xf9, 0xdd, 0x3b,
			]);

			expect(result).toEqual(expected);
		});
	});

	describe("string input", () => {
		it("should accept string input", () => {
			const result = hash("abc");
			expect(result.length).toBe(20);

			const hashFromBytes = hash(new Uint8Array([0x61, 0x62, 0x63]));
			expect(result).toEqual(hashFromBytes);
		});

		it("should hash empty string", () => {
			const result = hash("");
			expect(result.length).toBe(20);

			const hashEmpty = hash(new Uint8Array([]));
			expect(result).toEqual(hashEmpty);
		});

		it("should hash UTF-8 string", () => {
			const result = hash("Hello 世界 🌍");

			const manualBytes = new TextEncoder().encode("Hello 世界 🌍");
			const hashFromBytes = hash(manualBytes);

			expect(result).toEqual(hashFromBytes);
		});
	});

	describe("determinism", () => {
		it("should be deterministic", () => {
			const input = new Uint8Array([1, 2, 3, 4, 5]);
			const hash1 = hash(input);
			const hash2 = hash(input);

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

	describe("edge cases", () => {
		it("should hash single byte 0x00", () => {
			const input = new Uint8Array([0x00]);
			const result = hash(input);

			expect(result).toEqual(ripemd160(input));
			expect(result.length).toBe(20);
		});

		it("should hash single byte 0xFF", () => {
			const input = new Uint8Array([0xff]);
			const result = hash(input);

			expect(result).toEqual(ripemd160(input));
			expect(result.length).toBe(20);
		});

		it("should hash exactly 64 bytes (one block)", () => {
			const input = new Uint8Array(64).fill(0x61);
			const result = hash(input);

			expect(result).toEqual(ripemd160(input));
			expect(result.length).toBe(20);
		});

		it("should hash exactly 128 bytes (two blocks)", () => {
			const input = new Uint8Array(128).fill(0x61);
			const result = hash(input);

			expect(result).toEqual(ripemd160(input));
			expect(result.length).toBe(20);
		});

		it("should hash boundary: 55 bytes", () => {
			const input = new Uint8Array(55).fill(0x61);
			const result = hash(input);

			expect(result).toEqual(ripemd160(input));
			expect(result.length).toBe(20);
		});

		it("should hash boundary: 56 bytes", () => {
			const input = new Uint8Array(56).fill(0x61);
			const result = hash(input);

			expect(result).toEqual(ripemd160(input));
			expect(result.length).toBe(20);
		});

		it("should hash all byte values", () => {
			const input = new Uint8Array(256);
			for (let i = 0; i < 256; i++) {
				input[i] = i;
			}

			const result = hash(input);
			expect(result.length).toBe(20);
			expect(result).toEqual(ripemd160(input));
		});

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

			expect(differentBytes).toBeGreaterThanOrEqual(10);
		});
	});

	describe("large inputs", () => {
		it("should hash 1000-byte input", () => {
			const input = new Uint8Array(1000);
			for (let i = 0; i < input.length; i++) {
				input[i] = (i * 7) & 0xff;
			}

			const result = hash(input);
			expect(result.length).toBe(20);

			const result2 = hash(input);
			expect(result).toEqual(result2);
		});

		it("should hash 1MB input", () => {
			const size = 1024 * 1024;
			const input = new Uint8Array(size);

			for (let i = 0; i < size; i++) {
				input[i] = (i * 13 + 7) & 0xff;
			}

			const result = hash(input);
			expect(result.length).toBe(20);

			const result2 = hash(input);
			expect(result).toEqual(result2);
		});

		it("should hash multi-block message (>64 bytes)", () => {
			const input = new TextEncoder().encode(
				"The quick brown fox jumps over the lazy dog. " +
					"This message is longer than 64 bytes to test multi-block processing.",
			);

			const result = hash(input);

			expect(result).toEqual(ripemd160(input));
			expect(result.length).toBe(20);
		});
	});

	describe("Bitcoin use cases", () => {
		it("should compute hash160 (SHA256 then RIPEMD160)", () => {
			const input = new TextEncoder().encode("test");

			const sha256Hash = sha256(input);
			const hash160 = hash(sha256Hash);

			expect(hash160.length).toBe(20);

			const expectedHash160 = ripemd160(sha256Hash);
			expect(hash160).toEqual(expectedHash160);
		});

		it("should compute hash160 for Bitcoin public key", () => {
			const pubkey = new Uint8Array([
				0x04, 0x11, 0xdb, 0x93, 0xe1, 0xdc, 0xdb, 0x8a, 0x01, 0x6b, 0x49, 0x84,
				0x0f, 0x8c, 0x53, 0xbc, 0x1e, 0xb6, 0x8a, 0x38, 0x2e, 0x97, 0xb1, 0x48,
				0x2e, 0xca, 0xd7, 0xb1, 0x48, 0xa6, 0x90, 0x9a, 0x5c, 0xb2, 0xe0, 0xea,
				0xdd, 0xfb, 0x84, 0xcc, 0xf9, 0x74, 0x44, 0x64, 0xf8, 0x2e, 0x16, 0x0b,
				0xfa, 0x9b, 0x8b, 0x64, 0xf9, 0xd4, 0xc0, 0x3f, 0x99, 0x9b, 0x86, 0x43,
				0xf6, 0x56, 0xb4, 0x12, 0xa3,
			]);

			const sha256Hash = sha256(pubkey);
			const hash160 = hash(sha256Hash);

			expect(hash160.length).toBe(20);

			const expectedHash160 = ripemd160(sha256Hash);
			expect(hash160).toEqual(expectedHash160);
		});

		it("should compute hash160 for compressed public key", () => {
			const compressedPubkey = new Uint8Array([
				0x02, 0x11, 0xdb, 0x93, 0xe1, 0xdc, 0xdb, 0x8a, 0x01, 0x6b, 0x49, 0x84,
				0x0f, 0x8c, 0x53, 0xbc, 0x1e, 0xb6, 0x8a, 0x38, 0x2e, 0x97, 0xb1, 0x48,
				0x2e, 0xca, 0xd7, 0xb1, 0x48, 0xa6, 0x90, 0x9a, 0x5c,
			]);

			const sha256Hash = sha256(compressedPubkey);
			const hash160 = hash(sha256Hash);

			expect(hash160.length).toBe(20);

			const expectedHash160 = ripemd160(sha256Hash);
			expect(hash160).toEqual(expectedHash160);
		});

		it("should compute hash160 for genesis block pubkey", () => {
			const genesisPubKey = new Uint8Array([
				0x04, 0x67, 0x8a, 0xfd, 0xb0, 0xfe, 0x55, 0x48, 0x27, 0x19, 0x67, 0xf1,
				0xa6, 0x71, 0x30, 0xb7, 0x10, 0x5c, 0xd6, 0xa8, 0x28, 0xe0, 0x39, 0x09,
				0xa6, 0x79, 0x62, 0xe0, 0xea, 0x1f, 0x61, 0xde, 0xb6, 0x49, 0xf6, 0xbc,
				0x3f, 0x4c, 0xef, 0x38, 0xc4, 0xf3, 0x55, 0x04, 0xe5, 0x1e, 0xc1, 0x12,
				0xde, 0x5c, 0x38, 0x4d, 0xf7, 0xba, 0x0b, 0x8d, 0x57, 0x8a, 0x4c, 0x70,
				0x2b, 0x6b, 0xf1, 0x1d, 0x5f,
			]);

			const sha256Hash = sha256(genesisPubKey);
			const hash160 = hash(sha256Hash);

			expect(hash160.length).toBe(20);

			const expected = new Uint8Array([
				0x62, 0xe9, 0x07, 0xb1, 0x5c, 0xbf, 0x27, 0xd5, 0x42, 0x53, 0x99, 0xeb,
				0xf6, 0xf0, 0xfb, 0x50, 0xeb, 0xb8, 0x8f, 0x18,
			]);

			expect(hash160).toEqual(expected);
		});

		it("should be deterministic for repeated hash160 operations", () => {
			const input = new TextEncoder().encode("test data");

			const results = [];
			for (let i = 0; i < 10; i++) {
				const sha256Hash = sha256(input);
				const hash160 = hash(sha256Hash);
				results.push(hash160);
			}

			for (let i = 1; i < results.length; i++) {
				expect(results[i]).toEqual(results[0]);
			}
		});
	});

	describe("cross-validation with @noble/hashes", () => {
		it("should match @noble for empty input", () => {
			const input = new Uint8Array([]);
			expect(hash(input)).toEqual(ripemd160(input));
		});

		it("should match @noble for various input sizes", () => {
			const sizes = [1, 10, 20, 32, 55, 56, 64, 65, 100, 128, 256, 512, 1024];

			for (const size of sizes) {
				const input = new Uint8Array(size);
				for (let i = 0; i < size; i++) {
					input[i] = (i * 7) & 0xff;
				}

				expect(hash(input)).toEqual(ripemd160(input));
			}
		});

		it("should match @noble for string inputs", () => {
			const strings = [
				"",
				"a",
				"abc",
				"hello",
				"message digest",
				"The quick brown fox jumps over the lazy dog",
			];

			for (const str of strings) {
				const strBytes = new TextEncoder().encode(str);
				expect(hash(str)).toEqual(ripemd160(strBytes));
			}
		});

		it("should match @noble for all official test vectors", () => {
			const testVectors = [
				{
					input: "",
					expected: new Uint8Array([
						0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54, 0x61, 0x28, 0x08,
						0x97, 0x7e, 0xe8, 0xf5, 0x48, 0xb2, 0x25, 0x8d, 0x31,
					]),
				},
				{
					input: "a",
					expected: new Uint8Array([
						0x0b, 0xdc, 0x9d, 0x2d, 0x25, 0x6b, 0x3e, 0xe9, 0xda, 0xae, 0x34,
						0x7b, 0xe6, 0xf4, 0xdc, 0x83, 0x5a, 0x46, 0x7f, 0xfe,
					]),
				},
				{
					input: "abc",
					expected: new Uint8Array([
						0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a, 0x9b, 0x04, 0x4a,
						0x8e, 0x98, 0xc6, 0xb0, 0x87, 0xf1, 0x5a, 0x0b, 0xfc,
					]),
				},
			];

			for (const tv of testVectors) {
				const result = hash(tv.input);
				const nobleHash = ripemd160(new TextEncoder().encode(tv.input));

				expect(result).toEqual(tv.expected);
				expect(result).toEqual(nobleHash);
			}
		});

		it("should match @noble for random data", () => {
			const input = new Uint8Array(1000);
			for (let i = 0; i < input.length; i++) {
				input[i] = (i * 13 + 7) & 0xff;
			}

			expect(hash(input)).toEqual(ripemd160(input));
		});
	});
});
