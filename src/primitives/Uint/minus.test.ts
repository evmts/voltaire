import { describe, expect, it } from "vitest";
import { MAX, ZERO } from "./constants.js";
import { from } from "./from.js";
import { minus } from "./minus.js";

describe("Uint256.minus", () => {
	describe("known values", () => {
		it("subtracts zero", () => {
			const result = minus(from(42n), ZERO);
			expect(result).toBe(42n);
		});

		it("subtracts small values", () => {
			const result = minus(from(30n), from(10n));
			expect(result).toBe(20n);
		});

		it("subtracts 2 - 1 = 1", () => {
			const result = minus(from(2n), from(1n));
			expect(result).toBe(1n);
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

		it("n - n = 0", () => {
			const result = minus(from(999n), from(999n));
			expect(result).toBe(0n);
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
			const result = minus(ZERO, from(2n));
			expect(result).toBe(MAX - 1n);
		});

		it("1 - 2 wraps to MAX", () => {
			const result = minus(from(1n), from(2n));
			expect(result).toBe(MAX);
		});

		it("handles underflow with larger values", () => {
			const result = minus(from(100n), from(200n));
			expect(result).toBe(MAX - 99n);
		});
	});

	describe("large values", () => {
		it("subtracts Uint128 max values", () => {
			const a = from((1n << 128n) - 1n);
			const b = from(1n);
			const result = minus(a, b);
			expect(result).toBe((1n << 128n) - 2n);
		});

		it("subtracts values across 128-bit boundary", () => {
			const a = from(1n << 200n);
			const b = from(1n << 150n);
			const result = minus(a, b);
			expect(result).toBe((1n << 200n) - (1n << 150n));
		});

		it("MAX - 1 = MAX - 1", () => {
			const result = minus(MAX, from(1n));
			expect(result).toBe(MAX - 1n);
		});

		it("subtracts large values near MAX", () => {
			const a = MAX - 100n;
			const b = from(50n);
			const result = minus(a, b);
			expect(result).toBe(MAX - 150n);
		});
	});

	describe("properties", () => {
		it("inverse of addition: a - b + b = a", () => {
			const a = from(100n);
			const b = from(30n);
			const diff = minus(a, b);
			const sum = diff + b;
			expect(sum).toBe(a);
		});

		it("identity: a - 0 = a", () => {
			const a = from(42n);
			expect(minus(a, ZERO)).toBe(a);
		});

		it("self-subtraction: a - a = 0", () => {
			const a = from(12345n);
			expect(minus(a, a)).toBe(0n);
		});
	});
});
