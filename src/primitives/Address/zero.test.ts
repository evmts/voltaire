import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { zero } from "./zero.js";

describe("zero", () => {
	it("creates zero address", () => {
		const addr = zero();
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
		expect(addr.every((b) => b === 0)).toBe(true);
	});

	it("creates new instance each time", () => {
		const addr1 = zero();
		const addr2 = zero();
		expect(addr1).not.toBe(addr2);
		addr1[0] = 1;
		expect(addr2[0]).toBe(0);
	});

	it("is recognized as zero by isZero", () => {
		const addr = zero();
		expect(Address.isZero(addr)).toBe(true);
	});

	it("converts to zero hex", () => {
		const addr = zero();
		expect(Address.toHex(addr)).toBe(
			"0x0000000000000000000000000000000000000000",
		);
	});

	it("converts to zero bigint", () => {
		const addr = zero();
		expect(Address.toU256(addr)).toBe(0n);
	});

	it("works with Address namespace method", () => {
		const addr = Address.zero();
		expect(addr.every((b) => b === 0)).toBe(true);
	});

	it("creates valid Address instance", () => {
		const addr = zero();
		expect(Address.is(addr)).toBe(true);
	});
});
