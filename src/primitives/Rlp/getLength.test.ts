/**
 * Tests for Rlp.getLength
 */

import { describe, expect, it } from "vitest";
import { encode } from "./encode.js";
import { getLength } from "./getLength.js";
import { RlpDecodingError } from "./RlpError.js";

describe("Rlp.getLength", () => {
	it("calculates length for single byte < 0x80", () => {
		const data = new Uint8Array([0x7f]);
		expect(getLength(data)).toBe(1);
	});

	it("calculates length for single byte at boundary", () => {
		const data = new Uint8Array([0x00]);
		expect(getLength(data)).toBe(1);
		const data2 = new Uint8Array([0x7f]);
		expect(getLength(data2)).toBe(1);
	});

	it("calculates length for empty bytes (0x80)", () => {
		const data = new Uint8Array([0x80]);
		expect(getLength(data)).toBe(1);
	});

	it("calculates length for short string", () => {
		const data = encode(new Uint8Array([1, 2, 3]));
		expect(getLength(data)).toBe(4); // 1 prefix + 3 bytes
	});

	it("calculates length for 55-byte string (boundary)", () => {
		const input = new Uint8Array(55).fill(0x42);
		const data = encode(input);
		expect(getLength(data)).toBe(56); // 1 prefix + 55 bytes
	});

	it("calculates length for 56-byte string (long form)", () => {
		const input = new Uint8Array(56).fill(0x42);
		const data = encode(input);
		expect(getLength(data)).toBe(58); // 1 prefix + 1 length + 56 bytes
	});

	it("calculates length for long string", () => {
		const input = new Uint8Array(300).fill(0xff);
		const data = encode(input);
		expect(getLength(data)).toBe(303); // 1 prefix + 2 length + 300 bytes
	});

	it("calculates length for very large string", () => {
		const input = new Uint8Array(10000).fill(0xab);
		const data = encode(input);
		expect(getLength(data)).toBe(10003); // 1 prefix + 2 length + 10000 bytes
	});

	it("calculates length for empty list", () => {
		const data = encode([]);
		expect(getLength(data)).toBe(1); // 0xc0
	});

	it("calculates length for short list", () => {
		const data = encode([new Uint8Array([0x01]), new Uint8Array([0x02])]);
		expect(getLength(data)).toBe(3); // 1 prefix + 2 items
	});

	it("calculates length for long list", () => {
		const items = Array.from({ length: 60 }, () => new Uint8Array([0x01]));
		const data = encode(items);
		expect(getLength(data)).toBe(data.length);
	});

	it("calculates length for nested list", () => {
		const data = encode([new Uint8Array([0x01]), [new Uint8Array([0x02])]]);
		const length = getLength(data);
		expect(length).toBe(data.length);
	});

	it("matches actual encoded length", () => {
		const testCases = [
			new Uint8Array([1, 2, 3]),
			new Uint8Array(55).fill(0x42),
			new Uint8Array(100).fill(0xff),
			[new Uint8Array([1]), new Uint8Array([2])],
			[[new Uint8Array([1])]],
		];

		for (const testCase of testCases) {
			const encoded = encode(testCase);
			expect(getLength(encoded)).toBe(encoded.length);
		}
	});

	it("throws on empty input", () => {
		const data = new Uint8Array([]);
		expect(() => getLength(data)).toThrow(RlpDecodingError);
		expect(() => getLength(data)).toThrow("Cannot get length of empty data");
	});

	it("throws on truncated long string length prefix", () => {
		const data = new Uint8Array([0xb9]); // Claims 2 bytes of length, has 0
		expect(() => getLength(data)).toThrow(RlpDecodingError);
		expect(() => getLength(data)).toThrow("Insufficient data for length prefix");
	});

	it("throws on truncated long list length prefix", () => {
		const data = new Uint8Array([0xf8]); // Claims 1 byte of length, has 0
		expect(() => getLength(data)).toThrow(RlpDecodingError);
	});
});
