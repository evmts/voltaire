import { describe, expect, it } from "vitest";
import * as Address from "../index.js";

describe("Address.toBytes", () => {
	it("should convert Address to Uint8Array", () => {
		const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const bytes = Address.toBytes(addr);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(20);
		expect(bytes[0]).toBe(0x74);
		expect(bytes[19]).toBe(0xe3);
	});

	it("should create a new Uint8Array", () => {
		const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const bytes = Address.toBytes(addr);

		expect(bytes).not.toBe(addr);
	});

	it("should work as instance method", () => {
		const addr = Address.Address("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const bytes = addr.toBytes();

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(20);
	});

	it("should work with zero address", () => {
		const addr = Address.zero();
		const bytes = Address.toBytes(addr);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.every((b) => b === 0)).toBe(true);
	});
});
