import { describe, it, expect } from "vitest";
import { bitwiseNot } from "./bitwiseNot.js";
import { from } from "./from.js";
import { ZERO, MAX } from "./constants.js";

describe("Uint256.bitwiseNot", () => {
	describe("known values", () => {
		it("NOT zero", () => {
			const result = bitwiseNot(ZERO);
			expect(result).toBe(MAX);
		});

		it("NOT all ones", () => {
			const result = bitwiseNot(MAX);
			expect(result).toBe(0n);
		});

		it("NOT small value", () => {
			const result = bitwiseNot(from(0b1010n));
			expect(result).toBe(MAX ^ 0b1010n);
		});

		it("NOT 1", () => {
			const result = bitwiseNot(from(1n));
			expect(result).toBe(MAX ^ 1n);
		});

		it("NOT preserves bit pattern", () => {
			const value = from(0xffffn);
			const result = bitwiseNot(value);
			expect(result).toBe(MAX ^ 0xffffn);
		});
	});

	describe("edge cases", () => {
		it("~0 = MAX", () => {
			const result = bitwiseNot(ZERO);
			expect(result).toBe(MAX);
		});

		it("~MAX = 0", () => {
			const result = bitwiseNot(MAX);
			expect(result).toBe(0n);
		});
	});

	describe("large values", () => {
		it("NOT value at 128-bit boundary", () => {
			const value = from(1n << 128n);
			const result = bitwiseNot(value);
			expect(result).toBe(MAX ^ (1n << 128n));
		});

		it("NOT high bit set", () => {
			const value = from(1n << 255n);
			const result = bitwiseNot(value);
			expect(result).toBe(MAX ^ (1n << 255n));
		});

		it("NOT alternating bits", () => {
			const pattern =
				from(
					0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan,
				);
			const result = bitwiseNot(pattern);
			expect(result).toBe(MAX ^ pattern);
		});
	});

	describe("properties", () => {
		it("involution: ~~a = a", () => {
			const a = from(42n);
			const once = bitwiseNot(a);
			const twice = bitwiseNot(once);
			expect(twice).toBe(a);
		});

		it("complement: a | ~a = MAX", () => {
			const a = from(42n);
			const notA = bitwiseNot(a);
			expect(a | notA).toBe(MAX);
		});

		it("intersection: a & ~a = 0", () => {
			const a = from(42n);
			const notA = bitwiseNot(a);
			expect(a & notA).toBe(0n);
		});

		it("De Morgan's law: ~(a & b) = ~a | ~b", () => {
			const a = from(0xabcdn);
			const b = from(0x1234n);
			const left = bitwiseNot(a & b);
			const right = bitwiseNot(a) | bitwiseNot(b);
			expect(left).toBe(right);
		});

		it("De Morgan's law: ~(a | b) = ~a & ~b", () => {
			const a = from(0xabcdn);
			const b = from(0x1234n);
			const left = bitwiseNot(a | b);
			const right = bitwiseNot(a) & bitwiseNot(b);
			expect(left).toBe(right);
		});
	});
});
