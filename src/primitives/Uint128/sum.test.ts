import { describe, it, expect } from "vitest";
import { sum } from "./sum.js";
import { from } from "./from.js";
import { ZERO } from "./constants.js";

describe("Uint128.sum", () => {
	it("sums empty array", () => {
		expect(sum([])).toBe(0n);
	});

	it("sums single value", () => {
		expect(sum([from(42n)])).toBe(42n);
	});

	it("sums two values", () => {
		expect(sum([from(10n), from(20n)])).toBe(30n);
	});

	it("sums multiple values", () => {
		expect(sum([from(1n), from(2n), from(3n), from(4n), from(5n)])).toBe(15n);
	});

	it("handles zeros in array", () => {
		expect(sum([from(10n), ZERO, from(20n), ZERO])).toBe(30n);
	});

	it("sums all zeros", () => {
		expect(sum([ZERO, ZERO, ZERO])).toBe(0n);
	});

	it("sums large values", () => {
		const a = from(1n << 100n);
		const b = from(1n << 101n);
		expect(sum([a, b])).toBe(a + b);
	});
});
