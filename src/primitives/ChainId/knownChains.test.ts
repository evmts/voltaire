import { describe, expect, it } from "vitest";
import * as ChainId from "./index.js";

describe("KNOWN_CHAINS", () => {
	it("contains all expected chains", () => {
		expect(ChainId.KNOWN_CHAINS.has(1)).toBe(true);
		expect(ChainId.KNOWN_CHAINS.has(5)).toBe(true);
		expect(ChainId.KNOWN_CHAINS.has(10)).toBe(true);
		expect(ChainId.KNOWN_CHAINS.has(137)).toBe(true);
		expect(ChainId.KNOWN_CHAINS.has(8453)).toBe(true);
		expect(ChainId.KNOWN_CHAINS.has(42161)).toBe(true);
		expect(ChainId.KNOWN_CHAINS.has(11155111)).toBe(true);
		expect(ChainId.KNOWN_CHAINS.has(17000)).toBe(true);
	});

	it("has correct size", () => {
		expect(ChainId.KNOWN_CHAINS.size).toBe(8);
	});
});

describe("CHAIN_NAMES", () => {
	it("maps chain IDs to names", () => {
		expect(ChainId.CHAIN_NAMES.get(1)).toBe("Mainnet");
		expect(ChainId.CHAIN_NAMES.get(10)).toBe("Optimism");
		expect(ChainId.CHAIN_NAMES.get(137)).toBe("Polygon");
	});

	it("has same size as KNOWN_CHAINS", () => {
		expect(ChainId.CHAIN_NAMES.size).toBe(ChainId.KNOWN_CHAINS.size);
	});
});
