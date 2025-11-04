import { describe, expect, it } from "bun:test";
import * as Hash from "../primitives/Hash/Hash.js";
import { P256 } from "./p256.js";

describe("P256", () => {
	describe("Key Generation", () => {
		it("derivePublicKey should generate valid 64-byte public key", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const publicKey = P256.derivePublicKey(privateKey);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(64);
		});

		it("derivePublicKey should be deterministic", () => {
			const privateKey = new Uint8Array(32).fill(42);
			const publicKey1 = P256.derivePublicKey(privateKey);
			const publicKey2 = P256.derivePublicKey(privateKey);

			expect(publicKey1).toEqual(publicKey2);
		});

		it("derivePublicKey should throw for invalid key length", () => {
			const invalidKey = new Uint8Array(31);
			expect(() => P256.derivePublicKey(invalidKey)).toThrow();
		});
	});

	describe("Signing", () => {
		it("sign should produce valid signature", () => {
			const privateKey = new Uint8Array(32).fill(1);
			const messageHash = Hash.keccak256String("test message");

			const signature = P256.sign(messageHash, privateKey);

			expect(signature.r).toBeInstanceOf(Uint8Array);
			expect(signature.s).toBeInstanceOf(Uint8Array);
			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
		});

		it("sign should be deterministic", () => {
			const privateKey = new Uint8Array(32).fill(2);
			const messageHash = Hash.keccak256String("test");

			const sig1 = P256.sign(messageHash, privateKey);
			const sig2 = P256.sign(messageHash, privateKey);

			expect(sig1.r).toEqual(sig2.r);
			expect(sig1.s).toEqual(sig2.s);
		});

		it("sign should throw for invalid private key length", () => {
			const invalidKey = new Uint8Array(16);
			const messageHash = Hash.keccak256String("test");

			expect(() => P256.sign(messageHash, invalidKey)).toThrow();
		});
	});

	describe("Verification", () => {
		it("verify should accept valid signature", () => {
			const privateKey = new Uint8Array(32).fill(3);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("hello world");

			const signature = P256.sign(messageHash, privateKey);
			const valid = P256.verify(signature, messageHash, publicKey);

			expect(valid).toBe(true);
		});

		it("verify should reject signature with wrong message", () => {
			const privateKey = new Uint8Array(32).fill(4);
			const publicKey = P256.derivePublicKey(privateKey);
			const messageHash = Hash.keccak256String("original");

			const signature = P256.sign(messageHash, privateKey);
			const wrongHash = Hash.keccak256String("modified");
			const valid = P256.verify(signature, wrongHash, publicKey);

			expect(valid).toBe(false);
		});

		it("verify should reject signature with wrong public key", () => {
			const privateKey1 = new Uint8Array(32).fill(5);
			const privateKey2 = new Uint8Array(32).fill(6);
			const publicKey2 = P256.derivePublicKey(privateKey2);
			const messageHash = Hash.keccak256String("test");

			const signature = P256.sign(messageHash, privateKey1);
			const valid = P256.verify(signature, messageHash, publicKey2);

			expect(valid).toBe(false);
		});

		it("verify should throw for invalid public key length", () => {
			const privateKey = new Uint8Array(32).fill(7);
			const messageHash = Hash.keccak256String("test");
			const signature = P256.sign(messageHash, privateKey);
			const invalidPubKey = new Uint8Array(32);

			expect(() =>
				P256.verify(signature, messageHash, invalidPubKey),
			).toThrow();
		});
	});

	describe("ECDH", () => {
		it("ecdh should produce 32-byte shared secret", () => {
			const privateKey1 = new Uint8Array(32).fill(8);
			const privateKey2 = new Uint8Array(32).fill(9);
			const publicKey2 = P256.derivePublicKey(privateKey2);

			const shared = P256.ecdh(privateKey1, publicKey2);

			expect(shared).toBeInstanceOf(Uint8Array);
			expect(shared.length).toBe(32);
		});

		it("ecdh should be symmetric", () => {
			const privateKey1 = new Uint8Array(32).fill(10);
			const privateKey2 = new Uint8Array(32).fill(11);
			const publicKey1 = P256.derivePublicKey(privateKey1);
			const publicKey2 = P256.derivePublicKey(privateKey2);

			const shared1 = P256.ecdh(privateKey1, publicKey2);
			const shared2 = P256.ecdh(privateKey2, publicKey1);

			expect(shared1).toEqual(shared2);
		});

		it("ecdh should throw for invalid private key length", () => {
			const invalidPrivKey = new Uint8Array(16);
			const publicKey = P256.derivePublicKey(new Uint8Array(32).fill(12));

			expect(() => P256.ecdh(invalidPrivKey, publicKey)).toThrow();
		});

		it("ecdh should throw for invalid public key length", () => {
			const privateKey = new Uint8Array(32).fill(13);
			const invalidPubKey = new Uint8Array(32);

			expect(() => P256.ecdh(privateKey, invalidPubKey)).toThrow();
		});
	});

	describe("Validation", () => {
		it("validatePrivateKey should accept valid key", () => {
			const validKey = new Uint8Array(32).fill(1);
			expect(P256.validatePrivateKey(validKey)).toBe(true);
		});

		it("validatePrivateKey should reject invalid length", () => {
			const invalidKey = new Uint8Array(16);
			expect(P256.validatePrivateKey(invalidKey)).toBe(false);
		});

		it("validatePrivateKey should reject zero key", () => {
			const zeroKey = new Uint8Array(32);
			expect(P256.validatePrivateKey(zeroKey)).toBe(false);
		});

		it("validatePublicKey should accept valid key", () => {
			const privateKey = new Uint8Array(32).fill(14);
			const publicKey = P256.derivePublicKey(privateKey);
			expect(P256.validatePublicKey(publicKey)).toBe(true);
		});

		it("validatePublicKey should reject invalid length", () => {
			const invalidKey = new Uint8Array(32);
			expect(P256.validatePublicKey(invalidKey)).toBe(false);
		});
	});

	describe("Constants", () => {
		it("should have correct constant values", () => {
			expect(P256.PRIVATE_KEY_SIZE).toBe(32);
			expect(P256.PUBLIC_KEY_SIZE).toBe(64);
			expect(P256.SIGNATURE_COMPONENT_SIZE).toBe(32);
			expect(P256.SHARED_SECRET_SIZE).toBe(32);
			expect(P256.CURVE_ORDER).toBe(
				0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n,
			);
		});
	});
});
