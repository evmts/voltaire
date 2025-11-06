import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import * as UppercaseAddress from "./UppercaseAddress.js";

describe("UppercaseAddress", () => {
	describe("from", () => {
		it("returns uppercase string", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const uppercase = UppercaseAddress.from(addr);
			expect(uppercase).toBe("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
		});

		it("handles mixed case input", () => {
			const addr = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const uppercase = UppercaseAddress.from(addr);
			expect(uppercase).toBe("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
		});

		it("handles all lowercase input", () => {
			const addr = Address.fromHex(
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			);
			const uppercase = UppercaseAddress.from(addr);
			expect(uppercase).toBe("0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD");
		});

		it("handles all uppercase input", () => {
			const addr = Address.fromHex(
				"0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD",
			);
			const uppercase = UppercaseAddress.from(addr);
			expect(uppercase).toBe("0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD");
		});

		it("returns same result for same address", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const uppercase1 = UppercaseAddress.from(addr);
			const uppercase2 = UppercaseAddress.from(addr);
			expect(uppercase1).toBe(uppercase2);
		});

		it("handles zero address", () => {
			const addr = Address.zero();
			const uppercase = UppercaseAddress.from(addr);
			expect(uppercase).toBe("0x0000000000000000000000000000000000000000");
		});

		it("includes 0x prefix lowercase", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const uppercase = UppercaseAddress.from(addr);
			expect(uppercase.startsWith("0x")).toBe(true);
			expect(uppercase.slice(0, 2)).toBe("0x");
		});

		it("has correct length", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const uppercase = UppercaseAddress.from(addr);
			expect(uppercase.length).toBe(42);
		});

		it("contains no lowercase hex letters", () => {
			const addr = Address.fromHex(
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			);
			const uppercase = UppercaseAddress.from(addr);
			expect(uppercase).toMatch(/^0x[0-9A-F]{40}$/);
			expect(uppercase.slice(2)).not.toMatch(/[a-f]/);
		});

		it("type brands as uppercase", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const uppercase = UppercaseAddress.from(addr);
			// Type assertion to verify brand
			const _branded: UppercaseAddress.Uppercase = uppercase;
			expect(uppercase).toBe("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
		});
	});

	describe("multiple addresses", () => {
		it("converts multiple addresses to uppercase", () => {
			const addresses = [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
				"0x1234567890123456789012345678901234567890",
			];

			for (const hex of addresses) {
				const addr = Address.fromHex(hex);
				const uppercase = UppercaseAddress.from(addr);
				expect(uppercase).toBe("0x" + hex.slice(2).toUpperCase());
				expect(uppercase).toMatch(/^0x[0-9A-F]{40}$/);
			}
		});
	});

	describe("numeric characters", () => {
		it("does not change numeric characters", () => {
			const addr = Address.fromHex(
				"0x1234567890123456789012345678901234567890",
			);
			const uppercase = UppercaseAddress.from(addr);
			expect(uppercase).toBe("0x1234567890123456789012345678901234567890");
		});
	});
});
