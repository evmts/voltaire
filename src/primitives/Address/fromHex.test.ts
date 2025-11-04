import { describe, expect, it } from "vitest";
import { Address } from "./Address.js";
import * as AddressNamespace from "./index.js";
import { fromHex } from "./fromHex.js";

describe("fromHex", () => {
	it("converts valid lowercase hex to Address", () => {
		const addr = fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
	});

	it("converts valid uppercase hex to Address", () => {
		const addr = fromHex("0x742D35CC6634C0532925A3B844BC9E7595F251E3");
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
	});

	it("converts valid mixed case hex to Address", () => {
		const addr = fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
	});

	it("converts zero address", () => {
		const addr = fromHex("0x0000000000000000000000000000000000000000");
		expect(addr.every((b) => b === 0)).toBe(true);
	});

	it("converts max address", () => {
		const addr = fromHex("0xffffffffffffffffffffffffffffffffffffffff");
		expect(addr.every((b) => b === 255)).toBe(true);
	});

	it("parses hex correctly", () => {
		const addr = fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		expect(addr[0]).toBe(0x74);
		expect(addr[1]).toBe(0x2d);
		expect(addr[19]).toBe(0xe3);
	});

	it("throws on missing 0x prefix", () => {
		expect(() => fromHex("742d35cc6634c0532925a3b844bc9e7595f251e3")).toThrow(
			AddressNamespace.InvalidHexFormatError,
		);
	});

	it("throws on invalid length - too short", () => {
		expect(() => fromHex("0x742d35cc")).toThrow(
			AddressNamespace.InvalidHexFormatError,
		);
	});

	it("throws on invalid length - too long", () => {
		expect(() =>
			fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3ff"),
		).toThrow(AddressNamespace.InvalidHexFormatError);
	});

	it("throws on invalid hex characters", () => {
		expect(() =>
			fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251eZ"),
		).toThrow(AddressNamespace.InvalidHexStringError);
	});

	it("throws on hex with spaces", () => {
		expect(() =>
			fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3 "),
		).toThrow(AddressNamespace.InvalidHexFormatError);
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		expect(addr[0]).toBe(0x74);
	});

	it("creates new instances", () => {
		const addr1 = fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const addr2 = fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		expect(addr1).not.toBe(addr2);
	});
});
