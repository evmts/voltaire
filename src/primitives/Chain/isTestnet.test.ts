/**
 * Tests for Chain.isTestnet
 */

import { describe, expect, it } from "vitest";
import { Chain } from "./Chain.js";
import { isTestnet } from "./isTestnet.js";

describe("Chain.isTestnet", () => {
	it("returns false for Ethereum mainnet", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(false);
	});

	it("returns true for Sepolia", () => {
		const chain = Chain.fromId(11155111);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(true);
	});

	it("returns true for Holesky", () => {
		const chain = Chain.fromId(17000);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(true);
	});

	it("returns false for Optimism mainnet", () => {
		const chain = Chain.fromId(10);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(false);
	});

	it("returns true for Optimism Sepolia", () => {
		const chain = Chain.fromId(11155420);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(true);
	});

	it("returns false for Arbitrum One", () => {
		const chain = Chain.fromId(42161);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(false);
	});

	it("returns true for Arbitrum Sepolia", () => {
		const chain = Chain.fromId(421614);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(true);
	});

	it("returns false for Base mainnet", () => {
		const chain = Chain.fromId(8453);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(false);
	});

	it("returns true for Base Sepolia", () => {
		const chain = Chain.fromId(84532);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(true);
	});

	it("returns false for Polygon", () => {
		const chain = Chain.fromId(137);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(false);
	});

	it("returns false for Avalanche", () => {
		const chain = Chain.fromId(43114);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(false);
	});

	it("returns false for BSC", () => {
		const chain = Chain.fromId(56);
		if (!chain) throw new Error("Chain not found");
		expect(isTestnet(chain)).toBe(false);
	});
});
