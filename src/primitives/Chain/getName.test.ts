/**
 * Tests for Chain.getName
 */

import { describe, expect, it } from "vitest";
import { Chain } from "./Chain.js";
import { getName } from "./getName.js";

describe("Chain.getName", () => {
	it("returns name for mainnet", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		const name = getName(chain);
		expect(name).toBe("Ethereum Mainnet");
	});

	it("returns name for Sepolia", () => {
		const chain = Chain.fromId(11155111);
		if (!chain) throw new Error("Chain not found");
		const name = getName(chain);
		expect(name).toBe("Sepolia");
	});

	it("returns name for Optimism", () => {
		const chain = Chain.fromId(10);
		if (!chain) throw new Error("Chain not found");
		const name = getName(chain);
		expect(name).toBe("OP Mainnet");
	});

	it("returns name for Arbitrum", () => {
		const chain = Chain.fromId(42161);
		if (!chain) throw new Error("Chain not found");
		const name = getName(chain);
		expect(name).toBe("Arbitrum One");
	});

	it("returns name for Polygon", () => {
		const chain = Chain.fromId(137);
		if (!chain) throw new Error("Chain not found");
		const name = getName(chain);
		expect(name).toBe("Polygon Mainnet");
	});

	it("returns name for Base", () => {
		const chain = Chain.fromId(8453);
		if (!chain) throw new Error("Chain not found");
		const name = getName(chain);
		expect(name).toBe("Base");
	});

	it("returns name for Avalanche", () => {
		const chain = Chain.fromId(43114);
		if (!chain) throw new Error("Chain not found");
		const name = getName(chain);
		expect(name).toBe("Avalanche C-Chain");
	});

	it("returns name for BSC", () => {
		const chain = Chain.fromId(56);
		if (!chain) throw new Error("Chain not found");
		const name = getName(chain);
		expect(name).toBe("BNB Smart Chain Mainnet");
	});

	it("returns correct name from chain object", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		expect(chain.name).toBe(getName(chain));
	});
});
