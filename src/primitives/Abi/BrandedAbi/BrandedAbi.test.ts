import { describe, expect, test } from "vitest";
import type { BrandedAbi, Item } from "./BrandedAbi.js";
import * as BrandedAbiNS from "./index.js";

describe("BrandedAbi", () => {
	const testAbi = [
		{
			type: "function" as const,
			name: "transfer",
			stateMutability: "nonpayable" as const,
			inputs: [
				{ type: "address" as const, name: "to" },
				{ type: "uint256" as const, name: "amount" },
			],
			outputs: [{ type: "bool" as const }],
		},
		{
			type: "event" as const,
			name: "Transfer",
			inputs: [
				{ type: "address" as const, name: "from", indexed: true },
				{ type: "address" as const, name: "to", indexed: true },
				{ type: "uint256" as const, name: "value" },
			],
		},
		{
			type: "error" as const,
			name: "InsufficientBalance",
			inputs: [{ type: "uint256" as const, name: "available" }],
		},
	] as const satisfies readonly Item[];

	test("BrandedAbi type is readonly array of items", () => {
		const abi: BrandedAbi<typeof testAbi> = testAbi;
		expect(abi).toBeDefined();
		expect(abi.length).toBe(3);
	});

	test("getItem finds function by name", () => {
		const fn = BrandedAbiNS.getItem(testAbi, "transfer", "function");
		expect(fn).toBeDefined();
		expect(fn?.type).toBe("function");
		expect(fn?.name).toBe("transfer");
	});

	test("getItem finds event by name", () => {
		const evt = BrandedAbiNS.getItem(testAbi, "Transfer", "event");
		expect(evt).toBeDefined();
		expect(evt?.type).toBe("event");
		expect(evt?.name).toBe("Transfer");
	});

	test("getItem finds error by name", () => {
		const err = BrandedAbiNS.getItem(testAbi, "InsufficientBalance", "error");
		expect(err).toBeDefined();
		expect(err?.type).toBe("error");
		expect(err?.name).toBe("InsufficientBalance");
	});

	test("getItem returns undefined for non-existent item", () => {
		const result = BrandedAbiNS.getItem(testAbi, "nonExistent");
		expect(result).toBeUndefined();
	});

	test("format function item", () => {
		const fn = testAbi[0];
		const formatted = BrandedAbiNS.format(fn);
		expect(formatted).toContain("function transfer");
		expect(formatted).toContain("address to");
		expect(formatted).toContain("uint256 amount");
		expect(formatted).toContain("returns");
	});

	test("format event item", () => {
		const evt = testAbi[1];
		const formatted = BrandedAbiNS.format(evt);
		expect(formatted).toContain("event Transfer");
		expect(formatted).toContain("address from");
		expect(formatted).toContain("address to");
	});

	test("formatWithArgs", () => {
		const fn = testAbi[0];
		const formatted = BrandedAbiNS.formatWithArgs(fn, [
			"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
			100n,
		]);
		expect(formatted).toContain("transfer");
		expect(formatted).toContain("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
		expect(formatted).toContain("100");
	});

	test("namespace has sub-namespaces", () => {
		expect(BrandedAbiNS.BrandedAbi).toBeDefined();
		expect(typeof BrandedAbiNS.format).toBe("function");
		expect(typeof BrandedAbiNS.getItem).toBe("function");
		expect(typeof BrandedAbiNS.formatWithArgs).toBe("function");
	});

	test("namespace exports sub-modules", () => {
		// Sub-namespaces are re-exported from subdirectories
		expect(BrandedAbiNS.Function).toBeDefined();
		expect(BrandedAbiNS.Event).toBeDefined();
		expect(BrandedAbiNS.Error).toBeDefined();
		expect(BrandedAbiNS.Constructor).toBeDefined();
	});
});
