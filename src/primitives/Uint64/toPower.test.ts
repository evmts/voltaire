import { describe, it, expect } from "vitest";
import { toPower } from "./toPower.js";
import { from } from "./from.js";
import { ZERO, ONE } from "./constants.js";

describe("Uint64.toPower", () => {
	describe("known values", () => {
		it("n^0 = 1", () => {
			expect(toPower(from(42n), ZERO)).toBe(1n);
		});

		it("n^1 = n", () => {
			expect(toPower(from(42n), ONE)).toBe(42n);
		});

		it("2^8 = 256", () => {
			expect(toPower(from(2n), from(8n))).toBe(256n);
		});

		it("3^4 = 81", () => {
			expect(toPower(from(3n), from(4n))).toBe(81n);
		});

		it("5^5 = 3125", () => {
			expect(toPower(from(5n), from(5n))).toBe(3125n);
		});

		it("10^6 = 1000000", () => {
			expect(toPower(from(10n), from(6n))).toBe(1000000n);
		});
	});

	describe("edge cases", () => {
		it("0^0 = 1", () => {
			expect(toPower(ZERO, ZERO)).toBe(1n);
		});

		it("0^n = 0", () => {
			expect(toPower(ZERO, from(5n))).toBe(0n);
		});

		it("1^n = 1", () => {
			expect(toPower(ONE, from(100n))).toBe(1n);
		});

		it("wraps on overflow", () => {
			const result = toPower(from(2n), from(64n));
			expect(result).toBe(0n);
		});
	});
});
