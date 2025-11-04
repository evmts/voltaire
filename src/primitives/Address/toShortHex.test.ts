import { describe, expect, it } from "vitest";
import { Address } from "./Address.js";
import { toShortHex } from "./toShortHex.js";

describe("toShortHex", () => {
	it("shortens address with default lengths", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const short = toShortHex(addr);
		expect(short).toBe("0x742d35...51e3");
	});

	it("uses custom prefix length", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const short = toShortHex(addr, 8, 4);
		expect(short).toBe("0x742d35cc...51e3");
	});

	it("uses custom suffix length", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const short = toShortHex(addr, 6, 6);
		expect(short).toBe("0x742d35...251e3");
	});

	it("returns full hex if lengths exceed address length", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const short = toShortHex(addr, 30, 30);
		expect(short).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
	});

	it("returns full hex if prefix + suffix >= 40", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const short = toShortHex(addr, 20, 20);
		expect(short).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
	});

	it("handles zero address", () => {
		const addr = Address.zero();
		const short = toShortHex(addr);
		expect(short).toBe("0x000000...0000");
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const short = Address.toShortHex(addr);
		expect(short).toBe("0x742d35...51e3");
	});

	it("works with instance method", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const short = addr.toShortHex();
		expect(short).toBe("0x742d35...51e3");
	});

	it("includes ellipsis separator", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const short = toShortHex(addr);
		expect(short).toContain("...");
	});

	it("preserves 0x prefix", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const short = toShortHex(addr);
		expect(short.startsWith("0x")).toBe(true);
	});
});
