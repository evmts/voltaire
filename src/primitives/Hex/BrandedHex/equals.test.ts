import { describe, expect, it } from "vitest";
import { equals } from "./equals.js";
import type { BrandedHex } from "./BrandedHex.js";

describe("equals", () => {
	it("compares equal hex strings", () => {
		expect(equals("0x1234" as BrandedHex, "0x1234" as BrandedHex)).toBe(true);
		expect(equals("0xabcd" as BrandedHex, "0xabcd" as BrandedHex)).toBe(true);
	});

	it("compares case-insensitively", () => {
		expect(equals("0xabcd" as BrandedHex, "0xABCD" as BrandedHex)).toBe(true);
		expect(equals("0xABCD" as BrandedHex, "0xabcd" as BrandedHex)).toBe(true);
		expect(equals("0xAbCd" as BrandedHex, "0xaBcD" as BrandedHex)).toBe(true);
	});

	it("returns false for different values", () => {
		expect(equals("0x1234" as BrandedHex, "0x5678" as BrandedHex)).toBe(false);
		expect(equals("0xabcd" as BrandedHex, "0xef12" as BrandedHex)).toBe(false);
	});

	it("returns false for different lengths", () => {
		expect(equals("0x12" as BrandedHex, "0x1234" as BrandedHex)).toBe(false);
		expect(equals("0x1234" as BrandedHex, "0x12" as BrandedHex)).toBe(false);
	});

	it("compares empty hex strings", () => {
		expect(equals("0x" as BrandedHex, "0x" as BrandedHex)).toBe(true);
	});

	it("returns false when comparing empty with non-empty", () => {
		expect(equals("0x" as BrandedHex, "0x00" as BrandedHex)).toBe(false);
		expect(equals("0x00" as BrandedHex, "0x" as BrandedHex)).toBe(false);
	});

	it("compares single bytes", () => {
		expect(equals("0xff" as BrandedHex, "0xff" as BrandedHex)).toBe(true);
		expect(equals("0xff" as BrandedHex, "0xFf" as BrandedHex)).toBe(true);
		expect(equals("0xff" as BrandedHex, "0x00" as BrandedHex)).toBe(false);
	});

	it("handles leading zeros", () => {
		expect(equals("0x0012" as BrandedHex, "0x12" as BrandedHex)).toBe(false);
		expect(equals("0x0012" as BrandedHex, "0x0012" as BrandedHex)).toBe(true);
	});

	it("compares large hex strings", () => {
		const hex1 = ("0x" + "ab".repeat(100)) as BrandedHex;
		const hex2 = ("0x" + "ab".repeat(100)) as BrandedHex;
		const hex3 = ("0x" + "AB".repeat(100)) as BrandedHex;
		const hex4 = ("0x" + "cd".repeat(100)) as BrandedHex;
		expect(equals(hex1, hex2)).toBe(true);
		expect(equals(hex1, hex3)).toBe(true);
		expect(equals(hex1, hex4)).toBe(false);
	});

	it("is reflexive", () => {
		const hex = "0x1234abcd" as BrandedHex;
		expect(equals(hex, hex)).toBe(true);
	});

	it("is symmetric", () => {
		const hex1 = "0x1234" as BrandedHex;
		const hex2 = "0x1234" as BrandedHex;
		expect(equals(hex1, hex2)).toBe(equals(hex2, hex1));
	});
});
