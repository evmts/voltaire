import { describe, expect, it } from "vitest";
import { WEI_PER_ETHER, WEI_PER_GWEI } from "./constants.js";

describe("constants", () => {
	describe("WEI_PER_GWEI", () => {
		it("equals 10^9", () => {
			expect(WEI_PER_GWEI).toBe(1_000_000_000n);
		});

		it("is a bigint", () => {
			expect(typeof WEI_PER_GWEI).toBe("bigint");
		});
	});

	describe("WEI_PER_ETHER", () => {
		it("equals 10^18", () => {
			expect(WEI_PER_ETHER).toBe(1_000_000_000_000_000_000n);
		});

		it("is a bigint", () => {
			expect(typeof WEI_PER_ETHER).toBe("bigint");
		});

		it("equals WEI_PER_GWEI * 10^9", () => {
			expect(WEI_PER_ETHER).toBe(WEI_PER_GWEI * 1_000_000_000n);
		});
	});
});
