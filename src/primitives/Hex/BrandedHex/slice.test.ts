import { describe, expect, it } from "vitest";
import { slice } from "./slice.js";
import type { BrandedHex } from "./BrandedHex.js";

describe("slice", () => {
	it("slices from start to end", () => {
		const hex = "0x1234abcd" as BrandedHex;
		expect(slice(hex, 0, 2)).toBe("0x1234");
		expect(slice(hex, 1, 3)).toBe("0x34ab");
		expect(slice(hex, 2, 4)).toBe("0xabcd");
	});

	it("slices from start to end of hex", () => {
		const hex = "0x1234abcd" as BrandedHex;
		expect(slice(hex, 0)).toBe("0x1234abcd");
		expect(slice(hex, 1)).toBe("0x34abcd");
		expect(slice(hex, 2)).toBe("0xabcd");
		expect(slice(hex, 3)).toBe("0xcd");
	});

	it("handles empty slices", () => {
		const hex = "0x1234" as BrandedHex;
		expect(slice(hex, 2, 2)).toBe("0x");
		expect(slice(hex, 0, 0)).toBe("0x");
	});

	it("handles out-of-bounds indices", () => {
		const hex = "0x1234" as BrandedHex;
		expect(slice(hex, 5, 10)).toBe("0x");
		expect(slice(hex, 0, 100)).toBe("0x1234");
		expect(slice(hex, 1, 100)).toBe("0x34");
	});

	it("handles start greater than end", () => {
		const hex = "0x1234abcd" as BrandedHex;
		expect(slice(hex, 3, 1)).toBe("0x");
		expect(slice(hex, 2, 0)).toBe("0x");
	});

	it("slices empty hex", () => {
		const hex = "0x" as BrandedHex;
		expect(slice(hex, 0, 0)).toBe("0x");
		expect(slice(hex, 0, 1)).toBe("0x");
	});

	it("slices single byte", () => {
		const hex = "0x12" as BrandedHex;
		expect(slice(hex, 0, 1)).toBe("0x12");
		expect(slice(hex, 0)).toBe("0x12");
		expect(slice(hex, 1)).toBe("0x");
	});

	it("slices at byte boundaries", () => {
		const hex = "0x12345678" as BrandedHex;
		expect(slice(hex, 0, 1)).toBe("0x12");
		expect(slice(hex, 1, 2)).toBe("0x34");
		expect(slice(hex, 2, 3)).toBe("0x56");
		expect(slice(hex, 3, 4)).toBe("0x78");
	});

	it("handles negative indices (Uint8Array slice behavior)", () => {
		const hex = "0x1234" as BrandedHex;
		const result1 = slice(hex, -1, 2);
		expect(result1).toBe("0x34");
		const result2 = slice(hex, 0, -1);
		expect(result2).toBe("0x12");
	});

	it("slices large hex strings", () => {
		const large = ("0x" + "ab".repeat(100)) as BrandedHex;
		expect(slice(large, 0, 10).length).toBe(2 + 10 * 2);
		expect(slice(large, 50, 60).length).toBe(2 + 10 * 2);
		expect(slice(large, 90, 100).length).toBe(2 + 10 * 2);
	});
});
