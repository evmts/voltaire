import { describe, expect, it } from "vitest";
import type { BrandedHex } from "./BrandedHex.js";
import { fromBoolean } from "./fromBoolean.js";
import { toBoolean } from "./toBoolean.js";

describe("toBoolean", () => {
	it("converts 0x01 to true", () => {
		expect(toBoolean("0x01" as BrandedHex)).toBe(true);
	});

	it("converts 0x00 to false", () => {
		expect(toBoolean("0x00" as BrandedHex)).toBe(false);
	});

	it("converts non-zero values to true", () => {
		expect(toBoolean("0xff" as BrandedHex)).toBe(true);
		expect(toBoolean("0x1234" as BrandedHex)).toBe(true);
		expect(toBoolean("0x000001" as BrandedHex)).toBe(true);
		expect(toBoolean("0xdeadbeef" as BrandedHex)).toBe(true);
	});

	it("converts all-zero values to false", () => {
		expect(toBoolean("0x0000" as BrandedHex)).toBe(false);
		expect(toBoolean("0x00000000" as BrandedHex)).toBe(false);
		expect(toBoolean("0x0000000000000000" as BrandedHex)).toBe(false);
	});

	it("converts empty hex to false", () => {
		expect(toBoolean("0x" as BrandedHex)).toBe(false);
	});

	it("round-trip conversions", () => {
		expect(toBoolean(fromBoolean(true))).toBe(true);
		expect(toBoolean(fromBoolean(false))).toBe(false);
	});

	it("handles uppercase hex", () => {
		expect(toBoolean("0xFF" as BrandedHex)).toBe(true);
		expect(toBoolean("0x00" as BrandedHex)).toBe(false);
	});

	it("handles mixed case", () => {
		expect(toBoolean("0xFf" as BrandedHex)).toBe(true);
		expect(toBoolean("0x0A" as BrandedHex)).toBe(true);
	});

	it("treats any non-zero byte as true", () => {
		expect(toBoolean("0x0001" as BrandedHex)).toBe(true);
		expect(toBoolean("0x0100" as BrandedHex)).toBe(true);
		expect(toBoolean("0x000100" as BrandedHex)).toBe(true);
	});
});
