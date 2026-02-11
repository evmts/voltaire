import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("ChainId.from", () => {
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

	it("creates chain ID from bigint", () => {
		const chainId = from(1n);
		expect(chainId).toBe(1);
	});

	it("creates chain ID from large bigint", () => {
		const chainId = from(137n);
		expect(chainId).toBe(137);
	});

	it("throws on negative bigint", () => {
		expect(() => from(-1n)).toThrow("Chain ID must be non-negative integer");
	});
});
