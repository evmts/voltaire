import { describe, expect, it } from "vitest";
import * as ChainId from "./index.js";

describe("isKnown", () => {
	it("returns true for mainnet", () => {
		expect(ChainId.isKnown(1)).toBe(true);
	});

	it("returns true for all known chains", () => {
		expect(ChainId.isKnown(ChainId.MAINNET)).toBe(true);
		expect(ChainId.isKnown(ChainId.GOERLI)).toBe(true);
		expect(ChainId.isKnown(ChainId.SEPOLIA)).toBe(true);
		expect(ChainId.isKnown(ChainId.HOLESKY)).toBe(true);
		expect(ChainId.isKnown(ChainId.OPTIMISM)).toBe(true);
		expect(ChainId.isKnown(ChainId.ARBITRUM)).toBe(true);
		expect(ChainId.isKnown(ChainId.BASE)).toBe(true);
		expect(ChainId.isKnown(ChainId.POLYGON)).toBe(true);
	});

	it("returns false for unknown chain IDs", () => {
		expect(ChainId.isKnown(999999)).toBe(false);
		expect(ChainId.isKnown(12345)).toBe(false);
		expect(ChainId.isKnown(0)).toBe(false);
	});

	it("works with internal function", () => {
		const chainId = ChainId.from(1);
		expect(ChainId._isKnown.call(chainId)).toBe(true);
	});
});
