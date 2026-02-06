/**
 * Tests for Chain.getHardforkBlock
 */

import { describe, expect, it } from "vitest";
import type { Chain } from "./ChainType.js";
import { getHardforkBlock } from "./getHardforkBlock.js";

/** Helper to create a minimal chain object for testing */
const createChain = (chainId: number): Chain =>
	({ chainId }) as unknown as Chain;

describe("Chain.getHardforkBlock", () => {
	it("returns London hardfork block for mainnet", () => {
		const block = getHardforkBlock(createChain(1), "london");
		expect(block).toBe(12965000);
	});

	it("returns Berlin hardfork block for mainnet", () => {
		const block = getHardforkBlock(createChain(1), "berlin");
		expect(block).toBe(12244000);
	});

	it("returns Shanghai hardfork block for mainnet", () => {
		const block = getHardforkBlock(createChain(1), "shanghai");
		expect(block).toBe(17034870);
	});

	it("returns Cancun hardfork block for mainnet", () => {
		const block = getHardforkBlock(createChain(1), "cancun");
		expect(block).toBe(19426587);
	});

	it("returns undefined for unsupported hardfork", () => {
		// biome-ignore lint/suspicious/noExplicitAny: testing invalid hardfork name
		const block = getHardforkBlock(createChain(1), "frontier" as any);
		expect(block).toBeUndefined();
	});

	it("returns hardfork block for Sepolia", () => {
		const block = getHardforkBlock(createChain(11155111), "london");
		expect(block).toBeDefined();
	});

	it("returns undefined for chain without hardfork metadata", () => {
		// biome-ignore lint/suspicious/noExplicitAny: testing invalid hardfork name
		const block = getHardforkBlock(createChain(1), "prague" as any);
		expect(block).toBeUndefined();
	});

	it("handles testnet hardforks", () => {
		const block = getHardforkBlock(createChain(11155111), "cancun");
		expect(block).toBeDefined();
		expect(typeof block).toBe("number");
	});
});
