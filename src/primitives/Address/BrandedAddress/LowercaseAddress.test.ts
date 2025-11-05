import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import * as LowercaseAddress from "./LowercaseAddress.js";

describe("LowercaseAddress", () => {
	describe("from", () => {
		it("returns lowercase string", () => {
			const addr = Address.fromHex("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
			const lowercase = LowercaseAddress.from(addr);
			expect(lowercase).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});

		it("handles mixed case input", () => {
			const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
			const lowercase = LowercaseAddress.from(addr);
			expect(lowercase).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});

		it("handles all uppercase input", () => {
			const addr = Address.fromHex("0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD");
			const lowercase = LowercaseAddress.from(addr);
			expect(lowercase).toBe("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
		});

		it("handles all lowercase input", () => {
			const addr = Address.fromHex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
			const lowercase = LowercaseAddress.from(addr);
			expect(lowercase).toBe("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
		});

		it("returns same result for same address", () => {
			const addr = Address.fromHex("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
			const lowercase1 = LowercaseAddress.from(addr);
			const lowercase2 = LowercaseAddress.from(addr);
			expect(lowercase1).toBe(lowercase2);
		});

		it("handles zero address", () => {
			const addr = Address.zero();
			const lowercase = LowercaseAddress.from(addr);
			expect(lowercase).toBe("0x0000000000000000000000000000000000000000");
		});

		it("includes 0x prefix", () => {
			const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			const lowercase = LowercaseAddress.from(addr);
			expect(lowercase.startsWith("0x")).toBe(true);
		});

		it("has correct length", () => {
			const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			const lowercase = LowercaseAddress.from(addr);
			expect(lowercase.length).toBe(42);
		});

		it("contains no uppercase letters", () => {
			const addr = Address.fromHex("0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD");
			const lowercase = LowercaseAddress.from(addr);
			expect(lowercase).toMatch(/^0x[0-9a-f]{40}$/);
			expect(lowercase).not.toMatch(/[A-F]/);
		});

		it("type brands as lowercase", () => {
			const addr = Address.fromHex("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
			const lowercase = LowercaseAddress.from(addr);
			// Type assertion to verify brand
			const _branded: LowercaseAddress.Lowercase = lowercase;
			expect(lowercase).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});
	});

	describe("multiple addresses", () => {
		it("converts multiple addresses to lowercase", () => {
			const addresses = [
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
				"0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD",
				"0x1234567890123456789012345678901234567890",
			];

			for (const hex of addresses) {
				const addr = Address.fromHex(hex);
				const lowercase = LowercaseAddress.from(addr);
				expect(lowercase).toBe(hex.toLowerCase());
				expect(lowercase).toMatch(/^0x[0-9a-f]{40}$/);
			}
		});
	});
});
