import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { isZero } from "./isZero.js";

describe("isZero", () => {
	it("returns true for zero address", () => {
		const addr = Address.fromHex("0x0000000000000000000000000000000000000000");
		expect(isZero(addr)).toBe(true);
	});

	it("returns false for non-zero address", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		expect(isZero(addr)).toBe(false);
	});

	it("returns false for address with single non-zero byte", () => {
		const addr = Address.fromHex("0x0000000000000000000000000000000000000001");
		expect(isZero(addr)).toBe(false);
	});

	it("returns false for max address", () => {
		const addr = Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff");
		expect(isZero(addr)).toBe(false);
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex("0x0000000000000000000000000000000000000000");
		expect(Address.isZero(addr)).toBe(true);
	});

	it("works with instance method", () => {
		const addr = Address.fromHex("0x0000000000000000000000000000000000000000");
		expect(addr.isZero()).toBe(true);
	});
});
