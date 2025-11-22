import { describe, it, expect } from "vitest";
import { popCount } from "./popCount.js";
import { from } from "./from.js";
import { ZERO, MAX, ONE } from "./constants.js";

describe("Uint256.popCount", () => {
	describe("known values", () => {
		it("popCount(0) = 0", () => {
			expect(popCount(ZERO)).toBe(0);
		});

		it("popCount(1) = 1", () => {
			expect(popCount(ONE)).toBe(1);
		});

		it("popCount(3) = 2", () => {
			expect(popCount(from(0b11n))).toBe(2);
		});

		it("popCount(7) = 3", () => {
			expect(popCount(from(0b111n))).toBe(3);
		});

		it("popCount(15) = 4", () => {
			expect(popCount(from(0b1111n))).toBe(4);
		});

		it("popCount(255) = 8", () => {
			expect(popCount(from(255n))).toBe(8);
		});
	});

	describe("edge cases", () => {
		it("popCount(MAX) = 256", () => {
			expect(popCount(MAX)).toBe(256);
		});

		it("popCount(MAX - 1) = 255", () => {
			expect(popCount(MAX - 1n)).toBe(255);
		});
	});

	describe("powers of 2", () => {
		it("popCount(2^n) = 1", () => {
			const cases = [0, 1, 7, 8, 63, 64, 127, 128, 255];
			for (const n of cases) {
				const value = from(1n << BigInt(n));
				expect(popCount(value)).toBe(1);
			}
		});

		it("popCount(2^n - 1) = n for n > 0", () => {
			const cases = [
				{ n: 8, expected: 8 },
				{ n: 16, expected: 16 },
				{ n: 32, expected: 32 },
				{ n: 64, expected: 64 },
				{ n: 128, expected: 128 },
			];
			for (const { n, expected } of cases) {
				const value = from((1n << BigInt(n)) - 1n);
				expect(popCount(value)).toBe(expected);
			}
		});
	});

	describe("alternating patterns", () => {
		it("popCount(0xAA...AA) = 128", () => {
			const pattern =
				from(
					0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan,
				);
			expect(popCount(pattern)).toBe(128);
		});

		it("popCount(0x55...55) = 128", () => {
			const pattern =
				from(
					0x5555555555555555555555555555555555555555555555555555555555555555n,
				);
			expect(popCount(pattern)).toBe(128);
		});
	});

	describe("properties", () => {
		it("popCount(a | b) >= max(popCount(a), popCount(b))", () => {
			const a = from(0b1010n);
			const b = from(0b0101n);
			const or = a | b;
			expect(popCount(or)).toBeGreaterThanOrEqual(
				Math.max(popCount(a), popCount(b)),
			);
		});

		it("popCount(a & b) <= min(popCount(a), popCount(b))", () => {
			const a = from(0b1111n);
			const b = from(0b0101n);
			const and = a & b;
			expect(popCount(and)).toBeLessThanOrEqual(
				Math.min(popCount(a), popCount(b)),
			);
		});

		it("popCount(a ^ b) = popCount(a | b) - popCount(a & b)", () => {
			const a = from(0xabcdn);
			const b = from(0x1234n);
			const xor = a ^ b;
			const or = a | b;
			const and = a & b;
			expect(popCount(xor)).toBe(popCount(or) - popCount(and));
		});

		it("popCount(~a) = 256 - popCount(a)", () => {
			const values = [ZERO, ONE, from(0xffn), from(1n << 128n)];
			for (const v of values) {
				const notV = MAX ^ v;
				expect(popCount(notV)).toBe(256 - popCount(v));
			}
		});
	});
});
