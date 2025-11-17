import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { from } from "./from.js";
import * as AddressNamespace from "./index.js";

describe("from", () => {
	describe("from hex string", () => {
		it("creates Address from hex string", () => {
			const addr = from("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("throws on invalid hex", () => {
			expect(() => from("0x742d35cc")).toThrow();
		});
	});

	describe("from number", () => {
		it("creates Address from number", () => {
			const addr = from(42);
			expect(addr[19]).toBe(42);
		});

		it("creates Address from bigint", () => {
			const addr = from(0x742d35cc6634c0532925a3b844bc9e7595f251e3n);
			expect(addr[0]).toBe(0x74);
		});

		it("throws on negative number", () => {
			expect(() => from(-1)).toThrow(AddressNamespace.InvalidValueError);
		});
	});

	describe("from bytes", () => {
		it("creates Address from Uint8Array", () => {
			const bytes = new Uint8Array(20);
			bytes[0] = 0x74;
			const addr = from(bytes);
			expect(addr[0]).toBe(0x74);
		});

		it("throws on wrong length", () => {
			expect(() => from(new Uint8Array(19))).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});
	});

	describe("unsupported types", () => {
		it("throws on null", () => {
			expect(() => from(null as any)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});

		it("throws on undefined", () => {
			expect(() => from(undefined as any)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});

		it("throws on object", () => {
			expect(() => from({} as any)).toThrow(AddressNamespace.InvalidValueError);
		});

		it("throws on boolean", () => {
			expect(() => from(true as any)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});
	});

	it("works with Address factory", () => {
		const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		expect(addr[0]).toBe(0x74);
	});

	it("works with Address namespace method", () => {
		const addr = Address.from("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		expect(addr[0]).toBe(0x74);
	});

	it("handles all supported input types", () => {
		const hex = from("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const num = from(0x742d35cc6634c0532925a3b844bc9e7595f251e3n);
		const bytes = from(new Uint8Array(hex));
		expect(Address.equals(hex, num)).toBe(true);
		expect(Address.equals(hex, bytes)).toBe(true);
	});
});
