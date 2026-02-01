import { describe, expect, it } from "vitest";
import { clone } from "./clone.js";
import { MAX, ZERO } from "./constants.js";
import { equals } from "./equals.js";
import { from } from "./from.js";

describe("clone", () => {
	it("returns same value for bigint primitive", () => {
		const n1 = from(100n);
		const n2 = clone(n1);

		expect(equals(n1, n2)).toBe(true);
		expect(n1).toBe(n2); // bigints are primitives
	});

	it("works with zero", () => {
		const n1 = ZERO;
		const n2 = clone(n1);

		expect(n2).toBe(0n);
		expect(equals(n1, n2)).toBe(true);
	});

	it("works with max value", () => {
		const n1 = MAX;
		const n2 = clone(n1);

		expect(equals(n1, n2)).toBe(true);
	});

	it("works with large values", () => {
		const n1 = from("12345678901234567890");
		const n2 = clone(n1);

		expect(equals(n1, n2)).toBe(true);
	});
});
