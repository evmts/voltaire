import { secp256k1 } from "@noble/curves/secp256k1.js";
import { describe, expect, it } from "vitest";
import { Secp256k1 } from "./index.js";

describe("Secp256k1.ecdh", () => {
	it("performs valid key exchange", () => {
		const alicePrivate = new Uint8Array(32);
		alicePrivate.fill(1);
		const bobPrivate = new Uint8Array(32);
		bobPrivate.fill(2);

		const alicePublic = Secp256k1.derivePublicKey(alicePrivate);
		const bobPublic = Secp256k1.derivePublicKey(bobPrivate);

		const aliceShared = Secp256k1.ecdh(alicePrivate, bobPublic);
		const bobShared = Secp256k1.ecdh(bobPrivate, alicePublic);

		expect(aliceShared).toBeInstanceOf(Uint8Array);
		expect(aliceShared.length).toBe(32);
		expect(aliceShared).toEqual(bobShared);
	});

	it("computes shared secret", () => {
		const privateKey = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			privateKey[i] = i + 1;
		}

		const publicKey = Secp256k1.derivePublicKey(privateKey);
		const sharedSecret = Secp256k1.ecdh(privateKey, publicKey);

		expect(sharedSecret).toBeInstanceOf(Uint8Array);
		expect(sharedSecret.length).toBe(32);
		expect(sharedSecret.some((b) => b !== 0)).toBe(true);
	});

	it("demonstrates symmetry (A→B == B→A)", () => {
		const privateA = new Uint8Array(32);
		privateA[31] = 7;
		const privateB = new Uint8Array(32);
		privateB[31] = 13;

		const publicA = Secp256k1.derivePublicKey(privateA);
		const publicB = Secp256k1.derivePublicKey(privateB);

		const secretAB = Secp256k1.ecdh(privateA, publicB);
		const secretBA = Secp256k1.ecdh(privateB, publicA);

		expect(secretAB).toEqual(secretBA);
	});

	it("rejects invalid public key", () => {
		const privateKey = new Uint8Array(32);
		privateKey.fill(1);

		const invalidPublic = new Uint8Array(64);
		invalidPublic.fill(0xff);

		expect(() => Secp256k1.ecdh(privateKey, invalidPublic)).toThrow();
	});

	it("throws on invalid private key length", () => {
		const invalidPrivate = new Uint8Array(16);
		const publicKey = Secp256k1.derivePublicKey(new Uint8Array(32).fill(1));

		expect(() => Secp256k1.ecdh(invalidPrivate, publicKey)).toThrow(
			"Private key must be 32 bytes",
		);
	});

	it("throws on invalid public key length", () => {
		const privateKey = new Uint8Array(32);
		privateKey.fill(1);
		const invalidPublic = new Uint8Array(32);

		expect(() => Secp256k1.ecdh(privateKey, invalidPublic)).toThrow(
			"Public key must be 64 bytes",
		);
	});

	it("produces different secrets for different key pairs", () => {
		const privateA1 = new Uint8Array(32);
		privateA1[31] = 1;
		const privateA2 = new Uint8Array(32);
		privateA2[31] = 2;
		const privateB = new Uint8Array(32);
		privateB[31] = 3;

		const publicA1 = Secp256k1.derivePublicKey(privateA1);
		const publicA2 = Secp256k1.derivePublicKey(privateA2);
		const publicB = Secp256k1.derivePublicKey(privateB);

		const secret1 = Secp256k1.ecdh(privateA1, publicB);
		const secret2 = Secp256k1.ecdh(privateA2, publicB);

		expect(secret1).not.toEqual(secret2);
	});

	it("handles zero private key rejection", () => {
		const zeroPrivate = new Uint8Array(32);
		const publicKey = Secp256k1.derivePublicKey(new Uint8Array(32).fill(1));

		expect(() => Secp256k1.ecdh(zeroPrivate, publicKey)).toThrow();
	});

	it("cross-validates with @noble/curves", () => {
		const privateKey = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			privateKey[i] = i + 1;
		}
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		// Our implementation returns x-coordinate only (32 bytes)
		const ourShared = Secp256k1.ecdh(privateKey, publicKey);

		// Noble returns uncompressed point (65 bytes: 0x04 + x + y)
		const fullPublicKey = new Uint8Array(65);
		fullPublicKey[0] = 0x04;
		fullPublicKey.set(publicKey, 1);
		const nobleShared = secp256k1.getSharedSecret(
			privateKey,
			fullPublicKey,
			false,
		);
		const nobleXCoord = nobleShared.slice(1, 33);

		expect(ourShared).toEqual(nobleXCoord);
	});

	it("getSharedSecret alias works correctly", () => {
		const privateKey = new Uint8Array(32);
		privateKey.fill(1);
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const ecdhResult = Secp256k1.ecdh(privateKey, publicKey);
		const getSharedSecretResult = Secp256k1.getSharedSecret(
			privateKey,
			publicKey,
		);

		expect(getSharedSecretResult).toEqual(ecdhResult);
		expect(getSharedSecretResult.length).toBe(32);
	});
});
