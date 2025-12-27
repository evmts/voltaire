import { describe, expect, it } from "vitest";
import { toNumber } from "./toNumber.js";

describe("Bytes.toNumber", () => {
	it("converts empty bytes to zero", () => {
		expect(toNumber(new Uint8Array([]))).toBe(0);
	});

	it("converts single byte", () => {
		expect(toNumber(new Uint8Array([0]))).toBe(0);
		expect(toNumber(new Uint8Array([1]))).toBe(1);
		expect(toNumber(new Uint8Array([255]))).toBe(255);
	});

	it("converts multi-byte values", () => {
		expect(toNumber(new Uint8Array([1, 0]))).toBe(256);
		expect(toNumber(new Uint8Array([0x12, 0x34]))).toBe(0x1234);
		expect(toNumber(new Uint8Array([0xab, 0xcd, 0xef]))).toBe(0xabcdef);
	});

	it("handles leading zeros", () => {
		expect(toNumber(new Uint8Array([0, 0, 1]))).toBe(1);
		expect(toNumber(new Uint8Array([0, 0, 0, 255]))).toBe(255);
	});

	it("throws on values exceeding MAX_SAFE_INTEGER", () => {
		// 8 bytes is always too large
		expect(() => toNumber(new Uint8Array(8).fill(0xff))).toThrow(
			/too large to convert/,
		);
	});

	it("handles MAX_SAFE_INTEGER", () => {
		// MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF (7 bytes)
		const bytes = new Uint8Array([0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
		expect(toNumber(bytes)).toBe(Number.MAX_SAFE_INTEGER);
	});
});
