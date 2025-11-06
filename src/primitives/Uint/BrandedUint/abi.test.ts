/**
 * Tests for Uint ABI encoding/decoding
 */

import { describe, expect, it } from "vitest";
import * as Uint from "./index.js";

// ============================================================================
// toAbiEncoded Tests
// ============================================================================

describe("Uint.toAbiEncoded", () => {
	it("encodes zero to 32 zero bytes", () => {
		const encoded = Uint.toAbiEncoded(Uint.ZERO);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("encodes small value correctly", () => {
		const value = Uint.from(255);
		const encoded = Uint.toAbiEncoded(value);
		expect(encoded.length).toBe(32);
		expect(encoded[31]).toBe(0xff);
		expect(encoded[30]).toBe(0x00);
	});

	it("encodes MAX correctly", () => {
		const encoded = Uint.toAbiEncoded(Uint.MAX);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0xff)).toBe(true);
	});

	it("encodes in big-endian format", () => {
		const value = Uint.from(0x0102030405060708n);
		const encoded = Uint.toAbiEncoded(value);
		expect(encoded.length).toBe(32);
		// Big-endian: most significant byte first
		expect(encoded[24]).toBe(0x01);
		expect(encoded[25]).toBe(0x02);
		expect(encoded[26]).toBe(0x03);
		expect(encoded[27]).toBe(0x04);
		expect(encoded[28]).toBe(0x05);
		expect(encoded[29]).toBe(0x06);
		expect(encoded[30]).toBe(0x07);
		expect(encoded[31]).toBe(0x08);
	});

	it("is identical to toBytes", () => {
		const value = Uint.from(123456789);
		const abiEncoded = Uint.toAbiEncoded(value);
		const bytes = Uint.toBytes(value);
		expect(abiEncoded).toEqual(bytes);
	});

	it("encodes ONE correctly", () => {
		const encoded = Uint.toAbiEncoded(Uint.ONE);
		expect(encoded.length).toBe(32);
		expect(encoded[31]).toBe(0x01);
		for (let i = 0; i < 31; i++) {
			expect(encoded[i]).toBe(0x00);
		}
	});

	it("encodes large value correctly", () => {
		const value = Uint.from(2n ** 128n);
		const encoded = Uint.toAbiEncoded(value);
		expect(encoded.length).toBe(32);
		expect(encoded[16]).toBe(0x01);
		for (let i = 17; i < 32; i++) {
			expect(encoded[i]).toBe(0x00);
		}
	});
});

// ============================================================================
// fromAbiEncoded Tests
// ============================================================================

describe("Uint.fromAbiEncoded", () => {
	it("decodes 32 zero bytes to zero", () => {
		const bytes = new Uint8Array(32);
		const value = Uint.fromAbiEncoded(bytes);
		expect(value).toBe(0n);
	});

	it("decodes small value correctly", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 0xff;
		const value = Uint.fromAbiEncoded(bytes);
		expect(value).toBe(255n);
	});

	it("decodes MAX correctly", () => {
		const bytes = new Uint8Array(32);
		bytes.fill(0xff);
		const value = Uint.fromAbiEncoded(bytes);
		expect(value).toBe(Uint.MAX);
	});

	it("decodes big-endian format", () => {
		const bytes = new Uint8Array(32);
		bytes[24] = 0x01;
		bytes[25] = 0x02;
		bytes[26] = 0x03;
		bytes[27] = 0x04;
		bytes[28] = 0x05;
		bytes[29] = 0x06;
		bytes[30] = 0x07;
		bytes[31] = 0x08;
		const value = Uint.fromAbiEncoded(bytes);
		expect(value).toBe(0x0102030405060708n);
	});

	it("throws on bytes shorter than 32", () => {
		const bytes = new Uint8Array(31);
		expect(() => Uint.fromAbiEncoded(bytes)).toThrow(
			"must be exactly 32 bytes",
		);
	});

	it("throws on bytes longer than 32", () => {
		const bytes = new Uint8Array(33);
		expect(() => Uint.fromAbiEncoded(bytes)).toThrow(
			"must be exactly 32 bytes",
		);
	});

	it("throws on empty bytes", () => {
		const bytes = new Uint8Array(0);
		expect(() => Uint.fromAbiEncoded(bytes)).toThrow(
			"must be exactly 32 bytes",
		);
	});

	it("decodes ONE correctly", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 0x01;
		const value = Uint.fromAbiEncoded(bytes);
		expect(value).toBe(1n);
	});

	it("decodes large value correctly", () => {
		const bytes = new Uint8Array(32);
		bytes[16] = 0x01;
		const value = Uint.fromAbiEncoded(bytes);
		expect(value).toBe(2n ** 128n);
	});
});

