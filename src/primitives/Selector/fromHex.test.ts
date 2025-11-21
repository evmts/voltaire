import { describe, expect, it } from "vitest";
import * as Selector from "./index.js";

describe("Selector.fromHex", () => {
	describe("valid hex", () => {
		it("creates from hex with 0x prefix", () => {
			const selector = Selector.fromHex("0xa9059cbb");
			expect(selector).toEqual(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
		});

		it("creates from lowercase hex", () => {
			const selector = Selector.fromHex("0xa9059cbb");
			expect(Selector.toHex(selector)).toBe("0xa9059cbb");
		});

		it("creates from uppercase hex", () => {
			const selector = Selector.fromHex("0xA9059CBB");
			expect(Selector.toHex(selector)).toBe("0xa9059cbb");
		});

		it("creates from mixed case hex", () => {
			const selector = Selector.fromHex("0xA9059cBb");
			expect(Selector.toHex(selector)).toBe("0xa9059cbb");
		});

		it("creates transfer selector", () => {
			const selector = Selector.fromHex("0xa9059cbb");
			expect(Selector.toHex(selector)).toBe("0xa9059cbb");
		});

		it("creates approve selector", () => {
			const selector = Selector.fromHex("0x095ea7b3");
			expect(Selector.toHex(selector)).toBe("0x095ea7b3");
		});

		it("creates balanceOf selector", () => {
			const selector = Selector.fromHex("0x70a08231");
			expect(Selector.toHex(selector)).toBe("0x70a08231");
		});
	});

	describe("error cases", () => {
		it("throws on hex without 0x prefix", () => {
			expect(() => Selector.fromHex("a9059cbb")).toThrow("Invalid hex format");
		});

		it("throws on wrong length (too short)", () => {
			expect(() => Selector.fromHex("0xa9")).toThrow("exactly 4 bytes");
		});

		it("throws on wrong length (too long)", () => {
			expect(() => Selector.fromHex("0xa9059cbbff")).toThrow("exactly 4 bytes");
		});

		it("throws on empty string", () => {
			expect(() => Selector.fromHex("")).toThrow("Invalid hex format");
		});

		it("throws on just 0x", () => {
			expect(() => Selector.fromHex("0x")).toThrow("exactly 4 bytes");
		});

		it("throws on odd length hex", () => {
			expect(() => Selector.fromHex("0xa9059cb")).toThrow("Invalid hex length");
		});
	});

	describe("round-trip", () => {
		it("preserves value through fromHex and toHex", () => {
			const original = "0xa9059cbb";
			const selector = Selector.fromHex(original);
			const hex = Selector.toHex(selector);
			expect(hex).toBe(original);
		});

		it("normalizes case to lowercase", () => {
			const selector = Selector.fromHex("0xA9059CBB");
			const hex = Selector.toHex(selector);
			expect(hex).toBe("0xa9059cbb");
		});
	});
});
