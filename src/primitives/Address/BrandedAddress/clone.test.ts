import { describe, expect, it } from "vitest";
import * as Address from "../index.js";

describe("Address.clone", () => {
	it("should create a deep copy", () => {
		const addr1 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const addr2 = Address.clone(addr1);

		expect(Address.equals(addr1, addr2)).toBe(true);
		expect(addr1).not.toBe(addr2);
	});

	it("should be independent from original", () => {
		const addr1 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const addr2 = Address.clone(addr1);

		addr2[0] = 0xff;

		expect(addr1[0]).not.toBe(0xff);
		expect(Address.equals(addr1, addr2)).toBe(false);
	});

	it("should work as instance method", () => {
		const addr1 = Address.Address("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const addr2 = addr1.clone();

		expect(Address.equals(addr1, addr2)).toBe(true);
		expect(addr1).not.toBe(addr2);
	});

	it("should clone zero address", () => {
		const addr1 = Address.zero();
		const addr2 = Address.clone(addr1);

		expect(Address.equals(addr1, addr2)).toBe(true);
		expect(Address.isZero(addr2)).toBe(true);
	});
});
