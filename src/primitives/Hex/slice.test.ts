import { describe, expect, it } from "vitest";
import type { HexType } from "./HexType.js";
import { slice } from "./slice.js";

describe("slice", () => {
	it("slices from start to end", () => {
		const hex = "0x1234abcd" as HexType;
		expect(slice(hex, 0, 2)).toBe("0x1234");
		expect(slice(hex, 1, 3)).toBe("0x34ab");
		expect(slice(hex, 2, 4)).toBe("0xabcd");
	});

	it("slices from start to end of hex", () => {
		const hex = "0x1234abcd" as HexType;
		expect(slice(hex, 0)).toBe("0x1234abcd");
		expect(slice(hex, 1)).toBe("0x34abcd");
		expect(slice(hex, 2)).toBe("0xabcd");
		expect(slice(hex, 3)).toBe("0xcd");
	});

	it("handles empty slices", () => {
		const hex = "0x1234" as HexType;
		expect(slice(hex, 2, 2)).toBe("0x");
		expect(slice(hex, 0, 0)).toBe("0x");
	});

	it("handles out-of-bounds indices", () => {
		const hex = "0x1234" as HexType;
		expect(slice(hex, 5, 10)).toBe("0x");
		expect(slice(hex, 0, 100)).toBe("0x1234");
		expect(slice(hex, 1, 100)).toBe("0x34");
	});

	it("handles start greater than end", () => {
		const hex = "0x1234abcd" as HexType;
		expect(slice(hex, 3, 1)).toBe("0x");
		expect(slice(hex, 2, 0)).toBe("0x");
	});

	it("slices empty hex", () => {
		const hex = "0x" as HexType;
		expect(slice(hex, 0, 0)).toBe("0x");
		expect(slice(hex, 0, 1)).toBe("0x");
	});

	it("slices single byte", () => {
		const hex = "0x12" as HexType;
		expect(slice(hex, 0, 1)).toBe("0x12");
		expect(slice(hex, 0)).toBe("0x12");
		expect(slice(hex, 1)).toBe("0x");
	});

	it("slices at byte boundaries", () => {
		const hex = "0x12345678" as HexType;
		expect(slice(hex, 0, 1)).toBe("0x12");
		expect(slice(hex, 1, 2)).toBe("0x34");
		expect(slice(hex, 2, 3)).toBe("0x56");
		expect(slice(hex, 3, 4)).toBe("0x78");
	});

	it("handles negative start index", () => {
		// 0x1234567890 = 5 bytes: [0x12, 0x34, 0x56, 0x78, 0x90]
		const hex = "0x1234567890" as HexType;
		// -2 means start from 2nd to last byte (index 3), go to end
		expect(slice(hex, -2)).toBe("0x7890");
		// -1 means start from last byte
		expect(slice(hex, -1)).toBe("0x90");
		// -3 means start from 3rd to last byte
		expect(slice(hex, -3)).toBe("0x567890");
	});

	it("handles negative end index", () => {
		const hex = "0x1234567890" as HexType;
		// 1 to -1 = index 1 to index 4 (exclusive)
		expect(slice(hex, 1, -1)).toBe("0x34567890".slice(0, -2)); // "0x345678"
		expect(slice(hex, 1, -1)).toBe("0x345678");
		// 0 to -2 = index 0 to index 3 (exclusive)
		expect(slice(hex, 0, -2)).toBe("0x123456");
		// 2 to -1 = index 2 to index 4 (exclusive)
		expect(slice(hex, 2, -1)).toBe("0x5678");
	});

	it("handles both negative start and end", () => {
		const hex = "0x1234567890" as HexType;
		// -3 to -1 = index 2 to index 4 (exclusive)
		expect(slice(hex, -3, -1)).toBe("0x5678");
		// -4 to -2 = index 1 to index 3 (exclusive)
		expect(slice(hex, -4, -2)).toBe("0x3456");
	});

	it("handles negative indices with small hex", () => {
		const hex = "0x1234" as HexType;
		expect(slice(hex, -1)).toBe("0x34");
		expect(slice(hex, -2)).toBe("0x1234");
		expect(slice(hex, 0, -1)).toBe("0x12");
		expect(slice(hex, -1, 2)).toBe("0x34");
	});

	it("slices large hex strings", () => {
		const large = `0x${"ab".repeat(100)}` as HexType;
		expect(slice(large, 0, 10).length).toBe(2 + 10 * 2);
		expect(slice(large, 50, 60).length).toBe(2 + 10 * 2);
		expect(slice(large, 90, 100).length).toBe(2 + 10 * 2);
	});
});
