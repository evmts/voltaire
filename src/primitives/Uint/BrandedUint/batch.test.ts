import { describe, expect, it } from "vitest";
import * as Uint from "./index.js";

describe("Uint batch operations", () => {
	describe("sum", () => {
		it("sums multiple values", () => {
			const result = Uint.sum(Uint.from(100n), Uint.from(50n), Uint.from(25n));
			expect(result).toBe(175n);
		});

		it("returns zero for empty input", () => {
			const result = Uint.sum();
			expect(result).toBe(0n);
		});

		it("wraps on overflow", () => {
			const result = Uint.sum(Uint.MAX, Uint.from(10n));
			expect(result).toBe(9n);
		});
	});

	describe("product", () => {
		it("multiplies multiple values", () => {
			const result = Uint.product(
				Uint.from(10n),
				Uint.from(5n),
				Uint.from(2n),
			);
			expect(result).toBe(100n);
		});

		it("returns one for empty input", () => {
			const result = Uint.product();
			expect(result).toBe(1n);
		});

		it("wraps on overflow", () => {
			const result = Uint.product(Uint.MAX, Uint.from(2n));
			expect(result).toBe(Uint.MAX - 1n);
		});
	});

	describe("min", () => {
		it("finds minimum of multiple values", () => {
			const result = Uint.min(
				Uint.from(100n),
				Uint.from(50n),
				Uint.from(75n),
			);
			expect(result).toBe(50n);
		});

		it("throws for empty input", () => {
			expect(() => Uint.min()).toThrow("min requires at least one value");
		});

		it("returns single value", () => {
			const result = Uint.min(Uint.from(42n));
			expect(result).toBe(42n);
		});
	});

	describe("max", () => {
		it("finds maximum of multiple values", () => {
			const result = Uint.max(
				Uint.from(100n),
				Uint.from(50n),
				Uint.from(75n),
			);
			expect(result).toBe(100n);
		});

		it("throws for empty input", () => {
			expect(() => Uint.max()).toThrow("max requires at least one value");
		});

		it("returns single value", () => {
			const result = Uint.max(Uint.from(42n));
			expect(result).toBe(42n);
		});
	});

	describe("gcd", () => {
		it("calculates greatest common divisor", () => {
			const result = Uint.gcd(Uint.from(48n), Uint.from(18n));
			expect(result).toBe(6n);
		});

		it("handles zero", () => {
			const result = Uint.gcd(Uint.from(42n), Uint.ZERO);
			expect(result).toBe(42n);
		});

		it("handles coprime numbers", () => {
			const result = Uint.gcd(Uint.from(17n), Uint.from(19n));
			expect(result).toBe(1n);
		});
	});

	describe("lcm", () => {
		it("calculates least common multiple", () => {
			const result = Uint.lcm(Uint.from(12n), Uint.from(18n));
			expect(result).toBe(36n);
		});

		it("returns zero when either value is zero", () => {
			const result = Uint.lcm(Uint.from(42n), Uint.ZERO);
			expect(result).toBe(0n);
		});

		it("handles coprime numbers", () => {
			const result = Uint.lcm(Uint.from(7n), Uint.from(11n));
			expect(result).toBe(77n);
		});
	});

	describe("isPowerOf2", () => {
		it("identifies powers of 2", () => {
			expect(Uint.isPowerOf2(Uint.from(1n))).toBe(true);
			expect(Uint.isPowerOf2(Uint.from(2n))).toBe(true);
			expect(Uint.isPowerOf2(Uint.from(4n))).toBe(true);
			expect(Uint.isPowerOf2(Uint.from(16n))).toBe(true);
			expect(Uint.isPowerOf2(Uint.from(256n))).toBe(true);
		});

		it("rejects non-powers of 2", () => {
			expect(Uint.isPowerOf2(Uint.ZERO)).toBe(false);
			expect(Uint.isPowerOf2(Uint.from(3n))).toBe(false);
			expect(Uint.isPowerOf2(Uint.from(15n))).toBe(false);
			expect(Uint.isPowerOf2(Uint.from(100n))).toBe(false);
		});
	});
});
