/**
 * Tests for Uint utility functions (gcd, lcm, isPowerOf2, product, sum)
 */

import { describe, expect, it } from "vitest";
import * as Uint from "./index.js";

// ============================================================================
// GCD Tests
// ============================================================================

describe("Uint.gcd", () => {
	it("calculates GCD of two numbers", () => {
		const a = Uint.from(48);
		const b = Uint.from(18);
		const result = Uint.gcd(a, b);
		expect(result).toBe(6n);
	});

	it("calculates GCD with larger numbers", () => {
		const a = Uint.from(1071);
		const b = Uint.from(462);
		const result = Uint.gcd(a, b);
		expect(result).toBe(21n);
	});

	it("GCD with zero returns the other value", () => {
		const a = Uint.from(100);
		const result = Uint.gcd(a, Uint.ZERO);
		expect(result).toBe(100n);
	});

	it("GCD of zero and zero is zero", () => {
		const result = Uint.gcd(Uint.ZERO, Uint.ZERO);
		expect(result).toBe(0n);
	});

	it("GCD of equal values returns that value", () => {
		const a = Uint.from(42);
		const result = Uint.gcd(a, a);
		expect(result).toBe(42n);
	});

	it("GCD with 1 returns 1", () => {
		const a = Uint.from(100);
		const result = Uint.gcd(a, Uint.ONE);
		expect(result).toBe(1n);
	});

	it("GCD is commutative", () => {
		const a = Uint.from(48);
		const b = Uint.from(18);
		expect(Uint.gcd(a, b)).toBe(Uint.gcd(b, a));
	});

	it("GCD of coprime numbers returns 1", () => {
		const a = Uint.from(17);
		const b = Uint.from(19);
		const result = Uint.gcd(a, b);
		expect(result).toBe(1n);
	});

	it("GCD with powers of 2", () => {
		const a = Uint.from(64);
		const b = Uint.from(96);
		const result = Uint.gcd(a, b);
		expect(result).toBe(32n);
	});

	it("GCD with large values", () => {
		const a = Uint.from(2n ** 64n);
		const b = Uint.from(2n ** 63n);
		const result = Uint.gcd(a, b);
		expect(result).toBe(2n ** 63n);
	});
});

// ============================================================================
// LCM Tests
// ============================================================================

describe("Uint.lcm", () => {
	it("calculates LCM of two numbers", () => {
		const a = Uint.from(12);
		const b = Uint.from(18);
		const result = Uint.lcm(a, b);
		expect(result).toBe(36n);
	});

	it("calculates LCM with larger numbers", () => {
		const a = Uint.from(21);
		const b = Uint.from(6);
		const result = Uint.lcm(a, b);
		expect(result).toBe(42n);
	});

	it("LCM with zero returns zero", () => {
		const a = Uint.from(100);
		const result = Uint.lcm(a, Uint.ZERO);
		expect(result).toBe(0n);
	});

	it("LCM of zero and zero is zero", () => {
		const result = Uint.lcm(Uint.ZERO, Uint.ZERO);
		expect(result).toBe(0n);
	});

	it("LCM with 1 returns the other value", () => {
		const a = Uint.from(42);
		const result = Uint.lcm(a, Uint.ONE);
		expect(result).toBe(42n);
	});

	it("LCM of equal values returns that value", () => {
		const a = Uint.from(42);
		const result = Uint.lcm(a, a);
		expect(result).toBe(42n);
	});

	it("LCM is commutative", () => {
		const a = Uint.from(12);
		const b = Uint.from(18);
		expect(Uint.lcm(a, b)).toBe(Uint.lcm(b, a));
	});

	it("LCM of coprime numbers is their product", () => {
		const a = Uint.from(7);
		const b = Uint.from(11);
		const result = Uint.lcm(a, b);
		expect(result).toBe(77n);
	});

	it("LCM with powers of 2", () => {
		const a = Uint.from(8);
		const b = Uint.from(12);
		const result = Uint.lcm(a, b);
		expect(result).toBe(24n);
	});

	it("LCM wraps on overflow", () => {
		const a = Uint.from((Uint.MAX as bigint) / 2n);
		const b = Uint.from(3);
		const result = Uint.lcm(a, b);
		// Should wrap within U256 bounds
		expect(Uint.isValid(result)).toBe(true);
	});
});

// ============================================================================
// isPowerOf2 Tests
// ============================================================================

