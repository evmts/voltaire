import { describe, it, expect } from "vitest";
import { minus } from "./minus.js";
import { from } from "./from.js";
import { ZERO, MAX } from "./constants.js";

describe("Uint64.minus", () => {
	describe("known values", () => {
		it("subtracts zero", () => {
			const result = minus(from(42n), ZERO);
			expect(result).toBe(42n);
		});

		it("subtracts small values", () => {
			const result = minus(from(30n), from(10n));
			expect(result).toBe(20n);
		});

		it("subtracts equal values", () => {
			const result = minus(from(100n), from(100n));
			expect(result).toBe(0n);
		});

		it("subtracts larger values", () => {
			const result = minus(from(3000000n), from(1000000n));
			expect(result).toBe(2000000n);
		});
	});

	describe("edge cases", () => {
		it("0 - 0 = 0", () => {
			const result = minus(ZERO, ZERO);
			expect(result).toBe(0n);
		});

		it("n - 0 = n", () => {
			const result = minus(from(999n), ZERO);
			expect(result).toBe(999n);
		});

		it("MAX - 0 = MAX", () => {
			const result = minus(MAX, ZERO);
			expect(result).toBe(MAX);
		});

		it("MAX - MAX = 0", () => {
			const result = minus(MAX, MAX);
			expect(result).toBe(0n);
		});

		it("wraps on underflow", () => {
			const result = minus(ZERO, from(1n));
			expect(result).toBe(MAX);
		});

		it("wraps on large underflow", () => {
			const result = minus(from(5n), from(10n));
			expect(result).toBe(MAX - 4n);
		});
	});

	describe("properties", () => {
		it("inverse: a - a = 0", () => {
			const a = from(42n);
			expect(minus(a, a)).toBe(0n);
		});

		it("identity: a - 0 = a", () => {
			const a = from(42n);
			expect(minus(a, ZERO)).toBe(a);
		});
	});
});
