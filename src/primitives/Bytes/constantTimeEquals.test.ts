import { describe, expect, it } from "vitest";
import { constantTimeEquals } from "./constantTimeEquals.js";
import { from } from "./from.js";

describe("constantTimeEquals", () => {
	it("returns true for equal arrays", () => {
		const a = from([1, 2, 3, 4]);
		const b = from([1, 2, 3, 4]);
		expect(constantTimeEquals(a, b)).toBe(true);
	});

	it("returns false for different arrays of same length", () => {
		const a = from([1, 2, 3, 4]);
		const b = from([1, 2, 3, 5]);
		expect(constantTimeEquals(a, b)).toBe(false);
	});

	it("returns false for arrays of different lengths", () => {
		const a = from([1, 2, 3]);
		const b = from([1, 2, 3, 4]);
		expect(constantTimeEquals(a, b)).toBe(false);
	});

	it("returns false when first array is longer", () => {
		const a = from([1, 2, 3, 4, 5]);
		const b = from([1, 2, 3, 4]);
		expect(constantTimeEquals(a, b)).toBe(false);
	});

	it("returns true for empty arrays", () => {
		const a = from([]);
		const b = from([]);
		expect(constantTimeEquals(a, b)).toBe(true);
	});

	it("returns false comparing empty to non-empty", () => {
		const a = from([]);
		const b = from([1]);
		expect(constantTimeEquals(a, b)).toBe(false);
	});

	it("returns true for arrays with zeros", () => {
		const a = from([0, 0, 0]);
		const b = from([0, 0, 0]);
		expect(constantTimeEquals(a, b)).toBe(true);
	});

	it("returns false when arrays differ only in first byte", () => {
		const a = from([0, 2, 3, 4]);
		const b = from([1, 2, 3, 4]);
		expect(constantTimeEquals(a, b)).toBe(false);
	});

	it("returns false when arrays differ only in last byte", () => {
		const a = from([1, 2, 3, 4]);
		const b = from([1, 2, 3, 0]);
		expect(constantTimeEquals(a, b)).toBe(false);
	});

	it("handles max byte values correctly", () => {
		const a = from([255, 255, 255]);
		const b = from([255, 255, 255]);
		expect(constantTimeEquals(a, b)).toBe(true);
	});

	it("detects difference with max byte values", () => {
		const a = from([255, 255, 255]);
		const b = from([255, 254, 255]);
		expect(constantTimeEquals(a, b)).toBe(false);
	});
});
