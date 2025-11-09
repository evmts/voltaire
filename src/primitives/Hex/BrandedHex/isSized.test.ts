import { describe, expect, it } from "vitest";
import type { BrandedHex } from "./BrandedHex.js";
import { isSized } from "./isSized.js";

describe("isSized", () => {
	it("returns true for correct size", () => {
		expect(isSized("0x" as BrandedHex, 0)).toBe(true);
		expect(isSized("0x00" as BrandedHex, 1)).toBe(true);
		expect(isSized("0x1234" as BrandedHex, 2)).toBe(true);
		expect(isSized("0x123456" as BrandedHex, 3)).toBe(true);
		expect(isSized("0x12345678" as BrandedHex, 4)).toBe(true);
	});

	it("returns false for incorrect size", () => {
		expect(isSized("0x1234" as BrandedHex, 1)).toBe(false);
		expect(isSized("0x1234" as BrandedHex, 3)).toBe(false);
		expect(isSized("0x" as BrandedHex, 1)).toBe(false);
		expect(isSized("0x00" as BrandedHex, 0)).toBe(false);
	});

	it("handles large sizes", () => {
		const hex = `0x${"00".repeat(32)}` as BrandedHex;
		expect(isSized(hex, 32)).toBe(true);
		expect(isSized(hex, 31)).toBe(false);
		expect(isSized(hex, 33)).toBe(false);
	});

	it("handles address size (20 bytes)", () => {
		const address = `0x${"00".repeat(20)}` as BrandedHex;
		expect(isSized(address, 20)).toBe(true);
		expect(isSized(address, 19)).toBe(false);
	});

	it("handles hash size (32 bytes)", () => {
		const hash = `0x${"00".repeat(32)}` as BrandedHex;
		expect(isSized(hash, 32)).toBe(true);
		expect(isSized(hash, 31)).toBe(false);
	});

	it("works with zero target size", () => {
		expect(isSized("0x" as BrandedHex, 0)).toBe(true);
		expect(isSized("0x00" as BrandedHex, 0)).toBe(false);
	});
});
