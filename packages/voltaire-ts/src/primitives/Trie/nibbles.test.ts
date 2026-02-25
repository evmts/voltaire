import { describe, expect, it } from "vitest";
import { commonPrefixLength, keyToNibbles, nibblesToKey } from "./nibbles.js";

describe("keyToNibbles", () => {
	it("converts empty key", () => {
		expect(keyToNibbles(new Uint8Array([]))).toEqual(new Uint8Array([]));
	});

	it("converts single byte", () => {
		expect(keyToNibbles(new Uint8Array([0xab]))).toEqual(
			new Uint8Array([0x0a, 0x0b]),
		);
	});

	it("converts multiple bytes", () => {
		expect(keyToNibbles(new Uint8Array([0x12, 0x34, 0xff]))).toEqual(
			new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x0f, 0x0f]),
		);
	});

	it("handles zero bytes", () => {
		expect(keyToNibbles(new Uint8Array([0x00]))).toEqual(
			new Uint8Array([0x00, 0x00]),
		);
	});
});

describe("nibblesToKey", () => {
	it("converts empty nibbles", () => {
		expect(nibblesToKey(new Uint8Array([]))).toEqual(new Uint8Array([]));
	});

	it("round-trips with keyToNibbles", () => {
		const key = new Uint8Array([0xab, 0xcd, 0xef, 0x01, 0x23]);
		expect(nibblesToKey(keyToNibbles(key))).toEqual(key);
	});

	it("converts nibbles to bytes", () => {
		expect(nibblesToKey(new Uint8Array([0x0f, 0x0f]))).toEqual(
			new Uint8Array([0xff]),
		);
	});
});

describe("commonPrefixLength", () => {
	it("returns 0 for empty arrays", () => {
		expect(commonPrefixLength(new Uint8Array([]), new Uint8Array([]))).toBe(0);
	});

	it("returns 0 when first elements differ", () => {
		expect(
			commonPrefixLength(new Uint8Array([1, 2]), new Uint8Array([3, 4])),
		).toBe(0);
	});

	it("returns full length for identical arrays", () => {
		expect(
			commonPrefixLength(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3])),
		).toBe(3);
	});

	it("returns partial match length", () => {
		expect(
			commonPrefixLength(
				new Uint8Array([1, 2, 3, 4]),
				new Uint8Array([1, 2, 5, 6]),
			),
		).toBe(2);
	});

	it("handles different length arrays", () => {
		expect(
			commonPrefixLength(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3])),
		).toBe(2);
	});
});
