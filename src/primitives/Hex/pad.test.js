import { describe, expect, it } from "vitest";
import { InvalidSizeError, SizeExceededError } from "./errors.js";
import { pad } from "./pad.js";

describe("Hex.pad", () => {
	describe("basic padding", () => {
		it("pads hex to target size on left", () => {
			const hex = "0x1234";
			expect(pad(hex, 4)).toBe("0x00001234");
			expect(pad(hex, 8)).toBe("0x0000000000001234");
		});

		it("does not pad if already at target size", () => {
			const hex = "0x1234";
			expect(pad(hex, 2)).toBe("0x1234");
		});

		it("throws if hex exceeds target size", () => {
			const hex = "0x1234abcd";
			expect(() => pad(hex, 2)).toThrow(SizeExceededError);
			expect(() => pad(hex, 1)).toThrow(SizeExceededError);
		});

		it("pads empty hex", () => {
			const hex = "0x";
			expect(pad(hex, 2)).toBe("0x0000");
			expect(pad(hex, 4)).toBe("0x00000000");
		});
	});

	describe("invalid size parameter", () => {
		it("throws for negative size", () => {
			expect(() => pad("0x1234", -1)).toThrow(InvalidSizeError);
			expect(() => pad("0x1234", -1)).toThrow(
				"Size must be a non-negative integer",
			);
		});

		it("throws for non-integer size", () => {
			expect(() => pad("0x1234", 1.5)).toThrow(InvalidSizeError);
			expect(() => pad("0x1234", 1.5)).toThrow(
				"Size must be a non-negative integer",
			);
		});

		it("allows zero size when hex is empty", () => {
			expect(pad("0x", 0)).toBe("0x");
		});

		it("throws for zero size when hex has data", () => {
			expect(() => pad("0x1234", 0)).toThrow(SizeExceededError);
		});
	});

	describe("single byte padding", () => {
		it("pads single byte to various sizes", () => {
			const hex = "0xff";
			expect(pad(hex, 2)).toBe("0x00ff");
			expect(pad(hex, 4)).toBe("0x000000ff");
			expect(pad(hex, 8)).toBe("0x00000000000000ff");
		});

		it("pads zero byte", () => {
			const hex = "0x00";
			expect(pad(hex, 2)).toBe("0x0000");
			expect(pad(hex, 4)).toBe("0x00000000");
		});
	});

	describe("common Ethereum sizes", () => {
		it("pads to Bytes4 size (4 bytes)", () => {
			const hex = "0x12";
			const padded = pad(hex, 4);
			expect(padded.length).toBe(2 + 4 * 2);
			expect(padded).toBe("0x00000012");
		});

		it("pads to address size (20 bytes)", () => {
			const hex = "0x1234";
			const padded = pad(hex, 20);
			expect(padded.length).toBe(2 + 20 * 2);
			expect(padded.startsWith("0x0000")).toBe(true);
			expect(padded.endsWith("1234")).toBe(true);
		});

		it("pads to hash size (32 bytes)", () => {
			const hex = "0xabcd";
			const padded = pad(hex, 32);
			expect(padded.length).toBe(2 + 32 * 2);
			expect(padded.startsWith("0x0000")).toBe(true);
			expect(padded.endsWith("abcd")).toBe(true);
		});
	});

	describe("case handling", () => {
		it("converts to lowercase when padding", () => {
			const hex = "0xABCD";
			expect(pad(hex, 4)).toBe("0x0000abcd");
		});

		it("converts mixed case to lowercase", () => {
			const hex = "0xAbCd";
			expect(pad(hex, 4)).toBe("0x0000abcd");
		});
	});

	describe("type safety", () => {
		it("returns HexType branded string", () => {
			const hex = "0x12";
			const padded = pad(hex, 4);
			expect(typeof padded).toBe("string");
			expect(padded.startsWith("0x")).toBe(true);
		});
	});
});
