/**
 * Tests for Rlp.decodeObject
 */

import { describe, expect, it } from "vitest";
import { decodeObject } from "./decodeObject.js";
import { encodeObject } from "./encodeObject.js";

describe("Rlp.decodeObject", () => {
	it("decodes empty object", () => {
		const obj = {};
		const encoded = encodeObject(obj);
		const result = decodeObject(encoded);
		expect(result).toEqual({});
	});

	it("decodes object with single key", () => {
		const obj = { name: new Uint8Array([65, 66, 67]) };
		const encoded = encodeObject(obj);
		const result = decodeObject(encoded);
		expect(result.name).toEqual(new Uint8Array([65, 66, 67]));
	});

	it("decodes object with multiple keys", () => {
		const obj = {
			name: new Uint8Array([65, 66, 67]),
			age: new Uint8Array([25]),
			city: new Uint8Array([78, 89, 67]),
		};
		const encoded = encodeObject(obj);
		const result = decodeObject(encoded);
		expect(result.name).toEqual(new Uint8Array([65, 66, 67]));
		expect(result.age).toEqual(new Uint8Array([25]));
		expect(result.city).toEqual(new Uint8Array([78, 89, 67]));
	});

	it("decodes object with nested arrays", () => {
		const obj = {
			items: [new Uint8Array([1]), new Uint8Array([2])],
		};
		const encoded = encodeObject(obj);
		const result = decodeObject(encoded);
		expect(Array.isArray(result.items)).toBe(true);
		expect(result.items).toHaveLength(2);
	});

	it("decodes object with empty values", () => {
		const obj = {
			empty: new Uint8Array([]),
			filled: new Uint8Array([1, 2, 3]),
		};
		const encoded = encodeObject(obj);
		const result = decodeObject(encoded);
		expect(result.empty).toEqual(new Uint8Array([]));
		expect(result.filled).toEqual(new Uint8Array([1, 2, 3]));
	});

	it("decodes object with unicode keys", () => {
		const obj = {
			"🔑": new Uint8Array([1, 2, 3]),
			键: new Uint8Array([4, 5, 6]),
		};
		const encoded = encodeObject(obj);
		const result = decodeObject(encoded);
		expect(result["🔑"]).toEqual(new Uint8Array([1, 2, 3]));
		expect(result.键).toEqual(new Uint8Array([4, 5, 6]));
	});

	it("round-trips complex object", () => {
		const obj = {
			name: new Uint8Array([65, 66]),
			data: new Uint8Array(Array(100).fill(0xff)),
			flag: new Uint8Array([1]),
		};
		const encoded = encodeObject(obj);
		const result = decodeObject(encoded);
		expect(result.name).toEqual(obj.name);
		expect(result.data).toEqual(obj.data);
		expect(result.flag).toEqual(obj.flag);
	});

	it("throws on invalid non-array data", () => {
		const invalidData = new Uint8Array([0x80]);
		expect(() => decodeObject(invalidData)).toThrow("Expected array");
	});
});
