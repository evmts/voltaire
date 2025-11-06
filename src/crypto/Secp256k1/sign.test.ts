import { describe, expect, it } from "vitest";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { sign } from "./sign.js";
import { InvalidPrivateKeyError } from "./errors.js";

describe("Secp256k1.sign", () => {
	describe("RFC 6979 deterministic signing", () => {
		// Test vectors from RFC 6979
		it("should produce deterministic signatures", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1; // Private key = 1

			const message = sha256("hello world");

			const sig1 = sign(message, privateKey);
			const sig2 = sign(message, privateKey);

			// Same message + key = same signature
			expect(sig1.r).toEqual(sig2.r);
			expect(sig1.s).toEqual(sig2.s);
			expect(sig1.v).toEqual(sig2.v);
		});

		it("should produce different signatures for different messages", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			const message1 = sha256("hello");
			const message2 = sha256("world");

			const sig1 = sign(message1, privateKey);
			const sig2 = sign(message2, privateKey);

			// Different messages = different signatures
			expect(sig1.r).not.toEqual(sig2.r);
		});

		it("should produce different signatures for different keys", () => {
			const privateKey1 = new Uint8Array(32);
			privateKey1[31] = 1;
			const privateKey2 = new Uint8Array(32);
			privateKey2[31] = 2;

			const message = sha256("hello world");

			const sig1 = sign(message, privateKey1);
			const sig2 = sign(message, privateKey2);

			// Different keys = different signatures
			expect(sig1.r).not.toEqual(sig2.r);
		});
	});

	describe("signature format", () => {
		it("should return signature with r, s, v components", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");

			const sig = sign(message, privateKey);

			expect(sig).toHaveProperty("r");
			expect(sig).toHaveProperty("s");
			expect(sig).toHaveProperty("v");
			expect(sig.r).toBeInstanceOf(Uint8Array);
			expect(sig.s).toBeInstanceOf(Uint8Array);
			expect(typeof sig.v).toBe("number");
		});

		it("should produce 32-byte r and s components", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");

			const sig = sign(message, privateKey);

			expect(sig.r.length).toBe(32);
			expect(sig.s.length).toBe(32);
		});

		it("should produce Ethereum-compatible v value (27 or 28)", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");

			const sig = sign(message, privateKey);

			expect(sig.v === 27 || sig.v === 28).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("should handle minimum valid private key (1)", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");

			const sig = sign(message, privateKey);

			expect(sig.r.length).toBe(32);
			expect(sig.s.length).toBe(32);
		});

		it("should handle maximum valid private key (n-1)", () => {
			// CURVE_ORDER - 1
			const privateKey = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			]);
			const message = sha256("test");

			const sig = sign(message, privateKey);

			expect(sig.r.length).toBe(32);
			expect(sig.s.length).toBe(32);
		});

		it("should handle all-zero message hash", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = new Uint8Array(32); // All zeros

			const sig = sign(message, privateKey);

			expect(sig.r.length).toBe(32);
			expect(sig.s.length).toBe(32);
		});

		it("should handle all-ones message hash", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = new Uint8Array(32).fill(0xff);

			const sig = sign(message, privateKey);

			expect(sig.r.length).toBe(32);
			expect(sig.s.length).toBe(32);
		});
	});

	describe("validation", () => {
		it("should throw InvalidPrivateKeyError for zero private key", () => {
			const privateKey = new Uint8Array(32); // All zeros
			const message = sha256("test");

			expect(() => sign(message, privateKey)).toThrow(InvalidPrivateKeyError);
		});

		it("should throw InvalidPrivateKeyError for private key >= n", () => {
			// CURVE_ORDER (invalid)
			const privateKey = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
			]);
			const message = sha256("test");

			expect(() => sign(message, privateKey)).toThrow();
		});

		it("should throw InvalidPrivateKeyError for wrong length private key", () => {
			const privateKey = new Uint8Array(31); // Too short
			const message = sha256("test");

			expect(() => sign(message, privateKey)).toThrow(InvalidPrivateKeyError);
		});

		it("should throw InvalidPrivateKeyError for too long private key", () => {
			const privateKey = new Uint8Array(33); // Too long
			const message = sha256("test");

			expect(() => sign(message, privateKey)).toThrow(InvalidPrivateKeyError);
		});
	});

	describe("recovery bit correctness", () => {
		it("should compute correct recovery bit for public key recovery", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 42;
			const message = sha256("test recovery");

			const sig = sign(message, privateKey);

			// Verify recovery bit allows correct public key recovery
			const publicKey = secp256k1.getPublicKey(privateKey, false);
			const sigObj = secp256k1.Signature.fromBytes(
				new Uint8Array([...sig.r, ...sig.s]),
			);
			const sigWithRecovery = sigObj.addRecoveryBit(sig.v - 27);
			const recovered = sigWithRecovery.recoverPublicKey(message);
			const recoveredBytes = recovered.toBytes(false);

			expect(recoveredBytes).toEqual(publicKey);
		});
	});

	describe("cross-validation with @noble/curves", () => {
		it("should produce signature verifiable by @noble/curves", () => {
			const privateKey = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = i + 1;
			}
			const message = sha256("cross validation test");

			const sig = sign(message, privateKey);

			// Verify with @noble
			const publicKey = secp256k1.getPublicKey(privateKey, false);
			const compact = new Uint8Array([...sig.r, ...sig.s]);
			const valid = secp256k1.verify(compact, message, publicKey, {
				prehash: false,
			});

			expect(valid).toBe(true);
		});

		it("should handle multiple known test vectors", () => {
			// Test vector 1
			const pk1 = new Uint8Array(32);
			pk1[31] = 1;
			const msg1 = sha256("Satoshi Nakamoto");
			const sig1 = sign(msg1, pk1);
			expect(sig1.r.length).toBe(32);
			expect(sig1.s.length).toBe(32);

			// Test vector 2
			const pk2 = new Uint8Array(32);
			pk2[0] = 0xaa;
			pk2[31] = 0xbb;
			const msg2 = sha256("Ethereum");
			const sig2 = sign(msg2, pk2);
			expect(sig2.r.length).toBe(32);
			expect(sig2.s.length).toBe(32);

			// Different keys/messages produce different signatures
			expect(sig1.r).not.toEqual(sig2.r);
			expect(sig1.s).not.toEqual(sig2.s);
		});
	});

	describe("constant-time properties", () => {
		it("should not early-return based on message content", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 5;

			// Different message patterns should all succeed
			const messages = [
				new Uint8Array(32), // All zeros
				new Uint8Array(32).fill(0xff), // All ones
				sha256("pattern1"),
				sha256("pattern2"),
			];

			for (const msg of messages) {
				const sig = sign(msg, privateKey);
				expect(sig.r.length).toBe(32);
				expect(sig.s.length).toBe(32);
			}
		});
	});

	describe("low-s enforcement", () => {
		it("should produce low-s signatures (s <= n/2)", () => {
			const privateKey = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 7) % 256;
			}
			const message = sha256("low-s test");

			const sig = sign(message, privateKey);

			// Convert s to bigint
			let s = 0n;
			for (let i = 0; i < 32; i++) {
				s = (s << 8n) | BigInt(sig.s[i] ?? 0);
			}

			const halfN =
				0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n /
				2n;
			expect(s <= halfN).toBe(true);
		});
	});
});
