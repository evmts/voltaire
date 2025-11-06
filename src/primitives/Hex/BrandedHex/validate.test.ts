import { describe, expect, it } from "vitest";
import { validate } from "./validate.js";
import { InvalidCharacterError, InvalidFormatError } from "./errors.js";

describe("validate", () => {
	it("validates correct hex strings", () => {
		expect(validate("0x0")).toBe("0x0");
		expect(validate("0x00")).toBe("0x00");
		expect(validate("0x1234")).toBe("0x1234");
		expect(validate("0xabcdef")).toBe("0xabcdef");
		expect(validate("0xABCDEF")).toBe("0xABCDEF");
		expect(validate("0xdeadbeef")).toBe("0xdeadbeef");
	});

	it("validates empty hex", () => {
		expect(validate("0x")).toBe("0x");
	});

	it("validates mixed case", () => {
		expect(validate("0xAbCdEf")).toBe("0xAbCdEf");
		expect(validate("0xDeAdBeEf")).toBe("0xDeAdBeEf");
	});

	it("validates long hex strings", () => {
		const long = "0x" + "ab".repeat(1000);
		expect(validate(long)).toBe(long);
	});

	it("throws on missing 0x prefix", () => {
		expect(() => validate("1234")).toThrow(InvalidFormatError);
		expect(() => validate("abcdef")).toThrow(InvalidFormatError);
		expect(() => validate("")).toThrow(InvalidFormatError);
	});

	it("throws on single character prefix", () => {
		expect(() => validate("0")).toThrow(InvalidFormatError);
		expect(() => validate("x")).toThrow(InvalidFormatError);
	});

	it("throws on invalid hex characters", () => {
		expect(() => validate("0xg")).toThrow(InvalidCharacterError);
		expect(() => validate("0x123g")).toThrow(InvalidCharacterError);
		expect(() => validate("0xGHIJ")).toThrow(InvalidCharacterError);
	});

	it("throws on whitespace", () => {
		expect(() => validate("0x ")).toThrow(InvalidCharacterError);
		expect(() => validate("0x12 34")).toThrow(InvalidCharacterError);
		expect(() => validate(" 0x1234")).toThrow(InvalidFormatError);
		expect(() => validate("0x1234 ")).toThrow(InvalidCharacterError);
	});

	it("throws on special characters", () => {
		expect(() => validate("0x12!34")).toThrow(InvalidCharacterError);
		expect(() => validate("0x12@34")).toThrow(InvalidCharacterError);
		expect(() => validate("0x12#34")).toThrow(InvalidCharacterError);
	});

	it("validates addresses", () => {
		const address = "0x" + "00".repeat(20);
		expect(validate(address)).toBe(address);
	});

	it("validates hashes", () => {
		const hash = "0x" + "00".repeat(32);
		expect(validate(hash)).toBe(hash);
	});

	it("validates all valid hex characters", () => {
		expect(validate("0x0123456789")).toBe("0x0123456789");
		expect(validate("0xabcdef")).toBe("0xabcdef");
		expect(validate("0xABCDEF")).toBe("0xABCDEF");
		expect(validate("0x0123456789abcdefABCDEF")).toBe(
			"0x0123456789abcdefABCDEF",
		);
	});
});
