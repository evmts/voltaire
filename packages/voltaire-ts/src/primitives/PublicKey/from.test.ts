import { describe, expect, it } from "vitest";
import { derivePublicKey } from "../../crypto/Secp256k1/derivePublicKey.js";
import { InvalidFormatError } from "../errors/index.js";
import { from } from "./from.js";

function bytesToHex(bytes: Uint8Array): string {
	let hex = "";
	for (const byte of bytes) {
		hex += byte.toString(16).padStart(2, "0");
	}
	return hex;
}

describe("BrandedPublicKey.from", () => {
	it("creates public key from 64 byte hex", () => {
		const privateKey = new Uint8Array(32);
		privateKey[31] = 1;
		const publicKey = derivePublicKey(privateKey);
		const hex = `0x${bytesToHex(publicKey)}`;
		const pk = from(hex);
		expect(pk).toBeInstanceOf(Uint8Array);
		expect(pk.length).toBe(64);
	});

	it("throws on invalid length", () => {
		expect(() => from("0x1234")).toThrow("Public key must be 64 bytes");
	});

	it("throws on 65 byte key with prefix", () => {
		const hex = `0x04${"04".repeat(64)}`;
		expect(() => from(hex)).toThrow("Public key must be 64 bytes");
	});

	it("throws on public key not on curve", () => {
		const hex = `0x${"00".repeat(64)}`;
		expect(() => from(hex)).toThrow(InvalidFormatError);
	});
});
