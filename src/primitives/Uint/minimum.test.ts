import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { minimum } from "./minimum.js";

describe("Uint256.minimum", () => {
	describe("known values", () => {
		it("returns smaller of two values", () => {
			expect(minimum(from(10n), from(20n))).toBe(10n);
		});

		it("returns smaller when first is larger", () => {
			expect(minimum(from(20n), from(10n))).toBe(10n);
		});

		it("returns value when both equal", () => {
			expect(minimum(from(42n), from(42n))).toBe(42n);
		});

		it("handles zero", () => {
			expect(minimum(ZERO, from(100n))).toBe(0n);
			expect(minimum(from(100n), ZERO)).toBe(0n);
		});
	});

	describe("edge cases", () => {
		it("minimum(0, 0) = 0", () => {
			expect(minimum(ZERO, ZERO)).toBe(0n);
		});

		it("minimum(0, MAX) = 0", () => {
			expect(minimum(ZERO, MAX)).toBe(0n);
		});

		it("minimum(MAX, 0) = 0", () => {
			expect(minimum(MAX, ZERO)).toBe(0n);
		});

		it("minimum(MAX, MAX) = MAX", () => {
			expect(minimum(MAX, MAX)).toBe(MAX);
		});

		it("minimum(MAX - 1, MAX) = MAX - 1", () => {
			expect(minimum(MAX - 1n, MAX)).toBe(MAX - 1n);
		});
	});

	describe("large values", () => {
		it("handles 128-bit values", () => {
			const a = from(1n << 128n);
			const b = from(1n << 127n);
			expect(minimum(a, b)).toBe(b);
		});

		it("handles high bit set", () => {
			const a = from(1n << 255n);
			const b = from(1n << 200n);
			expect(minimum(a, b)).toBe(b);
		});
	});

	describe("properties", () => {
		it("commutative: min(a, b) = min(b, a)", () => {
			const a = from(10n);
			const b = from(20n);
			expect(minimum(a, b)).toBe(minimum(b, a));
		});

		it("associative: min(min(a, b), c) = min(a, min(b, c))", () => {
			const a = from(30n);
			const b = from(10n);
			const c = from(20n);
			expect(minimum(minimum(a, b), c)).toBe(minimum(a, minimum(b, c)));
		});

		it("idempotent: min(a, a) = a", () => {
			const a = from(42n);
			expect(minimum(a, a)).toBe(a);
		});

		it("identity: min(a, MAX) = a", () => {
			const a = from(42n);
			expect(minimum(a, MAX)).toBe(a);
		});
	});
});
