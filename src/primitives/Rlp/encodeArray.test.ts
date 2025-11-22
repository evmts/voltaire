/**
 * Tests for Rlp.encodeArray
 */

import { describe, expect, it } from "vitest";
import { decode } from "./decode.js";
import { encodeArray } from "./encodeArray.js";
import { toRaw } from "./toRaw.js";

describe("Rlp.encodeArray", () => {
	it("encodes empty array", () => {
		const result = encodeArray([]);
		expect(result).toEqual(new Uint8Array([0xc0]));
		const decoded = decode(result);
		expect(decoded.data.type).toBe("list");
		if (decoded.data.type === "list") {
			expect(decoded.data.value).toHaveLength(0);
		}
	});

	it("encodes single element array", () => {
		const items = [new Uint8Array([1, 2, 3])];
		const result = encodeArray(items);
		const decoded = decode(result);
		const raw = toRaw(decoded.data);
		expect(Array.isArray(raw)).toBe(true);
		expect(raw).toHaveLength(1);
		expect(raw[0]).toEqual(new Uint8Array([1, 2, 3]));
	});

	it("encodes multiple elements", () => {
		const items = [
			new Uint8Array([1, 2]),
			new Uint8Array([3, 4, 5]),
			new Uint8Array([6]),
		];
		const result = encodeArray(items);
		const decoded = decode(result);
		const raw = toRaw(decoded.data);
		expect(raw).toHaveLength(3);
		expect(raw[0]).toEqual(new Uint8Array([1, 2]));
		expect(raw[1]).toEqual(new Uint8Array([3, 4, 5]));
		expect(raw[2]).toEqual(new Uint8Array([6]));
	});

	it("encodes nested arrays", () => {
		const items = [
			new Uint8Array([1]),
			[new Uint8Array([2]), new Uint8Array([3])],
		];
		const result = encodeArray(items);
		const decoded = decode(result);
		const raw = toRaw(decoded.data);
		expect(Array.isArray(raw)).toBe(true);
		expect(raw).toHaveLength(2);
		expect(raw[0]).toEqual(new Uint8Array([1]));
		expect(Array.isArray(raw[1])).toBe(true);
		expect(raw[1] as any).toHaveLength(2);
	});

	it("encodes deeply nested arrays", () => {
		const items = [[[new Uint8Array([1])]]];
		const result = encodeArray(items);
		const decoded = decode(result);
		const raw = toRaw(decoded.data);
		expect(Array.isArray(raw)).toBe(true);
		expect(Array.isArray(raw[0])).toBe(true);
		expect(Array.isArray((raw[0] as any)[0])).toBe(true);
	});

	it("encodes array with empty elements", () => {
		const items = [new Uint8Array([]), new Uint8Array([1]), new Uint8Array([])];
		const result = encodeArray(items);
		const decoded = decode(result);
		const raw = toRaw(decoded.data);
		expect(raw).toHaveLength(3);
		expect(raw[0]).toEqual(new Uint8Array([]));
		expect(raw[1]).toEqual(new Uint8Array([1]));
		expect(raw[2]).toEqual(new Uint8Array([]));
	});

	it("encodes array with mixed sizes", () => {
		const items = [
			new Uint8Array([0x01]),
			new Uint8Array(Array(55).fill(0x02)),
			new Uint8Array(Array(100).fill(0x03)),
		];
		const result = encodeArray(items);
		const decoded = decode(result);
		const raw = toRaw(decoded.data);
		expect(raw).toHaveLength(3);
		expect(raw[0]).toEqual(new Uint8Array([0x01]));
		expect(raw[1]).toEqual(new Uint8Array(Array(55).fill(0x02)));
		expect(raw[2]).toEqual(new Uint8Array(Array(100).fill(0x03)));
	});

	it("encodes large array (1000+ elements)", () => {
		const items = Array.from(
			{ length: 1000 },
			(_, i) => new Uint8Array([i % 256]),
		);
		const result = encodeArray(items);
		const decoded = decode(result);
		const raw = toRaw(decoded.data);
		expect(raw).toHaveLength(1000);
		for (let i = 0; i < 1000; i++) {
			expect(raw[i]).toEqual(new Uint8Array([i % 256]));
		}
	});

	it("round-trips complex nested structures", () => {
		const items = [
			[new Uint8Array([1]), [new Uint8Array([2]), new Uint8Array([3])]],
			new Uint8Array([4]),
			[new Uint8Array([5])],
		];
		const encoded = encodeArray(items);
		const decoded = decode(encoded);
		const raw = toRaw(decoded.data);
		expect(raw).toEqual(items);
	});
});
