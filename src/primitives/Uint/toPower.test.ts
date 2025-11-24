import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { toPower } from "./toPower.js";

describe("Uint256.toPower", () => {
	describe("known values", () => {
		it("raises to power 0", () => {
			const result = toPower(from(42n), ZERO);
			expect(result).toBe(1n);
		});

		it("raises to power 1", () => {
			const result = toPower(from(42n), ONE);
			expect(result).toBe(42n);
		});

		it("calculates 2^8 = 256", () => {
			const result = toPower(from(2n), from(8n));
			expect(result).toBe(256n);
		});

		it("calculates 3^4 = 81", () => {
			const result = toPower(from(3n), from(4n));
			expect(result).toBe(81n);
		});

		it("calculates 10^6 = 1000000", () => {
			const result = toPower(from(10n), from(6n));
			expect(result).toBe(1000000n);
		});
	});

	describe("edge cases", () => {
		it("0^0 = 1 (mathematical convention)", () => {
			const result = toPower(ZERO, ZERO);
			expect(result).toBe(1n);
		});

		it("0^n = 0 for n > 0", () => {
			const result = toPower(ZERO, from(5n));
			expect(result).toBe(0n);
		});

		it("1^n = 1", () => {
			const result = toPower(ONE, from(999n));
			expect(result).toBe(1n);
		});

		it("n^0 = 1", () => {
			const result = toPower(from(999n), ZERO);
			expect(result).toBe(1n);
		});

		it("n^1 = n", () => {
			const result = toPower(from(999n), ONE);
			expect(result).toBe(999n);
		});

		it("wraps on overflow", () => {
			const result = toPower(from(2n), from(256n));
			expect(result).toBe(0n);
		});

		it("MAX^0 = 1", () => {
			const result = toPower(MAX, ZERO);
			expect(result).toBe(1n);
		});

		it("MAX^1 = MAX", () => {
			const result = toPower(MAX, ONE);
			expect(result).toBe(MAX);
		});

		it("2^255 is less than MAX", () => {
			const result = toPower(from(2n), from(255n));
			expect(result).toBe(1n << 255n);
		});
	});

	describe("large values", () => {
		it("calculates power of 2", () => {
			const result = toPower(from(2n), from(64n));
			expect(result).toBe(1n << 64n);
		});

		it("calculates 2^128", () => {
			const result = toPower(from(2n), from(128n));
			expect(result).toBe(1n << 128n);
		});

		it("wraps on 2^256", () => {
			const result = toPower(from(2n), from(256n));
			expect(result).toBe(0n);
		});

		it("calculates large base^small exponent", () => {
			const base = from(1n << 100n);
			const result = toPower(base, from(2n));
			const expected = ((1n << 100n) * (1n << 100n)) & MAX;
			expect(result).toBe(expected);
		});
	});

	describe("properties", () => {
		it("a^0 = 1 for all a", () => {
			expect(toPower(ZERO, ZERO)).toBe(1n);
			expect(toPower(from(1n), ZERO)).toBe(1n);
			expect(toPower(from(42n), ZERO)).toBe(1n);
		});

		it("a^1 = a for all a", () => {
			expect(toPower(ZERO, ONE)).toBe(0n);
			expect(toPower(from(42n), ONE)).toBe(42n);
			expect(toPower(MAX, ONE)).toBe(MAX);
		});

		it("1^n = 1 for all n", () => {
			expect(toPower(ONE, ZERO)).toBe(1n);
			expect(toPower(ONE, from(5n))).toBe(1n);
			expect(toPower(ONE, from(100n))).toBe(1n);
		});

		it("a^(b+c) = a^b * a^c (without overflow)", () => {
			const a = from(2n);
			const b = from(3n);
			const c = from(4n);
			const left = toPower(a, b + c);
			const right = (toPower(a, b) * toPower(a, c)) & MAX;
			expect(left).toBe(right);
		});
	});
});
