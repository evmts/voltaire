import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("BrandedPublicKey.from", () => {
	it("creates public key from 64 byte hex", () => {
		const hex =
			"0x" + "04".repeat(64); // 64 bytes
		const pk = from(hex);
		expect(pk).toBeInstanceOf(Uint8Array);
		expect(pk.length).toBe(64);
	});

	it("throws on invalid length", () => {
		expect(() => from("0x1234")).toThrow("Public key must be 64 bytes");
	});

	it("throws on 65 byte key with prefix", () => {
		const hex = "0x04" + "04".repeat(64);
		expect(() => from(hex)).toThrow("Public key must be 64 bytes");
	});
});
