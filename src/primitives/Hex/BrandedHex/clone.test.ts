import { describe, expect, it } from "vitest";
import { clone } from "./clone.js";
import { equals } from "./equals.js";
import { from } from "./from.js";

describe("clone", () => {
	it("creates a copy of hex string", () => {
		const hex1 = from("0x1234");
		const hex2 = clone(hex1);

		expect(equals(hex1, hex2)).toBe(true);
		expect(hex1).toBe(hex2); // strings are immutable in JS
	});

	it("clones empty hex", () => {
		const hex1 = from("0x");
		const hex2 = clone(hex1);

		expect(hex2).toBe("0x");
		expect(equals(hex1, hex2)).toBe(true);
	});

	it("clones long hex values", () => {
		const hex1 = from(`0x${"ab".repeat(100)}`);
		const hex2 = clone(hex1);

		expect(equals(hex1, hex2)).toBe(true);
	});
});