// ============================================================================
// Roundtrip Tests
// ============================================================================

describe("Uint ABI roundtrip", () => {
	it("roundtrips zero", () => {
		const original = Uint.ZERO;
		const encoded = Uint.toAbiEncoded(original);
		const decoded = Uint.fromAbiEncoded(encoded);
		expect(decoded).toBe(original);
	});

	it("roundtrips ONE", () => {
		const original = Uint.ONE;
		const encoded = Uint.toAbiEncoded(original);
		const decoded = Uint.fromAbiEncoded(encoded);
		expect(decoded).toBe(original);
	});

	it("roundtrips MAX", () => {
		const original = Uint.MAX;
		const encoded = Uint.toAbiEncoded(original);
		const decoded = Uint.fromAbiEncoded(encoded);
		expect(decoded).toBe(original);
	});

	it("roundtrips small value", () => {
		const original = Uint.from(12345);
		const encoded = Uint.toAbiEncoded(original);
		const decoded = Uint.fromAbiEncoded(encoded);
		expect(decoded).toBe(original);
	});

	it("roundtrips large value", () => {
		const original = Uint.from(2n ** 200n);
		const encoded = Uint.toAbiEncoded(original);
		const decoded = Uint.fromAbiEncoded(encoded);
		expect(decoded).toBe(original);
	});

	it("roundtrips random values", () => {
		const testValues = [
			0xdeadbeefn,
			0x123456789abcdefn,
			2n ** 64n - 1n,
			2n ** 128n - 1n,
			2n ** 255n,
		];

		for (const bigint of testValues) {
			const original = Uint.from(bigint);
			const encoded = Uint.toAbiEncoded(original);
			const decoded = Uint.fromAbiEncoded(encoded);
			expect(decoded).toBe(original);
		}
	});

	it("maintains exact byte representation", () => {
		const original = Uint.from(0xff00ff00ff00ff00n);
		const encoded = Uint.toAbiEncoded(original);
		const decoded = Uint.fromAbiEncoded(encoded);
		const reEncoded = Uint.toAbiEncoded(decoded);
		expect(reEncoded).toEqual(encoded);
	});
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Uint ABI integration", () => {
	it("encodes result of arithmetic operation", () => {
		const a = Uint.from(100);
		const b = Uint.from(200);
		const sum = Uint.plus(a, b);
		const encoded = Uint.toAbiEncoded(sum);
		expect(encoded.length).toBe(32);
		expect(encoded[31]).toBe(0x2c);
		expect(encoded[30]).toBe(0x01);
	});

	it("decodes and performs operation", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 0x64;
		const value = Uint.fromAbiEncoded(bytes);
		const doubled = Uint.times(value, Uint.from(2));
		expect(doubled).toBe(200n);
	});

	it("handles multiple encode/decode cycles", () => {
		let value = Uint.from(42);
		for (let i = 0; i < 10; i++) {
			const encoded = Uint.toAbiEncoded(value);
			value = Uint.fromAbiEncoded(encoded);
		}
		expect(value).toBe(42n);
	});

	it("works with toHex conversion", () => {
		const value = Uint.from(255);
		const encoded = Uint.toAbiEncoded(value);
		const decoded = Uint.fromAbiEncoded(encoded);
		const hex = Uint.toHex(decoded, false);
		expect(hex).toBe("0xff");
	});

	it("works with fromHex conversion", () => {
		const value = Uint.fromHex("0xff");
		const encoded = Uint.toAbiEncoded(value);
		const decoded = Uint.fromAbiEncoded(encoded);
		expect(decoded).toBe(255n);
	});
});
