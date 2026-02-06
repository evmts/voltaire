import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { toHex } from "./toHex.js";

describe("toHex", () => {
	it("converts Address to lowercase hex string", () => {
		const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const hex = toHex(addr);
		expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
	});

	it("includes 0x prefix", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const hex = toHex(addr);
		expect(hex.startsWith("0x")).toBe(true);
	});

	it("pads bytes with leading zeros", () => {
		const addr = Address.fromHex("0x000000000000000000000000000000000000000a");
		const hex = toHex(addr);
		expect(hex).toBe("0x000000000000000000000000000000000000000a");
		expect(hex.length).toBe(42);
	});

	it("converts zero address", () => {
		const addr = Address.fromHex("0x0000000000000000000000000000000000000000");
		const hex = toHex(addr);
		expect(hex).toBe("0x0000000000000000000000000000000000000000");
	});

	it("converts max address", () => {
		const addr = Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff");
		const hex = toHex(addr);
		expect(hex).toBe("0xffffffffffffffffffffffffffffffffffffffff");
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const hex = Address.toHex(addr);
		expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
	});

	it("works with instance method", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const hex = addr.toHex();
		expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
	});

	it("is reversible with fromHex", () => {
		const original = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
		const addr = Address.fromHex(original);
		const hex = toHex(addr);
		expect(hex).toBe(original);
	});
});
