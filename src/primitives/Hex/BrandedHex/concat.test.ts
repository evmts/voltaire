import { describe, expect, it } from "vitest";
import { concat } from "./concat.js";
import type { BrandedHex } from "./BrandedHex.js";

describe("concat", () => {
	it("concatenates two hex strings", () => {
		const hex1 = "0x1234" as BrandedHex;
		const hex2 = "0xabcd" as BrandedHex;
		expect(concat(hex1, hex2)).toBe("0x1234abcd");
	});

	it("concatenates multiple hex strings", () => {
		const hex1 = "0x12" as BrandedHex;
		const hex2 = "0x34" as BrandedHex;
		const hex3 = "0xab" as BrandedHex;
		const hex4 = "0xcd" as BrandedHex;
		expect(concat(hex1, hex2, hex3, hex4)).toBe("0x1234abcd");
	});

	it("concatenates with empty hex", () => {
		const hex1 = "0x" as BrandedHex;
		const hex2 = "0x1234" as BrandedHex;
		expect(concat(hex1, hex2)).toBe("0x1234");
		expect(concat(hex2, hex1)).toBe("0x1234");
		expect(concat(hex1, hex1)).toBe("0x");
	});

	it("concatenates single bytes", () => {
		const hex1 = "0x12" as BrandedHex;
		const hex2 = "0x34" as BrandedHex;
		expect(concat(hex1, hex2)).toBe("0x1234");
	});

	it("concatenates mixed sizes", () => {
		const hex1 = "0x12" as BrandedHex;
		const hex2 = "0x3456" as BrandedHex;
		const hex3 = "0x789abc" as BrandedHex;
		expect(concat(hex1, hex2, hex3)).toBe("0x123456789abc");
	});

	it("concatenates with single hex string", () => {
		const hex = "0x1234" as BrandedHex;
		expect(concat(hex)).toBe("0x1234");
	});

	it("concatenates empty result", () => {
		const hex1 = "0x" as BrandedHex;
		const hex2 = "0x" as BrandedHex;
		expect(concat(hex1, hex2)).toBe("0x");
	});

	it("concatenates (converts to lowercase via fromBytes)", () => {
		const hex1 = "0xABCD" as BrandedHex;
		const hex2 = "0xef12" as BrandedHex;
		expect(concat(hex1, hex2)).toBe("0xabcdef12");
	});

	it("concatenates many hex strings", () => {
		const hexes = Array.from({ length: 100 }, (_, i) =>
			`0x${i.toString(16).padStart(2, "0")}`,
		) as BrandedHex[];
		const result = concat(...hexes);
		expect(result.length).toBe(2 + 100 * 2);
		expect(result.startsWith("0x")).toBe(true);
	});

	it("concatenates large hex strings", () => {
		const hex1 = ("0x" + "ab".repeat(100)) as BrandedHex;
		const hex2 = ("0x" + "cd".repeat(100)) as BrandedHex;
		const result = concat(hex1, hex2);
		expect(result.length).toBe(2 + 200 * 2);
	});
});
