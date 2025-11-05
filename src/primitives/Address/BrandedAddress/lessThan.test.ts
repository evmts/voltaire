import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { lessThan } from "./lessThan.js";

describe("lessThan", () => {
	it("returns true when first address is smaller", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000001");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000002");
		expect(lessThan(addr1, addr2)).toBe(true);
	});

	it("returns false when first address is larger", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000002");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000001");
		expect(lessThan(addr1, addr2)).toBe(false);
	});

	it("returns false for identical addresses", () => {
		const addr1 = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const addr2 = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		expect(lessThan(addr1, addr2)).toBe(false);
	});

	it("returns true for zero vs non-zero", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000000");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000001");
		expect(lessThan(addr1, addr2)).toBe(true);
	});

	it("returns false for non-zero vs zero", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000001");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000000");
		expect(lessThan(addr1, addr2)).toBe(false);
	});

	it("works with Address namespace method", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000001");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000002");
		expect(Address.lessThan(addr1, addr2)).toBe(true);
	});

	it("works with instance method", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000001");
		const addr2 = Address.fromHex("0x0000000000000000000000000000000000000002");
		expect(addr1.lessThan(addr2)).toBe(true);
	});
});
