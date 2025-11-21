/**
 * Tests for Chain.supportsHardfork
 */

import { describe, expect, it } from "vitest";
import { Chain } from "./Chain.js";
import { supportsHardfork } from "./supportsHardfork.js";

describe("Chain.supportsHardfork", () => {
	it("returns true for mainnet London hardfork", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		expect(supportsHardfork(chain, "london")).toBe(true);
	});

	it("returns true for mainnet Berlin hardfork", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		expect(supportsHardfork(chain, "berlin")).toBe(true);
	});

	it("returns true for mainnet Shanghai hardfork", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		expect(supportsHardfork(chain, "shanghai")).toBe(true);
	});

	it("returns true for mainnet Cancun hardfork", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		expect(supportsHardfork(chain, "cancun")).toBe(true);
	});

	it("returns false for unsupported hardfork", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		expect(supportsHardfork(chain, "prague" as any)).toBe(false);
	});

	it("returns true for Sepolia London", () => {
		const chain = Chain.fromId(11155111);
		if (!chain) throw new Error("Chain not found");
		expect(supportsHardfork(chain, "london")).toBe(true);
	});

	it("returns true for Sepolia Cancun", () => {
		const chain = Chain.fromId(11155111);
		if (!chain) throw new Error("Chain not found");
		expect(supportsHardfork(chain, "cancun")).toBe(true);
	});

	it("returns false for Frontier on mainnet", () => {
		const chain = Chain.fromId(1);
		if (!chain) throw new Error("Chain not found");
		expect(supportsHardfork(chain, "frontier" as any)).toBe(false);
	});
});
