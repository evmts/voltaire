/**
 * Tests for Rlp.flatten
 */

import { describe, expect, it } from "vitest";
import { flatten } from "./flatten.js";

describe("Rlp.flatten", () => {
	it("flattens empty array", () => {
		const result = flatten([]);
		expect(result).toEqual([]);
	});

	it("flattens single element", () => {
		const result = flatten([new Uint8Array([1, 2, 3])]);
		expect(result).toEqual([new Uint8Array([1, 2, 3])]);
	});

	it("flattens already flat array", () => {
		const input = [
			new Uint8Array([1]),
			new Uint8Array([2]),
			new Uint8Array([3]),
		];
		const result = flatten(input);
		expect(result).toEqual(input);
	});

	it("flattens single-level nested array", () => {
		const input = [
			new Uint8Array([1]),
			[new Uint8Array([2]), new Uint8Array([3])],
		];
		const result = flatten(input);
		expect(result).toEqual([
			new Uint8Array([1]),
			new Uint8Array([2]),
			new Uint8Array([3]),
		]);
	});

	it("flattens deeply nested arrays", () => {
		const input = [
			new Uint8Array([1]),
			[new Uint8Array([2]), [new Uint8Array([3]), new Uint8Array([4])]],
		];
		const result = flatten(input);
		expect(result).toEqual([
			new Uint8Array([1]),
			new Uint8Array([2]),
			new Uint8Array([3]),
			new Uint8Array([4]),
		]);
	});

	it("flattens array with empty elements", () => {
		const input = [
			new Uint8Array([]),
			[new Uint8Array([1]), []],
			new Uint8Array([2]),
		];
		const result = flatten(input);
		expect(result).toEqual([
			new Uint8Array([]),
			new Uint8Array([1]),
			new Uint8Array([2]),
		]);
	});

	it("flattens complex nested structure", () => {
		const input = [
			[[new Uint8Array([1])], [[new Uint8Array([2])]]],
			new Uint8Array([3]),
		];
		const result = flatten(input);
		expect(result).toEqual([
			new Uint8Array([1]),
			new Uint8Array([2]),
			new Uint8Array([3]),
		]);
	});

	it("preserves Uint8Array content", () => {
		const input = [
			new Uint8Array([0xff, 0xfe]),
			[new Uint8Array([0x00, 0x01])],
		];
		const result = flatten(input);
		expect(result[0]).toEqual(new Uint8Array([0xff, 0xfe]));
		expect(result[1]).toEqual(new Uint8Array([0x00, 0x01]));
	});
});
