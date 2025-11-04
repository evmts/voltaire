import { describe, expect, it } from "vitest";
import { Address } from "./Address.js";
import { equals } from "./equals.js";

describe("equals", () => {
	it("returns true for identical addresses", () => {
		const addr1 = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const addr2 = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		expect(equals(addr1, addr2)).toBe(true);
	});

	it("returns true for same instance", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		expect(equals(addr, addr)).toBe(true);
	});

	it("returns false for different addresses", () => {
		const addr1 = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const addr2 = Address.fromHex(
			"0x0000000000000000000000000000000000000001",
		);
		expect(equals(addr1, addr2)).toBe(false);
	});

	it("returns false for addresses differing by single byte", () => {
		const addr1 = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const addr2 = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e4",
		);
		expect(equals(addr1, addr2)).toBe(false);
	});

	it("returns true for zero addresses", () => {
		const addr1 = Address.fromHex(
			"0x0000000000000000000000000000000000000000",
		);
		const addr2 = Address.fromHex(
			"0x0000000000000000000000000000000000000000",
		);
		expect(equals(addr1, addr2)).toBe(true);
	});

	it("returns true for max addresses", () => {
		const addr1 = Address.fromHex(
			"0xffffffffffffffffffffffffffffffffffffffff",
		);
		const addr2 = Address.fromHex(
			"0xffffffffffffffffffffffffffffffffffffffff",
		);
		expect(equals(addr1, addr2)).toBe(true);
	});

	it("works with Address namespace method", () => {
		const addr1 = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const addr2 = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		expect(Address.equals(addr1, addr2)).toBe(true);
	});

	it("works with instance method", () => {
		const addr1 = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const addr2 = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		expect(addr1.equals(addr2)).toBe(true);
	});
});
