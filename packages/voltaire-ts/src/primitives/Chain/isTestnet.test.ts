/**
 * Tests for Chain.isTestnet
 */

import { describe, expect, it } from "vitest";
import type { Chain } from "./ChainType.js";
import { isTestnet } from "./isTestnet.js";

/** Helper to create a minimal chain object for testing */
const createChain = (chainId: number): Chain =>
	({ chainId }) as unknown as Chain;

describe("Chain.isTestnet", () => {
	it("returns false for Ethereum mainnet", () => {
		expect(isTestnet(createChain(1))).toBe(false);
	});

	it("returns true for Sepolia", () => {
		expect(isTestnet(createChain(11155111))).toBe(true);
	});

	it("returns true for Holesky", () => {
		expect(isTestnet(createChain(17000))).toBe(true);
	});

	it("returns false for Optimism mainnet", () => {
		expect(isTestnet(createChain(10))).toBe(false);
	});

	it("returns true for Optimism Sepolia", () => {
		expect(isTestnet(createChain(11155420))).toBe(true);
	});

	it("returns false for Arbitrum One", () => {
		expect(isTestnet(createChain(42161))).toBe(false);
	});

	it("returns true for Arbitrum Sepolia", () => {
		expect(isTestnet(createChain(421614))).toBe(true);
	});

	it("returns false for Base mainnet", () => {
		expect(isTestnet(createChain(8453))).toBe(false);
	});

	it("returns true for Base Sepolia", () => {
		expect(isTestnet(createChain(84532))).toBe(true);
	});

	it("returns false for Polygon", () => {
		expect(isTestnet(createChain(137))).toBe(false);
	});

	it("returns false for Avalanche", () => {
		expect(isTestnet(createChain(43114))).toBe(false);
	});

	it("returns false for BSC", () => {
		expect(isTestnet(createChain(56))).toBe(false);
	});
});
