import { describe, it, expect } from "vitest";
import { isPowerOf2 } from "./isPowerOf2.js";
import { from } from "./from.js";
import { ZERO, ONE } from "./constants.js";

describe("Uint128.isPowerOf2", () => {
	describe("true cases", () => {
		it("returns true for 1", () => {
			expect(isPowerOf2(ONE)).toBe(true);
		});

		it("returns true for 2", () => {
			expect(isPowerOf2(from(2n))).toBe(true);
		});

		it("returns true for 4", () => {
			expect(isPowerOf2(from(4n))).toBe(true);
		});

		it("returns true for 8", () => {
			expect(isPowerOf2(from(8n))).toBe(true);
		});

		it("returns true for 16", () => {
			expect(isPowerOf2(from(16n))).toBe(true);
		});

		it("returns true for 1024", () => {
			expect(isPowerOf2(from(1024n))).toBe(true);
		});

		it("returns true for 2^32", () => {
			expect(isPowerOf2(from(1n << 32n))).toBe(true);
		});

		it("returns true for 2^64", () => {
			expect(isPowerOf2(from(1n << 64n))).toBe(true);
		});

		it("returns true for 2^127", () => {
			expect(isPowerOf2(from(1n << 127n))).toBe(true);
		});
	});

	describe("false cases", () => {
		it("returns false for 0", () => {
			expect(isPowerOf2(ZERO)).toBe(false);
		});

		it("returns false for 3", () => {
			expect(isPowerOf2(from(3n))).toBe(false);
		});

		it("returns false for 5", () => {
			expect(isPowerOf2(from(5n))).toBe(false);
		});

		it("returns false for 6", () => {
			expect(isPowerOf2(from(6n))).toBe(false);
		});

		it("returns false for 7", () => {
			expect(isPowerOf2(from(7n))).toBe(false);
		});

		it("returns false for 15", () => {
			expect(isPowerOf2(from(15n))).toBe(false);
		});

		it("returns false for 100", () => {
			expect(isPowerOf2(from(100n))).toBe(false);
		});

		it("returns false for 1023", () => {
			expect(isPowerOf2(from(1023n))).toBe(false);
		});

		it("returns false for 1025", () => {
			expect(isPowerOf2(from(1025n))).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("returns false for power of 2 minus 1", () => {
			expect(isPowerOf2(from((1n << 32n) - 1n))).toBe(false);
		});

		it("returns false for power of 2 plus 1", () => {
			expect(isPowerOf2(from((1n << 32n) + 1n))).toBe(false);
		});
	});
});
