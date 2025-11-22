import { describe, it, expect } from "vitest";
import { modulo } from "./modulo.js";
import { from } from "./from.js";
import { ZERO, MAX, ONE } from "./constants.js";

describe("Uint256.modulo", () => {
	describe("known values", () => {
		it("modulo by one returns zero", () => {
			const result = modulo(from(42n), ONE);
			expect(result).toBe(0n);
		});

		it("calculates small modulo", () => {
			const result = modulo(from(10n), from(3n));
			expect(result).toBe(1n);
		});

		it("calculates 25 % 5 = 0", () => {
			const result = modulo(from(25n), from(5n));
			expect(result).toBe(0n);
		});

		it("calculates 27 % 5 = 2", () => {
			const result = modulo(from(27n), from(5n));
			expect(result).toBe(2n);
		});

		it("calculates larger modulo", () => {
			const result = modulo(from(1000000n), from(7n));
			expect(result).toBe(1000000n % 7n);
		});
	});

	describe("edge cases", () => {
		it("0 % n = 0", () => {
			const result = modulo(ZERO, from(999n));
			expect(result).toBe(0n);
		});

		it("n % 1 = 0", () => {
			const result = modulo(from(999n), ONE);
			expect(result).toBe(0n);
		});

		it("n % n = 0", () => {
			const result = modulo(from(999n), from(999n));
			expect(result).toBe(0n);
		});

		it("MAX % 1 = 0", () => {
			const result = modulo(MAX, ONE);
			expect(result).toBe(0n);
		});

		it("MAX % MAX = 0", () => {
			const result = modulo(MAX, MAX);
			expect(result).toBe(0n);
		});

		it("throws on modulo by zero", () => {
			expect(() => modulo(from(42n), ZERO)).toThrow();
		});

		it("1 % 2 = 1", () => {
			const result = modulo(from(1n), from(2n));
			expect(result).toBe(1n);
		});

		it("smaller % larger = smaller", () => {
			const result = modulo(from(100n), from(200n));
			expect(result).toBe(100n);
		});
	});

	describe("large values", () => {
		it("calculates modulo with Uint128 values", () => {
			const a = from((1n << 128n) + 5n);
			const b = from(1n << 64n);
			const result = modulo(a, b);
			expect(result).toBe(((1n << 128n) + 5n) % (1n << 64n));
		});

		it("calculates MAX % small value", () => {
			const result = modulo(MAX, from(3n));
			expect(result).toBe(MAX % 3n);
		});

		it("calculates MAX % power of 2", () => {
			const result = modulo(MAX, from(256n));
			expect(result).toBe(MAX % 256n);
		});

		it("handles large dividend and divisor", () => {
			const a = MAX - 100n;
			const b = from(1n << 128n);
			const result = modulo(a, b);
			expect(result).toBe((MAX - 100n) % (1n << 128n));
		});
	});

	describe("properties", () => {
		it("result is always less than divisor", () => {
			const a = from(100n);
			const b = from(7n);
			const r = modulo(a, b);
			expect(r).toBeLessThan(b);
		});

		it("a = (a / b) * b + (a % b)", () => {
			const a = from(100n);
			const b = from(7n);
			const q = a / b;
			const r = modulo(a, b);
			expect(q * b + r).toBe(a);
		});

		it("n % 1 = 0 for all n", () => {
			expect(modulo(ZERO, ONE)).toBe(0n);
			expect(modulo(from(42n), ONE)).toBe(0n);
			expect(modulo(MAX, ONE)).toBe(0n);
		});

		it("n % n = 0 for all n", () => {
			const values = [from(1n), from(42n), from(1000n), from(1n << 128n)];
			for (const v of values) {
				expect(modulo(v, v)).toBe(0n);
			}
		});
	});
});
