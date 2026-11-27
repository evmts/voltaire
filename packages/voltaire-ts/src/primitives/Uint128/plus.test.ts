import { describe, expect, it } from "vitest";
import { MAX, ZERO } from "./constants.js";
import { Uint128OverflowError } from "./errors.js";
import { from } from "./from.js";
import { plus } from "./plus.js";
import { plusWrapping } from "./plusWrapping.js";

describe("Uint128.plus", () => {
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

		it("throws on overflow (and wraps with plusWrapping)", () => {
			expect(() => plus(MAX, from(1n))).toThrow(Uint128OverflowError);
			expect(plusWrapping(MAX, from(1n))).toBe(0n);
		});

		it("throws on large overflow (and wraps with plusWrapping)", () => {
			expect(() => plus(MAX, from(2n))).toThrow(Uint128OverflowError);
			expect(plusWrapping(MAX, from(2n))).toBe(1n);
		});
	});

	describe("large values", () => {
		it("adds Uint64 max values", () => {
			const a = from(18446744073709551615n);
			const b = from(18446744073709551615n);
			const result = plus(a, b);
			expect(result).toBe(36893488147419103230n);
		});
	});

	describe("properties", () => {
		it("commutative: a + b = b + a", () => {
			const a = from(100n);
			const b = from(200n);
			expect(plus(a, b)).toBe(plus(b, a));
		});

		it("identity: a + 0 = a", () => {
			const a = from(42n);
			expect(plus(a, ZERO)).toBe(a);
		});
	});
});
