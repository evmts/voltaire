import { describe, expect, it } from "vitest";
import type { BrandedEther } from "../BrandedEther/BrandedEther.js";
import { WEI_PER_ETHER } from "./constants.js";
import { fromEther } from "./fromEther.js";

describe("fromEther", () => {
	it("converts 1 Ether to Wei", () => {
		const ether = 1n as BrandedEther;
		const wei = fromEther(ether);
		expect(wei).toBe(WEI_PER_ETHER);
	});

	it("converts 0 Ether to 0 Wei", () => {
		const ether = 0n as BrandedEther;
		const wei = fromEther(ether);
		expect(wei).toBe(0n);
	});

	it("converts 2 Ether to Wei", () => {
		const ether = 2n as BrandedEther;
		const wei = fromEther(ether);
		expect(wei).toBe(2_000_000_000_000_000_000n);
	});

	it("converts fractional Ether (0.5 ETH represented as bigint)", () => {
		const ether = 5n as BrandedEther;
		const wei = fromEther(ether);
		expect(wei).toBe(5_000_000_000_000_000_000n);
	});

	it("converts large Ether value", () => {
		const ether = 1_000_000n as BrandedEther;
		const wei = fromEther(ether);
		expect(wei).toBe(1_000_000n * WEI_PER_ETHER);
	});

	it("maintains precision", () => {
		const ether = 123n as BrandedEther;
		const wei = fromEther(ether);
		expect(wei).toBe(123n * WEI_PER_ETHER);
	});
});
