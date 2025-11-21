import { describe, expect, it } from "vitest";
import * as ChainId from "./index.js";

describe("ChainId", () => {
	describe("from", () => {
		it("creates from mainnet ID", () => {
			const chainId = ChainId.from(1);
			expect(chainId).toBe(1);
		});

		it("creates from Sepolia ID", () => {
			const chainId = ChainId.from(11155111);
			expect(chainId).toBe(11155111);
		});

		it("creates from zero", () => {
			const chainId = ChainId.from(0);
			expect(chainId).toBe(0);
		});

		it("creates from custom chain ID", () => {
			const chainId = ChainId.from(31337);
			expect(chainId).toBe(31337);
		});

		it("creates from large ID", () => {
			const chainId = ChainId.from(999999999);
			expect(chainId).toBe(999999999);
		});

		it("throws on negative value", () => {
			expect(() => ChainId.from(-1)).toThrow("non-negative integer");
		});

		it("throws on non-integer", () => {
			expect(() => ChainId.from(1.5)).toThrow("non-negative integer");
		});

		it("throws on NaN", () => {
			expect(() => ChainId.from(Number.NaN)).toThrow("non-negative integer");
		});

		it("throws on Infinity", () => {
			expect(() => ChainId.from(Number.POSITIVE_INFINITY)).toThrow(
				"non-negative integer",
			);
		});
	});

	describe("namespace object", () => {
		it("has from method", () => {
			expect(typeof ChainId.ChainId.from).toBe("function");
		});

		it("has toNumber method", () => {
			expect(typeof ChainId.ChainId.toNumber).toBe("function");
		});

		it("has equals method", () => {
			expect(typeof ChainId.ChainId.equals).toBe("function");
		});

		it("has isMainnet method", () => {
			expect(typeof ChainId.ChainId.isMainnet).toBe("function");
		});
	});

	describe("well-known chain IDs", () => {
		it("Mainnet is 1", () => {
			const chainId = ChainId.from(ChainId.MAINNET);
			expect(ChainId.isMainnet(chainId)).toBe(true);
		});

		it("Sepolia is 11155111", () => {
			const chainId = ChainId.from(ChainId.SEPOLIA);
			expect(chainId).toBe(11155111);
			expect(ChainId.isMainnet(chainId)).toBe(false);
		});

		it("Optimism is 10", () => {
			const chainId = ChainId.from(ChainId.OPTIMISM);
			expect(chainId).toBe(10);
		});

		it("Arbitrum is 42161", () => {
			const chainId = ChainId.from(ChainId.ARBITRUM);
			expect(chainId).toBe(42161);
		});

		it("Base is 8453", () => {
			const chainId = ChainId.from(ChainId.BASE);
			expect(chainId).toBe(8453);
		});

		it("Polygon is 137", () => {
			const chainId = ChainId.from(ChainId.POLYGON);
			expect(chainId).toBe(137);
		});
	});
});
