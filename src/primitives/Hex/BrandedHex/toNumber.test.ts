import { describe, expect, it } from "vitest";
import type { BrandedHex } from "./BrandedHex.js";
import { fromNumber } from "./fromNumber.js";
import { toNumber } from "./toNumber.js";

describe("toNumber", () => {
	it("converts zero", () => {
		expect(toNumber("0x0" as BrandedHex)).toBe(0);
		expect(toNumber("0x00" as BrandedHex)).toBe(0);
		expect(toNumber("0x0000" as BrandedHex)).toBe(0);
	});

	it("converts small numbers", () => {
		expect(toNumber("0x1" as BrandedHex)).toBe(1);
		expect(toNumber("0xf" as BrandedHex)).toBe(15);
		expect(toNumber("0x10" as BrandedHex)).toBe(16);
		expect(toNumber("0xff" as BrandedHex)).toBe(255);
		expect(toNumber("0x100" as BrandedHex)).toBe(256);
	});

	it("converts larger numbers", () => {
		expect(toNumber("0x1234" as BrandedHex)).toBe(0x1234);
		expect(toNumber("0xdeadbeef" as BrandedHex)).toBe(0xdeadbeef);
		expect(toNumber("0xffffffff" as BrandedHex)).toBe(0xffffffff);
	});

	it("handles leading zeros", () => {
		expect(toNumber("0x00ff" as BrandedHex)).toBe(255);
		expect(toNumber("0x0001" as BrandedHex)).toBe(1);
		expect(toNumber("0x00001234" as BrandedHex)).toBe(0x1234);
	});

	it("handles uppercase hex", () => {
		expect(toNumber("0xABCD" as BrandedHex)).toBe(0xabcd);
		expect(toNumber("0xDEADBEEF" as BrandedHex)).toBe(0xdeadbeef);
	});

	it("handles mixed case", () => {
		expect(toNumber("0xAbCd" as BrandedHex)).toBe(0xabcd);
		expect(toNumber("0xDeAdBeEf" as BrandedHex)).toBe(0xdeadbeef);
	});

	it("round-trip conversions", () => {
		const values = [0, 1, 15, 255, 256, 0x1234, 0xabcdef, 0xffffffff];
		values.forEach((val) => {
			const hex = fromNumber(val);
			expect(toNumber(hex)).toBe(val);
		});
	});

	it("converts max safe integer", () => {
		const hex = "0x1fffffffffffff" as BrandedHex;
		expect(toNumber(hex)).toBe(Number.MAX_SAFE_INTEGER);
	});

	it("throws on values exceeding MAX_SAFE_INTEGER", () => {
		expect(() => toNumber("0xffffffffffffffff" as BrandedHex)).toThrow(
			RangeError,
		);
		expect(() => toNumber("0x10000000000000000" as BrandedHex)).toThrow(
			RangeError,
		);
	});

	it("converts powers of 2", () => {
		expect(toNumber("0x1" as BrandedHex)).toBe(1);
		expect(toNumber("0x2" as BrandedHex)).toBe(2);
		expect(toNumber("0x4" as BrandedHex)).toBe(4);
		expect(toNumber("0x8" as BrandedHex)).toBe(8);
		expect(toNumber("0x10" as BrandedHex)).toBe(16);
		expect(toNumber("0x100" as BrandedHex)).toBe(256);
		expect(toNumber("0x10000" as BrandedHex)).toBe(65536);
	});

	it("throws on empty hex (NaN is not safe integer)", () => {
		expect(() => toNumber("0x" as BrandedHex)).toThrow(RangeError);
	});
});
