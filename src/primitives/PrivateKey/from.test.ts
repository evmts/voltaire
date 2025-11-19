import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("BrandedPrivateKey.from", () => {
	it("creates private key from 32 byte hex", () => {
		const hex =
			"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
		const pk = from(hex);
		expect(pk).toBeInstanceOf(Uint8Array);
		expect(pk.length).toBe(32);
	});

	it("throws on invalid length", () => {
		expect(() => from("0x1234")).toThrow("Private key must be 32 bytes");
	});

	it("creates from padded hex", () => {
		const hex =
			"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
		const pk = from(hex);
		expect(pk.length).toBe(32);
	});
});
