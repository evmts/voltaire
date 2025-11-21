import { describe, it, expect } from "vitest";
import { greaterThan } from "./greaterThan.js";
import { from } from "./from.js";
import { ZERO, ONE, MAX } from "./constants.js";

describe("Uint64.greaterThan", () => {
	describe("true cases", () => {
		it("1 > 0", () => {
			expect(greaterThan(ONE, ZERO)).toBe(true);
		});

		it("2 > 1", () => {
			expect(greaterThan(from(2n), ONE)).toBe(true);
		});

		it("43 > 42", () => {
			expect(greaterThan(from(43n), from(42n))).toBe(true);
		});

		it("MAX > MAX - 1", () => {
			expect(greaterThan(MAX, from(MAX - 1n))).toBe(true);
		});

		it("large > small", () => {
			expect(greaterThan(from(1000000n), from(100n))).toBe(true);
		});

		it("MAX > 0", () => {
			expect(greaterThan(MAX, ZERO)).toBe(true);
		});
	});

	describe("false cases", () => {
		it("0 > 1 is false", () => {
			expect(greaterThan(ZERO, ONE)).toBe(false);
		});

		it("1 > 1 is false", () => {
			expect(greaterThan(ONE, ONE)).toBe(false);
		});

		it("42 > 43 is false", () => {
			expect(greaterThan(from(42n), from(43n))).toBe(false);
		});

		it("MAX > MAX is false", () => {
			expect(greaterThan(MAX, MAX)).toBe(false);
		});
	});

	describe("properties", () => {
		it("irreflexive: not(a > a)", () => {
			const a = from(42n);
			expect(greaterThan(a, a)).toBe(false);
		});

		it("asymmetric: a > b implies not(b > a)", () => {
			const a = from(20n);
			const b = from(10n);
			if (greaterThan(a, b)) {
				expect(greaterThan(b, a)).toBe(false);
			}
		});

		it("transitive: a > b and b > c implies a > c", () => {
			const a = from(30n);
			const b = from(20n);
			const c = from(10n);
			if (greaterThan(a, b) && greaterThan(b, c)) {
				expect(greaterThan(a, c)).toBe(true);
			}
		});
	});
});
