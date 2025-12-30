import { describe, expect, it } from "vitest";
import type { WeiType as BrandedWei } from "./WeiType.js";
import { WEI_PER_GWEI } from "./gwei-constants.js";
import { fromWei } from "./gwei-fromWei.js";

describe("fromWei", () => {
	it("converts 1 billion Wei to 1 Gwei", () => {
		const wei = 1_000_000_000n as BrandedWei;
		const gwei = fromWei(wei);
		expect(typeof gwei).toBe("string");
		expect(gwei).toBe("1");
	});

	it("converts 0 Wei to 0 Gwei", () => {
		const wei = 0n as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe("0");
	});

	it("converts 5 billion Wei to 5 Gwei", () => {
		const wei = 5_000_000_000n as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe("5");
	});

	it("converts 10 billion Wei to 10 Gwei", () => {
		const wei = 10_000_000_000n as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe("10");
	});

	it("converts large Wei value", () => {
		const wei = 1_000_000_000_000_000n as BrandedWei;
		const gwei = fromWei(wei);
		expect(gwei).toBe("1000000");
	});

	it("preserves fractional Gwei", () => {
		const wei = (123n * WEI_PER_GWEI + 500_000_000n) as BrandedWei; // 123.5 Gwei
		const gwei = fromWei(wei);
		expect(gwei).toBe("123.5");
	});
});
