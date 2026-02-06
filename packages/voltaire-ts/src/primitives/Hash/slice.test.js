import { describe, expect, it } from "vitest";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { slice } from "./slice.js";

describe("slice", () => {
	describe("basic slicing", () => {
		it("extracts portion of hash", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 0, 4);
			expect(result.length).toBe(4);
			expect(result[0]).toBe(0x12);
			expect(result[1]).toBe(0x34);
			expect(result[2]).toBe(0x56);
			expect(result[3]).toBe(0x78);
		});

		it("extracts end portion", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 28);
			expect(result.length).toBe(4);
			expect(result[0]).toBe(0x90);
			expect(result[3]).toBe(0xef);
		});

		it("extracts middle portion", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 14, 18);
			expect(result.length).toBe(4);
			expect(result[0]).toBe(0xcd);
			expect(result[1]).toBe(0xef);
		});

		it("extracts single byte", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 0, 1);
			expect(result.length).toBe(1);
			expect(result[0]).toBe(0x12);
		});

		it("extracts entire hash", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 0, 32);
			expect(result.length).toBe(32);
			expect(result[0]).toBe(0x12);
			expect(result[31]).toBe(0xef);
		});
	});

	describe("without end parameter", () => {
		it("slices to end when end not specified", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 28);
			expect(result.length).toBe(4);
		});

		it("slices from beginning when no params", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash);
			expect(result.length).toBe(32);
		});

		it("slices from middle to end", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 16);
			expect(result.length).toBe(16);
		});
	});

	describe("function selector use case", () => {
		it("extracts first 4 bytes for function selector", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const selector = slice(hash, 0, 4);
			expect(selector.length).toBe(4);
			expect(selector[0]).toBe(0x12);
			expect(selector[1]).toBe(0x34);
			expect(selector[2]).toBe(0x56);
			expect(selector[3]).toBe(0x78);
		});
	});

	describe("independence", () => {
		it("returned slice is independent from original", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 0, 4);
			result[0] = 0xff;
			expect(hash[0]).toBe(0x12);
		});

		it("modifying original does not affect slice", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 0, 4);
			hash[0] = 0xff;
			expect(result[0]).toBe(0x12);
		});
	});

	describe("edge cases", () => {
		it("extracts last byte", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 31, 32);
			expect(result.length).toBe(1);
			expect(result[0]).toBe(0xef);
		});

		it("extracts first byte", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 0, 1);
			expect(result.length).toBe(1);
			expect(result[0]).toBe(0x12);
		});

		it("returns empty for same start and end", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 10, 10);
			expect(result.length).toBe(0);
		});

		it("handles zero hash", () => {
			const hash = fromBytes(new Uint8Array(32));
			const result = slice(hash, 0, 4);
			expect(result.length).toBe(4);
			expect(result.every((b) => b === 0)).toBe(true);
		});

		it("preserves byte values in slice", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i;
			}
			const hash = fromBytes(bytes);
			const result = slice(hash, 10, 20);
			for (let i = 0; i < 10; i++) {
				expect(result[i]).toBe(i + 10);
			}
		});
	});
});
