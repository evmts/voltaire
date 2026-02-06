import { describe, expect, it } from "vitest";
import { bitwiseXor } from "./bitwiseXor.js";
import { MAX, ZERO } from "./constants.js";
import { from } from "./from.js";

describe("Uint256.bitwiseXor", () => {
	describe("known values", () => {
		it("XOR with zero", () => {
			const result = bitwiseXor(from(42n), ZERO);
			expect(result).toBe(42n);
		});

		it("XOR with all ones", () => {
			const result = bitwiseXor(from(42n), MAX);
			expect(result).toBe(MAX ^ 42n);
		});

		it("XOR small values", () => {
			const result = bitwiseXor(from(0b1010n), from(0b0101n));
			expect(result).toBe(0b1111n);
		});

		it("XOR with same value", () => {
			const result = bitwiseXor(from(42n), from(42n));
			expect(result).toBe(0n);
		});

		it("XOR distinct bits", () => {
			const a = from(0xf0n);
			const b = from(0x0fn);
			const result = bitwiseXor(a, b);
			expect(result).toBe(0xffn);
		});
	});

	describe("edge cases", () => {
		it("0 ^ 0 = 0", () => {
			const result = bitwiseXor(ZERO, ZERO);
			expect(result).toBe(0n);
		});

		it("n ^ 0 = n", () => {
			const result = bitwiseXor(from(999n), ZERO);
			expect(result).toBe(999n);
		});

		it("n ^ n = 0", () => {
			const result = bitwiseXor(from(999n), from(999n));
			expect(result).toBe(0n);
		});

		it("n ^ MAX inverts all bits", () => {
			const result = bitwiseXor(from(0n), MAX);
			expect(result).toBe(MAX);
		});

		it("MAX ^ MAX = 0", () => {
			const result = bitwiseXor(MAX, MAX);
			expect(result).toBe(0n);
		});
	});

	describe("large values", () => {
		it("XOR across 128-bit boundary", () => {
			const a = from(1n << 200n);
			const b = from(1n << 100n);
			const result = bitwiseXor(a, b);
			expect(result).toBe((1n << 200n) ^ (1n << 100n));
		});

		it("XOR high and low bits", () => {
			const a = from(1n << 255n);
			const b = from(1n);
			const result = bitwiseXor(a, b);
			expect(result).toBe((1n << 255n) ^ 1n);
		});
	});

	describe("properties", () => {
		it("commutative: a ^ b = b ^ a", () => {
			const a = from(0xabcdn);
			const b = from(0x1234n);
			expect(bitwiseXor(a, b)).toBe(bitwiseXor(b, a));
		});

		it("associative: (a ^ b) ^ c = a ^ (b ^ c)", () => {
			const a = from(0xabcdn);
			const b = from(0x1234n);
			const c = from(0x5678n);
			const left = bitwiseXor(bitwiseXor(a, b), c);
			const right = bitwiseXor(a, bitwiseXor(b, c));
			expect(left).toBe(right);
		});

		it("identity: a ^ 0 = a", () => {
			const a = from(42n);
			expect(bitwiseXor(a, ZERO)).toBe(a);
		});

		it("self-inverse: a ^ a = 0", () => {
			const a = from(42n);
			expect(bitwiseXor(a, a)).toBe(0n);
		});

		it("involution: a ^ b ^ b = a", () => {
			const a = from(42n);
			const b = from(99n);
			const xored = bitwiseXor(a, b);
			const restored = bitwiseXor(xored, b);
			expect(restored).toBe(a);
		});
	});
});
