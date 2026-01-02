import { describe, expect, it } from "vitest";
import { MAX, ZERO } from "./constants.js";
import { from } from "./from.js";
import { maximum } from "./maximum.js";

describe("Uint256.maximum", () => {
	describe("known values", () => {
		it("returns larger of two values", () => {
			expect(maximum(from(10n), from(20n))).toBe(20n);
		});

		it("returns larger when first is larger", () => {
			expect(maximum(from(20n), from(10n))).toBe(20n);
		});

		it("returns value when both equal", () => {
			expect(maximum(from(42n), from(42n))).toBe(42n);
		});

		it("handles zero", () => {
			expect(maximum(ZERO, from(100n))).toBe(100n);
			expect(maximum(from(100n), ZERO)).toBe(100n);
		});
	});

	describe("edge cases", () => {
		it("maximum(0, 0) = 0", () => {
			expect(maximum(ZERO, ZERO)).toBe(0n);
		});

		it("maximum(0, MAX) = MAX", () => {
			expect(maximum(ZERO, MAX)).toBe(MAX);
		});

		it("maximum(MAX, 0) = MAX", () => {
			expect(maximum(MAX, ZERO)).toBe(MAX);
		});

		it("maximum(MAX, MAX) = MAX", () => {
			expect(maximum(MAX, MAX)).toBe(MAX);
		});

		it("maximum(MAX - 1, MAX) = MAX", () => {
			expect(maximum(MAX - 1n, MAX)).toBe(MAX);
		});
	});

	describe("large values", () => {
		it("handles 128-bit values", () => {
			const a = from(1n << 128n);
			const b = from(1n << 127n);
			expect(maximum(a, b)).toBe(a);
		});

		it("handles high bit set", () => {
			const a = from(1n << 255n);
			const b = from(1n << 200n);
			expect(maximum(a, b)).toBe(a);
		});
	});

	describe("properties", () => {
		it("commutative: max(a, b) = max(b, a)", () => {
			const a = from(10n);
			const b = from(20n);
			expect(maximum(a, b)).toBe(maximum(b, a));
		});

		it("associative: max(max(a, b), c) = max(a, max(b, c))", () => {
			const a = from(30n);
			const b = from(10n);
			const c = from(20n);
			expect(maximum(maximum(a, b), c)).toBe(maximum(a, maximum(b, c)));
		});

		it("idempotent: max(a, a) = a", () => {
			const a = from(42n);
			expect(maximum(a, a)).toBe(a);
		});

		it("identity: max(a, 0) = a", () => {
			const a = from(42n);
			expect(maximum(a, ZERO)).toBe(a);
		});
	});
});
