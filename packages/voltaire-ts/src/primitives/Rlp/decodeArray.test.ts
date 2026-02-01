/**
 * Tests for Rlp.decodeArray
 */

import { describe, expect, it } from "vitest";
import { decodeArray } from "./decodeArray.js";
import { encodeArray } from "./encodeArray.js";

describe("Rlp.decodeArray", () => {
	it("decodes empty array", () => {
		const encoded = encodeArray([]);
		const result = decodeArray(encoded);
		expect(result).toEqual([]);
	});

	it("decodes array with single element", () => {
		const input = [new Uint8Array([1, 2, 3])];
		const encoded = encodeArray(input);
		const result = decodeArray(encoded);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(new Uint8Array([1, 2, 3]));
	});

	it("decodes array with multiple elements", () => {
		const input = [
			new Uint8Array([1, 2]),
			new Uint8Array([3, 4]),
			new Uint8Array([5, 6]),
		];
		const encoded = encodeArray(input);
		const result = decodeArray(encoded);
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual(new Uint8Array([1, 2]));
		expect(result[1]).toEqual(new Uint8Array([3, 4]));
		expect(result[2]).toEqual(new Uint8Array([5, 6]));
	});

	it("decodes nested arrays", () => {
		const input = [[new Uint8Array([1])], [new Uint8Array([2])]];
		const encoded = encodeArray(input);
		const result = decodeArray(encoded);
		expect(result).toHaveLength(2);
		expect(Array.isArray(result[0])).toBe(true);
		expect(Array.isArray(result[1])).toBe(true);
	});

	it("decodes array with empty elements", () => {
		const input = [new Uint8Array([]), new Uint8Array([1]), new Uint8Array([])];
		const encoded = encodeArray(input);
		const result = decodeArray(encoded);
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual(new Uint8Array([]));
		expect(result[1]).toEqual(new Uint8Array([1]));
		expect(result[2]).toEqual(new Uint8Array([]));
	});

	it("decodes array with mixed sizes", () => {
		const input = [
			new Uint8Array([0x01]),
			new Uint8Array(Array(55).fill(0x02)),
			new Uint8Array(Array(100).fill(0x03)),
		];
		const encoded = encodeArray(input);
		const result = decodeArray(encoded);
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual(new Uint8Array([0x01]));
		expect(result[1]).toEqual(new Uint8Array(Array(55).fill(0x02)));
		expect(result[2]).toEqual(new Uint8Array(Array(100).fill(0x03)));
	});

	it("round-trips complex nested structures", () => {
		const input = [
			[new Uint8Array([1]), [new Uint8Array([2]), new Uint8Array([3])]],
			new Uint8Array([4]),
		];
		const encoded = encodeArray(input);
		const result = decodeArray(encoded);
		expect(result).toEqual(input);
	});
});
