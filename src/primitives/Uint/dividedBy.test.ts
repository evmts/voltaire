import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { dividedBy } from "./dividedBy.js";
import { from } from "./from.js";

describe("Uint256.dividedBy", () => {
	describe("known values", () => {
		it("divides by one", () => {
			const result = dividedBy(from(42n), ONE);
			expect(result).toBe(42n);
		});

		it("divides small values", () => {
			const result = dividedBy(from(100n), from(10n));
			expect(result).toBe(10n);
		});

		it("divides 25 / 5 = 5", () => {
			const result = dividedBy(from(25n), from(5n));
			expect(result).toBe(5n);
		});

		it("divides larger values", () => {
			const result = dividedBy(from(2000000n), from(1000n));
			expect(result).toBe(2000n);
		});

		it("rounds down on non-exact division", () => {
			const result = dividedBy(from(10n), from(3n));
			expect(result).toBe(3n);
		});
	});

	describe("edge cases", () => {
		it("0 / n = 0", () => {
			const result = dividedBy(ZERO, from(999n));
			expect(result).toBe(0n);
		});

		it("n / 1 = n", () => {
			const result = dividedBy(from(999n), ONE);
			expect(result).toBe(999n);
		});

		it("n / n = 1", () => {
			const result = dividedBy(from(999n), from(999n));
			expect(result).toBe(1n);
		});

		it("MAX / 1 = MAX", () => {
			const result = dividedBy(MAX, ONE);
			expect(result).toBe(MAX);
		});

		it("MAX / MAX = 1", () => {
			const result = dividedBy(MAX, MAX);
			expect(result).toBe(1n);
		});

		it("throws on division by zero", () => {
			expect(() => dividedBy(from(42n), ZERO)).toThrow();
		});

		it("1 / 2 = 0 (rounds down)", () => {
			const result = dividedBy(from(1n), from(2n));
			expect(result).toBe(0n);
		});

		it("smaller / larger = 0", () => {
			const result = dividedBy(from(100n), from(200n));
			expect(result).toBe(0n);
		});
	});

	describe("large values", () => {
		it("divides Uint128 values", () => {
			const a = from(1n << 128n);
			const b = from(1n << 64n);
			const result = dividedBy(a, b);
			expect(result).toBe(1n << 64n);
		});

		it("divides values across bit boundaries", () => {
			const a = from(1n << 200n);
			const b = from(1n << 100n);
			const result = dividedBy(a, b);
			expect(result).toBe(1n << 100n);
		});

		it("MAX / 2 rounds down", () => {
			const result = dividedBy(MAX, from(2n));
			expect(result).toBe(MAX >> 1n);
		});

		it("handles large dividend and small divisor", () => {
			const a = MAX - 100n;
			const b = from(2n);
			const result = dividedBy(a, b);
			expect(result).toBe((MAX - 100n) / 2n);
		});
	});

	describe("properties", () => {
		it("identity: a / 1 = a", () => {
			const a = from(42n);
			expect(dividedBy(a, ONE)).toBe(a);
		});

		it("self-division: a / a = 1", () => {
			const a = from(12345n);
			expect(dividedBy(a, a)).toBe(1n);
		});

		it("zero numerator: 0 / a = 0", () => {
			const a = from(999n);
			expect(dividedBy(ZERO, a)).toBe(0n);
		});

		it("quotient * divisor <= dividend", () => {
			const a = from(100n);
			const b = from(7n);
			const q = dividedBy(a, b);
			expect(q * b).toBeLessThanOrEqual(a);
		});
	});
});
