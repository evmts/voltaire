import { describe, it, expect } from "vitest";
import { randomPrivateKey } from "./randomPrivateKey.js";
import { Address } from "../primitives/Address/index.ts";

describe("randomPrivateKey", () => {
	it("should generate valid Ethereum address", () => {
		const addr = randomPrivateKey();
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
	});

	it("should generate different addresses on each call", () => {
		const addr1 = randomPrivateKey();
		const addr2 = randomPrivateKey();
		expect(Address.equals(addr1, addr2)).toBe(false);
	});

	it("should generate addresses that are not zero", () => {
		const addr = randomPrivateKey();
		expect(Address.isZero(addr)).toBe(false);
	});

	it("should generate valid checksummed hex", () => {
		const addr = randomPrivateKey();
		const hex = Address.toChecksummed(addr);
		expect(hex).toMatch(/^0x[0-9a-fA-F]{40}$/);
	});

	it("should generate multiple unique addresses", () => {
		const addresses = new Set();
		for (let i = 0; i < 100; i++) {
			const addr = randomPrivateKey();
			const hex = Address.toHex(addr);
			addresses.add(hex);
		}
		// All 100 should be unique
		expect(addresses.size).toBe(100);
	});
});
