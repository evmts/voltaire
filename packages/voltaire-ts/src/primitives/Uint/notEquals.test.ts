import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { notEquals } from "./notEquals.js";

describe("Uint256.notEquals", () => {
	describe("known values", () => {
		it("0 != 1", () => {
			expect(notEquals(ZERO, ONE)).toBe(true);
		});

		it("1 != 1 is false", () => {
			expect(notEquals(ONE, ONE)).toBe(false);
		});

		it("different values are not equal", () => {
			expect(notEquals(from(42n), from(99n))).toBe(true);
		});

		it("same values are equal (not not-equal)", () => {
			expect(notEquals(from(42n), from(42n))).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("0 != 0 is false", () => {
			expect(notEquals(ZERO, ZERO)).toBe(false);
		});

		it("0 != MAX", () => {
			expect(notEquals(ZERO, MAX)).toBe(true);
		});

		it("MAX != 0", () => {
			expect(notEquals(MAX, ZERO)).toBe(true);
		});

		it("MAX != MAX is false", () => {
			expect(notEquals(MAX, MAX)).toBe(false);
		});

		it("MAX != MAX - 1", () => {
			expect(notEquals(MAX, MAX - 1n)).toBe(true);
		});
	});

	describe("large values", () => {
		it("compares across 128-bit boundary", () => {
			const a = from(1n << 127n);
			const b = from(1n << 128n);
			expect(notEquals(a, b)).toBe(true);
		});

		it("equal large values", () => {
			const a = from(1n << 200n);
			const b = from(1n << 200n);
			expect(notEquals(a, b)).toBe(false);
		});
	});

	describe("properties", () => {
		it("symmetric: if a != b then b != a", () => {
			const a = from(10n);
			const b = from(20n);
			expect(notEquals(a, b)).toBe(notEquals(b, a));
		});

		it("irreflexive: a != a is false", () => {
			const a = from(42n);
			expect(notEquals(a, a)).toBe(false);
		});

		it("complement of equals: a != b iff not (a == b)", () => {
			const a = from(42n);
			const b = from(99n);
			expect(notEquals(a, b)).toBe(a !== b);
		});
	});
});
