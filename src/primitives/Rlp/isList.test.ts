/**
 * Tests for Rlp.isList
 */

import { describe, expect, it } from "vitest";
import { RlpDecodingError } from "./RlpError.js";
import { encode } from "./encode.js";
import { isList } from "./isList.js";

describe("Rlp.isList", () => {
	it("identifies empty list", () => {
		const data = encode([]);
		expect(isList(data)).toBe(true);
		expect(data[0]).toBe(0xc0);
	});

	it("identifies short list", () => {
		const data = encode([new Uint8Array([0x01]), new Uint8Array([0x02])]);
		expect(isList(data)).toBe(true);
	});

	it("identifies long list", () => {
		const items = Array.from({ length: 60 }, () => new Uint8Array([0x01]));
		const data = encode(items);
		expect(isList(data)).toBe(true);
	});

	it("identifies nested list", () => {
		const data = encode([[new Uint8Array([0x01])]]);
		expect(isList(data)).toBe(true);
	});

	it("returns false for single byte < 0x80", () => {
		const data = new Uint8Array([0x7f]);
		expect(isList(data)).toBe(false);
	});

	it("returns false for empty bytes", () => {
		const data = new Uint8Array([0x80]);
		expect(isList(data)).toBe(false);
	});

	it("returns false for short string", () => {
		const data = encode(new Uint8Array([1, 2, 3]));
		expect(isList(data)).toBe(false);
	});

	it("returns false for long string", () => {
		const data = encode(new Uint8Array(60).fill(0x42));
		expect(isList(data)).toBe(false);
	});

	it("checks list boundary (0xc0)", () => {
		const listData = new Uint8Array([0xc0]); // Empty list
		const bytesData = new Uint8Array([0xbf]); // Max short string
		expect(isList(listData)).toBe(true);
		expect(isList(bytesData)).toBe(false);
	});

	it("checks all list prefix ranges", () => {
		// Short list [0xc0, 0xf7]
		expect(isList(new Uint8Array([0xc0]))).toBe(true);
		expect(isList(new Uint8Array([0xf7, ...new Uint8Array(55)]))).toBe(true);

		// Long list [0xf8, 0xff]
		expect(isList(new Uint8Array([0xf8, 0x01, 0x00]))).toBe(true);
		expect(isList(new Uint8Array([0xff, ...new Uint8Array(8)]))).toBe(true);
	});

	it("throws on empty input", () => {
		const data = new Uint8Array([]);
		expect(() => isList(data)).toThrow(RlpDecodingError);
		expect(() => isList(data)).toThrow("Cannot check empty data");
	});
});
