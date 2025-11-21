import { describe, it, expect } from "vitest";
import { bitwiseOr } from "./bitwiseOr.js";
import { from } from "./from.js";
import { ZERO, MAX } from "./constants.js";

describe("Uint64.bitwiseOr", () => {
	describe("known values", () => {
		it("0b1100 | 0b1010 = 0b1110", () => {
			const result = bitwiseOr(from(0b1100n), from(0b1010n));
			expect(result).toBe(0b1110n);
		});

		it("0xff | 0x0f = 0xff", () => {
			const result = bitwiseOr(from(0xffn), from(0x0fn));
			expect(result).toBe(0xffn);
		});

		it("240 | 15 = 255", () => {
			const result = bitwiseOr(from(240n), from(15n));
			expect(result).toBe(255n);
		});

		it("0xff00 | 0x00ff = 0xffff", () => {
			const result = bitwiseOr(from(0xff00n), from(0x00ffn));
			expect(result).toBe(0xffffn);
		});
	});

	describe("edge cases", () => {
		it("n | 0 = n", () => {
			const result = bitwiseOr(from(42n), ZERO);
			expect(result).toBe(42n);
		});

		it("n | MAX = MAX", () => {
			const result = bitwiseOr(from(42n), MAX);
			expect(result).toBe(MAX);
		});

		it("MAX | MAX = MAX", () => {
			const result = bitwiseOr(MAX, MAX);
			expect(result).toBe(MAX);
		});

		it("n | n = n", () => {
			const result = bitwiseOr(from(999n), from(999n));
			expect(result).toBe(999n);
		});
	});

	describe("properties", () => {
		it("commutative: a | b = b | a", () => {
			const a = from(0b1100n);
			const b = from(0b1010n);
			expect(bitwiseOr(a, b)).toBe(bitwiseOr(b, a));
		});

		it("associative: (a | b) | c = a | (b | c)", () => {
			const a = from(0b1100n);
			const b = from(0b1010n);
			const c = from(0b0110n);
			expect(bitwiseOr(bitwiseOr(a, b), c)).toBe(bitwiseOr(a, bitwiseOr(b, c)));
		});

		it("idempotent: a | a = a", () => {
			const a = from(42n);
			expect(bitwiseOr(a, a)).toBe(a);
		});
	});
});
