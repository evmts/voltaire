import { describe, expect, it } from "vitest";
import { ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { product } from "./product.js";

describe("Uint128.product", () => {
	it("products empty array to 1", () => {
		expect(product([])).toBe(1n);
	});

	it("products single value", () => {
		expect(product([from(42n)])).toBe(42n);
	});

	it("products two values", () => {
		expect(product([from(6n), from(7n)])).toBe(42n);
	});

	it("products multiple values", () => {
		expect(product([from(2n), from(3n), from(5n)])).toBe(30n);
	});

	it("products with zero gives zero", () => {
		expect(product([from(10n), ZERO, from(20n)])).toBe(0n);
	});

	it("products with one preserves value", () => {
		expect(product([from(42n), ONE, ONE])).toBe(42n);
	});

	it("products powers of 2", () => {
		expect(product([from(2n), from(4n), from(8n)])).toBe(64n);
	});
});
