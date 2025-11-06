import { describe, expect, it } from "vitest";
import { BrandedGwei } from "../BrandedGwei/index.js";
import { fromGwei } from "./fromGwei.js";

describe("fromGwei", () => {
	it("converts 1 Gwei to Ether", () => {
		const gwei = BrandedGwei.from(1_000_000_000n);
		const ether = fromGwei(gwei);
		expect(typeof ether).toBe("bigint");
		expect(ether).toBe(1n);
	});

	it("converts 0 Gwei to Ether", () => {
		const gwei = BrandedGwei.from(0n);
		const ether = fromGwei(gwei);
		expect(ether).toBe(0n);
	});

	it("converts multiple Gwei to Ether", () => {
		const gwei = BrandedGwei.from(5_000_000_000n);
		const ether = fromGwei(gwei);
		expect(ether).toBe(5n);
	});

	it("truncates fractional Ether", () => {
		const gwei = BrandedGwei.from(1_500_000_000n); // 1.5 ETH
		const ether = fromGwei(gwei);
		expect(ether).toBe(1n); // Truncates to 1
	});

	it("converts large Gwei value", () => {
		const gwei = BrandedGwei.from(1_000_000_000_000n);
		const ether = fromGwei(gwei);
		expect(ether).toBe(1_000n);
	});
});
