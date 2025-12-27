import { describe, expect, it } from "vitest";
import type { HexType } from "./HexType.js";
import { fromBoolean } from "./fromBoolean.js";
import { toBoolean } from "./toBoolean.js";

describe("toBoolean", () => {
	it("converts 0x01 to true", () => {
		expect(toBoolean("0x01" as HexType)).toBe(true);
	});

	it("converts 0x00 to false", () => {
		expect(toBoolean("0x00" as HexType)).toBe(false);
	});

	it("converts padded 0x01 to true", () => {
		expect(toBoolean("0x000001" as HexType)).toBe(true);
		expect(toBoolean("0x0000000000000001" as HexType)).toBe(true);
	});

	it("throws for non-boolean values", () => {
		expect(() => toBoolean("0xff" as HexType)).toThrow(
			/Invalid boolean hex value/,
		);
		expect(() => toBoolean("0x1234" as HexType)).toThrow(
			/Invalid boolean hex value/,
		);
		expect(() => toBoolean("0xdeadbeef" as HexType)).toThrow(
			/Invalid boolean hex value/,
		);
		expect(() => toBoolean("0x02" as HexType)).toThrow(
			/Invalid boolean hex value/,
		);
	});

	it("converts all-zero values to false", () => {
		expect(toBoolean("0x0000" as HexType)).toBe(false);
		expect(toBoolean("0x00000000" as HexType)).toBe(false);
		expect(toBoolean("0x0000000000000000" as HexType)).toBe(false);
	});

	it("converts empty hex to false", () => {
		expect(toBoolean("0x" as HexType)).toBe(false);
	});

	it("round-trip conversions", () => {
		expect(toBoolean(fromBoolean(true))).toBe(true);
		expect(toBoolean(fromBoolean(false))).toBe(false);
	});

	it("handles uppercase hex for valid values", () => {
		expect(() => toBoolean("0xFF" as HexType)).toThrow(
			/Invalid boolean hex value/,
		);
		expect(toBoolean("0x00" as HexType)).toBe(false);
		expect(toBoolean("0x01" as HexType)).toBe(true);
	});

	it("throws for non-boolean values regardless of case", () => {
		expect(() => toBoolean("0xFf" as HexType)).toThrow(
			/Invalid boolean hex value/,
		);
		expect(() => toBoolean("0x0A" as HexType)).toThrow(
			/Invalid boolean hex value/,
		);
	});

	it("only accepts 0 or 1 as valid boolean (with padding)", () => {
		expect(toBoolean("0x0001" as HexType)).toBe(true);
		expect(() => toBoolean("0x0100" as HexType)).toThrow(
			/Invalid boolean hex value/,
		);
		expect(() => toBoolean("0x000100" as HexType)).toThrow(
			/Invalid boolean hex value/,
		);
	});
});
