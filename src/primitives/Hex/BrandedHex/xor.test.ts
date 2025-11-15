import { describe, expect, it } from "vitest";
import { InvalidLengthError } from "../../errors/index.js";
import type { HexType } from "./HexType.js";
import { xor } from "./xor.js";

describe("xor", () => {
	it("performs XOR on same-length hex strings", () => {
		expect(xor("0x12" as HexType, "0x34" as HexType)).toBe("0x26");
		expect(xor("0xab" as HexType, "0xcd" as HexType)).toBe("0x66");
	});

	it("performs XOR with all zeros", () => {
		expect(xor("0xff" as HexType, "0x00" as HexType)).toBe("0xff");
		expect(xor("0x1234" as HexType, "0x0000" as HexType)).toBe("0x1234");
	});

	it("performs XOR with all ones", () => {
		expect(xor("0x12" as HexType, "0xff" as HexType)).toBe("0xed");
		expect(xor("0x1234" as HexType, "0xffff" as HexType)).toBe("0xedcb");
	});

	it("performs XOR on multi-byte hex", () => {
		expect(xor("0x1234" as HexType, "0xabcd" as HexType)).toBe("0xb9f9");
		expect(xor("0x123456" as HexType, "0xabcdef" as HexType)).toBe("0xb9f9b9");
	});

	it("XOR with itself returns zeros", () => {
		expect(xor("0xdeadbeef" as HexType, "0xdeadbeef" as HexType)).toBe(
			"0x00000000",
		);
		expect(xor("0x1234" as HexType, "0x1234" as HexType)).toBe("0x0000");
	});

	it("XOR is commutative", () => {
		const hex1 = "0x1234" as HexType;
		const hex2 = "0xabcd" as HexType;
		expect(xor(hex1, hex2)).toBe(xor(hex2, hex1));
	});

	it("XOR is associative", () => {
		const hex1 = "0x12" as HexType;
		const hex2 = "0x34" as HexType;
		const hex3 = "0xab" as HexType;
		const result1 = xor(xor(hex1, hex2), hex3);
		const result2 = xor(hex1, xor(hex2, hex3));
		expect(result1).toBe(result2);
	});

	it("XOR twice returns original", () => {
		const hex1 = "0x1234" as HexType;
		const hex2 = "0xabcd" as HexType;
		const xored = xor(hex1, hex2);
		expect(xor(xored, hex2)).toBe(hex1);
		expect(xor(xored, hex1)).toBe(hex2);
	});

	it("throws on mismatched lengths", () => {
		expect(() => xor("0x12" as HexType, "0x1234" as HexType)).toThrow(
			InvalidLengthError,
		);
		expect(() => xor("0x1234" as HexType, "0x12" as HexType)).toThrow(
			InvalidLengthError,
		);
		expect(() => xor("0x" as HexType, "0x12" as HexType)).toThrow(
			InvalidLengthError,
		);
	});

	it("handles empty hex", () => {
		expect(xor("0x" as HexType, "0x" as HexType)).toBe("0x");
	});

	it("handles uppercase hex", () => {
		expect(xor("0xAB" as HexType, "0xCD" as HexType)).toBe("0x66");
		expect(xor("0xABCD" as HexType, "0xEF12" as HexType)).toBe("0x44df");
	});

	it("handles mixed case", () => {
		expect(xor("0xAb" as HexType, "0xcD" as HexType)).toBe("0x66");
	});

	it("performs XOR on large hex strings", () => {
		const hex1 = `0x${"ff".repeat(100)}` as HexType;
		const hex2 = `0x${"00".repeat(100)}` as HexType;
		const result = xor(hex1, hex2);
		expect(result).toBe(hex1);
	});

	it("validates all bytes in XOR", () => {
		const hex1 = "0x123456" as HexType;
		const hex2 = "0xabcdef" as HexType;
		const result = xor(hex1, hex2);
		expect(result.length).toBe(hex1.length);
		expect(result.startsWith("0x")).toBe(true);
	});
});
