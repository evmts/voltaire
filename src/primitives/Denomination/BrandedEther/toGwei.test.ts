import { describe, expect, it } from "vitest";
import { GWEI_PER_ETHER } from "./constants.js";
import { from } from "./from.js";
import { toGwei } from "./toGwei.js";

describe("toGwei", () => {
	it("converts 1 Ether to Gwei", () => {
		const ether = from(1n);
		const gwei = toGwei(ether);
		expect(typeof gwei).toBe("bigint");
		expect(gwei).toBe(1_000_000_000n);
	});

	it("converts 0 Ether to Gwei", () => {
		const ether = from(0n);
		const gwei = toGwei(ether);
		expect(gwei).toBe(0n);
	});

	it("converts multiple Ether to Gwei", () => {
		const ether = from(5n);
		const gwei = toGwei(ether);
		expect(gwei).toBe(5_000_000_000n);
	});

	it("converts fractional Ether value", () => {
		const ether = from(100n); // 100 wei as ether unit
		const gwei = toGwei(ether);
		expect(gwei).toBe(100n * GWEI_PER_ETHER);
	});

	it("converts large Ether value", () => {
		const ether = from(1_000_000n);
		const gwei = toGwei(ether);
		expect(gwei).toBe(1_000_000n * GWEI_PER_ETHER);
	});
});
