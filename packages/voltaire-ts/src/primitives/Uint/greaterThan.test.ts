import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { greaterThan } from "./greaterThan.js";

describe("Uint256.greaterThan", () => {
	describe("known values", () => {
		it("1 > 0", () => {
			expect(greaterThan(ONE, ZERO)).toBe(true);
		});

		it("0 > 1 is false", () => {
			expect(greaterThan(ZERO, ONE)).toBe(false);
		});

		it("10 > 5", () => {
			expect(greaterThan(from(10n), from(5n))).toBe(true);
		});

		it("5 > 10 is false", () => {
			expect(greaterThan(from(5n), from(10n))).toBe(false);
		});

		it("equal values are not greater than", () => {
			expect(greaterThan(from(42n), from(42n))).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("0 > 0 is false", () => {
			expect(greaterThan(ZERO, ZERO)).toBe(false);
		});

		it("MAX > 0", () => {
			expect(greaterThan(MAX, ZERO)).toBe(true);
		});

		it("0 > MAX is false", () => {
			expect(greaterThan(ZERO, MAX)).toBe(false);
		});

		it("MAX > MAX is false", () => {
			expect(greaterThan(MAX, MAX)).toBe(false);
		});

		it("MAX > MAX - 1", () => {
			expect(greaterThan(MAX, MAX - 1n)).toBe(true);
		});
	});

	describe("large values", () => {
		it("compares across 128-bit boundary", () => {
			const a = from(1n << 128n);
			const b = from(1n << 127n);
			expect(greaterThan(a, b)).toBe(true);
		});

		it("compares high bit set values", () => {
			const a = from((1n << 255n) + 1n);
			const b = from(1n << 255n);
			expect(greaterThan(a, b)).toBe(true);
		});
	});

	describe("properties", () => {
		it("asymmetric: if a > b then not b > a", () => {
			const a = from(20n);
			const b = from(10n);
			expect(greaterThan(a, b)).toBe(true);
			expect(greaterThan(b, a)).toBe(false);
		});

		it("irreflexive: a > a is false", () => {
			const a = from(42n);
			expect(greaterThan(a, a)).toBe(false);
		});

		it("transitive: if a > b and b > c then a > c", () => {
			const a = from(30n);
			const b = from(20n);
			const c = from(10n);
			expect(greaterThan(a, b)).toBe(true);
			expect(greaterThan(b, c)).toBe(true);
			expect(greaterThan(a, c)).toBe(true);
		});
	});
});
