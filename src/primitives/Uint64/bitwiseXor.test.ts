import { describe, it, expect } from "vitest";
import { bitwiseXor } from "./bitwiseXor.js";
import { from } from "./from.js";
import { ZERO } from "./constants.js";

describe("Uint64.bitwiseXor", () => {
	describe("known values", () => {
		it("0b1100 ^ 0b1010 = 0b0110", () => {
			const result = bitwiseXor(from(0b1100n), from(0b1010n));
			expect(result).toBe(0b0110n);
		});

		it("0xff ^ 0x0f = 0xf0", () => {
			const result = bitwiseXor(from(0xffn), from(0x0fn));
			expect(result).toBe(0xf0n);
		});

		it("255 ^ 15 = 240", () => {
			const result = bitwiseXor(from(255n), from(15n));
			expect(result).toBe(240n);
		});

		it("0xffff ^ 0xff00 = 0x00ff", () => {
			const result = bitwiseXor(from(0xffffn), from(0xff00n));
			expect(result).toBe(0x00ffn);
		});
	});

	describe("edge cases", () => {
		it("n ^ 0 = n", () => {
			const result = bitwiseXor(from(42n), ZERO);
			expect(result).toBe(42n);
		});

		it("n ^ n = 0", () => {
			const result = bitwiseXor(from(999n), from(999n));
			expect(result).toBe(0n);
		});

		it("0 ^ 0 = 0", () => {
			const result = bitwiseXor(ZERO, ZERO);
			expect(result).toBe(0n);
		});
	});

	describe("properties", () => {
		it("commutative: a ^ b = b ^ a", () => {
			const a = from(0b1100n);
			const b = from(0b1010n);
			expect(bitwiseXor(a, b)).toBe(bitwiseXor(b, a));
		});

		it("associative: (a ^ b) ^ c = a ^ (b ^ c)", () => {
			const a = from(0b1100n);
			const b = from(0b1010n);
			const c = from(0b0110n);
			expect(bitwiseXor(bitwiseXor(a, b), c)).toBe(
				bitwiseXor(a, bitwiseXor(b, c)),
			);
		});

		it("self-inverse: (a ^ b) ^ b = a", () => {
			const a = from(42n);
			const b = from(99n);
			expect(bitwiseXor(bitwiseXor(a, b), b)).toBe(a);
		});
	});
});
