import { describe, expect, it } from "vitest";
import {
	ARBITRUM,
	BASE,
	GOERLI,
	HOLESKY,
	MAINNET,
	OPTIMISM,
	POLYGON,
	SEPOLIA,
} from "./constants.js";
import { from } from "./from.js";
import { getChainName } from "./getChainName.js";

describe("ChainId.getChainName", () => {
	describe("returns name for known chains", () => {
		it("returns 'Mainnet' for chain ID 1", () => {
			expect(getChainName(from(MAINNET))).toBe("Mainnet");
		});

		it("returns 'Goerli' for chain ID 5", () => {
			expect(getChainName(from(GOERLI))).toBe("Goerli");
		});

		it("returns 'Sepolia' for chain ID 11155111", () => {
			expect(getChainName(from(SEPOLIA))).toBe("Sepolia");
		});

		it("returns 'Holesky' for chain ID 17000", () => {
			expect(getChainName(from(HOLESKY))).toBe("Holesky");
		});

		it("returns 'Optimism' for chain ID 10", () => {
			expect(getChainName(from(OPTIMISM))).toBe("Optimism");
		});

		it("returns 'Arbitrum One' for chain ID 42161", () => {
			expect(getChainName(from(ARBITRUM))).toBe("Arbitrum One");
		});

		it("returns 'Base' for chain ID 8453", () => {
			expect(getChainName(from(BASE))).toBe("Base");
		});

		it("returns 'Polygon' for chain ID 137", () => {
			expect(getChainName(from(POLYGON))).toBe("Polygon");
		});
	});

	describe("returns undefined for unknown chains", () => {
		it("returns undefined for arbitrary chain ID", () => {
			expect(getChainName(from(999999))).toBeUndefined();
		});

		it("returns undefined for zero", () => {
			expect(getChainName(from(0))).toBeUndefined();
		});
	});
});
