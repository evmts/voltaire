/**
 * Tests for Rlp.encodeBatch
 */

import { describe, expect, it } from "vitest";
import { decodeBatch } from "./decodeBatch.js";
import { encodeBatch } from "./encodeBatch.js";

describe("Rlp.encodeBatch", () => {
	it("encodes empty batch", () => {
		const result = encodeBatch([]);
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(0);
	});

	it("encodes single item", () => {
		const items = [[new Uint8Array([1, 2, 3])]];
		const result = encodeBatch(items);
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(1);
		expect(result[0]).toBeInstanceOf(Uint8Array);
	});

	it("encodes multiple items", () => {
		const items = [
			[new Uint8Array([1, 2])],
			[new Uint8Array([3, 4, 5])],
			[new Uint8Array([6])],
		];
		const result = encodeBatch(items);
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(3);
		const decoded = decodeBatch(result);
		expect(decoded).toHaveLength(3);
	});

	it("encodes nested arrays", () => {
		const items = [
			[new Uint8Array([1])],
			[new Uint8Array([2]), new Uint8Array([3])],
		];
		const result = encodeBatch(items);
		expect(result.length).toBe(2);
		const decoded = decodeBatch(result);
		expect(decoded).toHaveLength(2);
	});

	it("encodes large batch", () => {
		const items = Array.from({ length: 100 }, (_, i) => [new Uint8Array([i])]);
		const result = encodeBatch(items);
		expect(result.length).toBe(100);
		const decoded = decodeBatch(result);
		expect(decoded).toHaveLength(100);
	});

	it("encodes empty items in batch", () => {
		const items = [
			[new Uint8Array([])],
			[new Uint8Array([1])],
			[new Uint8Array([])],
		];
		const result = encodeBatch(items);
		const decoded = decodeBatch(result);
		expect(decoded).toHaveLength(3);
		expect(decoded[0]).toEqual([new Uint8Array([])]);
		expect(decoded[1]).toEqual([new Uint8Array([1])]);
		expect(decoded[2]).toEqual([new Uint8Array([])]);
	});

	it("round-trips complex batch", () => {
		const items = [
			[new Uint8Array([0x01])],
			[new Uint8Array([0x02]), new Uint8Array([0x03])],
			[new Uint8Array(Array(100).fill(0x04))],
		];
		const result = encodeBatch(items);
		const decoded = decodeBatch(result);
		expect(decoded).toEqual(items);
	});
});
