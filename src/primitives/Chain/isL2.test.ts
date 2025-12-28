/**
 * Tests for Chain.isL2
 */

import { describe, expect, it } from "vitest";
import type { Chain } from "./ChainType.js";
import { isL2 } from "./isL2.js";

/** Helper to create a minimal chain object for testing */
const createChain = (chainId: number): Chain =>
	({ chainId }) as unknown as Chain;

describe("Chain.isL2", () => {
	it("returns false for Ethereum mainnet", () => {
		expect(isL2(createChain(1))).toBe(false);
	});

	it("returns true for Optimism", () => {
		expect(isL2(createChain(10))).toBe(true);
	});

	it("returns true for Arbitrum One", () => {
		expect(isL2(createChain(42161))).toBe(true);
	});

	it("returns true for Base", () => {
		expect(isL2(createChain(8453))).toBe(true);
	});

	it("returns false for Polygon", () => {
		expect(isL2(createChain(137))).toBe(false);
	});

	it("returns false for BSC", () => {
		expect(isL2(createChain(56))).toBe(false);
	});

	it("returns false for Avalanche", () => {
		expect(isL2(createChain(43114))).toBe(false);
	});

	it("returns false for Sepolia", () => {
		expect(isL2(createChain(11155111))).toBe(false);
	});

	it("returns true for Optimism Sepolia", () => {
		expect(isL2(createChain(11155420))).toBe(true);
	});

	it("returns true for Arbitrum Sepolia", () => {
		expect(isL2(createChain(421614))).toBe(true);
	});

	it("returns true for Base Sepolia", () => {
		expect(isL2(createChain(84532))).toBe(true);
	});
});
