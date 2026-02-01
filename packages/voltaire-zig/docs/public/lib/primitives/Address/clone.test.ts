import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { clone } from "./clone.js";
import { equals } from "./equals.js";
import { isZero } from "./isZero.js";

describe("clone", () => {
	it("creates a deep copy", () => {
		const addr1 = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const addr2 = clone(addr1);

		expect(equals(addr1, addr2)).toBe(true);
		expect(addr1).not.toBe(addr2);
	});

	it("is independent from original", () => {
		const addr1 = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const addr2 = clone(addr1);

		addr2[0] = 0xff;

		expect(addr1[0]).not.toBe(0xff);
		expect(equals(addr1, addr2)).toBe(false);
	});

	it("works with namespace method", () => {
		const addr1 = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const addr2 = Address.clone(addr1);

		expect(Address.equals(addr1, addr2)).toBe(true);
		expect(addr1).not.toBe(addr2);
	});

	it("works as instance method", () => {
		const addr1 = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const addr2 = Address.clone(addr1);

		expect(Address.equals(addr1, addr2)).toBe(true);
		expect(addr1).not.toBe(addr2);
	});

	it("clones zero address", () => {
		const addr1 = Address.fromHex("0x0000000000000000000000000000000000000000");
		const addr2 = clone(addr1);

		expect(equals(addr1, addr2)).toBe(true);
		expect(isZero(addr2)).toBe(true);
	});
});
