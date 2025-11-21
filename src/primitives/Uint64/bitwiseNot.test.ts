import { describe, it, expect } from "vitest";
import { bitwiseNot } from "./bitwiseNot.js";
import { from } from "./from.js";
import { ZERO, MAX } from "./constants.js";

describe("Uint64.bitwiseNot", () => {
	describe("known values", () => {
		it("~0 = MAX", () => {
			const result = bitwiseNot(ZERO);
			expect(result).toBe(MAX);
		});

		it("~MAX = 0", () => {
			const result = bitwiseNot(MAX);
			expect(result).toBe(0n);
		});

		it("~0b1100 has correct bits flipped", () => {
			const result = bitwiseNot(from(0b1100n));
			expect(result).toBe(18446744073709551603n);
		});

		it("~0xff flips all bits in byte", () => {
			const result = bitwiseNot(from(0xffn));
			expect(result).toBe(18446744073709551360n);
		});
	});

	describe("properties", () => {
		it("double negation: ~~a = a", () => {
			const a = from(42n);
			expect(bitwiseNot(bitwiseNot(a))).toBe(a);
		});

		it("De Morgan: ~(a & b) = ~a | ~b", () => {
			const a = from(0b1100n);
			const b = from(0b1010n);
			const left = bitwiseNot(a & b);
			const right = bitwiseNot(a) | bitwiseNot(b);
			expect(left).toBe(right);
		});

		it("De Morgan: ~(a | b) = ~a & ~b", () => {
			const a = from(0b1100n);
			const b = from(0b1010n);
			const left = bitwiseNot(a | b);
			const right = bitwiseNot(a) & bitwiseNot(b);
			expect(left).toBe(right);
		});
	});
});
