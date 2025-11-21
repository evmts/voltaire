/**
 * Tests for Chain.isL2
 */

import { describe, expect, it } from "vitest";
import { Chain } from "./Chain.js";
import { isL2 } from "./isL2.js";

describe("Chain.isL2", () => {
	it("returns false for Ethereum mainnet", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(false);
	});

	it("returns true for Optimism", () => {
		const chain = Chain.fromId(10);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(true);
	});

	it("returns true for Arbitrum One", () => {
		const chain = Chain.fromId(42161);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(true);
	});

	it("returns true for Base", () => {
		const chain = Chain.fromId(8453);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(true);
	});

	it("returns false for Polygon", () => {
		const chain = Chain.fromId(137);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(false);
	});

	it("returns false for BSC", () => {
		const chain = Chain.fromId(56);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(false);
	});

	it("returns false for Avalanche", () => {
		const chain = Chain.fromId(43114);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(false);
	});

	it("returns false for Sepolia", () => {
		const chain = Chain.fromId(11155111);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(false);
	});

	it("returns true for Optimism Sepolia", () => {
		const chain = Chain.fromId(11155420);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(true);
	});

	it("returns true for Arbitrum Sepolia", () => {
		const chain = Chain.fromId(421614);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(true);
	});

	it("returns true for Base Sepolia", () => {
		const chain = Chain.fromId(84532);
		if (!chain) throw new Error("Chain not found");
		expect(isL2(chain)).toBe(true);
	});
});
