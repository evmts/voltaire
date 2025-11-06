import { describe, expect, it } from "vitest";
import { WEI_PER_GWEI } from "./constants.js";
import { from } from "./from.js";
import { toWei } from "./toWei.js";

describe("toWei", () => {
	it("converts 1 Gwei to Wei", () => {
		const gwei = from(1);
		const wei = toWei(gwei);
		expect(wei).toBe(WEI_PER_GWEI);
	});

	it("converts 0 Gwei to 0 Wei", () => {
		const gwei = from(0);
		const wei = toWei(gwei);
		expect(wei).toBe(0n);
	});

	it("converts 5 Gwei to Wei", () => {
		const gwei = from(5);
		const wei = toWei(gwei);
		expect(wei).toBe(5_000_000_000n);
	});

	it("converts large Gwei value to Wei", () => {
		const gwei = from(1_000_000);
		const wei = toWei(gwei);
		expect(wei).toBe(1_000_000_000_000_000n);
	});

	it("converts fractional Gwei representation", () => {
		const gwei = from(123);
		const wei = toWei(gwei);
		expect(wei).toBe(123_000_000_000n);
	});

	it("maintains precision for exact conversions", () => {
		const gwei = from(789);
		const wei = toWei(gwei);
		expect(wei).toBe(789n * WEI_PER_GWEI);
	});
});
