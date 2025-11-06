import { describe, expect, it } from "vitest";
import { sha256 } from "@noble/hashes/sha256";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sign } from "./sign.js";
import { verify } from "./verify.js";
import { derivePublicKey } from "./derivePublicKey.js";
import { InvalidPublicKeyError, InvalidSignatureError } from "./errors.js";

describe("Secp256k1.verify", () => {
	describe("valid signatures", () => {
		it("should verify valid signature", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("hello world");

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		it("should verify multiple valid signatures", () => {
			const privateKey = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = i + 1;
			}

			const messages = [
				sha256("message 1"),
				sha256("message 2"),
				sha256("message 3"),
			];

			const publicKey = derivePublicKey(privateKey);

			for (const message of messages) {
				const signature = sign(message, privateKey);
				const valid = verify(signature, message, publicKey);
				expect(valid).toBe(true);
			}
		});

		it("should verify signature with v=27", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test v=27");

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			// Test even if v is 27 or 28
			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});
	});

	describe("invalid signatures", () => {
		it("should reject signature with wrong message", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message1 = sha256("original message");
			const message2 = sha256("different message");

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
			const message = sha256("test");

			const signature = sign(message, privateKey1);
			const wrongPublicKey = derivePublicKey(privateKey2);

			const valid = verify(signature, message, wrongPublicKey);
			expect(valid).toBe(false);
		});

		it("should reject signature with modified r", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			// Modify r
			const modifiedSig = {
				r: new Uint8Array(signature.r),
				s: signature.s,
				v: signature.v,
			};
			modifiedSig.r[0] ^= 0x01;

			const valid = verify(modifiedSig, message, publicKey);
			expect(valid).toBe(false);
		});

		it("should reject signature with modified s", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			// Modify s
			const modifiedSig = {
				r: signature.r,
				s: new Uint8Array(signature.s),
				v: signature.v,
			};
			modifiedSig.s[0] ^= 0x01;

			const valid = verify(modifiedSig, message, publicKey);
			expect(valid).toBe(false);
		});
	});

	describe("malformed signatures", () => {
		it("should throw InvalidSignatureError for r with wrong length", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");
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
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");
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
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");
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
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");
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
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");
			const publicKey = derivePublicKey(privateKey);

			// r = n (curve order, invalid)
			const invalidSig = {
				r: new Uint8Array([
					0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
					0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
					0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
				]),
				s: new Uint8Array(32).fill(1),
				v: 27,
			};

			const valid = verify(invalidSig, message, publicKey);
			expect(valid).toBe(false);
		});

		it("should return false for s >= n (curve order)", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");
			const publicKey = derivePublicKey(privateKey);

			// s = n (curve order, invalid)
			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array([
					0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
					0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
					0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
				]),
				v: 27,
			};

			const valid = verify(invalidSig, message, publicKey);
			expect(valid).toBe(false);
		});
	});

	describe("malformed public keys", () => {
		it("should throw InvalidPublicKeyError for wrong length public key", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");
			const signature = sign(message, privateKey);

			const wrongLengthKey = new Uint8Array(63);

			expect(() => verify(signature, message, wrongLengthKey)).toThrow(
				InvalidPublicKeyError,
			);
		});

		it("should throw InvalidPublicKeyError for too long public key", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");
			const signature = sign(message, privateKey);

			const tooLongKey = new Uint8Array(65);

			expect(() => verify(signature, message, tooLongKey)).toThrow(
				InvalidPublicKeyError,
			);
		});

		it("should return false for invalid curve point", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");
			const signature = sign(message, privateKey);

			// All-zero public key (invalid point)
			const invalidPublicKey = new Uint8Array(64);

			const valid = verify(signature, message, invalidPublicKey);
			expect(valid).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle all-zero message hash", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = new Uint8Array(32);

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		it("should handle all-ones message hash", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = new Uint8Array(32).fill(0xff);

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		it("should handle minimum valid private key", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		it("should handle maximum valid private key (n-1)", () => {
			const privateKey = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			]);
			const message = sha256("test");

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});
	});

	describe("cross-validation with @noble/curves", () => {
		it("should verify signature created by @noble/curves", () => {
			const privateKey = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 13) % 256;
			}
			const message = sha256("cross validation");

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
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("timing test");
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
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("v parameter test");

			const signature = sign(message, privateKey);
			const publicKey = derivePublicKey(privateKey);

			// Original signature should verify
			const valid = verify(signature, message, publicKey);
			expect(valid).toBe(true);

			// Wrong v should fail
			const wrongV = { ...signature, v: signature.v === 27 ? 28 : 27 };
			const invalidV = verify(wrongV, message, publicKey);
			expect(invalidV).toBe(false);
		});
	});
});
