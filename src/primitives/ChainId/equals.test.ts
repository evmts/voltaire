import { describe, expect, it } from "vitest";
import * as ChainId from "./index.js";

describe("ChainId.equals", () => {
	describe("equal chain IDs", () => {
		it("returns true for same mainnet IDs", () => {
			const a = ChainId.from(1);
			const b = ChainId.from(1);
			expect(ChainId.equals(a, b)).toBe(true);
		});

		it("returns true for same custom chain ID", () => {
			const a = ChainId.from(31337);
			const b = ChainId.from(31337);
			expect(ChainId.equals(a, b)).toBe(true);
		});

		it("returns true for zero chain ID", () => {
			const a = ChainId.from(0);
			const b = ChainId.from(0);
			expect(ChainId.equals(a, b)).toBe(true);
		});

		it("returns true for large chain ID", () => {
			const a = ChainId.from(999999999);
			const b = ChainId.from(999999999);
			expect(ChainId.equals(a, b)).toBe(true);
		});
	});

	describe("different chain IDs", () => {
		it("returns false for mainnet vs sepolia", () => {
			const mainnet = ChainId.from(ChainId.MAINNET);
			const sepolia = ChainId.from(ChainId.SEPOLIA);
			expect(ChainId.equals(mainnet, sepolia)).toBe(false);
		});

		it("returns false for different values", () => {
			const a = ChainId.from(1);
			const b = ChainId.from(2);
			expect(ChainId.equals(a, b)).toBe(false);
		});

		it("returns false for off-by-one", () => {
			const a = ChainId.from(100);
			const b = ChainId.from(101);
			expect(ChainId.equals(a, b)).toBe(false);
		});
	});
});
