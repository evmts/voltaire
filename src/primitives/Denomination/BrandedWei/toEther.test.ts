import { describe, expect, it } from "vitest";
import { WEI_PER_ETHER } from "./constants.js";
import { from } from "./from.js";
import { toEther } from "./toEther.js";

describe("toEther", () => {
	it("converts 1 Ether worth of Wei to Ether", () => {
		const wei = from(WEI_PER_ETHER);
		const ether = toEther(wei);
		expect(ether).toBe(1n);
	});

	it("converts 0 Wei to 0 Ether", () => {
		const wei = from(0);
		const ether = toEther(wei);
		expect(ether).toBe(0n);
	});

	it("converts 2 Ether worth of Wei to Ether", () => {
		const wei = from(2_000_000_000_000_000_000);
		const ether = toEther(wei);
		expect(ether).toBe(2n);
	});

	it("converts large Wei value to Ether", () => {
		const wei = from(1_000_000n * WEI_PER_ETHER);
		const ether = toEther(wei);
		expect(ether).toBe(1_000_000n);
	});

	it("truncates fractional Ether (integer division)", () => {
		const wei = from(1_500_000_000_000_000_000); // 1.5 ETH
		const ether = toEther(wei);
		expect(ether).toBe(1n);
	});

	it("maintains precision for exact conversions", () => {
		const wei = from(123n * WEI_PER_ETHER);
		const ether = toEther(wei);
		expect(ether).toBe(123n);
	});
});
