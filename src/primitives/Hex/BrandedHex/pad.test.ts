import { describe, expect, it } from "vitest";
import type { BrandedHex } from "./BrandedHex.js";
import { pad } from "./pad.js";

describe("pad", () => {
	it("pads hex to target size on left (converts to lowercase)", () => {
		const hex = "0x1234" as BrandedHex;
		expect(pad(hex, 4)).toBe("0x00001234");
		expect(pad(hex, 8)).toBe("0x0000000000001234");
	});

	it("does not pad if already at target size", () => {
		const hex = "0x1234" as BrandedHex;
		expect(pad(hex, 2)).toBe("0x1234");
	});

	it("does not pad if larger than target size", () => {
		const hex = "0x1234abcd" as BrandedHex;
		expect(pad(hex, 2)).toBe("0x1234abcd");
		expect(pad(hex, 1)).toBe("0x1234abcd");
	});

	it("pads empty hex", () => {
		const hex = "0x" as BrandedHex;
		expect(pad(hex, 2)).toBe("0x0000");
		expect(pad(hex, 4)).toBe("0x00000000");
	});

	it("pads single byte", () => {
		const hex = "0xff" as BrandedHex;
		expect(pad(hex, 2)).toBe("0x00ff");
		expect(pad(hex, 4)).toBe("0x000000ff");
		expect(pad(hex, 8)).toBe("0x00000000000000ff");
	});

	it("pads to zero size", () => {
		const hex = "0x1234" as BrandedHex;
		expect(pad(hex, 0)).toBe("0x1234");
	});

	it("pads to address size (20 bytes)", () => {
		const hex = "0x1234" as BrandedHex;
		const padded = pad(hex, 20);
		expect(padded.length).toBe(2 + 20 * 2);
		expect(padded.startsWith("0x")).toBe(true);
		expect(padded.endsWith("1234")).toBe(true);
	});

	it("pads to hash size (32 bytes)", () => {
		const hex = "0xabcd" as BrandedHex;
		const padded = pad(hex, 32);
		expect(padded.length).toBe(2 + 32 * 2);
		expect(padded.startsWith("0x")).toBe(true);
		expect(padded.endsWith("abcd")).toBe(true);
	});

	it("converts to lowercase when padding (via fromBytes)", () => {
		const hex = "0xABCD" as BrandedHex;
		expect(pad(hex, 4)).toBe("0x0000abcd");
	});

	it("handles large padding", () => {
		const hex = "0x12" as BrandedHex;
		const padded = pad(hex, 100);
		expect(padded.length).toBe(2 + 100 * 2);
		expect(padded.startsWith("0x00000000")).toBe(true);
		expect(padded.endsWith("12")).toBe(true);
	});
});
