import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { toAbiEncoded } from "./toAbiEncoded.js";

describe("toAbiEncoded", () => {
	it("encodes address to 32 bytes", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const encoded = toAbiEncoded(addr);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(32);
	});

	it("pads with 12 leading zero bytes", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const encoded = toAbiEncoded(addr);
		for (let i = 0; i < 12; i++) {
			expect(encoded[i]).toBe(0);
		}
	});

	it("places address in last 20 bytes", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const encoded = toAbiEncoded(addr);
		expect(encoded[12]).toBe(0x74);
		expect(encoded[13]).toBe(0x2d);
		expect(encoded[31]).toBe(0xe3);
	});

	it("encodes zero address", () => {
		const addr = Address.zero();
		const encoded = toAbiEncoded(addr);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("encodes max address", () => {
		const addr = Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff");
		const encoded = toAbiEncoded(addr);
		// First 12 bytes should be zero
		for (let i = 0; i < 12; i++) {
			expect(encoded[i]).toBe(0);
		}
		// Last 20 bytes should be 0xff
		for (let i = 12; i < 32; i++) {
			expect(encoded[i]).toBe(0xff);
		}
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const encoded = Address.toAbiEncoded(addr);
		expect(encoded.length).toBe(32);
	});

	it("works with instance method", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const encoded = addr.toAbiEncoded();
		expect(encoded.length).toBe(32);
	});

	it("is reversible with fromAbiEncoded", () => {
		const original = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const encoded = toAbiEncoded(original);
		const decoded = Address.fromAbiEncoded(encoded);
		expect(Address.equals(decoded, original)).toBe(true);
	});

	it("creates independent copy", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const encoded = toAbiEncoded(addr);
		addr[0] = 0xff;
		expect(encoded[12]).toBe(0x74);
	});
});
