/**
 * Tests for Rlp.getEncodedLength
 */

import { describe, expect, it } from "vitest";
import { encode } from "./encode.js";
import { getEncodedLength } from "./getEncodedLength.js";

describe("Rlp.getEncodedLength", () => {
	it("returns length for empty bytes", () => {
		const data = new Uint8Array([]);
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
		expect(length).toBe(1);
	});

	it("returns length for single byte < 0x80", () => {
		const data = new Uint8Array([0x7f]);
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
		expect(length).toBe(1);
	});

	it("returns length for single byte >= 0x80", () => {
		const data = new Uint8Array([0x80]);
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
		expect(length).toBe(2);
	});

	it("returns length for short string (< 56 bytes)", () => {
		const data = new Uint8Array(Array(55).fill(0x01));
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
		expect(length).toBe(56);
	});

	it("returns length for long string (>= 56 bytes)", () => {
		const data = new Uint8Array(Array(100).fill(0x01));
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
		expect(length).toBe(102);
	});

	it("returns length for empty list", () => {
		const data: unknown[] = [];
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
		expect(length).toBe(1);
	});

	it("returns length for short list", () => {
		const data = [new Uint8Array([1]), new Uint8Array([2])];
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
		expect(length).toBe(4);
	});

	it("returns length for long list", () => {
		const data = Array.from({ length: 100 }, () => new Uint8Array([0x01]));
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
	});

	it("returns length for nested structures", () => {
		const data = [
			[new Uint8Array([1])],
			[new Uint8Array([2]), new Uint8Array([3])],
		];
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
	});

	it("returns length for complex nested data", () => {
		const data = [
			new Uint8Array([0x01]),
			[new Uint8Array(Array(60).fill(0x02)), [new Uint8Array([0x03])]],
		];
		const encoded = encode(data);
		const length = getEncodedLength(data);
		expect(length).toBe(encoded.length);
	});
});
