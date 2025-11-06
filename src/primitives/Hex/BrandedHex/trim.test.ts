import { describe, expect, it } from "vitest";
import { trim } from "./trim.js";
import type { BrandedHex } from "./BrandedHex.js";

describe("trim", () => {
	it("removes leading zeros", () => {
		expect(trim("0x00001234" as BrandedHex)).toBe("0x1234");
		expect(trim("0x0000abcd" as BrandedHex)).toBe("0xabcd");
	});

	it("removes all leading zeros", () => {
		expect(trim("0x0000" as BrandedHex)).toBe("0x");
		expect(trim("0x00000000" as BrandedHex)).toBe("0x");
	});

	it("does not trim non-zero values", () => {
		expect(trim("0x1234" as BrandedHex)).toBe("0x1234");
		expect(trim("0xabcd" as BrandedHex)).toBe("0xabcd");
	});

	it("does not trim zeros in middle or end", () => {
		expect(trim("0x120034" as BrandedHex)).toBe("0x120034");
		expect(trim("0x123400" as BrandedHex)).toBe("0x123400");
	});

	it("trims empty hex", () => {
		expect(trim("0x" as BrandedHex)).toBe("0x");
	});

	it("trims single zero byte", () => {
		expect(trim("0x00" as BrandedHex)).toBe("0x");
	});

	it("preserves single non-zero byte", () => {
		expect(trim("0xff" as BrandedHex)).toBe("0xff");
		expect(trim("0x01" as BrandedHex)).toBe("0x01");
	});

	it("handles odd-length leading zeros", () => {
		expect(trim("0x001234" as BrandedHex)).toBe("0x1234");
	});

	it("converts to lowercase when trimming (via fromBytes)", () => {
		expect(trim("0x0000ABCD" as BrandedHex)).toBe("0xabcd");
		expect(trim("0x0000abcd" as BrandedHex)).toBe("0xabcd");
	});

	it("trims many leading zeros", () => {
		const hex = ("0x" + "00".repeat(50) + "1234") as BrandedHex;
		expect(trim(hex)).toBe("0x1234");
	});

	it("handles zero value", () => {
		expect(trim("0x00" as BrandedHex)).toBe("0x");
		expect(trim("0x0000000000000000" as BrandedHex)).toBe("0x");
	});
});
