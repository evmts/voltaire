import { describe, expect, it } from "vitest";
import type { BytesType } from "./BytesType.js";
import { equalsConstantTime } from "./equalsConstantTime.js";

describe("equalsConstantTime", () => {
	describe("basic equality", () => {
		it("should return true for identical arrays", () => {
			const a = new Uint8Array([1, 2, 3, 4]) as BytesType;
			const b = new Uint8Array([1, 2, 3, 4]) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(true);
		});

		it("should return false for different arrays", () => {
			const a = new Uint8Array([1, 2, 3, 4]) as BytesType;
			const b = new Uint8Array([1, 2, 3, 5]) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(false);
		});

		it("should return false for different lengths", () => {
			const a = new Uint8Array([1, 2, 3]) as BytesType;
			const b = new Uint8Array([1, 2, 3, 4]) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(false);
		});

		it("should return true for empty arrays", () => {
			const a = new Uint8Array([]) as BytesType;
			const b = new Uint8Array([]) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("should handle single byte arrays", () => {
			const a = new Uint8Array([0xff]) as BytesType;
			const b = new Uint8Array([0xff]) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(true);

			const c = new Uint8Array([0x00]) as BytesType;
			expect(equalsConstantTime(a, c)).toBe(false);
		});

		it("should handle all zeros", () => {
			const a = new Uint8Array(32).fill(0) as BytesType;
			const b = new Uint8Array(32).fill(0) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(true);
		});

		it("should handle all 0xff", () => {
			const a = new Uint8Array(32).fill(0xff) as BytesType;
			const b = new Uint8Array(32).fill(0xff) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(true);
		});

		it("should detect difference in first byte", () => {
			const a = new Uint8Array([0, 1, 2, 3]) as BytesType;
			const b = new Uint8Array([1, 1, 2, 3]) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(false);
		});

		it("should detect difference in last byte", () => {
			const a = new Uint8Array([1, 2, 3, 0]) as BytesType;
			const b = new Uint8Array([1, 2, 3, 1]) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(false);
		});

		it("should detect difference in middle byte", () => {
			const a = new Uint8Array([1, 2, 3, 4]) as BytesType;
			const b = new Uint8Array([1, 2, 0, 4]) as BytesType;
			expect(equalsConstantTime(a, b)).toBe(false);
		});
	});

	describe("cryptographic sizes", () => {
		it("should handle 32-byte hashes", () => {
			const hash1 = new Uint8Array(32).fill(0xab) as BytesType;
			const hash2 = new Uint8Array(32).fill(0xab) as BytesType;
			expect(equalsConstantTime(hash1, hash2)).toBe(true);

			hash2[31] = 0xac;
			expect(equalsConstantTime(hash1, hash2)).toBe(false);
		});

		it("should handle 64-byte signatures", () => {
			const sig1 = new Uint8Array(64).fill(0xcd) as BytesType;
			const sig2 = new Uint8Array(64).fill(0xcd) as BytesType;
			expect(equalsConstantTime(sig1, sig2)).toBe(true);
		});

		it("should handle 20-byte addresses", () => {
			const addr1 = new Uint8Array(20).fill(0x12) as BytesType;
			const addr2 = new Uint8Array(20).fill(0x12) as BytesType;
			expect(equalsConstantTime(addr1, addr2)).toBe(true);
		});
	});

	describe("same reference", () => {
		it("should return true when comparing same reference", () => {
			const a = new Uint8Array([1, 2, 3]) as BytesType;
			expect(equalsConstantTime(a, a)).toBe(true);
		});
	});
});
