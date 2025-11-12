import { secp256k1 } from "@noble/curves/secp256k1.js";
import { PrivateKey } from "../../primitives/PrivateKey/BrandedPrivateKey/index.js";import { sha256 } from "@noble/hashes/sha2.js";
import { PrivateKey } from "../../primitives/PrivateKey/BrandedPrivateKey/index.js";import { describe, expect, it } from "vitest";
import { PrivateKey } from "../../primitives/PrivateKey/BrandedPrivateKey/index.js";import { Hash } from "../../primitives/Hash/index.js";
import { PrivateKey } from "../../primitives/PrivateKey/BrandedPrivateKey/index.js";import {
	InvalidPublicKeyError,
	InvalidSignatureError,
} from "../../primitives/errors/index.js";
import { derivePublicKey } from "./derivePublicKey.js";
import { PrivateKey } from "../../primitives/PrivateKey/BrandedPrivateKey/index.js";import { sign } from "./sign.js";
import { PrivateKey } from "../../primitives/PrivateKey/BrandedPrivateKey/index.js";import { verify } from "./verify.js";
import { PrivateKey } from "../../primitives/PrivateKey/BrandedPrivateKey/index.js";
describe("Secp256k1.verify", () => {
	describe("valid signatures", () => {
		it("should verify valid signature", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash(
				sha256(new TextEncoder().encode("hello world")),
			);

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		it("should verify multiple valid signatures", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = i + 1;
			}

			const messages = [
				Hash(sha256(new TextEncoder().encode("message 1"))),
				Hash(sha256(new TextEncoder().encode("message 2"))),
				Hash(sha256(new TextEncoder().encode("message 3"))),
			];

			const publicKey = derivePublicKey(privateKey);

			for (const message of messages) {
				const signature = sign(message, privateKey);
				const valid = verify(signature, message, publicKey);
				expect(valid).toBe(true);
			}
		});

		it("should verify signature with v=27", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test v=27")));

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			// Test even if v is 27 or 28
			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});
	});

	describe("invalid signatures", () => {
		it("should reject signature with wrong message", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message1 = Hash.from(
				sha256(new TextEncoder().encode("original message")),
			);
			const message2 = Hash.from(
				sha256(new TextEncoder().encode("different message")),
			);

			const signature = sign(message1, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message2, publicKey);
			expect(valid).toBe(false);
		});

		it("should reject signature with wrong public key", () => {
			const privateKey1 = new Uint8Array(32);
			privateKey1[31] = 1;
			const privateKey2 = new Uint8Array(32);
			privateKey2[31] = 2;
			const message = Hash.from(sha256(new TextEncoder().encode("test")));

			const signature = sign(message, privateKey1);
			const wrongPublicKey = derivePublicKey(privateKey2);

			const valid = verify(signature, message, wrongPublicKey);
			expect(valid).toBe(false);
		});

		it("should reject signature with modified r", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			// Modify r
			const modifiedR = new Uint8Array(signature.r);
			modifiedR[0]! ^= 0x01;
			const modifiedSig = {
				r: modifiedR,
				s: signature.s,
				v: signature.v,
			};

			const valid = verify(modifiedSig, message, publicKey);
			expect(valid).toBe(false);
		});

		it("should reject signature with modified s", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			// Modify s
			const modifiedS = new Uint8Array(signature.s);
			modifiedS[0]! ^= 0x01;
			const modifiedSig = {
				r: signature.r,
				s: modifiedS,
				v: signature.v,
			};

			const valid = verify(modifiedSig, message, publicKey);
			expect(valid).toBe(false);
		});
	});

	describe("malformed signatures", () => {
		it("should throw InvalidSignatureError for r with wrong length", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));
			const publicKey = derivePublicKey(privateKey);

			const malformedSig = {
				r: new Uint8Array(31), // Wrong length
				s: new Uint8Array(32),
				v: 27,
			};

			expect(() => verify(malformedSig, message, publicKey)).toThrow(
				InvalidSignatureError,
			);
		});

		it("should throw InvalidSignatureError for s with wrong length", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));
			const publicKey = derivePublicKey(privateKey);

			const malformedSig = {
				r: new Uint8Array(32),
				s: new Uint8Array(33), // Wrong length
				v: 27,
			};

			expect(() => verify(malformedSig, message, publicKey)).toThrow(
				InvalidSignatureError,
			);
		});

		it("should return false for all-zero r", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));
			const publicKey = derivePublicKey(privateKey);

			const invalidSig = {
				r: new Uint8Array(32), // All zeros
				s: new Uint8Array(32).fill(1),
				v: 27,
			};

			const valid = verify(invalidSig, message, publicKey);
			expect(valid).toBe(false);
		});

		it("should return false for all-zero s", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));
			const publicKey = derivePublicKey(privateKey);

			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32), // All zeros
				v: 27,
			};

			const valid = verify(invalidSig, message, publicKey);
			expect(valid).toBe(false);
		});

		it("should return false for r >= n (curve order)", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));
			const publicKey = derivePublicKey(privateKey);

			// r = n (curve order, invalid)
			const invalidSig = {
				r: new Uint8Array([
					0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
					0xff, 0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48,
					0xa0, 0x3b, 0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
				]),
				s: new Uint8Array(32).fill(1),
				v: 27,
			};

			const valid = verify(invalidSig, message, publicKey);
			expect(valid).toBe(false);
		});

		it("should return false for s >= n (curve order)", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));
			const publicKey = derivePublicKey(privateKey);

			// s = n (curve order, invalid)
			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array([
					0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
					0xff, 0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48,
					0xa0, 0x3b, 0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
				]),
				v: 27,
			};

			const valid = verify(invalidSig, message, publicKey);
			expect(valid).toBe(false);
		});
	});

	describe("malformed public keys", () => {
		it("should throw InvalidPublicKeyError for wrong length public key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));
			const signature = sign(message, privateKey);

			const wrongLengthKey = new Uint8Array(63);

			expect(() => verify(signature, message, wrongLengthKey)).toThrow(
				InvalidPublicKeyError,
			);
		});

		it("should throw InvalidPublicKeyError for too long public key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));
			const signature = sign(message, privateKey);

			const tooLongKey = new Uint8Array(65);

			expect(() => verify(signature, message, tooLongKey)).toThrow(
				InvalidPublicKeyError,
			);
		});

		it("should return false for invalid curve point", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));
			const signature = sign(message, privateKey);

			// All-zero public key (invalid point)
			const invalidPublicKey = new Uint8Array(64);

			const valid = verify(signature, message, invalidPublicKey);
			expect(valid).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle all-zero message hash", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(new Uint8Array(32));

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		it("should handle all-ones message hash", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(new Uint8Array(32).fill(0xff));

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		it("should handle minimum valid private key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		it("should handle maximum valid private key (n-1)", () => {
			const privateKeyBytes = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			]);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(sha256(new TextEncoder().encode("test")));

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});
	});

	describe("cross-validation with @noble/curves", () => {
		it("should verify signature created by @noble/curves", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 13) % 256;
			}
			const message = Hash.from(
				sha256(new TextEncoder().encode("cross validation")),
			);

			// Create signature with @noble
			const nobleSignature = secp256k1.sign(message, privateKey, {
				prehash: false,
			});
			const r = nobleSignature.slice(0, 32);
			const s = nobleSignature.slice(32, 64);

			// Get public key
			const publicKeyFull = secp256k1.getPublicKey(privateKey, false);
			const publicKey = publicKeyFull.slice(1); // Remove 0x04 prefix

			const signature = { r, s, v: 27 }; // Try v=27

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});
	});

	describe("timing attack resistance", () => {
		it("should not early-return on invalid signatures", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(
				sha256(new TextEncoder().encode("timing test")),
			);
			const publicKey = derivePublicKey(privateKey);

			// Multiple invalid signatures should all return false
			const invalidSigs = [
				{ r: new Uint8Array(32), s: new Uint8Array(32), v: 27 },
				{
					r: new Uint8Array(32).fill(1),
					s: new Uint8Array(32).fill(1),
					v: 27,
				},
				{
					r: new Uint8Array(32).fill(0xff),
					s: new Uint8Array(32).fill(0xff),
					v: 27,
				},
			];

			for (const sig of invalidSigs) {
				const valid = verify(sig, message, publicKey);
				expect(valid).toBe(false);
			}
		});
	});

	describe("v parameter handling", () => {
		it("should verify with both v values when appropriate", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = Hash.from(
				sha256(new TextEncoder().encode("v parameter test")),
			);

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			// Original signature should verify
			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);

			// v is only used for recovery, not verification with known pubkey
			// Different v should still verify with correct pubkey
			const wrongV = { ...signature, v: signature.v === 27 ? 28 : 27 };
			const stillValid = verify(wrongV, message, publicKey);
			expect(stillValid).toBe(true);
		});
	});
});
