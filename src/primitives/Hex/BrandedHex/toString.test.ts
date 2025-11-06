import { describe, expect, it } from "vitest";
import { toString } from "./toString.js";
import { fromString } from "./fromString.js";
import type { BrandedHex } from "./BrandedHex.js";
import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";

describe("toString", () => {
	it("converts empty hex", () => {
		expect(toString("0x" as BrandedHex)).toBe("");
	});

	it("converts single character", () => {
		expect(toString("0x61" as BrandedHex)).toBe("a");
	});

	it("converts ASCII text", () => {
		expect(toString("0x68656c6c6f" as BrandedHex)).toBe("hello");
		expect(toString("0x48656c6c6f20576f726c6421" as BrandedHex)).toBe(
			"Hello World!",
		);
	});

	it("converts special characters", () => {
		expect(toString("0x40" as BrandedHex)).toBe("@");
		expect(toString("0x313233" as BrandedHex)).toBe("123");
		expect(toString("0x2140232425" as BrandedHex)).toBe("!@#$%");
	});

	it("converts newlines and tabs", () => {
		expect(toString("0x0a" as BrandedHex)).toBe("\n");
		expect(toString("0x09" as BrandedHex)).toBe("\t");
		expect(toString("0x0d0a" as BrandedHex)).toBe("\r\n");
	});

	it("handles uppercase hex", () => {
		expect(toString("0x68656C6C6F" as BrandedHex)).toBe("hello");
		expect(toString("0x48454C4C4F" as BrandedHex)).toBe("HELLO");
	});

	it("handles mixed case hex", () => {
		expect(toString("0x68656c6C6f" as BrandedHex)).toBe("hello");
	});

	it("round-trip with fromString", () => {
		const original = "Hello, World! 123";
		const hex = fromString(original);
		const decoded = toString(hex);
		expect(decoded).toBe(original);
	});

	it("throws on missing 0x prefix", () => {
		expect(() => toString("68656c6c6f" as BrandedHex)).toThrow(
			InvalidFormatError,
		);
	});

	it("throws on odd length", () => {
		expect(() => toString("0x1" as BrandedHex)).toThrow(OddLengthError);
		expect(() => toString("0x123" as BrandedHex)).toThrow(OddLengthError);
	});

	it("throws on invalid hex character", () => {
		expect(() => toString("0x68656c6c6g" as BrandedHex)).toThrow(
			InvalidCharacterError,
		);
		expect(() => toString("0x6865 6c6c6f" as BrandedHex)).toThrow(
			InvalidCharacterError,
		);
	});

	it("handles long strings", () => {
		const original = "a".repeat(1000);
		const hex = fromString(original);
		const decoded = toString(hex);
		expect(decoded).toBe(original);
	});

	it("handles UTF-8 encoded characters", () => {
		const hex = fromString("🚀");
		const decoded = toString(hex);
		expect(decoded).toBe("🚀");
	});
});
