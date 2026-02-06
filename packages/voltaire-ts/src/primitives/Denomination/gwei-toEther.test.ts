import { describe, expect, it } from "vitest";
import { from } from "./gwei-from.js";
import { toEther } from "./gwei-toEther.js";

describe("toEther", () => {
	it("converts 1 Ether worth of Gwei to Ether", () => {
		const gwei = from("1000000000");
		const ether = toEther(gwei);
		expect(ether).toBe("1");
	});

	it("converts 0 Gwei to 0 Ether", () => {
		const gwei = from("0");
		const ether = toEther(gwei);
		expect(ether).toBe("0");
	});

	it("converts 2 Ether worth of Gwei to Ether", () => {
		const gwei = from("2000000000");
		const ether = toEther(gwei);
		expect(ether).toBe("2");
	});

	it("converts large Gwei value to Ether", () => {
		const gwei = from("1000000000000000");
		const ether = toEther(gwei);
		expect(ether).toBe("1000000");
	});

	it("preserves fractional Ether as decimal string", () => {
		const gwei = from("1500000000"); // 1.5 ETH
		const ether = toEther(gwei);
		expect(ether).toBe("1.5");
	});

	it("maintains precision for exact conversions", () => {
		const gwei = from("123000000000");
		const ether = toEther(gwei);
		expect(ether).toBe("123");
	});
});
