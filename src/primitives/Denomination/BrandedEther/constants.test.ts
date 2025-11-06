import { describe, expect, it } from "vitest";
import { WEI_PER_ETHER, GWEI_PER_ETHER } from "./constants.js";

describe("constants", () => {
	describe("WEI_PER_ETHER", () => {
		it("equals 10^18", () => {
			expect(WEI_PER_ETHER).toBe(1_000_000_000_000_000_000n);
		});

		it("is a bigint", () => {
			expect(typeof WEI_PER_ETHER).toBe("bigint");
		});
	});

	describe("GWEI_PER_ETHER", () => {
		it("equals 10^9", () => {
			expect(GWEI_PER_ETHER).toBe(1_000_000_000n);
		});

		it("is a bigint", () => {
			expect(typeof GWEI_PER_ETHER).toBe("bigint");
		});
	});

	it("WEI_PER_ETHER = GWEI_PER_ETHER * WEI_PER_GWEI relationship holds", () => {
		const WEI_PER_GWEI = 1_000_000_000n;
		expect(WEI_PER_ETHER).toBe(GWEI_PER_ETHER * WEI_PER_GWEI);
	});
});
