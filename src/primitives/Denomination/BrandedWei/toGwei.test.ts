import { describe, expect, it } from "vitest";
import { WEI_PER_GWEI } from "./constants.js";
import { from } from "./from.js";
import { toGwei } from "./toGwei.js";

describe("toGwei", () => {
	it("converts 1 Gwei worth of Wei to Gwei", () => {
		const wei = from(WEI_PER_GWEI);
		const gwei = toGwei(wei);
		expect(gwei).toBe(1n);
	});

	it("converts 0 Wei to 0 Gwei", () => {
		const wei = from(0);
		const gwei = toGwei(wei);
		expect(gwei).toBe(0n);
	});

	it("converts 5 Gwei worth of Wei to Gwei", () => {
		const wei = from(5_000_000_000);
		const gwei = toGwei(wei);
		expect(gwei).toBe(5n);
	});

	it("converts large Wei value to Gwei", () => {
		const wei = from(1_000_000_000_000_000);
		const gwei = toGwei(wei);
		expect(gwei).toBe(1_000_000n);
	});

	it("truncates fractional Gwei (integer division)", () => {
		const wei = from(1_500_000_000); // 1.5 Gwei
		const gwei = toGwei(wei);
		expect(gwei).toBe(1n);
	});

	it("maintains precision for exact conversions", () => {
		const wei = from(123n * WEI_PER_GWEI);
		const gwei = toGwei(wei);
		expect(gwei).toBe(123n);
	});
});
