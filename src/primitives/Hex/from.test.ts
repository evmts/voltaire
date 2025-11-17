import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("from", () => {
	it("accepts hex string", () => {
		expect(from("0x1234")).toBe("0x1234");
		expect(from("0xabcdef")).toBe("0xabcdef");
		expect(from("0x")).toBe("0x");
	});

	it("accepts Uint8Array", () => {
		expect(from(new Uint8Array([]))).toBe("0x");
		expect(from(new Uint8Array([0x12, 0x34]))).toBe("0x1234");
		expect(from(new Uint8Array([0xab, 0xcd, 0xef]))).toBe("0xabcdef");
	});

	it("converts single byte", () => {
		expect(from(new Uint8Array([0x00]))).toBe("0x00");
		expect(from(new Uint8Array([0xff]))).toBe("0xff");
		expect(from(new Uint8Array([0x61]))).toBe("0x61");
	});

	it("handles edge cases", () => {
		expect(from(new Uint8Array([0x00, 0x00, 0x00]))).toBe("0x000000");
		expect(from(new Uint8Array([0xff, 0xff, 0xff]))).toBe("0xffffff");
	});

	it("preserves string hex format", () => {
		expect(from("0xABCDEF")).toBe("0xABCDEF");
		expect(from("0xabcdef")).toBe("0xabcdef");
		expect(from("0xAbCdEf")).toBe("0xAbCdEf");
	});

	it("handles large byte arrays", () => {
		const large = new Uint8Array(1000).fill(0xaa);
		const hex = from(large);
		expect(hex.length).toBe(2 + 1000 * 2);
		expect(hex.startsWith("0x")).toBe(true);
	});
});
