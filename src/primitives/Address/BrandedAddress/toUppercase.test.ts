import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { toUppercase } from "./toUppercase.js";

describe("toUppercase", () => {
	describe("mixed case input", () => {
		it("converts mixed case to uppercase", () => {
			const addr = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const upper = toUppercase(addr);
			expect(upper).toBe("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
		});

		it("converts checksummed address to uppercase", () => {
			const addr = Address.fromHex(
				"0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
			);
			const upper = toUppercase(addr);
			expect(upper).toBe("0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED");
		});
	});

	describe("already uppercase", () => {
		it("returns same format for already uppercase", () => {
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			const upper = toUppercase(addr);
			expect(upper).toBe("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
		});

		it("is idempotent", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const upper1 = toUppercase(addr);
			// Convert back by lowercasing then creating from hex
			const lowerHex = upper1.toLowerCase();
			const addr2 = Address.fromHex(lowerHex);
			const upper2 = toUppercase(addr2);
			expect(upper1).toBe(upper2);
		});
	});

	describe("lowercase input", () => {
		it("converts all lowercase to uppercase", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const upper = toUppercase(addr);
			expect(upper).toBe("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
		});

		it("converts lowercase with numbers to uppercase", () => {
			const addr = Address.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
			const upper = toUppercase(addr);
			expect(upper).toBe("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
		});
	});

	describe("output validation", () => {
		it("always produces uppercase output", () => {
			const testCases = [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			];
			for (const testCase of testCases) {
				const addr = Address.fromHex(testCase);
				const upper = toUppercase(addr);
				expect(upper).toBe("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
				expect(upper).toMatch(/^0[Xx][0-9A-F]{40}$/);
			}
		});

		it("starts with 0x or 0X prefix", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const upper = toUppercase(addr);
			expect(upper.startsWith("0X") || upper.startsWith("0x")).toBe(true);
		});

		it("is 42 characters long", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const upper = toUppercase(addr);
			expect(upper.length).toBe(42);
		});

		it("contains no lowercase letters", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const upper = toUppercase(addr);
			expect(/[a-f]/.test(upper)).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("handles zero address", () => {
			const addr = Address.zero();
			const upper = toUppercase(addr);
			expect(upper).toBe("0x0000000000000000000000000000000000000000");
		});

		it("handles max address", () => {
			const addr = Address.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
			const upper = toUppercase(addr);
			expect(upper).toBe("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
		});
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const upper = Address.toUppercase(addr);
		expect(upper).toBe("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
	});
});
