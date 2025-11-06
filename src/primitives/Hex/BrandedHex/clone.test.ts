import { describe, expect, it } from "vitest";
import * as Hex from "../index.js";

describe("Hex.clone", () => {
	it("should create a copy of hex string", () => {
		const hex1 = Hex.from("0x1234");
		const hex2 = Hex.clone(hex1);

		expect(Hex.equals(hex1, hex2)).toBe(true);
		expect(hex1).toBe(hex2); // strings are immutable in JS
	});

	it("should work as instance method", () => {
		const hex1 = Hex.Hex("0x1234abcd");
		const hex2 = hex1.clone();

		expect(Hex.equals(hex1, hex2)).toBe(true);
	});

	it("should clone empty hex", () => {
		const hex1 = Hex.from("0x");
		const hex2 = Hex.clone(hex1);

		expect(hex2).toBe("0x");
		expect(Hex.equals(hex1, hex2)).toBe(true);
	});

	it("should clone long hex values", () => {
		const hex1 = Hex.from("0x" + "ab".repeat(100));
		const hex2 = Hex.clone(hex1);

		expect(Hex.equals(hex1, hex2)).toBe(true);
	});
});
