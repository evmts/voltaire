/**
 * SHA256.hashHex tests
 *
 * Tests for the hashHex function covering:
 * - Hex string input with and without 0x prefix
 * - Cross-validation with hash() function
 * - Edge cases and malformed inputs
 */

import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";
import { hashHex } from "./hashHex.js";

describe("SHA256 hashHex function", () => {
	describe("hex with 0x prefix", () => {
		it("should hash hex string with 0x prefix", () => {
			const result = hashHex("0xdeadbeef");
			expect(result.length).toBe(32);

			const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const expected = hash(bytes);

			expect(result).toEqual(expected);
		});

		it("should hash '0x1234'", () => {
			const result = hashHex("0x1234");
			const bytes = new Uint8Array([0x12, 0x34]);

			expect(result).toEqual(hash(bytes));
		});

		it("should hash 32-byte hex (Ethereum hash)", () => {
			const hexHash = `0x${"a".repeat(64)}`;
			const result = hashHex(hexHash);

			expect(result.length).toBe(32);

			const bytes = new Uint8Array(32).fill(0xaa);
			expect(result).toEqual(hash(bytes));
		});

		it("should hash 64-byte hex", () => {
			const hexHash = `0x${"ff".repeat(64)}`;
			const result = hashHex(hexHash);

			const bytes = new Uint8Array(64).fill(0xff);
			expect(result).toEqual(hash(bytes));
		});
	});

	describe("hex without 0x prefix", () => {
		it("should hash hex string without prefix", () => {
			const result = hashHex("deadbeef");
			expect(result.length).toBe(32);

			const withPrefix = hashHex("0xdeadbeef");
			expect(result).toEqual(withPrefix);
		});

		it("should hash '1234'", () => {
			const result = hashHex("1234");
			const bytes = new Uint8Array([0x12, 0x34]);

			expect(result).toEqual(hash(bytes));
		});

		it("should hash '00'", () => {
			const result = hashHex("00");
			const bytes = new Uint8Array([0x00]);

			expect(result).toEqual(hash(bytes));
		});

		it("should hash 'ff'", () => {
			const result = hashHex("ff");
			const bytes = new Uint8Array([0xff]);

			expect(result).toEqual(hash(bytes));
		});
	});

	describe("empty input", () => {
		it("should hash empty hex string", () => {
			const result = hashHex("");
			expect(result.length).toBe(32);

			const hashEmpty = hash(new Uint8Array([]));
			expect(result).toEqual(hashEmpty);
		});

		it("should hash '0x' (empty with prefix)", () => {
			const result = hashHex("0x");
			expect(result.length).toBe(32);

			const hashEmpty = hash(new Uint8Array([]));
			expect(result).toEqual(hashEmpty);
		});
	});

	describe("determinism", () => {
		it("should be deterministic", () => {
			const hex = "0x123456789abcdef0";
			const hash1 = hashHex(hex);
			const hash2 = hashHex(hex);

			expect(hash1).toEqual(hash2);
		});

		it("should produce different hashes for different inputs", () => {
			const hash1 = hashHex("0x00");
			const hash2 = hashHex("0x01");
			const hash3 = hashHex("0x0000");

			expect(hash1).not.toEqual(hash2);
			expect(hash1).not.toEqual(hash3);
			expect(hash2).not.toEqual(hash3);
		});
	});

	describe("lowercase and uppercase", () => {
		it("should handle lowercase hex", () => {
			const result = hashHex("0xabcdef");
			const bytes = new Uint8Array([0xab, 0xcd, 0xef]);

			expect(result).toEqual(hash(bytes));
		});

		it("should handle uppercase hex", () => {
			const result = hashHex("0xABCDEF");
			const bytes = new Uint8Array([0xab, 0xcd, 0xef]);

			expect(result).toEqual(hash(bytes));
		});

		it("should handle mixed case hex", () => {
			const result = hashHex("0xAbCdEf");
			const bytes = new Uint8Array([0xab, 0xcd, 0xef]);

			expect(result).toEqual(hash(bytes));
		});

		it("should treat uppercase and lowercase as equal", () => {
			const hash1 = hashHex("0xabcdef");
			const hash2 = hashHex("0xABCDEF");
			const hash3 = hashHex("0xAbCdEf");

			expect(hash1).toEqual(hash2);
			expect(hash1).toEqual(hash3);
		});
	});

	describe("typical Ethereum values", () => {
		it("should hash address-sized hex (20 bytes)", () => {
			const address = "0x" + "1".repeat(40);
			const result = hashHex(address);

			expect(result.length).toBe(32);

			const bytes = new Uint8Array(20).fill(0x11);
			expect(result).toEqual(hash(bytes));
		});

		it("should hash hash-sized hex (32 bytes)", () => {
			const hash32 = "0x" + "a".repeat(64);
			const result = hashHex(hash32);

			expect(result.length).toBe(32);

			const bytes = new Uint8Array(32).fill(0xaa);
			expect(result).toEqual(hash(bytes));
		});

		it("should hash signature r,s values (32 bytes each)", () => {
			const r = "0x" + "1".repeat(64);
			const s = "0x" + "2".repeat(64);

			const hashR = hashHex(r);
			const hashS = hashHex(s);

			expect(hashR).not.toEqual(hashS);
			expect(hashR.length).toBe(32);
			expect(hashS.length).toBe(32);
		});
	});

	describe("edge cases", () => {
		it("should hash single hex byte '00'", () => {
			const result = hashHex("0x00");
			const bytes = new Uint8Array([0x00]);

			expect(result).toEqual(hash(bytes));
		});

		it("should hash single hex byte 'ff'", () => {
			const result = hashHex("0xff");
			const bytes = new Uint8Array([0xff]);

			expect(result).toEqual(hash(bytes));
		});

		it("should hash all-zeros hex", () => {
			const hex = "0x" + "00".repeat(32);
			const result = hashHex(hex);

			const bytes = new Uint8Array(32).fill(0x00);
			expect(result).toEqual(hash(bytes));
		});

		it("should hash all-ones hex", () => {
			const hex = "0x" + "ff".repeat(32);
			const result = hashHex(hex);

			const bytes = new Uint8Array(32).fill(0xff);
			expect(result).toEqual(hash(bytes));
		});

		it("should hash alternating pattern", () => {
			const hex = "0x" + "aa".repeat(16);
			const result = hashHex(hex);

			const bytes = new Uint8Array(16).fill(0xaa);
			expect(result).toEqual(hash(bytes));
		});
	});

	describe("various lengths", () => {
		it("should hash 2-character hex (1 byte)", () => {
			const result = hashHex("0x42");
			const bytes = new Uint8Array([0x42]);

			expect(result).toEqual(hash(bytes));
		});

		it("should hash 4-character hex (2 bytes)", () => {
			const result = hashHex("0x1234");
			const bytes = new Uint8Array([0x12, 0x34]);

			expect(result).toEqual(hash(bytes));
		});

		it("should hash 8-character hex (4 bytes)", () => {
			const result = hashHex("0x12345678");
			const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

			expect(result).toEqual(hash(bytes));
		});

		it("should hash 16-character hex (8 bytes)", () => {
			const result = hashHex("0x123456789abcdef0");
			const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);

			expect(result).toEqual(hash(bytes));
		});

		it("should hash very long hex (128 bytes)", () => {
			const hex = "0x" + "ab".repeat(128);
			const result = hashHex(hex);

			const bytes = new Uint8Array(128).fill(0xab);
			expect(result).toEqual(hash(bytes));
		});
	});

	describe("prefix handling", () => {
		it("should strip 0x prefix correctly", () => {
			const withPrefix = hashHex("0xdeadbeef");
			const withoutPrefix = hashHex("deadbeef");

			expect(withPrefix).toEqual(withoutPrefix);
		});

		it("should handle multiple test cases with and without prefix", () => {
			const testCases = [
				["0x00", "00"],
				["0xff", "ff"],
				["0x1234", "1234"],
				["0xabcdef", "abcdef"],
			];

			for (const [withPrefix, withoutPrefix] of testCases) {
				expect(hashHex(withPrefix)).toEqual(hashHex(withoutPrefix));
			}
		});
	});

	describe("cross-validation with hash()", () => {
		it("should match hash() for various inputs", () => {
			const testCases = [
				{ hex: "0x00", bytes: [0x00] },
				{ hex: "0xff", bytes: [0xff] },
				{ hex: "0x1234", bytes: [0x12, 0x34] },
				{ hex: "0xdeadbeef", bytes: [0xde, 0xad, 0xbe, 0xef] },
				{ hex: "0x0123456789abcdef", bytes: [0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef] },
			];

			for (const { hex, bytes } of testCases) {
				const result = hashHex(hex);
				const expected = hash(new Uint8Array(bytes));
				expect(result).toEqual(expected);
			}
		});
	});
});
