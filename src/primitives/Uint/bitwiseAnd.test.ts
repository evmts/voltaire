import { describe, it, expect } from "vitest";
import { bitwiseAnd } from "./bitwiseAnd.js";
import { from } from "./from.js";
import { ZERO, MAX } from "./constants.js";

describe("Uint256.bitwiseAnd", () => {
	describe("known values", () => {
		it("0b1100 & 0b1010 = 0b1000", () => {
			const result = bitwiseAnd(from(0b1100n), from(0b1010n));
			expect(result).toBe(0b1000n);
		});

		it("0xff & 0x0f = 0x0f", () => {
			const result = bitwiseAnd(from(0xffn), from(0x0fn));
			expect(result).toBe(0x0fn);
		});

		it("255 & 15 = 15", () => {
			const result = bitwiseAnd(from(255n), from(15n));
			expect(result).toBe(15n);
		});

		it("masks high bits", () => {
			const result = bitwiseAnd(from(0xffffn), from(0xff00n));
			expect(result).toBe(0xff00n);
		});
	});

	describe("edge cases", () => {
		it("n & 0 = 0", () => {
			const result = bitwiseAnd(from(42n), ZERO);
			expect(result).toBe(0n);
		});

		it("n & MAX = n", () => {
			const result = bitwiseAnd(from(42n), MAX);
			expect(result).toBe(42n);
		});

		it("MAX & MAX = MAX", () => {
			const result = bitwiseAnd(MAX, MAX);
			expect(result).toBe(MAX);
		});

		it("n & n = n", () => {
			const result = bitwiseAnd(from(999n), from(999n));
			expect(result).toBe(999n);
		});
	});

	describe("large values", () => {
		it("masks 128-bit values", () => {
			const mask = from((1n << 128n) - 1n);
			const value = from((1n << 200n) | 0xffffn);
			const result = bitwiseAnd(value, mask);
			expect(result).toBe(0xffffn);
		});

		it("masks lower 64 bits", () => {
			const mask = from((1n << 64n) - 1n);
			const value = from((1n << 128n) | 0xdeadbeefn);
			const result = bitwiseAnd(value, mask);
			expect(result).toBe(0xdeadbeefn);
		});
	});

	describe("properties", () => {
		it("commutative: a & b = b & a", () => {
			const a = from(0b1100n);
			const b = from(0b1010n);
			expect(bitwiseAnd(a, b)).toBe(bitwiseAnd(b, a));
		});

		it("idempotent: a & a = a", () => {
			const a = from(42n);
			expect(bitwiseAnd(a, a)).toBe(a);
		});
	});
});
