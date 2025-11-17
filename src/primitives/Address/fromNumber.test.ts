import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { fromNumber } from "./fromNumber.js";
import * as AddressNamespace from "./index.js";

describe("fromNumber", () => {
	it("creates Address from small number", () => {
		const addr = fromNumber(42);
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
		expect(addr[19]).toBe(42);
	});

	it("creates Address from bigint", () => {
		const value = 0x742d35cc6634c0532925a3b844bc9e7595f251e3n;
		const addr = fromNumber(value);
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr[0]).toBe(0x74);
		expect(addr[1]).toBe(0x2d);
	});

	it("creates Address from zero", () => {
		const addr = fromNumber(0);
		expect(addr.every((b) => b === 0)).toBe(true);
	});

	it("truncates values larger than 160 bits", () => {
		const value = (1n << 200n) + 42n;
		const addr = fromNumber(value);
		expect(addr[19]).toBe(42);
	});

	it("throws on negative number", () => {
		expect(() => fromNumber(-1)).toThrow(AddressNamespace.InvalidValueError);
	});

	it("throws on negative bigint", () => {
		expect(() => fromNumber(-1n)).toThrow(AddressNamespace.InvalidValueError);
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromNumber(42);
		expect(addr[19]).toBe(42);
	});

	it("works as factory wrapper", () => {
		const addr = Address.fromNumber(42);
		expect(addr.toHex).toBeDefined();
	});
});
