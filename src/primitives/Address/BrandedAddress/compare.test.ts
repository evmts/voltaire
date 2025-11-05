import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { compare } from "./compare.js";

describe("compare", () => {
	it("returns 0 for identical addresses", () => {
		const addr1 = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const addr2 = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		expect(compare(addr1, addr2)).toBe(0);
	});

	it("returns 0 for same instance", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		expect(compare(addr, addr)).toBe(0);
	});

	it("returns -1 when first address is smaller", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000001");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000002");
		expect(compare(addr1, addr2)).toBe(-1);
	});

	it("returns 1 when first address is larger", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000002");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000001");
		expect(compare(addr1, addr2)).toBe(1);
	});

	it("compares lexicographically from left to right", () => {
		const addr1 = Address.fromHex("0x1000000000000000000000000000000000000000");
		const addr2 = Address.fromHex("0x2000000000000000000000000000000000000000");
		expect(compare(addr1, addr2)).toBe(-1);
	});

	it("returns -1 for zero vs non-zero", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000000");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000001");
		expect(compare(addr1, addr2)).toBe(-1);
	});

	it("returns 1 for non-zero vs zero", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000001");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000000");
		expect(compare(addr1, addr2)).toBe(1);
	});

	it("returns -1 for min vs max", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000000");
		const addr2 = Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff");
		expect(compare(addr1, addr2)).toBe(-1);
	});

	it("can be used to sort addresses", () => {
		const addresses = [
			Address.fromHex("0x0000000000000000000000000000000000000003"),
			Address.fromHex("0x0000000000000000000000000000000000000001"),
			Address.fromHex("0x0000000000000000000000000000000000000002"),
		];
		addresses.sort(compare);
		expect(addresses[0]![19]).toBe(1);
		expect(addresses[1]![19]).toBe(2);
		expect(addresses[2]![19]).toBe(3);
	});

	it("works with Address namespace method", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000001");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000002");
		expect(Address.compare(addr1, addr2)).toBe(-1);
	});

	it("works with instance method", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000001");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000002");
		expect(addr1.compare(addr2)).toBe(-1);
	});
});
