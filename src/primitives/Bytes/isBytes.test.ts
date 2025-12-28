import { describe, expect, it } from "vitest";
import { assert } from "./assert.js";
import { isBytes } from "./isBytes.js";

describe("Bytes.isBytes", () => {
	it("returns true for Uint8Array", () => {
		expect(isBytes(new Uint8Array([1, 2, 3]))).toBe(true);
		expect(isBytes(new Uint8Array([]))).toBe(true);
	});

	it("returns false for arrays", () => {
		expect(isBytes([1, 2, 3])).toBe(false);
	});

	it("returns false for strings", () => {
		expect(isBytes("0x1234")).toBe(false);
	});

	it("returns false for null/undefined", () => {
		expect(isBytes(null)).toBe(false);
		expect(isBytes(undefined)).toBe(false);
	});

	it("returns false for numbers", () => {
		expect(isBytes(123)).toBe(false);
	});
});

describe("Bytes.assert", () => {
	it("returns bytes for valid Uint8Array", () => {
		const bytes = new Uint8Array([1, 2, 3]);
		expect(assert(bytes)).toBe(bytes);
	});

	it("throws for non-Uint8Array", () => {
		expect(() => assert([1, 2, 3])).toThrow(/Expected Uint8Array/);
		expect(() => assert("0x1234")).toThrow(/Expected Uint8Array/);
		expect(() => assert(null)).toThrow(/Expected Uint8Array/);
	});
});
