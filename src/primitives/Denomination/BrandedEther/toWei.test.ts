import { describe, expect, it } from "vitest";
import { WEI_PER_ETHER } from "./constants.js";
import { from } from "./from.js";
import { toWei } from "./toWei.js";

describe("toWei", () => {
	it("converts 1 Ether to Wei", () => {
		const ether = from(1n);
		const wei = toWei(ether);
		expect(typeof wei).toBe("bigint");
		expect(wei).toBe(1_000_000_000_000_000_000n);
	});

	it("converts 0 Ether to Wei", () => {
		const ether = from(0n);
		const wei = toWei(ether);
		expect(wei).toBe(0n);
	});

	it("converts multiple Ether to Wei", () => {
		const ether = from(5n);
		const wei = toWei(ether);
		expect(wei).toBe(5_000_000_000_000_000_000n);
	});

	it("converts fractional Ether (already in Wei units)", () => {
		const ether = from(500_000_000_000_000_000n); // 0.5 ETH in wei units
		const wei = toWei(ether);
		expect(wei).toBe(500_000_000_000_000_000n * WEI_PER_ETHER);
	});

	it("converts large Ether value", () => {
		const ether = from(1_000_000n);
		const wei = toWei(ether);
		expect(wei).toBe(1_000_000n * WEI_PER_ETHER);
	});
});
