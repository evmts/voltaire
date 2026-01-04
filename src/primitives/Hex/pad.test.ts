import { describe, expect, it } from "vitest";
import { InvalidSizeError } from "./errors.js";
import type { HexType } from "./HexType.js";
import { pad } from "./pad.js";

describe("pad", () => {
	it("pads hex to target size on left (converts to lowercase)", () => {
		const hex = "0x1234" as HexType;
		expect(pad(hex, 4)).toBe("0x00001234");
		expect(pad(hex, 8)).toBe("0x0000000000001234");
	});

	it("does not pad if already at target size", () => {
		const hex = "0x1234" as HexType;
		expect(pad(hex, 2)).toBe("0x1234");
	});

	it("throws if larger than target size", () => {
		const hex = "0x1234abcd" as HexType;
		expect(() => pad(hex, 2)).toThrow(/exceeds padding size/);
		expect(() => pad(hex, 1)).toThrow(/exceeds padding size/);
	});

	it("pads empty hex", () => {
		const hex = "0x" as HexType;
		expect(pad(hex, 2)).toBe("0x0000");
		expect(pad(hex, 4)).toBe("0x00000000");
	});

	it("pads single byte", () => {
		const hex = "0xff" as HexType;
		expect(pad(hex, 2)).toBe("0x00ff");
		expect(pad(hex, 4)).toBe("0x000000ff");
		expect(pad(hex, 8)).toBe("0x00000000000000ff");
	});

	it("throws when padding to zero size with non-empty hex", () => {
		const hex = "0x1234" as HexType;
		expect(() => pad(hex, 0)).toThrow(/exceeds padding size/);
	});

	it("pads empty hex to zero size", () => {
		const hex = "0x" as HexType;
		expect(pad(hex, 0)).toBe("0x");
	});

	it("pads to address size (20 bytes)", () => {
		const hex = "0x1234" as HexType;
		const padded = pad(hex, 20);
		expect(padded.length).toBe(2 + 20 * 2);
		expect(padded.startsWith("0x")).toBe(true);
		expect(padded.endsWith("1234")).toBe(true);
	});

	it("pads to hash size (32 bytes)", () => {
		const hex = "0xabcd" as HexType;
		const padded = pad(hex, 32);
		expect(padded.length).toBe(2 + 32 * 2);
		expect(padded.startsWith("0x")).toBe(true);
		expect(padded.endsWith("abcd")).toBe(true);
	});

	it("converts to lowercase when padding (via fromBytes)", () => {
		const hex = "0xABCD" as HexType;
		expect(pad(hex, 4)).toBe("0x0000abcd");
	});

	it("handles large padding", () => {
		const hex = "0x12" as HexType;
		const padded = pad(hex, 100);
		expect(padded.length).toBe(2 + 100 * 2);
		expect(padded.startsWith("0x00000000")).toBe(true);
		expect(padded.endsWith("12")).toBe(true);
	});

	describe("size parameter validation", () => {
		it("throws InvalidSizeError for negative size", () => {
			const hex = "0x1234" as HexType;
			expect(() => pad(hex, -1)).toThrow(InvalidSizeError);
			expect(() => pad(hex, -1)).toThrow(/Invalid target size: -1/);
		});

		it("throws InvalidSizeError for non-integer size", () => {
			const hex = "0x1234" as HexType;
			expect(() => pad(hex, 1.5)).toThrow(InvalidSizeError);
			expect(() => pad(hex, 2.7)).toThrow(/Invalid target size: 2.7/);
		});

		it("throws InvalidSizeError for NaN", () => {
			const hex = "0x1234" as HexType;
			expect(() => pad(hex, NaN)).toThrow(InvalidSizeError);
			expect(() => pad(hex, NaN)).toThrow(/Invalid target size: NaN/);
		});

		it("throws InvalidSizeError for Infinity", () => {
			const hex = "0x1234" as HexType;
			expect(() => pad(hex, Infinity)).toThrow(InvalidSizeError);
			expect(() => pad(hex, -Infinity)).toThrow(InvalidSizeError);
		});

		it("accepts zero as valid size", () => {
			const hex = "0x" as HexType;
			expect(pad(hex, 0)).toBe("0x");
		});

		it("error includes context with targetSize", () => {
			const hex = "0x1234" as HexType;
			try {
				pad(hex, -5);
			} catch (e) {
				expect(e).toBeInstanceOf(InvalidSizeError);
				expect((e as InvalidSizeError).context).toEqual({ targetSize: -5 });
			}
		});
	});
});
