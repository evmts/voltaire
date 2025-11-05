import { describe, expect, it } from "vitest";
import type { BrandedGwei } from "../BrandedGwei/BrandedGwei.js";
import { WEI_PER_GWEI } from "./constants.js";
import { fromGwei } from "./fromGwei.js";

describe("fromGwei", () => {
	it("converts 1 Gwei to Wei", () => {
		const gwei = 1n as BrandedGwei;
		const wei = fromGwei(gwei);
		expect(wei).toBe(WEI_PER_GWEI);
	});

	it("converts 0 Gwei to 0 Wei", () => {
		const gwei = 0n as BrandedGwei;
		const wei = fromGwei(gwei);
		expect(wei).toBe(0n);
	});

	it("converts 5 Gwei to Wei", () => {
		const gwei = 5n as BrandedGwei;
		const wei = fromGwei(gwei);
		expect(wei).toBe(5_000_000_000n);
	});

	it("converts fractional Gwei (10 Gwei)", () => {
		const gwei = 10n as BrandedGwei;
		const wei = fromGwei(gwei);
		expect(wei).toBe(10_000_000_000n);
	});

	it("converts large Gwei value", () => {
		const gwei = 1_000_000n as BrandedGwei;
		const wei = fromGwei(gwei);
		expect(wei).toBe(1_000_000_000_000_000n);
	});

	it("maintains precision", () => {
		const gwei = 123n as BrandedGwei;
		const wei = fromGwei(gwei);
		expect(wei).toBe(123n * WEI_PER_GWEI);
	});
});
