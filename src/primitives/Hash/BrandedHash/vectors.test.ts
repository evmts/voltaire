/**
 * Hash Test Vectors and Edge Cases
 *
 * Comprehensive tests for Hash module including:
 * - Known keccak256 test vectors
 * - Edge cases and boundary conditions
 * - Security-relevant tests
 * - Integration with Ethereum data structures
 */

import { describe, expect, it } from "vitest";
import * as Hash from "./index.js";

describe("Hash Test Vectors", () => {
	describe("Known keccak256 test vectors", () => {
		it("hashes empty input", () => {
			const hash = Hash.keccak256(new Uint8Array([]));
			const hex = Hash.toHex(hash);
			expect(hex).toBe(
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			);
		});

		it("hashes empty string", () => {
			const hash = Hash.keccak256String("");
			const hex = Hash.toHex(hash);
			expect(hex).toBe(
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			);
		});

		it("hashes 'hello'", () => {
			const hash = Hash.keccak256String("hello");
			const hex = Hash.toHex(hash);
			expect(hex).toBe(
				"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
			);
		});

		it("hashes 'Hello, World!'", () => {
			const hash = Hash.keccak256String("Hello, World!");
			const hex = Hash.toHex(hash);
			expect(hex).toBe(
				"0xacaf3289d7b601cbd114fb36c4d29c85bbfd5e133f14cb355c3fd8d99367964f",
			);
		});

		it("hashes bytes 0x00", () => {
			const hash = Hash.keccak256(new Uint8Array([0x00]));
			const hex = Hash.toHex(hash);
			expect(hex).toBe(
				"0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a",
			);
		});

		it("hashes bytes 0xff", () => {
			const hash = Hash.keccak256(new Uint8Array([0xff]));
			const hex = Hash.toHex(hash);
			// Verified keccak256(0xff) hash
			expect(hex).toBe(
				"0x8b1a944cf13a9a1c08facb2c9e98623ef3254d2ddb48113885c3e8e97fec8db9",
			);
		});

		it("hashes sequence 0x00 to 0xff", () => {
			const data = new Uint8Array(256);
			for (let i = 0; i < 256; i++) {
				data[i] = i;
			}
			const hash = Hash.keccak256(data);
			expect(Hash.isHash(hash)).toBe(true);
			expect(hash.length).toBe(32);
		});
	});

	describe("Consistency tests", () => {
		it("produces same hash for same input", () => {
			const data = new Uint8Array([1, 2, 3, 4, 5]);
			const hash1 = Hash.keccak256(data);
			const hash2 = Hash.keccak256(data);
			expect(Hash.equals(hash1, hash2)).toBe(true);
		});

		it("produces different hashes for different inputs", () => {
			const data1 = new Uint8Array([1, 2, 3, 4, 5]);
			const data2 = new Uint8Array([1, 2, 3, 4, 6]);
			const hash1 = Hash.keccak256(data1);
			const hash2 = Hash.keccak256(data2);
			expect(Hash.equals(hash1, hash2)).toBe(false);
		});

		it("keccak256String and keccak256 produce same result", () => {
			const text = "test";
			const hash1 = Hash.keccak256String(text);
			const hash2 = Hash.keccak256(new TextEncoder().encode(text));
			expect(Hash.equals(hash1, hash2)).toBe(true);
		});

		it("keccak256Hex and keccak256 produce same result", () => {
			const data = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
			const hash1 = Hash.keccak256(data);
			const hash2 = Hash.keccak256Hex("0x1234abcd");
			expect(Hash.equals(hash1, hash2)).toBe(true);
		});
	});

	describe("Edge cases", () => {
		it("handles single byte inputs", () => {
			for (let i = 0; i <= 255; i++) {
				const data = new Uint8Array([i]);
				const hash = Hash.keccak256(data);
				expect(hash.length).toBe(32);
				expect(Hash.isHash(hash)).toBe(true);
			}
		});

		it("handles maximum safe array size", () => {
			const largeData = new Uint8Array(100000);
			for (let i = 0; i < largeData.length; i++) {
				largeData[i] = i % 256;
			}
			const hash = Hash.keccak256(largeData);
			expect(hash.length).toBe(32);
			expect(Hash.isHash(hash)).toBe(true);
		});

		it("handles repeated bytes", () => {
			const data = new Uint8Array(1000).fill(0xaa);
			const hash = Hash.keccak256(data);
			expect(hash.length).toBe(32);
			expect(Hash.isHash(hash)).toBe(true);
		});

		it("handles zero bytes", () => {
			const data = new Uint8Array(1000).fill(0x00);
			const hash = Hash.keccak256(data);
			expect(hash.length).toBe(32);
			expect(Hash.isHash(hash)).toBe(true);
		});

		it("handles alternating pattern", () => {
			const data = new Uint8Array(1000);
			for (let i = 0; i < data.length; i++) {
				data[i] = i % 2 === 0 ? 0xaa : 0x55;
			}
			const hash = Hash.keccak256(data);
			expect(hash.length).toBe(32);
			expect(Hash.isHash(hash)).toBe(true);
		});
	});

	describe("Boundary values", () => {
		it("handles length 1", () => {
			const hash = Hash.keccak256(new Uint8Array([0x42]));
			expect(hash.length).toBe(32);
		});

		it("handles length 31", () => {
			const hash = Hash.keccak256(new Uint8Array(31).fill(0x42));
			expect(hash.length).toBe(32);
		});

		it("handles length 32", () => {
			const hash = Hash.keccak256(new Uint8Array(32).fill(0x42));
			expect(hash.length).toBe(32);
		});

		it("handles length 33", () => {
			const hash = Hash.keccak256(new Uint8Array(33).fill(0x42));
			expect(hash.length).toBe(32);
		});

		it("handles length 64", () => {
			const hash = Hash.keccak256(new Uint8Array(64).fill(0x42));
			expect(hash.length).toBe(32);
		});

		it("handles length 127", () => {
			const hash = Hash.keccak256(new Uint8Array(127).fill(0x42));
			expect(hash.length).toBe(32);
		});

		it("handles length 128", () => {
			const hash = Hash.keccak256(new Uint8Array(128).fill(0x42));
			expect(hash.length).toBe(32);
		});

		it("handles length 256", () => {
			const hash = Hash.keccak256(new Uint8Array(256).fill(0x42));
			expect(hash.length).toBe(32);
		});

		it("handles length 1024", () => {
			const hash = Hash.keccak256(new Uint8Array(1024).fill(0x42));
			expect(hash.length).toBe(32);
		});
	});

	describe("Ethereum-specific use cases", () => {
		it("hashes 20-byte address", () => {
			const address = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				address[i] = i + 1;
			}
			const hash = Hash.keccak256(address);
			expect(hash.length).toBe(32);
		});

		it("hashes 32-byte hash", () => {
			const existingHash = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				existingHash[i] = i + 1;
			}
			const hash = Hash.keccak256(existingHash);
			expect(hash.length).toBe(32);
		});

		it("hashes transaction-like data", () => {
			const txData = new Uint8Array([
				0x02, 0xf8, 0x7c, 0x01, 0x84, 0x3b, 0x9a, 0xca, 0x00, 0x85, 0x04, 0xa8,
				0x17, 0xc8, 0x00, 0x82, 0x52, 0x08,
			]);
			const hash = Hash.keccak256(txData);
			expect(hash.length).toBe(32);
		});

		it("hashes signature data (r, s, v)", () => {
			const r = new Uint8Array(32).fill(0xaa);
			const s = new Uint8Array(32).fill(0xbb);
			const v = new Uint8Array([0x1b]);
			const combined = new Uint8Array([...r, ...s, ...v]);
			const hash = Hash.keccak256(combined);
			expect(hash.length).toBe(32);
		});

		it("hashes bloom filter (256 bytes)", () => {
			const bloom = new Uint8Array(256);
			for (let i = 0; i < 256; i++) {
				bloom[i] = (i * 7) % 256;
			}
			const hash = Hash.keccak256(bloom);
			expect(hash.length).toBe(32);
		});
	});

	describe("toString edge cases", () => {
		it("formats hash correctly", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const str = Hash.toString(hash);
			expect(str).toBe(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
		});

		it("formats zero hash", () => {
			const str = Hash.toString(Hash.ZERO);
			expect(str).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
		});

		it("formats hash with leading zeros", () => {
			const hash = Hash.fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			const str = Hash.toString(hash);
			expect(str).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
		});
	});

	describe("format function", () => {
		it("truncates long hash", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const formatted = Hash.format(hash);
			expect(formatted).toContain("0x1234");
			expect(formatted).toContain("...");
			expect(formatted).toContain("cdef");
			expect(formatted.length).toBeLessThan(70);
		});

		it("formats zero hash", () => {
			const formatted = Hash.format(Hash.ZERO);
			expect(formatted).toContain("0x0000");
		});
	});

	describe("slice functionality", () => {
		it("extracts first 4 bytes", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const sliced = Hash.slice(hash, 0, 4);
			expect(sliced.length).toBe(4);
			expect(sliced[0]).toBe(0x12);
			expect(sliced[1]).toBe(0x34);
			expect(sliced[2]).toBe(0x56);
			expect(sliced[3]).toBe(0x78);
		});

		it("extracts last 4 bytes", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const sliced = Hash.slice(hash, 28, 32);
			expect(sliced.length).toBe(4);
			expect(sliced[0]).toBe(0x90);
			expect(sliced[1]).toBe(0xab);
			expect(sliced[2]).toBe(0xcd);
			expect(sliced[3]).toBe(0xef);
		});

		it("extracts middle bytes", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const sliced = Hash.slice(hash, 14, 18);
			expect(sliced.length).toBe(4);
		});

		it("slices from start to end", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const sliced = Hash.slice(hash, 10);
			expect(sliced.length).toBe(22);
		});
	});

	describe("clone functionality", () => {
		it("creates independent copy", () => {
			const original = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const copy = Hash.clone(original);

			expect(Hash.equals(original, copy)).toBe(true);
			expect(original).not.toBe(copy);

			// Modify original
			(original as any)[0] = 0xff;
			expect(copy[0]).toBe(0x12);
		});

		it("clones zero hash", () => {
			const copy = Hash.clone(Hash.ZERO);
			expect(Hash.equals(copy, Hash.ZERO)).toBe(true);
			expect(copy).not.toBe(Hash.ZERO);
		});
	});

	describe("validation edge cases", () => {
		it("validates correct hash", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(() => Hash.assert(hash)).not.toThrow();
		});

		it("rejects short array", () => {
			const invalid = new Uint8Array(31);
			expect(() => Hash.assert(invalid)).toThrow();
		});

		it("rejects long array", () => {
			const invalid = new Uint8Array(33);
			expect(() => Hash.assert(invalid)).toThrow();
		});

		it("rejects non-Uint8Array", () => {
			expect(() => Hash.assert("not a hash" as any)).toThrow();
			expect(() => Hash.assert(null as any)).toThrow();
			expect(() => Hash.assert(undefined as any)).toThrow();
			expect(() => Hash.assert(123 as any)).toThrow();
			expect(() => Hash.assert([1, 2, 3] as any)).toThrow();
		});
	});

	describe("isValidHex edge cases", () => {
		it("accepts valid 64-char hex", () => {
			expect(
				Hash.isValidHex(
					"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				),
			).toBe(true);
		});

		it("accepts valid hex with 0x prefix", () => {
			expect(
				Hash.isValidHex(
					"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				),
			).toBe(true);
		});

		it("rejects wrong length", () => {
			expect(Hash.isValidHex("0x1234")).toBe(false);
			expect(Hash.isValidHex("0x" + "12".repeat(33))).toBe(false);
		});

		it("rejects invalid characters", () => {
			expect(
				Hash.isValidHex(
					"0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
				),
			).toBe(false);
		});

		it("rejects mixed case with invalid chars", () => {
			expect(
				Hash.isValidHex(
					"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg",
				),
			).toBe(false);
		});
	});

	describe("random functionality", () => {
		it("creates valid hash", () => {
			const hash = Hash.random();
			expect(hash.length).toBe(32);
			expect(Hash.isHash(hash)).toBe(true);
		});

		it("creates different hashes", () => {
			const hash1 = Hash.random();
			const hash2 = Hash.random();
			expect(Hash.equals(hash1, hash2)).toBe(false);
		});

		it("creates many unique hashes", () => {
			const hashes = new Set<string>();
			for (let i = 0; i < 100; i++) {
				const hash = Hash.random();
				const hex = Hash.toHex(hash);
				hashes.add(hex);
			}
			expect(hashes.size).toBe(100);
		});
	});

	describe("equals constant-time property", () => {
		it("compares equal hashes", () => {
			const h1 = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const h2 = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(Hash.equals(h1, h2)).toBe(true);
		});

		it("compares different hashes", () => {
			const h1 = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const h2 = Hash.fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			expect(Hash.equals(h1, h2)).toBe(false);
		});

		it("detects single bit difference", () => {
			const h1 = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const h2 = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdee",
			);
			expect(Hash.equals(h1, h2)).toBe(false);
		});

		it("detects difference in first byte", () => {
			const h1 = Hash.fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			const h2 = Hash.fromHex(
				"0x0100000000000000000000000000000000000000000000000000000000000000",
			);
			expect(Hash.equals(h1, h2)).toBe(false);
		});

		it("detects difference in last byte", () => {
			const h1 = Hash.fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			const h2 = Hash.fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			expect(Hash.equals(h1, h2)).toBe(false);
		});
	});

	describe("isZero functionality", () => {
		it("identifies zero hash", () => {
			expect(Hash.isZero(Hash.ZERO)).toBe(true);
		});

		it("identifies non-zero hash", () => {
			const hash = Hash.fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			expect(Hash.isZero(hash)).toBe(false);
		});

		it("identifies hash with single non-zero byte", () => {
			for (let i = 0; i < 32; i++) {
				const data = new Uint8Array(32);
				data[i] = 0x01;
				const hash = Hash.fromBytes(data);
				expect(Hash.isZero(hash)).toBe(false);
			}
		});
	});
});
