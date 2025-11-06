import { describe, expect, it } from "vitest";
import type { BrandedWei } from "../BrandedWei/BrandedWei.js";
import { WEI_PER_GWEI } from "./constants.js";
import { fromWei } from "./fromWei.js";

describe("fromWei", () => {
	it("converts 1 billion Wei to 1 Gwei", () => {
		const wei = 1_000_000_000n as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe(1n);
	});

	it("converts 0 Wei to 0 Gwei", () => {
		const wei = 0n as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe(0n);
	});

	it("converts 5 billion Wei to 5 Gwei", () => {
		const wei = 5_000_000_000n as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe(5n);
	});

	it("converts 10 billion Wei to 10 Gwei", () => {
		const wei = 10_000_000_000n as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe(10n);
	});

	it("converts large Wei value", () => {
		const wei = 1_000_000_000_000_000n as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe(1_000_000n);
	});

	it("maintains precision", () => {
		const wei = (123n * WEI_PER_GWEI) as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe(123n);
	});
});
