import { describe, expect, it } from "vitest";
import { random } from "./random.js";

describe("Bytes.random", () => {
	it("generates bytes of correct size", () => {
		expect(random(0).length).toBe(0);
		expect(random(1).length).toBe(1);
		expect(random(32).length).toBe(32);
		expect(random(100).length).toBe(100);
	});

	it("generates different values each time", () => {
		const a = random(32);
		const b = random(32);
		// Extremely unlikely to be equal if random
		expect(a).not.toEqual(b);
	});

	it("throws on negative size", () => {
		expect(() => random(-1)).toThrow(/must be non-negative/);
	});

	it("throws on non-integer size", () => {
		expect(() => random(1.5)).toThrow(/must be an integer/);
	});

	it("returns Uint8Array", () => {
		expect(random(16)).toBeInstanceOf(Uint8Array);
	});
});
