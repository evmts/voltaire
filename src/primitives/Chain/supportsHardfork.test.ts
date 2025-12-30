/**
 * Tests for Chain.supportsHardfork
 */

import { describe, expect, it } from "vitest";
import type { Chain } from "./ChainType.js";
import { supportsHardfork } from "./supportsHardfork.js";

/** Helper to create a minimal chain object for testing */
const createChain = (chainId: number): Chain =>
	({ chainId }) as unknown as Chain;

describe("Chain.supportsHardfork", () => {
	it("returns true for mainnet London hardfork", () => {
		expect(supportsHardfork(createChain(1), "london")).toBe(true);
	});

	it("returns true for mainnet Berlin hardfork", () => {
		expect(supportsHardfork(createChain(1), "berlin")).toBe(true);
	});

	it("returns true for mainnet Shanghai hardfork", () => {
		expect(supportsHardfork(createChain(1), "shanghai")).toBe(true);
	});

	it("returns true for mainnet Cancun hardfork", () => {
		expect(supportsHardfork(createChain(1), "cancun")).toBe(true);
	});

	it("returns false for unsupported hardfork", () => {
		// biome-ignore lint/suspicious/noExplicitAny: testing invalid hardfork name
		expect(supportsHardfork(createChain(1), "prague" as any)).toBe(false);
	});

	it("returns true for Sepolia London", () => {
		expect(supportsHardfork(createChain(11155111), "london")).toBe(true);
	});

	it("returns true for Sepolia Cancun", () => {
		expect(supportsHardfork(createChain(11155111), "cancun")).toBe(true);
	});

	it("returns false for Frontier on mainnet", () => {
		// biome-ignore lint/suspicious/noExplicitAny: testing invalid hardfork name
		expect(supportsHardfork(createChain(1), "frontier" as any)).toBe(false);
	});
});
