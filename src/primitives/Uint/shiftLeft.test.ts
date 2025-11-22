import { describe, it, expect } from "vitest";
import { shiftLeft } from "./shiftLeft.js";
import { from } from "./from.js";
import { ZERO, MAX, ONE } from "./constants.js";

describe("Uint256.shiftLeft", () => {
	describe("known values", () => {
		it("shift by zero", () => {
			const result = shiftLeft(from(42n), ZERO);
			expect(result).toBe(42n);
		});

		it("shift 1 by 1 = 2", () => {
			const result = shiftLeft(ONE, ONE);
			expect(result).toBe(2n);
		});

		it("shift 1 by 8 = 256", () => {
			const result = shiftLeft(ONE, from(8n));
			expect(result).toBe(256n);
		});

		it("shift small value", () => {
			const result = shiftLeft(from(0b1010n), from(2n));
			expect(result).toBe(0b101000n);
		});

		it("shift by large amount", () => {
			const result = shiftLeft(from(5n), from(100n));
			expect(result).toBe(5n << 100n);
		});
	});

	describe("edge cases", () => {
		it("0 << n = 0", () => {
			const result = shiftLeft(ZERO, from(10n));
			expect(result).toBe(0n);
		});

		it("n << 0 = n", () => {
			const result = shiftLeft(from(999n), ZERO);
			expect(result).toBe(999n);
		});

		it("1 << 255 sets highest bit", () => {
			const result = shiftLeft(ONE, from(255n));
			expect(result).toBe(1n << 255n);
		});

		it("1 << 256 wraps to 0", () => {
			const result = shiftLeft(ONE, from(256n));
			expect(result).toBe(0n);
		});

		it("shifts larger than 256 result in 0", () => {
			const result = shiftLeft(from(42n), from(300n));
			expect(result).toBe(0n);
		});

		it("MAX << 1 loses high bit", () => {
			const result = shiftLeft(MAX, ONE);
			expect(result).toBe((MAX << 1n) & MAX);
		});
	});

	describe("large values", () => {
		it("shift across 128-bit boundary", () => {
			const value = from(1n << 100n);
			const result = shiftLeft(value, from(28n));
			expect(result).toBe(1n << 128n);
		});

		it("shift high value loses bits", () => {
			const value = from(1n << 255n);
			const result = shiftLeft(value, ONE);
			expect(result).toBe(0n);
		});

		it("shift pattern left", () => {
			const pattern = from(0xffffn);
			const result = shiftLeft(pattern, from(64n));
			expect(result).toBe(0xffffn << 64n);
		});
	});

	describe("properties", () => {
		it("identity: n << 0 = n", () => {
			const n = from(42n);
			expect(shiftLeft(n, ZERO)).toBe(n);
		});

		it("multiplication: (n << k) = n * 2^k (without overflow)", () => {
			const n = from(42n);
			const k = from(10n);
			const shifted = shiftLeft(n, k);
			const multiplied = (n * (1n << k)) & MAX;
			expect(shifted).toBe(multiplied);
		});

		it("associative: (n << a) << b = n << (a + b)", () => {
			const n = from(42n);
			const a = from(10n);
			const b = from(20n);
			const left = shiftLeft(shiftLeft(n, a), b);
			const right = shiftLeft(n, (a + b) & MAX);
			expect(left).toBe(right);
		});

		it("zero: 0 << n = 0", () => {
			expect(shiftLeft(ZERO, from(10n))).toBe(0n);
		});
	});
});
