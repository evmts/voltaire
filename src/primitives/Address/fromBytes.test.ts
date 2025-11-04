import { describe, expect, it } from "vitest";
import { Address } from "./Address.js";
import * as AddressNamespace from "./index.js";
import { fromBytes } from "./fromBytes.js";

describe("fromBytes", () => {
	it("creates Address from 20-byte array", () => {
		const bytes = new Uint8Array(20);
		bytes[0] = 0x74;
		bytes[1] = 0x2d;
		const addr = fromBytes(bytes);
		expect(addr[0]).toBe(0x74);
		expect(addr[1]).toBe(0x2d);
		expect(addr.length).toBe(20);
	});

	it("creates copy of input bytes", () => {
		const bytes = new Uint8Array(20);
		const addr = fromBytes(bytes);
		bytes[0] = 0xff;
		expect(addr[0]).toBe(0);
	});

	it("creates Address from zero bytes", () => {
		const bytes = new Uint8Array(20);
		const addr = fromBytes(bytes);
		expect(addr.every((b) => b === 0)).toBe(true);
	});

	it("creates Address from max bytes", () => {
		const bytes = new Uint8Array(20).fill(0xff);
		const addr = fromBytes(bytes);
		expect(addr.every((b) => b === 0xff)).toBe(true);
	});

	it("throws on length 19", () => {
		expect(() => fromBytes(new Uint8Array(19))).toThrow(
			AddressNamespace.InvalidAddressLengthError,
		);
	});

	it("throws on length 21", () => {
		expect(() => fromBytes(new Uint8Array(21))).toThrow(
			AddressNamespace.InvalidAddressLengthError,
		);
	});

	it("throws on empty array", () => {
		expect(() => fromBytes(new Uint8Array(0))).toThrow(
			AddressNamespace.InvalidAddressLengthError,
		);
	});

	it("throws on length 32", () => {
		expect(() => fromBytes(new Uint8Array(32))).toThrow(
			AddressNamespace.InvalidAddressLengthError,
		);
	});

	it("works with Address namespace method", () => {
		const bytes = new Uint8Array(20);
		bytes[0] = 0x74;
		const addr = Address.fromBytes(bytes);
		expect(addr[0]).toBe(0x74);
	});

	it("preserves all bytes", () => {
		const bytes = new Uint8Array(20);
		for (let i = 0; i < 20; i++) {
			bytes[i] = i + 1;
		}
		const addr = fromBytes(bytes);
		for (let i = 0; i < 20; i++) {
			expect(addr[i]).toBe(i + 1);
		}
	});
});
