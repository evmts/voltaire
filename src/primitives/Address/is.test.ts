import { describe, expect, it } from "vitest";
import { Address } from "./Address.js";
import { is } from "./is.js";

describe("is", () => {
	it("returns true for valid Address", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		expect(is(addr)).toBe(true);
	});

	it("returns true for zero address", () => {
		const addr = Address.zero();
		expect(is(addr)).toBe(true);
	});

	it("returns false for wrong length Uint8Array", () => {
		expect(is(new Uint8Array(19))).toBe(false);
		expect(is(new Uint8Array(21))).toBe(false);
		expect(is(new Uint8Array(32))).toBe(false);
	});

	it("returns false for empty array", () => {
		expect(is(new Uint8Array(0))).toBe(false);
	});

	it("returns false for string", () => {
		expect(is("0x742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(false);
	});

	it("returns false for number", () => {
		expect(is(42)).toBe(false);
		expect(is(0)).toBe(false);
	});

	it("returns false for bigint", () => {
		expect(is(42n)).toBe(false);
	});

	it("returns false for null", () => {
		expect(is(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(is(undefined)).toBe(false);
	});

	it("returns false for object", () => {
		expect(is({})).toBe(false);
		expect(is({ length: 20 })).toBe(false);
	});

	it("returns false for regular array", () => {
		expect(is(new Array(20).fill(0))).toBe(false);
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		expect(Address.is(addr)).toBe(true);
	});

	it("can be used as type guard", () => {
		const value: unknown = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		if (is(value)) {
			expect(value.length).toBe(20);
		}
	});
});
