import { describe, it, expect } from "vitest";
import { toBytes } from "./toBytes.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { ZERO, ONE, MAX } from "./constants.js";

describe("Uint64.toBytes", () => {
	it("converts zero to 8 zero bytes", () => {
		const result = toBytes(ZERO);
		expect(result).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]));
	});

	it("converts one", () => {
		const result = toBytes(ONE);
		expect(result).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]));
	});

	it("converts 255", () => {
		const result = toBytes(from(255n));
		expect(result).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255]));
	});

	it("converts 256", () => {
		const result = toBytes(from(256n));
		expect(result).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 1, 0]));
	});

	it("converts MAX", () => {
		const result = toBytes(MAX);
		expect(result).toEqual(
			new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]),
		);
	});

	it("converts 0xdeadbeef", () => {
		const result = toBytes(from(0xdeadbeefn));
		expect(result).toEqual(
			new Uint8Array([0, 0, 0, 0, 0xde, 0xad, 0xbe, 0xef]),
		);
	});

	it("always returns 8 bytes", () => {
		expect(toBytes(ZERO).length).toBe(8);
		expect(toBytes(ONE).length).toBe(8);
		expect(toBytes(MAX).length).toBe(8);
		expect(toBytes(from(12345n)).length).toBe(8);
	});

	it("big-endian byte order", () => {
		const result = toBytes(from(0x0102030405060708n));
		expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
	});

	it("round-trips with fromBytes", () => {
		const original = from(123456789n);
		const bytes = toBytes(original);
		expect(fromBytes(bytes)).toBe(original);
	});
});
