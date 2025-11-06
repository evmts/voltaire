import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { toBytes } from "./toBytes.js";

describe("toBytes", () => {
	it("converts Address to Uint8Array", () => {
		const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const bytes = toBytes(addr);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(20);
		expect(bytes[0]).toBe(0x74);
		expect(bytes[19]).toBe(0xe3);
	});

	it("creates a new Uint8Array", () => {
		const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const bytes = toBytes(addr);

		expect(bytes).not.toBe(addr);
	});

	it("works with namespace method", () => {
		const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const bytes = Address.toBytes(addr);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(20);
	});

	it("works as instance method", () => {
		const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const bytes = Address.toBytes(addr);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(20);
	});

	it("works with zero address", () => {
		const addr = Address.fromHex("0x0000000000000000000000000000000000000000");
		const bytes = toBytes(addr);

		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.every((b) => b === 0)).toBe(true);
	});
});
