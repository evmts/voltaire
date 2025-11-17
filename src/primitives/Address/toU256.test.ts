import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { toU256 } from "./toU256.js";

describe("toU256", () => {
	it("converts Address to bigint", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const value = toU256(addr);
		expect(typeof value).toBe("bigint");
		expect(value).toBe(0x742d35cc6634c0532925a3b844bc9e7595f251e3n);
	});

	it("converts zero address to 0n", () => {
		const addr = Address.fromHex("0x0000000000000000000000000000000000000000");
		const value = toU256(addr);
		expect(value).toBe(0n);
	});

	it("converts max address", () => {
		const addr = Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff");
		const value = toU256(addr);
		expect(value).toBe((1n << 160n) - 1n);
	});

	it("preserves all 20 bytes", () => {
		const addr = Address.fromHex("0x0000000000000000000000000000000000000001");
		const value = toU256(addr);
		expect(value).toBe(1n);
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const value = Address.toU256(addr);
		expect(value).toBe(0x742d35cc6634c0532925a3b844bc9e7595f251e3n);
	});

	it("works with instance method", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const value = toU256(addr);
		expect(value).toBe(0x742d35cc6634c0532925a3b844bc9e7595f251e3n);
	});

	it("is reversible with fromNumber", () => {
		const original = 0x742d35cc6634c0532925a3b844bc9e7595f251e3n;
		const addr = Address.fromNumber(original);
		const value = toU256(addr);
		expect(value).toBe(original);
	});
});
