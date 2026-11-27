import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { UintOverflowError } from "./errors.js";
import { from } from "./from.js";
import { times } from "./times.js";
import { timesWrapping } from "./timesWrapping.js";

describe("Uint256.times", () => {
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
			const result = times(from(10n), from(20n));
			expect(result).toBe(200n);
		});

		it("multiplies 5 * 5 = 25", () => {
			const result = times(from(5n), from(5n));
			expect(result).toBe(25n);
		});

		it("multiplies larger values", () => {
			const result = times(from(1000n), from(2000n));
			expect(result).toBe(2000000n);
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

		it("1 * n = n", () => {
			const result = times(ONE, from(999n));
			expect(result).toBe(999n);
		});

		it("MAX * 0 = 0", () => {
			const result = times(MAX, ZERO);
			expect(result).toBe(0n);
		});

		it("MAX * 1 = MAX", () => {
			const result = times(MAX, ONE);
			expect(result).toBe(MAX);
		});

		it("throws on overflow", () => {
			expect(() => times(MAX, from(2n))).toThrow(UintOverflowError);
			expect(timesWrapping(MAX, from(2n))).toBe(MAX - 1n);
		});

		it("throws on large overflow", () => {
			expect(() => times(from(1n << 200n), from(1n << 200n))).toThrow(
				UintOverflowError,
			);
			const expected = ((1n << 200n) * (1n << 200n)) & MAX;
			expect(timesWrapping(from(1n << 200n), from(1n << 200n))).toBe(expected);
		});
	});

	describe("large values", () => {
		it("multiplies Uint128 values", () => {
			const a = from(1n << 64n);
			const b = from(1n << 64n);
			const result = times(a, b);
			expect(result).toBe((1n << 128n) & MAX);
		});

		it("throws for values causing overflow (and wraps with timesWrapping)", () => {
			const a = from(1n << 128n);
			const b = from(1n << 128n);
			expect(() => times(a, b)).toThrow(UintOverflowError);
			const expected = ((1n << 128n) * (1n << 128n)) & MAX;
			expect(timesWrapping(a, b)).toBe(expected);
		});

		it("throws on multiplication near MAX (and wraps with timesWrapping)", () => {
			const a = MAX;
			const b = MAX;
			expect(() => times(a, b)).toThrow(UintOverflowError);
			expect(timesWrapping(a, b)).toBe(1n);
		});
	});

	describe("properties", () => {
		it("commutative: a * b = b * a", () => {
			const a = from(100n);
			const b = from(200n);
			expect(times(a, b)).toBe(times(b, a));
		});

		it("identity: a * 1 = a", () => {
			const a = from(42n);
			expect(times(a, ONE)).toBe(a);
		});

		it("zero: a * 0 = 0", () => {
			const a = from(42n);
			expect(times(a, ZERO)).toBe(0n);
		});

		it("distributive: a * (b + c) = a * b + a * c (without overflow)", () => {
			const a = from(10n);
			const b = from(20n);
			const c = from(30n);
			const left = times(a, b + c);
			const right = (times(a, b) + times(a, c)) & MAX;
			expect(left).toBe(right);
		});
	});
});
