import { describe, expect, it } from "vitest";
import { Ether } from "./ether-index.js";
import { fromEther } from "./gwei-fromEther.js";

describe("fromEther", () => {
	it("converts 1 Ether to Gwei", () => {
		const ether = Ether.from("1");
		const gwei = fromEther(ether);
		expect(typeof gwei).toBe("string");
		expect(gwei).toBe("1000000000");
	});

	it("converts 0 Ether to 0 Gwei", () => {
		const ether = Ether.from("0");
		const gwei = fromEther(ether);
		expect(gwei).toBe("0");
	});

	it("converts 2 Ether to Gwei", () => {
		const ether = Ether.from("2");
		const gwei = fromEther(ether);
		expect(gwei).toBe("2000000000");
	});

	it("converts 5 Ether to Gwei", () => {
		const ether = Ether.from("5");
		const gwei = fromEther(ether);
		expect(gwei).toBe("5000000000");
	});

	it("converts large Ether value", () => {
		const ether = Ether.from("1000000");
		const gwei = fromEther(ether);
		expect(gwei).toBe("1000000000000000");
	});

	it("converts fractional Ether", () => {
		const ether = Ether.from("1.5");
		const gwei = fromEther(ether);
		expect(gwei).toBe("1500000000");
	});
});
