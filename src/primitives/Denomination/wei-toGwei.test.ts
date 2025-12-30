import { describe, expect, it } from "vitest";
import { WEI_PER_GWEI } from "./wei-constants.js";
import { from } from "./wei-from.js";
import { toGwei } from "./wei-toGwei.js";

describe("toGwei", () => {
	it("converts 1 Gwei worth of Wei to Gwei", () => {
		const wei = from(WEI_PER_GWEI);
		const gwei = toGwei(wei);
		expect(gwei).toBe("1");
	});

	it("converts 0 Wei to 0 Gwei", () => {
		const wei = from(0);
		const gwei = toGwei(wei);
		expect(gwei).toBe("0");
	});

	it("converts 5 Gwei worth of Wei to Gwei", () => {
		const wei = from(5_000_000_000n);
		const gwei = toGwei(wei);
		expect(gwei).toBe("5");
	});

	it("converts large Wei value to Gwei", () => {
		const wei = from(1_000_000_000_000_000n);
		const gwei = toGwei(wei);
		expect(gwei).toBe("1000000");
	});

	it("preserves fractional Gwei as decimal string", () => {
		const wei = from(1_500_000_000n); // 1.5 Gwei
		const gwei = toGwei(wei);
		expect(gwei).toBe("1.5");
	});

	it("maintains precision for exact conversions", () => {
		const wei = from(123n * WEI_PER_GWEI);
		const gwei = toGwei(wei);
		expect(gwei).toBe("123");
	});
});
