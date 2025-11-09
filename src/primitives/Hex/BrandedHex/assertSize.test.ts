import { describe, expect, it } from "vitest";
import type { BrandedHex } from "./BrandedHex.js";
import { assertSize } from "./assertSize.js";
import { InvalidLengthError } from "./errors.js";

describe("assertSize", () => {
	it("returns hex when size matches", () => {
		expect(assertSize("0x" as BrandedHex, 0)).toBe("0x");
		expect(assertSize("0x00" as BrandedHex, 1)).toBe("0x00");
		expect(assertSize("0x1234" as BrandedHex, 2)).toBe("0x1234");
		expect(assertSize("0x123456" as BrandedHex, 3)).toBe("0x123456");
	});

	it("throws when size does not match", () => {
		expect(() => assertSize("0x1234" as BrandedHex, 1)).toThrow(
			InvalidLengthError,
		);
		expect(() => assertSize("0x1234" as BrandedHex, 3)).toThrow(
			InvalidLengthError,
		);
		expect(() => assertSize("0x" as BrandedHex, 1)).toThrow(InvalidLengthError);
	});

	it("includes expected and actual size in error message", () => {
		try {
			assertSize("0x1234" as BrandedHex, 3);
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(InvalidLengthError);
			expect((error as Error).message).toContain("Expected 3 bytes");
			expect((error as Error).message).toContain("got 2");
		}
	});

	it("validates address size (20 bytes)", () => {
		const address = `0x${"00".repeat(20)}` as BrandedHex;
		expect(assertSize(address, 20)).toBe(address);
		expect(() => assertSize(address, 19)).toThrow(InvalidLengthError);
		expect(() => assertSize(address, 21)).toThrow(InvalidLengthError);
	});

	it("validates hash size (32 bytes)", () => {
		const hash = `0x${"00".repeat(32)}` as BrandedHex;
		expect(assertSize(hash, 32)).toBe(hash);
		expect(() => assertSize(hash, 31)).toThrow(InvalidLengthError);
		expect(() => assertSize(hash, 33)).toThrow(InvalidLengthError);
	});

	it("validates empty hex", () => {
		expect(assertSize("0x" as BrandedHex, 0)).toBe("0x");
		expect(() => assertSize("0x" as BrandedHex, 1)).toThrow(InvalidLengthError);
	});

	it("validates large sizes", () => {
		const large = `0x${"00".repeat(100)}` as BrandedHex;
		expect(assertSize(large, 100)).toBe(large);
		expect(() => assertSize(large, 99)).toThrow(InvalidLengthError);
		expect(() => assertSize(large, 101)).toThrow(InvalidLengthError);
	});
});
