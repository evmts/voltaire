import { describe, it, expect } from "vitest";
import { times } from "./times.js";
import { from } from "./from.js";
import { ZERO, ONE } from "./constants.js";

describe("Uint64.times", () => {
	describe("known values", () => {
		it("multiplies by zero", () => {
			const result = times(from(42n), ZERO);
			expect(result).toBe(0n);
		});

		it("multiplies by one", () => {
			const result = times(from(42n), ONE);
			expect(result).toBe(42n);
		});

		it("multiplies small values", () => {
			const result = times(from(6n), from(7n));
			expect(result).toBe(42n);
		});

		it("multiplies larger values", () => {
			const result = times(from(1000n), from(2000n));
			expect(result).toBe(2000000n);
		});

		it("multiplies powers of 2", () => {
			const result = times(from(16n), from(32n));
			expect(result).toBe(512n);
		});
	});

	describe("edge cases", () => {
		it("0 * 0 = 0", () => {
			const result = times(ZERO, ZERO);
			expect(result).toBe(0n);
		});

		it("n * 0 = 0", () => {
			const result = times(from(999n), ZERO);
			expect(result).toBe(0n);
		});

		it("n * 1 = n", () => {
			const result = times(from(999n), ONE);
			expect(result).toBe(999n);
		});

		it("wraps on overflow", () => {
			const a = from(1n << 32n);
			const b = from(1n << 33n);
			const result = times(a, b);
			expect(result).toBe(0n);
		});
	});

	describe("properties", () => {
		it("commutative: a * b = b * a", () => {
			const a = from(12n);
			const b = from(7n);
			expect(times(a, b)).toBe(times(b, a));
		});

		it("associative: (a * b) * c = a * (b * c)", () => {
			const a = from(2n);
			const b = from(3n);
			const c = from(5n);
			expect(times(times(a, b), c)).toBe(times(a, times(b, c)));
		});

		it("identity: a * 1 = a", () => {
			const a = from(42n);
			expect(times(a, ONE)).toBe(a);
		});

		it("zero: a * 0 = 0", () => {
			const a = from(42n);
			expect(times(a, ZERO)).toBe(0n);
		});
	});
});
