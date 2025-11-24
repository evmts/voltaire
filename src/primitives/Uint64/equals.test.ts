import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { equals } from "./equals.js";
import { from } from "./from.js";

describe("Uint64.equals", () => {
	describe("true cases", () => {
		it("0 == 0", () => {
			expect(equals(ZERO, ZERO)).toBe(true);
		});

		it("1 == 1", () => {
			expect(equals(ONE, ONE)).toBe(true);
		});

		it("MAX == MAX", () => {
			expect(equals(MAX, MAX)).toBe(true);
		});

		it("42 == 42", () => {
			expect(equals(from(42n), from(42n))).toBe(true);
		});

		it("large value equals itself", () => {
			const val = from(18446744073709551614n);
			expect(equals(val, val)).toBe(true);
		});
	});

	describe("false cases", () => {
		it("0 != 1", () => {
			expect(equals(ZERO, ONE)).toBe(false);
		});

		it("1 != 0", () => {
			expect(equals(ONE, ZERO)).toBe(false);
		});

		it("42 != 43", () => {
			expect(equals(from(42n), from(43n))).toBe(false);
		});

		it("MAX != MAX - 1", () => {
			expect(equals(MAX, from(MAX - 1n))).toBe(false);
		});
	});

	describe("properties", () => {
		it("reflexive: a == a", () => {
			const a = from(42n);
			expect(equals(a, a)).toBe(true);
		});

		it("symmetric: a == b implies b == a", () => {
			const a = from(42n);
			const b = from(42n);
			expect(equals(a, b)).toBe(equals(b, a));
		});

		it("transitive: a == b and b == c implies a == c", () => {
			const a = from(42n);
			const b = from(42n);
			const c = from(42n);
			if (equals(a, b) && equals(b, c)) {
				expect(equals(a, c)).toBe(true);
			}
		});
	});
});
