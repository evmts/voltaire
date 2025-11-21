import { describe, it, expect } from "vitest";
import { gcd } from "./gcd.js";
import { from } from "./from.js";
import { ZERO, MAX } from "./constants.js";

describe("Uint256.gcd", () => {
	describe("known values", () => {
		it("calculates gcd(48, 18) = 6", () => {
			const result = gcd(from(48n), from(18n));
			expect(result).toBe(6n);
		});

		it("calculates gcd(100, 50) = 50", () => {
			const result = gcd(from(100n), from(50n));
			expect(result).toBe(50n);
		});

		it("calculates gcd(17, 19) = 1 (coprime)", () => {
			const result = gcd(from(17n), from(19n));
			expect(result).toBe(1n);
		});

		it("calculates gcd(1071, 462) = 21", () => {
			const result = gcd(from(1071n), from(462n));
			expect(result).toBe(21n);
		});
	});

	describe("edge cases", () => {
		it("gcd(0, n) = n", () => {
			const result = gcd(ZERO, from(42n));
			expect(result).toBe(42n);
		});

		it("gcd(n, 0) = n", () => {
			const result = gcd(from(42n), ZERO);
			expect(result).toBe(42n);
		});

		it("gcd(0, 0) = 0", () => {
			const result = gcd(ZERO, ZERO);
			expect(result).toBe(0n);
		});

		it("gcd(1, n) = 1", () => {
			const result = gcd(from(1n), from(123456n));
			expect(result).toBe(1n);
		});

		it("gcd(n, n) = n", () => {
			const result = gcd(from(999n), from(999n));
			expect(result).toBe(999n);
		});
	});

	describe("large values", () => {
		it("calculates gcd of large numbers", () => {
			const a = from(18446744073709551615n); // Uint64 max
			const b = from(4294967295n); // Uint32 max
			const result = gcd(a, b);
			expect(result).toBe(4294967295n);
		});

		it("calculates gcd with very large value", () => {
			const a = from(1n << 200n);
			const b = from(1n << 100n);
			const result = gcd(a, b);
			expect(result).toBe(1n << 100n);
		});

		it("calculates gcd of powers of 2", () => {
			const result = gcd(from(1n << 128n), from(1n << 64n));
			expect(result).toBe(1n << 64n);
		});
	});

	describe("commutative", () => {
		it("gcd(a, b) = gcd(b, a)", () => {
			const a = from(48n);
			const b = from(18n);
			expect(gcd(a, b)).toBe(gcd(b, a));
		});
	});
});
