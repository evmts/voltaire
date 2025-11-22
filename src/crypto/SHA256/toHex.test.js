/**
 * SHA256.toHex tests
 *
 * Tests for the toHex function covering:
 * - Conversion of hash to hex string
 * - Lowercase output with 0x prefix
 * - Various input patterns
 */

import { describe, expect, it } from "vitest";
import { hash } from "./hash.js";
import { toHex } from "./toHex.js";

describe("SHA256 toHex function", () => {
	describe("basic conversion", () => {
		it("should convert hash to hex string", () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]);
			const hashResult = hash(input);
			const hex = toHex(hashResult);

			expect(hex).toBe(
				"0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
			);
		});

		it("should handle empty hash", () => {
			const hashResult = hash(new Uint8Array([]));
			const hex = toHex(hashResult);

			expect(hex).toBe(
				"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			);
		});

		it("should convert simple bytes", () => {
			const hashResult = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const hex = toHex(hashResult);

			expect(hex).toBe("0xdeadbeef");
		});
	});

	describe("format validation", () => {
		it("should produce lowercase hex", () => {
			const hashResult = new Uint8Array([0xab, 0xcd, 0xef]);
			const hex = toHex(hashResult);

			expect(hex).toBe("0xabcdef");
			expect(hex.slice(2)).toBe(hex.slice(2).toLowerCase());
		});

		it("should include 0x prefix", () => {
			const hashResult = hash(new Uint8Array([1, 2, 3]));
			const hex = toHex(hashResult);

			expect(hex).toMatch(/^0x/);
			expect(hex.startsWith("0x")).toBe(true);
		});

		it("should have correct length for 32-byte hash", () => {
			const hashResult = hash(new Uint8Array([0x42]));
			const hex = toHex(hashResult);

			expect(hex.length).toBe(66); // "0x" + 64 characters
		});

		it("should pad single-digit hex values with zero", () => {
			const hashResult = new Uint8Array([0x00, 0x01, 0x0f]);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x00010f");
		});
	});

	describe("edge cases", () => {
		it("should convert all-zero hash", () => {
			const hashResult = new Uint8Array(32).fill(0x00);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x" + "00".repeat(32));
		});

		it("should convert all-ones hash", () => {
			const hashResult = new Uint8Array(32).fill(0xff);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x" + "ff".repeat(32));
		});

		it("should convert single byte 0x00", () => {
			const hashResult = new Uint8Array([0x00]);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x00");
		});

		it("should convert single byte 0xff", () => {
			const hashResult = new Uint8Array([0xff]);
			const hex = toHex(hashResult);

			expect(hex).toBe("0xff");
		});

		it("should convert alternating pattern", () => {
			const hashResult = new Uint8Array([0xaa, 0x55, 0xaa, 0x55]);
			const hex = toHex(hashResult);

			expect(hex).toBe("0xaa55aa55");
		});
	});

	describe("determinism", () => {
		it("should be deterministic", () => {
			const hashResult = hash(new Uint8Array([1, 2, 3]));
			const hex1 = toHex(hashResult);
			const hex2 = toHex(hashResult);

			expect(hex1).toBe(hex2);
		});

		it("should produce different hex for different hashes", () => {
			const hash1 = hash(new Uint8Array([0x00]));
			const hash2 = hash(new Uint8Array([0x01]));

			const hex1 = toHex(hash1);
			const hex2 = toHex(hash2);

			expect(hex1).not.toBe(hex2);
		});
	});

	describe("byte patterns", () => {
		it("should convert sequential bytes", () => {
			const hashResult = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x00010203");
		});

		it("should convert reverse sequential bytes", () => {
			const hashResult = new Uint8Array([0x03, 0x02, 0x01, 0x00]);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x03020100");
		});

		it("should convert all byte values", () => {
			const hashResult = new Uint8Array(256);
			for (let i = 0; i < 256; i++) {
				hashResult[i] = i;
			}

			const hex = toHex(hashResult);

			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(2 + 256 * 2);
		});
	});

	describe("real hash outputs", () => {
		it("should convert hash of 'hello world'", () => {
			const input = new TextEncoder().encode("hello world");
			const hashResult = hash(input);
			const hex = toHex(hashResult);

			expect(hex).toBe(
				"0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
			);
		});

		it("should convert hash of 'abc'", () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]);
			const hashResult = hash(input);
			const hex = toHex(hashResult);

			expect(hex).toBe(
				"0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
			);
		});

		it("should convert hash of empty input", () => {
			const hashResult = hash(new Uint8Array([]));
			const hex = toHex(hashResult);

			expect(hex).toBe(
				"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			);
		});
	});

	describe("round-trip consistency", () => {
		it("should round-trip with hashHex", async () => {
			const { hashHex } = await import("./hashHex.js");

			const originalHex = "0xdeadbeef";
			const hashResult = hashHex(originalHex);
			const hexOutput = toHex(hashResult);

			const hashResult2 = hashHex(hexOutput);
			expect(hashResult).toEqual(hashResult2);
		});

		it("should preserve hash value through conversion", () => {
			const input = new Uint8Array([1, 2, 3, 4, 5]);
			const hashResult = hash(input);
			const hex = toHex(hashResult);

			const bytes = new Uint8Array(hashResult.length);
			for (let i = 0; i < hashResult.length; i++) {
				bytes[i] = hashResult[i];
			}

			expect(toHex(bytes)).toBe(hex);
		});
	});

	describe("various hash lengths", () => {
		it("should convert 4-byte value", () => {
			const hashResult = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x12345678");
			expect(hex.length).toBe(10);
		});

		it("should convert 16-byte value", () => {
			const hashResult = new Uint8Array(16).fill(0x42);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x" + "42".repeat(16));
			expect(hex.length).toBe(34);
		});

		it("should convert 32-byte value", () => {
			const hashResult = new Uint8Array(32).fill(0xaa);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x" + "aa".repeat(32));
			expect(hex.length).toBe(66);
		});

		it("should convert 64-byte value", () => {
			const hashResult = new Uint8Array(64).fill(0xff);
			const hex = toHex(hashResult);

			expect(hex).toBe("0x" + "ff".repeat(64));
			expect(hex.length).toBe(130);
		});
	});
});
