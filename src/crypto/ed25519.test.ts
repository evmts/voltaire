import { describe, expect, it } from "bun:test";
import { Ed25519 } from "./Ed25519/index.js";

describe("Ed25519", () => {
	describe("Keypair Generation", () => {
		it("keypairFromSeed should generate valid keys", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);

			expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
			expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
			expect(keypair.secretKey.length).toBe(32);
			expect(keypair.publicKey.length).toBe(32);
		});

		it("keypairFromSeed should be deterministic", () => {
			const seed = new Uint8Array(32).fill(42);
			const keypair1 = Ed25519.keypairFromSeed(seed);
			const keypair2 = Ed25519.keypairFromSeed(seed);

			expect(keypair1.secretKey).toEqual(keypair2.secretKey);
			expect(keypair1.publicKey).toEqual(keypair2.publicKey);
		});

		it("keypairFromSeed should throw for invalid seed length", () => {
			const invalidSeed = new Uint8Array(16);
			expect(() => Ed25519.keypairFromSeed(invalidSeed)).toThrow();
		});
	});

	describe("Public Key Derivation", () => {
		it("derivePublicKey should generate valid 32-byte public key", () => {
			const secretKey = new Uint8Array(32).fill(1);
			const publicKey = Ed25519.derivePublicKey(secretKey);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(32);
		});

		it("derivePublicKey should be deterministic", () => {
			const secretKey = new Uint8Array(32).fill(7);
			const publicKey1 = Ed25519.derivePublicKey(secretKey);
			const publicKey2 = Ed25519.derivePublicKey(secretKey);

			expect(publicKey1).toEqual(publicKey2);
		});

		it("derivePublicKey should match keypair generation", () => {
			const seed = new Uint8Array(32).fill(99);
			const keypair = Ed25519.keypairFromSeed(seed);
			const derived = Ed25519.derivePublicKey(seed);

			expect(derived).toEqual(keypair.publicKey);
		});

		it("derivePublicKey should throw for invalid key length", () => {
			const invalidKey = new Uint8Array(16);
			expect(() => Ed25519.derivePublicKey(invalidKey)).toThrow();
		});
	});

	describe("Signing", () => {
		it("sign should produce valid signature", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("test message");

			const signature = Ed25519.sign(message, keypair.secretKey);

			expect(signature).toBeInstanceOf(Uint8Array);
			expect(signature.length).toBe(64);
		});

		it("sign should be deterministic", () => {
			const seed = new Uint8Array(32).fill(2);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("test");

			const sig1 = Ed25519.sign(message, keypair.secretKey);
			const sig2 = Ed25519.sign(message, keypair.secretKey);

			expect(sig1).toEqual(sig2);
		});

		it("sign should throw for invalid secret key length", () => {
			const invalidKey = new Uint8Array(16);
			const message = new TextEncoder().encode("test");

			expect(() => Ed25519.sign(message, invalidKey)).toThrow();
		});

		it("sign should handle empty messages", () => {
			const seed = new Uint8Array(32).fill(3);
			const keypair = Ed25519.keypairFromSeed(seed);
			const emptyMessage = new Uint8Array(0);

			const signature = Ed25519.sign(emptyMessage, keypair.secretKey);
			expect(signature.length).toBe(64);
		});
	});

	describe("Verification", () => {
		it("verify should accept valid signature", () => {
			const seed = new Uint8Array(32).fill(4);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("hello world");

			const signature = Ed25519.sign(message, keypair.secretKey);
			const valid = Ed25519.verify(signature, message, keypair.publicKey);

			expect(valid).toBe(true);
		});

		it("verify should reject signature with wrong message", () => {
			const seed = new Uint8Array(32).fill(5);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("original");

			const signature = Ed25519.sign(message, keypair.secretKey);
			const wrongMessage = new TextEncoder().encode("modified");
			const valid = Ed25519.verify(signature, wrongMessage, keypair.publicKey);

			expect(valid).toBe(false);
		});

		it("verify should reject signature with wrong public key", () => {
			const seed1 = new Uint8Array(32).fill(6);
			const seed2 = new Uint8Array(32).fill(7);
			const keypair1 = Ed25519.keypairFromSeed(seed1);
			const keypair2 = Ed25519.keypairFromSeed(seed2);
			const message = new TextEncoder().encode("test");

			const signature = Ed25519.sign(message, keypair1.secretKey);
			const valid = Ed25519.verify(signature, message, keypair2.publicKey);

			expect(valid).toBe(false);
		});

		it("verify should throw for invalid public key length", () => {
			const seed = new Uint8Array(32).fill(8);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("test");
			const signature = Ed25519.sign(message, keypair.secretKey);
			const invalidPubKey = new Uint8Array(16);

			expect(() => Ed25519.verify(signature, message, invalidPubKey)).toThrow();
		});

		it("verify should throw for invalid signature length", () => {
			const seed = new Uint8Array(32).fill(9);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("test");
			const invalidSig = new Uint8Array(32);

			expect(() =>
				Ed25519.verify(invalidSig, message, keypair.publicKey),
			).toThrow();
		});

		it("verify should handle empty messages", () => {
			const seed = new Uint8Array(32).fill(10);
			const keypair = Ed25519.keypairFromSeed(seed);
			const emptyMessage = new Uint8Array(0);

			const signature = Ed25519.sign(emptyMessage, keypair.secretKey);
			const valid = Ed25519.verify(signature, emptyMessage, keypair.publicKey);

			expect(valid).toBe(true);
		});
	});

	describe("Validation", () => {
		it("validateSecretKey should accept valid key", () => {
			const validKey = new Uint8Array(32).fill(1);
			expect(Ed25519.validateSecretKey(validKey)).toBe(true);
		});

		it("validateSecretKey should reject invalid length", () => {
			const invalidKey = new Uint8Array(16);
			expect(Ed25519.validateSecretKey(invalidKey)).toBe(false);
		});

		it("validatePublicKey should accept valid key", () => {
			const seed = new Uint8Array(32).fill(11);
			const keypair = Ed25519.keypairFromSeed(seed);
			expect(Ed25519.validatePublicKey(keypair.publicKey)).toBe(true);
		});

		it("validatePublicKey should reject invalid length", () => {
			const invalidKey = new Uint8Array(16);
			expect(Ed25519.validatePublicKey(invalidKey)).toBe(false);
		});

		it("validateSeed should accept valid seed", () => {
			const validSeed = new Uint8Array(32);
			expect(Ed25519.validateSeed(validSeed)).toBe(true);
		});

		it("validateSeed should reject invalid length", () => {
			const invalidSeed = new Uint8Array(16);
			expect(Ed25519.validateSeed(invalidSeed)).toBe(false);
		});
	});

	describe("Constants", () => {
		it("should have correct constant values", () => {
			expect(Ed25519.SECRET_KEY_SIZE).toBe(32);
			expect(Ed25519.PUBLIC_KEY_SIZE).toBe(32);
			expect(Ed25519.SIGNATURE_SIZE).toBe(64);
			expect(Ed25519.SEED_SIZE).toBe(32);
		});
	});
});
