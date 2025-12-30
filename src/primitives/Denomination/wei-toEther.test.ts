import { describe, expect, it } from "vitest";
import { WEI_PER_ETHER } from "./wei-constants.js";
import { from } from "./wei-from.js";
import { toEther } from "./wei-toEther.js";

describe("toEther", () => {
	it("converts 1 Ether worth of Wei to Ether", () => {
		const wei = from(WEI_PER_ETHER);
		const ether = toEther(wei);
		expect(ether).toBe("1");
	});

	it("converts 0 Wei to 0 Ether", () => {
		const wei = from(0);
		const ether = toEther(wei);
		expect(ether).toBe("0");
	});

	it("converts 2 Ether worth of Wei to Ether", () => {
		const wei = from(2_000_000_000_000_000_000n);
		const ether = toEther(wei);
		expect(ether).toBe("2");
	});

	it("converts large Wei value to Ether", () => {
		const wei = from(1_000_000n * WEI_PER_ETHER);
		const ether = toEther(wei);
		expect(ether).toBe("1000000");
	});

	it("preserves fractional Ether as decimal string", () => {
		const wei = from(1_500_000_000_000_000_000n); // 1.5 ETH
		const ether = toEther(wei);
		expect(ether).toBe("1.5");
	});

	it("maintains precision for exact conversions", () => {
		const wei = from(123n * WEI_PER_ETHER);
		const ether = toEther(wei);
		expect(ether).toBe("123");
	});
});
