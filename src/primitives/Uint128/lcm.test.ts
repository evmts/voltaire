import { describe, expect, it } from "vitest";
import { ZERO } from "./constants.js";
import { from } from "./from.js";
import { lcm } from "./lcm.js";

describe("Uint128.lcm", () => {
	describe("known values", () => {
		it("calculates lcm(12, 18) = 36", () => {
			const result = lcm(from(12n), from(18n));
			expect(result).toBe(36n);
		});

		it("calculates lcm(4, 6) = 12", () => {
			const result = lcm(from(4n), from(6n));
			expect(result).toBe(12n);
		});

		it("calculates lcm(21, 6) = 42", () => {
			const result = lcm(from(21n), from(6n));
			expect(result).toBe(42n);
		});

		it("calculates lcm(17, 19) = 323 (coprime)", () => {
			const result = lcm(from(17n), from(19n));
			expect(result).toBe(323n);
		});
	});

	describe("edge cases", () => {
		it("lcm(0, n) = 0", () => {
			const result = lcm(ZERO, from(42n));
			expect(result).toBe(0n);
		});

		it("lcm(n, 0) = 0", () => {
			const result = lcm(from(42n), ZERO);
			expect(result).toBe(0n);
		});

		it("lcm(0, 0) = 0", () => {
			const result = lcm(ZERO, ZERO);
			expect(result).toBe(0n);
		});

		it("lcm(1, n) = n", () => {
			const result = lcm(from(1n), from(42n));
			expect(result).toBe(42n);
		});

		it("lcm(n, n) = n", () => {
			const result = lcm(from(999n), from(999n));
			expect(result).toBe(999n);
		});
	});

	describe("large values", () => {
		it("calculates lcm of large numbers", () => {
			const result = lcm(from(1000000n), from(750000n));
			expect(result).toBe(3000000n);
		});

		it("calculates lcm of powers of 2", () => {
			const result = lcm(from(1n << 32n), from(1n << 16n));
			expect(result).toBe(1n << 32n);
		});
	});

	describe("commutative", () => {
		it("lcm(a, b) = lcm(b, a)", () => {
			const a = from(12n);
			const b = from(18n);
			expect(lcm(a, b)).toBe(lcm(b, a));
		});
	});
});
