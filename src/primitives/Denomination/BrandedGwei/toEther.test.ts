import { describe, expect, it } from "vitest";
import { GWEI_PER_ETHER } from "./constants.js";
import { from } from "./from.js";
import { toEther } from "./toEther.js";

describe("toEther", () => {
	it("converts 1 Ether worth of Gwei to Ether", () => {
		const gwei = from(GWEI_PER_ETHER);
		const ether = toEther(gwei);
		expect(ether).toBe(1n);
	});

	it("converts 0 Gwei to 0 Ether", () => {
		const gwei = from(0);
		const ether = toEther(gwei);
		expect(ether).toBe(0n);
	});

	it("converts 2 Ether worth of Gwei to Ether", () => {
		const gwei = from(2_000_000_000);
		const ether = toEther(gwei);
		expect(ether).toBe(2n);
	});

	it("converts large Gwei value to Ether", () => {
		const gwei = from(1_000_000n * GWEI_PER_ETHER);
		const ether = toEther(gwei);
		expect(ether).toBe(1_000_000n);
	});

	it("truncates fractional Ether (integer division)", () => {
		const gwei = from(1_500_000_000); // 1.5 ETH
		const ether = toEther(gwei);
		expect(ether).toBe(1n);
	});

	it("maintains precision for exact conversions", () => {
		const gwei = from(123n * GWEI_PER_ETHER);
		const ether = toEther(gwei);
		expect(ether).toBe(123n);
	});
});
