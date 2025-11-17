import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { toLowercase } from "./toLowercase.js";

describe("toLowercase", () => {
	describe("mixed case input", () => {
		it("converts mixed case to lowercase", () => {
			const addr = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const lower = toLowercase(addr);
			expect(lower).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});

		it("converts checksummed address to lowercase", () => {
			const addr = Address.fromHex(
				"0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
			);
			const lower = toLowercase(addr);
			expect(lower).toBe("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed");
		});
	});

	describe("already lowercase", () => {
		it("returns same format for already lowercase", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const lower = toLowercase(addr);
			expect(lower).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});

		it("is idempotent", () => {
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			const lower1 = toLowercase(addr);
			const addr2 = Address.fromHex(lower1);
			const lower2 = toLowercase(addr2);
			expect(lower1).toBe(lower2);
		});
	});

	describe("uppercase input", () => {
		it("converts all uppercase to lowercase", () => {
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			const lower = toLowercase(addr);
			expect(lower).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});

		it("converts uppercase with numbers to lowercase", () => {
			const addr = Address.fromHex(
				"0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
			);
			const lower = toLowercase(addr);
			expect(lower).toBe("0xffffffffffffffffffffffffffffffffffffffff");
		});
	});

	describe("output validation", () => {
		it("always produces lowercase output", () => {
			const testCases = [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			];
			for (const testCase of testCases) {
				const addr = Address.fromHex(testCase);
				const lower = toLowercase(addr);
				expect(lower).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
				expect(lower).toMatch(/^0x[0-9a-f]{40}$/);
			}
		});

		it("starts with 0x prefix", () => {
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			const lower = toLowercase(addr);
			expect(lower.startsWith("0x")).toBe(true);
		});

		it("is 42 characters long", () => {
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			const lower = toLowercase(addr);
			expect(lower.length).toBe(42);
		});

		it("contains no uppercase letters", () => {
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			const lower = toLowercase(addr);
			expect(/[A-F]/.test(lower)).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("handles zero address", () => {
			const addr = Address.zero();
			const lower = toLowercase(addr);
			expect(lower).toBe("0x0000000000000000000000000000000000000000");
		});

		it("handles max address", () => {
			const addr = Address.fromHex(
				"0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
			);
			const lower = toLowercase(addr);
			expect(lower).toBe("0xffffffffffffffffffffffffffffffffffffffff");
		});
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
		const lower = Address.toLowercase(addr);
		expect(lower).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
	});
});
