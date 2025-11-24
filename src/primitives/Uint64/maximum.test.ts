import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { maximum } from "./maximum.js";

describe("Uint64.maximum", () => {
	it("returns larger of two values", () => {
		expect(maximum(from(10n), from(20n))).toBe(20n);
	});

	it("returns same value when equal", () => {
		expect(maximum(from(42n), from(42n))).toBe(42n);
	});

	it("returns first when larger", () => {
		expect(maximum(from(100n), from(50n))).toBe(100n);
	});

	it("handles zero", () => {
		expect(maximum(ZERO, from(1n))).toBe(1n);
		expect(maximum(from(1n), ZERO)).toBe(1n);
	});

	it("handles MAX", () => {
		expect(maximum(MAX, from(999n))).toBe(MAX);
		expect(maximum(from(999n), MAX)).toBe(MAX);
	});

	it("commutative", () => {
		const a = from(10n);
		const b = from(20n);
		expect(maximum(a, b)).toBe(maximum(b, a));
	});
});
