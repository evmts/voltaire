/**
 * Tests for Rlp.isString
 */

import { describe, expect, it } from "vitest";
import { RlpDecodingError } from "./RlpError.js";
import { encode } from "./encode.js";
import { isString } from "./isString.js";

describe("Rlp.isString", () => {
	it("identifies single byte < 0x80", () => {
		const data = new Uint8Array([0x7f]);
		expect(isString(data)).toBe(true);
	});

	it("identifies single byte at 0x00", () => {
		const data = new Uint8Array([0x00]);
		expect(isString(data)).toBe(true);
	});

	it("identifies empty bytes (0x80)", () => {
		const data = new Uint8Array([0x80]);
		expect(isString(data)).toBe(true);
	});

	it("identifies short string", () => {
		const data = encode(new Uint8Array([1, 2, 3]));
		expect(isString(data)).toBe(true);
		expect(data[0]).toBeGreaterThanOrEqual(0x80);
		expect(data[0]).toBeLessThan(0xc0);
	});

	it("identifies long string", () => {
		const data = encode(new Uint8Array(60).fill(0x42));
		expect(isString(data)).toBe(true);
		expect(data[0]).toBeGreaterThanOrEqual(0xb8);
		expect(data[0]).toBeLessThan(0xc0);
	});

	it("returns false for empty list", () => {
		const data = encode([]);
		expect(isString(data)).toBe(false);
		expect(data[0]).toBe(0xc0);
	});

	it("returns false for short list", () => {
		const data = encode([new Uint8Array([0x01])]);
		expect(isString(data)).toBe(false);
	});

	it("returns false for long list", () => {
		const items = Array.from({ length: 60 }, () => new Uint8Array([0x01]));
		const data = encode(items);
		expect(isString(data)).toBe(false);
	});

	it("checks string/list boundary (0xc0)", () => {
		const stringData = new Uint8Array([0xbf]); // Max short string prefix
		const listData = new Uint8Array([0xc0]); // Empty list
		expect(isString(stringData)).toBe(true);
		expect(isString(listData)).toBe(false);
	});

	it("checks all string prefix ranges", () => {
		// Single byte [0x00, 0x7f]
		expect(isString(new Uint8Array([0x00]))).toBe(true);
		expect(isString(new Uint8Array([0x7f]))).toBe(true);

		// Short string [0x80, 0xb7]
		expect(isString(new Uint8Array([0x80]))).toBe(true);
		expect(isString(new Uint8Array([0xb7, ...new Uint8Array(55)]))).toBe(true);

		// Long string [0xb8, 0xbf]
		expect(isString(new Uint8Array([0xb8, 0x01, 0x00]))).toBe(true);
		expect(isString(new Uint8Array([0xbf, ...new Uint8Array(8)]))).toBe(true);
	});

	it("identifies encoded text string", () => {
		const text = "hello world";
		const textBytes = new TextEncoder().encode(text);
		const data = encode(textBytes);
		expect(isString(data)).toBe(true);
	});

	it("throws on empty input", () => {
		const data = new Uint8Array([]);
		expect(() => isString(data)).toThrow(RlpDecodingError);
		expect(() => isString(data)).toThrow("Cannot check empty data");
	});
});
