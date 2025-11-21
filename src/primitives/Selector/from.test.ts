import { describe, expect, it } from "vitest";
import * as Selector from "./index.js";

describe("Selector.from", () => {
	describe("from Uint8Array", () => {
		it("creates from 4-byte Uint8Array", () => {
			const bytes = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
			const selector = Selector.from(bytes);
			expect(selector).toEqual(bytes);
			expect(selector.length).toBe(4);
		});

		it("creates from transfer selector bytes", () => {
			const bytes = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
			const selector = Selector.from(bytes);
			expect(Selector.toHex(selector)).toBe("0xa9059cbb");
		});

		it("creates from approve selector bytes", () => {
			const bytes = new Uint8Array([0x09, 0x5e, 0xa7, 0xb3]);
			const selector = Selector.from(bytes);
			expect(Selector.toHex(selector)).toBe("0x095ea7b3");
		});

		it("throws on wrong length (too short)", () => {
			const bytes = new Uint8Array([0xa9, 0x05]);
			expect(() => Selector.from(bytes)).toThrow("exactly 4 bytes");
		});

		it("throws on wrong length (too long)", () => {
			const bytes = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb, 0x00]);
			expect(() => Selector.from(bytes)).toThrow("exactly 4 bytes");
		});

		it("throws on empty array", () => {
			const bytes = new Uint8Array([]);
			expect(() => Selector.from(bytes)).toThrow("exactly 4 bytes");
		});
	});

	describe("from hex string", () => {
		it("creates from hex with 0x prefix", () => {
			const selector = Selector.from("0xa9059cbb");
			expect(Selector.toHex(selector)).toBe("0xa9059cbb");
		});

		it("creates from transfer hex", () => {
			const selector = Selector.from("0xa9059cbb");
			expect(selector).toEqual(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
		});

		it("creates from approve hex", () => {
			const selector = Selector.from("0x095ea7b3");
			expect(selector).toEqual(new Uint8Array([0x09, 0x5e, 0xa7, 0xb3]));
		});

		it("creates from balanceOf hex", () => {
			const selector = Selector.from("0x70a08231");
			expect(selector).toEqual(new Uint8Array([0x70, 0xa0, 0x82, 0x31]));
		});

		it("throws on hex without prefix", () => {
			expect(() => Selector.from("a9059cbb")).toThrow("Invalid hex format");
		});

		it("throws on wrong hex length", () => {
			expect(() => Selector.from("0xa9")).toThrow("exactly 4 bytes");
		});
	});

	describe("error cases", () => {
		it("throws on invalid type (number)", () => {
			expect(() => Selector.from(0xa9059cbb as any)).toThrow(
				"Invalid selector input",
			);
		});

		it("throws on invalid type (boolean)", () => {
			expect(() => Selector.from(true as any)).toThrow(
				"Invalid selector input",
			);
		});

		it("throws on invalid type (object)", () => {
			expect(() => Selector.from({} as any)).toThrow("Invalid selector input");
		});

		it("throws on null", () => {
			expect(() => Selector.from(null as any)).toThrow(
				"Invalid selector input",
			);
		});
	});

	describe("round-trip", () => {
		it("preserves value through from bytes and toHex", () => {
			const original = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
			const selector = Selector.from(original);
			const hex = Selector.toHex(selector);
			const back = Selector.from(hex);
			expect(back).toEqual(original);
		});

		it("preserves value through from hex and back", () => {
			const original = "0xa9059cbb";
			const selector = Selector.from(original);
			const hex = Selector.toHex(selector);
			expect(hex).toBe(original);
		});
	});
});