describe("Uint.isPowerOf2", () => {
	it("returns true for powers of 2", () => {
		expect(Uint.isPowerOf2(Uint.ONE)).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(2))).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(4))).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(8))).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(16))).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(32))).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(64))).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(128))).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(256))).toBe(true);
	});

	it("returns false for non-powers of 2", () => {
		expect(Uint.isPowerOf2(Uint.from(3))).toBe(false);
		expect(Uint.isPowerOf2(Uint.from(5))).toBe(false);
		expect(Uint.isPowerOf2(Uint.from(6))).toBe(false);
		expect(Uint.isPowerOf2(Uint.from(7))).toBe(false);
		expect(Uint.isPowerOf2(Uint.from(9))).toBe(false);
		expect(Uint.isPowerOf2(Uint.from(15))).toBe(false);
		expect(Uint.isPowerOf2(Uint.from(100))).toBe(false);
	});

	it("returns false for zero", () => {
		expect(Uint.isPowerOf2(Uint.ZERO)).toBe(false);
	});

	it("returns true for large powers of 2", () => {
		expect(Uint.isPowerOf2(Uint.from(2n ** 32n))).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(2n ** 64n))).toBe(true);
		expect(Uint.isPowerOf2(Uint.from(2n ** 128n))).toBe(true);
	});

	it("returns false for large non-powers of 2", () => {
		expect(Uint.isPowerOf2(Uint.from((2n ** 32n) + 1n))).toBe(false);
		expect(Uint.isPowerOf2(Uint.from((2n ** 64n) - 1n))).toBe(false);
	});

	it("returns false for MAX (all bits set)", () => {
		expect(Uint.isPowerOf2(Uint.MAX)).toBe(false);
	});

	it("handles edge case: 2^255", () => {
		expect(Uint.isPowerOf2(Uint.from(2n ** 255n))).toBe(true);
	});
});

// ============================================================================
// product Tests
// ============================================================================

describe("Uint.product", () => {
	it("multiplies multiple values", () => {
		const result = Uint.product(Uint.from(2), Uint.from(3), Uint.from(5));
		expect(result).toBe(30n);
	});

	it("returns ONE for no arguments", () => {
		const result = Uint.product();
		expect(result).toBe(1n);
	});

	it("returns the value for single argument", () => {
		const result = Uint.product(Uint.from(42));
		expect(result).toBe(42n);
	});

	it("returns ZERO when any value is ZERO", () => {
		const result = Uint.product(
			Uint.from(10),
			Uint.ZERO,
			Uint.from(5),
		);
		expect(result).toBe(0n);
	});

	it("multiplies with ONE correctly", () => {
		const result = Uint.product(
			Uint.from(42),
			Uint.ONE,
			Uint.from(2),
		);
		expect(result).toBe(84n);
	});

	it("wraps on overflow", () => {
		const result = Uint.product(
			Uint.MAX,
			Uint.from(2),
		);
		// MAX * 2 wraps
		expect(result).toBe((Uint.MAX as bigint) - 1n);
	});

	it("handles many small values", () => {
		const result = Uint.product(
			Uint.from(2),
			Uint.from(2),
			Uint.from(2),
			Uint.from(2),
			Uint.from(2),
		);
		expect(result).toBe(32n);
	});

	it("handles large values", () => {
		const a = Uint.from(2n ** 64n);
		const b = Uint.from(2n ** 64n);
		const result = Uint.product(a, b);
		// 2^64 * 2^64 = 2^128
		expect(result).toBe(2n ** 128n);
	});
});

// ============================================================================
// sum Tests
// ============================================================================

describe("Uint.sum", () => {
	it("sums multiple values", () => {
		const result = Uint.sum(Uint.from(10), Uint.from(20), Uint.from(30));
		expect(result).toBe(60n);
	});

	it("returns ZERO for no arguments", () => {
		const result = Uint.sum();
		expect(result).toBe(0n);
	});

	it("returns the value for single argument", () => {
		const result = Uint.sum(Uint.from(42));
		expect(result).toBe(42n);
	});

	it("sums with ZERO correctly", () => {
		const result = Uint.sum(
			Uint.from(10),
			Uint.ZERO,
			Uint.from(20),
		);
		expect(result).toBe(30n);
	});

	it("wraps on overflow", () => {
		const result = Uint.sum(
			Uint.MAX,
			Uint.ONE,
		);
		expect(result).toBe(0n);
	});

	it("wraps on large overflow", () => {
		const result = Uint.sum(
			Uint.MAX,
			Uint.from(10),
		);
		expect(result).toBe(9n);
	});

	it("handles many small values", () => {
		const result = Uint.sum(
			Uint.from(1),
			Uint.from(2),
			Uint.from(3),
			Uint.from(4),
			Uint.from(5),
		);
		expect(result).toBe(15n);
	});

	it("handles large values", () => {
		const a = Uint.from(2n ** 255n);
		const b = Uint.from(2n ** 255n);
		const result = Uint.sum(a, b);
		// Should wrap
		expect(result).toBe(0n);
	});

	it("sums mixed sizes", () => {
		const result = Uint.sum(
			Uint.from(1),
			Uint.from(2n ** 64n),
			Uint.from(100),
		);
		expect(result).toBe(2n ** 64n + 101n);
	});
});
