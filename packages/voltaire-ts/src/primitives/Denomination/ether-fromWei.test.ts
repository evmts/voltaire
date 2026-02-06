import { describe, expect, it } from "vitest";
import { fromWei } from "./ether-fromWei.js";
import { Wei } from "./wei-index.js";

describe("fromWei", () => {
	it("converts 1 Ether in Wei to 1 Ether", () => {
		const wei = Wei.from(1_000_000_000_000_000_000n);
		const ether = fromWei(wei);
		expect(typeof ether).toBe("string");
		expect(ether).toBe("1");
	});

	it("converts 0 Wei to 0 Ether", () => {
		const wei = Wei.from(0);
		const ether = fromWei(wei);
		expect(ether).toBe("0");
	});

	it("converts 5 Ether in Wei to 5 Ether", () => {
		const wei = Wei.from(5_000_000_000_000_000_000n);
		const ether = fromWei(wei);
		expect(ether).toBe("5");
	});

	it("converts 10 Ether in Wei to 10 Ether", () => {
		const wei = Wei.from(10_000_000_000_000_000_000n);
		const ether = fromWei(wei);
		expect(ether).toBe("10");
	});

	it("converts large Wei value", () => {
		const wei = Wei.from(1_000_000_000_000_000_000_000_000n);
		const ether = fromWei(wei);
		expect(ether).toBe("1000000");
	});

	it("preserves fractional Ether", () => {
		const wei = Wei.from(1_500_000_000_000_000_000n); // 1.5 ETH
		const ether = fromWei(wei);
		expect(ether).toBe("1.5"); // Preserves as decimal string
	});
});
