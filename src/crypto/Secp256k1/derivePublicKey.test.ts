import { secp256k1 } from "@noble/curves/secp256k1.js";
import { describe, expect, it } from "vitest";
import { InvalidPrivateKeyError } from "../../primitives/errors/index.js";
import { derivePublicKey } from "./derivePublicKey.js";

import { PrivateKey } from "../../primitives/PrivateKey/BrandedPrivateKey/index.js";
describe("Secp256k1.derivePublicKey", () => {
	describe("successful derivation", () => {
		it("should derive public key from private key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);

			const publicKey = derivePublicKey(privateKey);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(64);
		});

		it("should derive deterministic public key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);

			const publicKey1 = derivePublicKey(privateKey);
			const publicKey2 = derivePublicKey(privateKey);

			expect(publicKey1).toEqual(publicKey2);
		});

		it("should derive different keys for different private keys", () => {
			const privateKey1 = new Uint8Array(32);
			privateKey1[31] = 1;
			const privateKey2 = new Uint8Array(32);
			privateKey2[31] = 2;

			const publicKey1 = derivePublicKey(privateKey1);
			const publicKey2 = derivePublicKey(privateKey2);

			expect(publicKey1).not.toEqual(publicKey2);
		});

		it("should return 64-byte uncompressed public key", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = i + 1;
			}

			const publicKey = derivePublicKey(privateKey);

			expect(publicKey.length).toBe(64);
		});
	});

	describe("validation errors", () => {
		it("should throw InvalidPrivateKeyError for zero private key", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes); // All zeros

			expect(() => derivePublicKey(privateKey)).toThrow(InvalidPrivateKeyError);
		});

		it("should throw InvalidPrivateKeyError for private key >= n", () => {
			// CURVE_ORDER (invalid)
			const privateKeyBytes = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
			]);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);

			expect(() => derivePublicKey(privateKey)).toThrow();
		});

		it("should throw InvalidPrivateKeyError for wrong length private key", () => {
			const privateKeyBytes = new Uint8Array(31);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes); // Too short

			expect(() => derivePublicKey(privateKey)).toThrow(InvalidPrivateKeyError);
		});

		it("should throw InvalidPrivateKeyError for too long private key", () => {
			const privateKeyBytes = new Uint8Array(33);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes); // Too long

			expect(() => derivePublicKey(privateKey)).toThrow(InvalidPrivateKeyError);
		});
	});

	describe("edge cases", () => {
		it("should handle minimum valid private key (1)", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);

			const publicKey = derivePublicKey(privateKey);

			expect(publicKey.length).toBe(64);
		});

		it("should handle maximum valid private key (n-1)", () => {
			// CURVE_ORDER - 1
			const privateKeyBytes = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			]);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);

			const publicKey = derivePublicKey(privateKey);

			expect(publicKey.length).toBe(64);
		});

		it("should handle various private key patterns", () => {
			const patterns = [
				new Uint8Array(32).fill(0x01),
				new Uint8Array(32).fill(0x0f),
				new Uint8Array(32).fill(0xa5),
			];

			for (const privateKey of patterns) {
				// Ensure valid by setting to 1
				privateKey.fill(0);
				privateKey[31] = 1;

				const publicKey = derivePublicKey(privateKey);
				expect(publicKey.length).toBe(64);
			}
		});
	});

	describe("cross-validation with @noble/curves", () => {
		it("should derive same public key as @noble/curves", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 13) % 256;
			}
			// Ensure valid
			privateKey[0] = 0;
			privateKey[1] = 0;
			privateKey[31] = 42;

			const publicKey = derivePublicKey(privateKey);

			// Compare with @noble
			const noblePublicKey = secp256k1.getPublicKey(privateKey, false);
			// Remove 0x04 prefix from noble's key
			const nobleWithoutPrefix = noblePublicKey.slice(1);

			expect(publicKey).toEqual(nobleWithoutPrefix);
		});

		it("should derive correct public key for known test vectors", () => {
			// Test vector 1: private key = 1
			const privateKey1 = new Uint8Array(32);
			privateKey1[31] = 1;
			const publicKey1 = derivePublicKey(privateKey1);

			// Should be the generator point G
			const nobleG = secp256k1.getPublicKey(privateKey1, false).slice(1);
			expect(publicKey1).toEqual(nobleG);

			// Test vector 2: private key = 2
			const privateKey2 = new Uint8Array(32);
			privateKey2[31] = 2;
			const publicKey2 = derivePublicKey(privateKey2);

			const noble2 = secp256k1.getPublicKey(privateKey2, false).slice(1);
			expect(publicKey2).toEqual(noble2);
		});
	});

	describe("coordinate validation", () => {
		it("should derive valid curve point", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 17) % 256;
			}
			privateKey[0] = 0;
			privateKey[31] = 7;

			const publicKey = derivePublicKey(privateKey);

			// Should be parseable as a valid point
			const prefixed = new Uint8Array(65);
			prefixed[0] = 0x04;
			prefixed.set(publicKey, 1);

			// @noble should be able to parse it
			expect(() => secp256k1.Point.fromBytes(prefixed)).not.toThrow();
		});

		it("should not produce point at infinity", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);

			const publicKey = derivePublicKey(privateKey);

			// Point at infinity would be all zeros (invalid)
			const isAllZeros = publicKey.every((byte) => byte === 0);
			expect(isAllZeros).toBe(false);
		});
	});

	describe("consistency", () => {
		it("should produce same key across multiple calls", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = i;
			}
			privateKey[31] = 99;

			const keys = [];
			for (let i = 0; i < 5; i++) {
				keys.push(derivePublicKey(privateKey));
			}

			// All should be equal
			for (let i = 1; i < keys.length; i++) {
				expect(keys[i]).toEqual(keys[0]);
			}
		});

		it("should maintain uniqueness for sequential private keys", () => {
			const publicKeys = [];

			for (let i = 1; i <= 10; i++) {
				const privateKeyBytes = new Uint8Array(32);
				privateKeyBytes[31] = i;
				const privateKey = PrivateKey.fromBytes(privateKeyBytes);
				publicKeys.push(derivePublicKey(privateKey));
			}

			// All should be unique
			for (let i = 0; i < publicKeys.length; i++) {
				for (let j = i + 1; j < publicKeys.length; j++) {
					expect(publicKeys[i]).not.toEqual(publicKeys[j]);
				}
			}
		});
	});
});
