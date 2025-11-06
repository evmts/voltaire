import { describe, expect, it } from "vitest";
import { BrandedWei } from "../BrandedWei/index.js";
import { fromWei } from "./fromWei.js";

describe("fromWei", () => {
	it("converts 1 Ether in Wei to 1 Ether", () => {
		const wei = BrandedWei.from(1_000_000_000_000_000_000n);
		const ether = fromWei(wei);
		expect(ether).toBe(1n);
	});

	it("converts 0 Wei to 0 Ether", () => {
		const wei = BrandedWei.from(0);
		const ether = fromWei(wei);
		expect(ether).toBe(0n);
	});

	it("converts 5 Ether in Wei to 5 Ether", () => {
		const wei = BrandedWei.from(5_000_000_000_000_000_000n);
		const ether = fromWei(wei);
		expect(ether).toBe(5n);
	});

	it("converts 10 Ether in Wei to 10 Ether", () => {
		const wei = BrandedWei.from(10_000_000_000_000_000_000n);
		const ether = fromWei(wei);
		expect(ether).toBe(10n);
	});

	it("converts large Wei value", () => {
		const wei = BrandedWei.from(1_000_000_000_000_000_000_000_000n);
		const ether = fromWei(wei);
		expect(ether).toBe(1_000_000n);
	});

	it("handles precision loss (truncation)", () => {
		const wei = BrandedWei.from(1_500_000_000_000_000_000n); // 1.5 ETH
		const ether = fromWei(wei);
		expect(ether).toBe(1n); // Truncates to 1 ETH
	});
});
