import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("BrandedChainId.from", () => {
	it("creates chain ID from number", () => {
		const chainId = from(1);
		expect(chainId).toBe(1);
	});

	it("accepts large chain IDs", () => {
		const sepolia = from(11155111);
		expect(sepolia).toBe(11155111);
	});

	it("throws on negative numbers", () => {
		expect(() => from(-1)).toThrow("Chain ID must be non-negative integer");
	});

	it("throws on floats", () => {
		expect(() => from(1.5)).toThrow("Chain ID must be non-negative integer");
	});
});
