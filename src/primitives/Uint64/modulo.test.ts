import { describe, expect, it } from "vitest";
import { ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { modulo } from "./modulo.js";

describe("Uint64.modulo", () => {
	describe("known values", () => {
		it("10 % 3 = 1", () => {
			const result = modulo(from(10n), from(3n));
			expect(result).toBe(1n);
		});

		it("42 % 5 = 2", () => {
			const result = modulo(from(42n), from(5n));
			expect(result).toBe(2n);
		});

		it("100 % 7 = 2", () => {
			const result = modulo(from(100n), from(7n));
			expect(result).toBe(2n);
		});

		it("evenly divisible gives 0", () => {
			const result = modulo(from(42n), from(6n));
			expect(result).toBe(0n);
		});
	});

	describe("edge cases", () => {
		it("0 % n = 0", () => {
			const result = modulo(ZERO, from(42n));
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

		it("small % large = small", () => {
			const result = modulo(from(5n), from(10n));
			expect(result).toBe(5n);
		});

		it("throws on modulo by zero", () => {
			expect(() => modulo(from(42n), ZERO)).toThrow();
		});
	});

	describe("properties", () => {
		it("result is always less than divisor", () => {
			const dividend = from(42n);
			const divisor = from(7n);
			const result = modulo(dividend, divisor);
			expect(result < divisor).toBe(true);
		});

		it("(a + b) % n = ((a % n) + (b % n)) % n", () => {
			const a = from(17n);
			const b = from(23n);
			const n = from(5n);
			const left = modulo(a + b, n);
			const right = modulo(modulo(a, n) + modulo(b, n), n);
			expect(left).toBe(right);
		});
	});
});
