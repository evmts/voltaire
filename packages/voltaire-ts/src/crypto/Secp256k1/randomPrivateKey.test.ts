import { describe, expect, it } from "vitest";
import { createKeyPair } from "./createKeyPair.js";
import { derivePublicKey } from "./derivePublicKey.js";
import { isValidPrivateKey } from "./isValidPrivateKey.js";
import { randomPrivateKey } from "./randomPrivateKey.js";

describe("Secp256k1.randomPrivateKey", () => {
	it("generates 32-byte private key", () => {
		const key = randomPrivateKey();
		expect(key).toBeInstanceOf(Uint8Array);
		expect(key.length).toBe(32);
	});

	it("generates valid private key", () => {
		const key = randomPrivateKey();
		expect(isValidPrivateKey(key)).toBe(true);
	});

	it("generates different keys each time", () => {
		const key1 = randomPrivateKey();
		const key2 = randomPrivateKey();
		expect(key1).not.toEqual(key2);
	});

	it("generated key can derive public key", () => {
		const privateKey = randomPrivateKey();
		const publicKey = derivePublicKey(privateKey);
		expect(publicKey).toBeInstanceOf(Uint8Array);
		// 64 bytes = x,y coordinates (32 bytes each)
		expect(publicKey.length).toBe(64);
	});
});

describe("Secp256k1.createKeyPair", () => {
	it("generates valid key pair", () => {
		const { privateKey, publicKey } = createKeyPair();

		expect(privateKey).toBeInstanceOf(Uint8Array);
		expect(privateKey.length).toBe(32);
		expect(isValidPrivateKey(privateKey)).toBe(true);

		expect(publicKey).toBeInstanceOf(Uint8Array);
		// 64 bytes = x,y coordinates (32 bytes each)
		expect(publicKey.length).toBe(64);
	});

	it("public key matches derived from private key", () => {
		const { privateKey, publicKey } = createKeyPair();
		const derived = derivePublicKey(privateKey);
		expect(publicKey).toEqual(derived);
	});

	it("generates different pairs each time", () => {
		const pair1 = createKeyPair();
		const pair2 = createKeyPair();
		expect(pair1.privateKey).not.toEqual(pair2.privateKey);
		expect(pair1.publicKey).not.toEqual(pair2.publicKey);
	});
});
