import { describe, expect, it } from "vitest";
import type { BrandedEther } from "../BrandedEther/BrandedEther.js";
import { GWEI_PER_ETHER } from "./constants.js";
import { fromEther } from "./fromEther.js";

describe("fromEther", () => {
	it("converts 1 Ether to Gwei", () => {
		const ether = 1n as BrandedEther;
		const gwei = fromEther(ether);
		expect(gwei).toBe(GWEI_PER_ETHER);
	});

	it("converts 0 Ether to 0 Gwei", () => {
		const ether = 0n as BrandedEther;
		const gwei = fromEther(ether);
		expect(gwei).toBe(0n);
	});

	it("converts 2 Ether to Gwei", () => {
		const ether = 2n as BrandedEther;
		const gwei = fromEther(ether);
		expect(gwei).toBe(2_000_000_000n);
	});

	it("converts 5 Ether to Gwei", () => {
		const ether = 5n as BrandedEther;
		const gwei = fromEther(ether);
		expect(gwei).toBe(5_000_000_000n);
	});

	it("converts large Ether value", () => {
		const ether = 1_000_000n as BrandedEther;
		const gwei = fromEther(ether);
		expect(gwei).toBe(1_000_000n * GWEI_PER_ETHER);
	});

	it("maintains precision", () => {
		const ether = 123n as BrandedEther;
		const gwei = fromEther(ether);
		expect(gwei).toBe(123n * GWEI_PER_ETHER);
	});
});
