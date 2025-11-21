/**
 * Tests for Chain.getHardforkBlock
 */

import { describe, expect, it } from "vitest";
import { Chain } from "./Chain.js";
import { getHardforkBlock } from "./getHardforkBlock.js";

describe("Chain.getHardforkBlock", () => {
	it("returns London hardfork block for mainnet", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		const block = getHardforkBlock(chain, "london");
		expect(block).toBe(12965000);
	});

	it("returns Berlin hardfork block for mainnet", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		const block = getHardforkBlock(chain, "berlin");
		expect(block).toBe(12244000);
	});

	it("returns Shanghai hardfork block for mainnet", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		const block = getHardforkBlock(chain, "shanghai");
		expect(block).toBe(17034870);
	});

	it("returns Cancun hardfork block for mainnet", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		const block = getHardforkBlock(chain, "cancun");
		expect(block).toBe(19426587);
	});

	it("returns undefined for unsupported hardfork", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		const block = getHardforkBlock(chain, "frontier" as any);
		expect(block).toBeUndefined();
	});

	it("returns hardfork block for Sepolia", () => {
		const chain = Chain.fromId(11155111);
		if (!chain) throw new Error("Chain not found");
		const block = getHardforkBlock(chain, "london");
		expect(block).toBeDefined();
	});

	it("returns undefined for chain without hardfork metadata", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		const block = getHardforkBlock(chain, "prague" as any);
		expect(block).toBeUndefined();
	});

	it("handles testnet hardforks", () => {
		const chain = Chain.fromId(11155111);
		if (!chain) throw new Error("Chain not found");
		const block = getHardforkBlock(chain, "cancun");
		expect(block).toBeDefined();
		expect(typeof block).toBe("number");
	});
});
