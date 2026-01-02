import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";

describe("fromAbiEncoded", () => {
	it("decodes ABI-encoded address from 32 bytes", () => {
		const encoded = new Uint8Array(32);
		// Set last 20 bytes to address
		for (let i = 0; i < 20; i++) {
			encoded[12 + i] = i + 1;
		}
		const addr = fromAbiEncoded(encoded);
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
		expect(addr[0]).toBe(1);
		expect(addr[19]).toBe(20);
	});

	it("throws on non-zero leading padding bytes", () => {
		const encoded = new Uint8Array(32);
		// Fill padding with non-zero values
		for (let i = 0; i < 12; i++) {
			encoded[i] = 0xff;
		}
		// Set address bytes
		for (let i = 12; i < 32; i++) {
			encoded[i] = 0;
		}
		expect(() => fromAbiEncoded(encoded)).toThrow(
			"ABI-encoded Address must have leading 12 bytes as zeros",
		);
	});

	it("throws when any leading byte is non-zero", () => {
		// Test first byte non-zero
		const encoded1 = new Uint8Array(32);
		encoded1[0] = 1;
		expect(() => fromAbiEncoded(encoded1)).toThrow(
			"ABI-encoded Address must have leading 12 bytes as zeros",
		);

		// Test last padding byte (index 11) non-zero
		const encoded2 = new Uint8Array(32);
		encoded2[11] = 1;
		expect(() => fromAbiEncoded(encoded2)).toThrow(
			"ABI-encoded Address must have leading 12 bytes as zeros",
		);

		// Test middle padding byte non-zero
		const encoded3 = new Uint8Array(32);
		encoded3[5] = 0x42;
		expect(() => fromAbiEncoded(encoded3)).toThrow(
			"ABI-encoded Address must have leading 12 bytes as zeros",
		);
	});

	it("accepts valid ABI encoding with zero padding", () => {
		const encoded = new Uint8Array(32);
		// First 12 bytes are zeros by default
		// Set address bytes
		for (let i = 12; i < 32; i++) {
			encoded[i] = i - 11;
		}
		const addr = fromAbiEncoded(encoded);
		expect(addr.length).toBe(20);
		expect(addr[0]).toBe(1);
	});

	it("extracts address from known ABI encoding", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const encoded = Address.toAbiEncoded(addr);
		const decoded = fromAbiEncoded(encoded);
		expect(Address.equals(decoded, addr)).toBe(true);
	});

	it("throws on invalid length", () => {
		expect(() => fromAbiEncoded(new Uint8Array(20))).toThrow(
			"ABI-encoded Address must be exactly 32 bytes",
		);
		expect(() => fromAbiEncoded(new Uint8Array(31))).toThrow(
			"ABI-encoded Address must be exactly 32 bytes",
		);
		expect(() => fromAbiEncoded(new Uint8Array(33))).toThrow(
			"ABI-encoded Address must be exactly 32 bytes",
		);
	});

	it("throws on empty array", () => {
		expect(() => fromAbiEncoded(new Uint8Array(0))).toThrow();
	});

	it("works with Address namespace method", () => {
		const encoded = new Uint8Array(32);
		for (let i = 12; i < 32; i++) {
			encoded[i] = i - 11;
		}
		const addr = Address.fromAbiEncoded(encoded);
		expect(addr.length).toBe(20);
	});

	it("works as factory wrapper", () => {
		const encoded = new Uint8Array(32);
		for (let i = 12; i < 32; i++) {
			encoded[i] = 1;
		}
		const addr = Address.fromAbiEncoded(encoded);
		expect(addr.toHex).toBeDefined();
	});

	it("is reversible with toAbiEncoded", () => {
		const original = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const encoded = Address.toAbiEncoded(original);
		const decoded = fromAbiEncoded(encoded);
		expect(Address.equals(decoded, original)).toBe(true);
	});
});
