import { describe, expect, it } from "vitest";
import type { BrandedHex } from "./BrandedHex.js";
import { size } from "./size.js";

describe("size", () => {
	it("returns 0 for empty hex", () => {
		expect(size("0x" as BrandedHex)).toBe(0);
	});

	it("returns correct size for single byte", () => {
		expect(size("0x00" as BrandedHex)).toBe(1);
		expect(size("0xff" as BrandedHex)).toBe(1);
		expect(size("0x61" as BrandedHex)).toBe(1);
	});

	it("returns correct size for multiple bytes", () => {
		expect(size("0x1234" as BrandedHex)).toBe(2);
		expect(size("0x123456" as BrandedHex)).toBe(3);
		expect(size("0x12345678" as BrandedHex)).toBe(4);
	});

	it("returns correct size for addresses (20 bytes)", () => {
		const address = `0x${"00".repeat(20)}` as BrandedHex;
		expect(size(address)).toBe(20);
	});

	it("returns correct size for hashes (32 bytes)", () => {
		const hash = `0x${"00".repeat(32)}` as BrandedHex;
		expect(size(hash)).toBe(32);
	});

	it("handles large hex strings", () => {
		const large = `0x${"00".repeat(1000)}` as BrandedHex;
		expect(size(large)).toBe(1000);
	});

	it("ignores case in calculation", () => {
		expect(size("0xabcd" as BrandedHex)).toBe(2);
		expect(size("0xABCD" as BrandedHex)).toBe(2);
		expect(size("0xAbCd" as BrandedHex)).toBe(2);
	});

	it("calculates size for odd-length hex (fractional bytes)", () => {
		expect(size("0x1" as BrandedHex)).toBe(0.5);
		expect(size("0x123" as BrandedHex)).toBe(1.5);
	});
});
