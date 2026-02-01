import { describe, expect, it } from "vitest";
import * as Selector from "./index.js";

describe("Selector.toHex", () => {
	describe("conversion", () => {
		it("converts transfer selector to hex", () => {
			const selector = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			expect(Selector.toHex(selector)).toBe("0xa9059cbb");
		});

		it("converts approve selector to hex", () => {
			const selector = Selector.from(new Uint8Array([0x09, 0x5e, 0xa7, 0xb3]));
			expect(Selector.toHex(selector)).toBe("0x095ea7b3");
		});

		it("converts balanceOf selector to hex", () => {
			const selector = Selector.from(new Uint8Array([0x70, 0xa0, 0x82, 0x31]));
			expect(Selector.toHex(selector)).toBe("0x70a08231");
		});

		it("converts selector with leading zeros", () => {
			const selector = Selector.from(new Uint8Array([0x00, 0x01, 0x02, 0x03]));
			expect(Selector.toHex(selector)).toBe("0x00010203");
		});

		it("converts all zeros", () => {
			const selector = Selector.from(new Uint8Array([0x00, 0x00, 0x00, 0x00]));
			expect(Selector.toHex(selector)).toBe("0x00000000");
		});

		it("converts all ones", () => {
			const selector = Selector.from(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
			expect(Selector.toHex(selector)).toBe("0xffffffff");
		});
	});

	describe("format", () => {
		it("includes 0x prefix", () => {
			const selector = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			const hex = Selector.toHex(selector);
			expect(hex.startsWith("0x")).toBe(true);
		});

		it("is lowercase", () => {
			const selector = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			const hex = Selector.toHex(selector);
			expect(hex).toBe(hex.toLowerCase());
		});

		it("is exactly 10 characters (0x + 8 hex digits)", () => {
			const selector = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			const hex = Selector.toHex(selector);
			expect(hex.length).toBe(10);
		});

		it("pads with zeros", () => {
			const selector = Selector.from(new Uint8Array([0x00, 0x00, 0x00, 0x01]));
			const hex = Selector.toHex(selector);
			expect(hex).toBe("0x00000001");
		});
	});

	describe("round-trip", () => {
		it("preserves value through toHex and from", () => {
			const original = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			const hex = Selector.toHex(original);
			const back = Selector.from(hex);
			expect(Selector.equals(back, original)).toBe(true);
		});

		it("preserves all common selectors", () => {
			const selectors = [
				"transfer(address,uint256)",
				"approve(address,uint256)",
				"balanceOf(address)",
				"totalSupply()",
			];

			for (const sig of selectors) {
				const original = Selector.fromSignature(sig);
				const hex = Selector.toHex(original);
				const back = Selector.from(hex);
				expect(Selector.equals(back, original)).toBe(true);
			}
		});
	});

	describe("known selector values", () => {
		it("transfer is 0xa9059cbb", () => {
			const selector = Selector.fromSignature("transfer(address,uint256)");
			expect(Selector.toHex(selector)).toBe("0xa9059cbb");
		});

		it("approve is 0x095ea7b3", () => {
			const selector = Selector.fromSignature("approve(address,uint256)");
			expect(Selector.toHex(selector)).toBe("0x095ea7b3");
		});

		it("balanceOf is 0x70a08231", () => {
			const selector = Selector.fromSignature("balanceOf(address)");
			expect(Selector.toHex(selector)).toBe("0x70a08231");
		});

		it("totalSupply is 0x18160ddd", () => {
			const selector = Selector.fromSignature("totalSupply()");
			expect(Selector.toHex(selector)).toBe("0x18160ddd");
		});
	});
});
