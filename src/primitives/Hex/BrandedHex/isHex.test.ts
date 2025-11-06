import { describe, expect, it } from "vitest";
import { isHex } from "./isHex.js";

describe("isHex", () => {
	it("returns true for valid hex strings", () => {
		expect(isHex("0x0")).toBe(true);
		expect(isHex("0x00")).toBe(true);
		expect(isHex("0x1234")).toBe(true);
		expect(isHex("0xabcdef")).toBe(true);
		expect(isHex("0xABCDEF")).toBe(true);
		expect(isHex("0xdeadbeef")).toBe(true);
	});

	it("returns true for empty hex", () => {
		expect(isHex("0x")).toBe(true);
	});

	it("returns true for mixed case", () => {
		expect(isHex("0xAbCdEf")).toBe(true);
		expect(isHex("0xDeAdBeEf")).toBe(true);
	});

	it("returns true for all valid hex characters", () => {
		expect(isHex("0x0123456789")).toBe(true);
		expect(isHex("0xabcdef")).toBe(true);
		expect(isHex("0xABCDEF")).toBe(true);
		expect(isHex("0x0123456789abcdefABCDEF")).toBe(true);
	});

	it("returns false for missing 0x prefix", () => {
		expect(isHex("")).toBe(false);
		expect(isHex("1234")).toBe(false);
		expect(isHex("abcdef")).toBe(false);
	});

	it("returns false for invalid prefix", () => {
		expect(isHex("0")).toBe(false);
		expect(isHex("x")).toBe(false);
		expect(isHex("00x1234")).toBe(false);
	});

	it("returns false for invalid hex characters", () => {
		expect(isHex("0xg")).toBe(false);
		expect(isHex("0x123g")).toBe(false);
		expect(isHex("0xGHIJ")).toBe(false);
		expect(isHex("0xz")).toBe(false);
	});

	it("returns false for whitespace", () => {
		expect(isHex("0x ")).toBe(false);
		expect(isHex("0x12 34")).toBe(false);
		expect(isHex(" 0x1234")).toBe(false);
		expect(isHex("0x1234 ")).toBe(false);
	});

	it("returns false for special characters", () => {
		expect(isHex("0x12!34")).toBe(false);
		expect(isHex("0x12@34")).toBe(false);
		expect(isHex("0x12#34")).toBe(false);
		expect(isHex("0x12$34")).toBe(false);
		expect(isHex("0x12%34")).toBe(false);
	});

	it("validates long hex strings", () => {
		const long = "0x" + "ab".repeat(1000);
		expect(isHex(long)).toBe(true);
	});

	it("validates addresses (20 bytes)", () => {
		const address = "0x" + "00".repeat(20);
		expect(isHex(address)).toBe(true);
	});

	it("validates hashes (32 bytes)", () => {
		const hash = "0x" + "00".repeat(32);
		expect(isHex(hash)).toBe(true);
	});

	it("handles odd lengths", () => {
		expect(isHex("0x1")).toBe(true);
		expect(isHex("0x123")).toBe(true);
		expect(isHex("0x12345")).toBe(true);
	});
});
