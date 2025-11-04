import { describe, expect, it } from "vitest";
import { Address } from "./Address.js";
import { isValid } from "./isValid.js";

describe("isValid", () => {
	it("returns true for valid hex with 0x prefix", () => {
		expect(isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(true);
	});

	it("returns true for valid hex without 0x prefix", () => {
		expect(isValid("742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(true);
	});

	it("returns true for uppercase hex", () => {
		expect(isValid("0x742D35CC6634C0532925A3B844BC9E7595F251E3")).toBe(true);
	});

	it("returns true for mixed case hex", () => {
		expect(isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")).toBe(true);
	});

	it("returns true for zero address", () => {
		expect(isValid("0x0000000000000000000000000000000000000000")).toBe(true);
	});

	it("returns true for max address", () => {
		expect(isValid("0xffffffffffffffffffffffffffffffffffffffff")).toBe(true);
	});

	it("returns false for invalid length with 0x", () => {
		expect(isValid("0x742d35cc")).toBe(false);
		expect(isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3ff")).toBe(
			false,
		);
	});

	it("returns false for invalid length without 0x", () => {
		expect(isValid("742d35cc")).toBe(false);
		expect(isValid("742d35cc6634c0532925a3b844bc9e7595f251e3ff")).toBe(false);
	});

	it("returns false for invalid hex characters", () => {
		expect(isValid("0x742d35cc6634c0532925a3b844bc9e7595f251eZ")).toBe(
			false,
		);
		expect(isValid("0x742d35cc6634c0532925a3b844bc9e7595f251eg")).toBe(
			false,
		);
	});

	it("returns false for empty string", () => {
		expect(isValid("")).toBe(false);
	});

	it("returns false for only 0x", () => {
		expect(isValid("0x")).toBe(false);
	});

	it("returns false for string with spaces", () => {
		expect(isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3 ")).toBe(
			false,
		);
		expect(isValid(" 0x742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(
			false,
		);
	});

	it("works with Address namespace method", () => {
		expect(Address.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(
			true,
		);
	});

	it("accepts addresses that can be parsed by fromHex", () => {
		const validAddresses = [
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			"0x0000000000000000000000000000000000000000",
			"0xffffffffffffffffffffffffffffffffffffffff",
		];
		for (const addr of validAddresses) {
			expect(isValid(addr)).toBe(true);
			expect(() => Address.fromHex(addr)).not.toThrow();
		}
	});
});
