import { describe, it, expect } from "vitest";
import { plus } from "./plus.js";
import { from } from "./from.js";
import { ZERO, MAX } from "./constants.js";

describe("Uint64.plus", () => {
	describe("known values", () => {
		it("adds zero", () => {
			const result = plus(from(42n), ZERO);
			expect(result).toBe(42n);
		});

		it("adds small values", () => {
			const result = plus(from(10n), from(20n));
			expect(result).toBe(30n);
		});

		it("adds 1 + 1 = 2", () => {
			const result = plus(from(1n), from(1n));
			expect(result).toBe(2n);
		});

		it("adds larger values", () => {
			const result = plus(from(1000000n), from(2000000n));
			expect(result).toBe(3000000n);
		});
	});

	describe("edge cases", () => {
		it("0 + 0 = 0", () => {
			const result = plus(ZERO, ZERO);
			expect(result).toBe(0n);
		});

		it("n + 0 = n", () => {
			const result = plus(from(999n), ZERO);
			expect(result).toBe(999n);
		});

		it("MAX + 0 = MAX", () => {
			const result = plus(MAX, ZERO);
			expect(result).toBe(MAX);
		});

		it("wraps on overflow", () => {
			const result = plus(MAX, from(1n));
			expect(result).toBe(0n);
		});

		it("wraps on large overflow", () => {
			const result = plus(MAX, from(2n));
			expect(result).toBe(1n);
		});
	});

	describe("properties", () => {
		it("commutative: a + b = b + a", () => {
			const a = from(100n);
			const b = from(200n);
			expect(plus(a, b)).toBe(plus(b, a));
		});

		it("associative: (a + b) + c = a + (b + c)", () => {
			const a = from(10n);
			const b = from(20n);
			const c = from(30n);
			expect(plus(plus(a, b), c)).toBe(plus(a, plus(b, c)));
		});

		it("identity: a + 0 = a", () => {
			const a = from(42n);
			expect(plus(a, ZERO)).toBe(a);
		});
	});
});
