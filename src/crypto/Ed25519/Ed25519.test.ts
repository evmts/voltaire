import { ed25519 } from "@noble/curves/ed25519.js";
import { describe, expect, it } from "vitest";
import { Ed25519 } from "./Ed25519.js";

describe("Ed25519", () => {
	describe("keypairFromSeed", () => {
		it("generates deterministic keypair from seed", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair1 = Ed25519.keypairFromSeed(seed);
			const keypair2 = Ed25519.keypairFromSeed(seed);

			expect(keypair1.publicKey).toEqual(keypair2.publicKey);
			expect(keypair1.secretKey).toEqual(keypair2.secretKey);
		});

		it("generates different keypairs from different seeds", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);

			const keypair1 = Ed25519.keypairFromSeed(seed1);
			const keypair2 = Ed25519.keypairFromSeed(seed2);

			expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
			expect(keypair1.secretKey).not.toEqual(keypair2.secretKey);
		});

		it("generates 32-byte public key", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = Ed25519.keypairFromSeed(seed);

			expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
			expect(keypair.publicKey.length).toBe(32);
		});

		it("generates 32-byte secret key", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = Ed25519.keypairFromSeed(seed);

			expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
			expect(keypair.secretKey.length).toBe(32);
		});

		it("throws on invalid seed size", () => {
			const invalidSeed = new Uint8Array(16);

			expect(() => Ed25519.keypairFromSeed(invalidSeed)).toThrow();
		});

		it("matches @noble/curves implementation", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = Ed25519.keypairFromSeed(seed);
			const noblePublicKey = ed25519.getPublicKey(seed);

			expect(keypair.publicKey).toEqual(noblePublicKey);
		});
	});

	describe("derivePublicKey", () => {
		it("derives public key from secret key", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const derivedPublicKey = Ed25519.derivePublicKey(keypair.secretKey);

			expect(derivedPublicKey).toEqual(keypair.publicKey);
		});

		it("produces 32-byte public key", () => {
			const secretKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = Ed25519.derivePublicKey(secretKey);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(32);
		});

		it("throws on invalid secret key size", () => {
			const invalidSecretKey = new Uint8Array(16);

			expect(() => Ed25519.derivePublicKey(invalidSecretKey)).toThrow();
		});

		it("matches @noble/curves implementation", () => {
			const secretKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = Ed25519.derivePublicKey(secretKey);
			const noblePublicKey = ed25519.getPublicKey(secretKey);

			expect(publicKey).toEqual(noblePublicKey);
		});
	});

	describe("sign", () => {
		it("creates 64-byte signature", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("Hello, world!");

			const signature = Ed25519.sign(message, keypair.secretKey);

			expect(signature).toBeInstanceOf(Uint8Array);
			expect(signature.length).toBe(64);
		});

		it("creates deterministic signatures", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("Hello, world!");

			const signature1 = Ed25519.sign(message, keypair.secretKey);
			const signature2 = Ed25519.sign(message, keypair.secretKey);

			expect(signature1).toEqual(signature2);
		});

		it("creates different signatures for different messages", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);

			const message1 = new TextEncoder().encode("Message 1");
			const message2 = new TextEncoder().encode("Message 2");

			const signature1 = Ed25519.sign(message1, keypair.secretKey);
			const signature2 = Ed25519.sign(message2, keypair.secretKey);

			expect(signature1).not.toEqual(signature2);
		});

		it("signs empty message", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new Uint8Array(0);

			const signature = Ed25519.sign(message, keypair.secretKey);

			expect(signature).toBeInstanceOf(Uint8Array);
			expect(signature.length).toBe(64);
		});

		it("throws on invalid secret key size", () => {
			const invalidSecretKey = new Uint8Array(16);
			const message = new TextEncoder().encode("test");

			expect(() => Ed25519.sign(message, invalidSecretKey)).toThrow();
		});

		it("matches @noble/curves implementation", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("Test message");

			const signature = Ed25519.sign(message, keypair.secretKey);
			const nobleSignature = ed25519.sign(message, keypair.secretKey);

			expect(signature).toEqual(nobleSignature);
		});
	});

	describe("verify", () => {
		it("verifies valid signature", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("Hello, world!");

			const signature = Ed25519.sign(message, keypair.secretKey);
			const valid = Ed25519.verify(signature, message, keypair.publicKey);

			expect(valid).toBe(true);
		});

		it("rejects invalid signature", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("Hello, world!");

			const sig = Ed25519.sign(message, keypair.secretKey);
			expect(sig).toBeDefined();
			if (!sig) throw new Error("No signature");
			// Corrupt signature - copy to ensure immutability
			const signature: Uint8Array = new Uint8Array(sig);
			// @ts-expect-error - TypeScript doesn't understand type narrowing here
			signature[0] ^= 1;

			const valid = Ed25519.verify(signature, message, keypair.publicKey);

			expect(valid).toBe(false);
		});

		it("rejects signature for different message", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);

			const message1 = new TextEncoder().encode("Message 1");
			const message2 = new TextEncoder().encode("Message 2");

			const signature = Ed25519.sign(message1, keypair.secretKey);
			const valid = Ed25519.verify(signature, message2, keypair.publicKey);

			expect(valid).toBe(false);
		});

		it("rejects signature with wrong public key", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);
			const keypair1 = Ed25519.keypairFromSeed(seed1);
			const keypair2 = Ed25519.keypairFromSeed(seed2);
			const message = new TextEncoder().encode("Hello, world!");

			const signature = Ed25519.sign(message, keypair1.secretKey);
			const valid = Ed25519.verify(signature, message, keypair2.publicKey);

			expect(valid).toBe(false);
		});

		it("verifies empty message signature", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new Uint8Array(0);

			const signature = Ed25519.sign(message, keypair.secretKey);
			const valid = Ed25519.verify(signature, message, keypair.publicKey);

			expect(valid).toBe(true);
		});

		it("throws on invalid public key size", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("test");
			const signature = Ed25519.sign(message, keypair.secretKey);
			const invalidPublicKey = new Uint8Array(16);

			expect(() =>
				Ed25519.verify(signature, message, invalidPublicKey),
			).toThrow();
		});

		it("throws on invalid signature size", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("test");
			const invalidSignature = new Uint8Array(32);

			expect(() =>
				Ed25519.verify(invalidSignature, message, keypair.publicKey),
			).toThrow();
		});

		it("matches @noble/curves verification", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("Test message");

			const signature = Ed25519.sign(message, keypair.secretKey);
			const ourValid = Ed25519.verify(signature, message, keypair.publicKey);
			const nobleValid = ed25519.verify(signature, message, keypair.publicKey);

			expect(ourValid).toBe(nobleValid);
			expect(ourValid).toBe(true);
		});
	});

	describe("RFC 8032 Test Vectors", () => {
		// Test vector 1 from RFC 8032
		it("verifies RFC 8032 test vector 1", () => {
			const secretKey = new Uint8Array([
				0x9d, 0x61, 0xb1, 0x9d, 0xef, 0xfd, 0x5a, 0x60, 0xba, 0x84, 0x4a, 0xf4,
				0x92, 0xec, 0x2c, 0xc4, 0x44, 0x49, 0xc5, 0x69, 0x7b, 0x32, 0x69, 0x19,
				0x70, 0x3b, 0xac, 0x03, 0x1c, 0xae, 0x7f, 0x60,
			]);

			const expectedPublicKey = new Uint8Array([
				0xd7, 0x5a, 0x98, 0x01, 0x82, 0xb1, 0x0a, 0xb7, 0xd5, 0x4b, 0xfe, 0xd3,
				0xc9, 0x64, 0x07, 0x3a, 0x0e, 0xe1, 0x72, 0xf3, 0xda, 0xa6, 0x23, 0x25,
				0xaf, 0x02, 0x1a, 0x68, 0xf7, 0x07, 0x51, 0x1a,
			]);

			const message = new Uint8Array(0);

			const expectedSignature = new Uint8Array([
				0xe5, 0x56, 0x43, 0x00, 0xc3, 0x60, 0xac, 0x72, 0x90, 0x86, 0xe2, 0xcc,
				0x80, 0x6e, 0x82, 0x8a, 0x84, 0x87, 0x7f, 0x1e, 0xb8, 0xe5, 0xd9, 0x74,
				0xd8, 0x73, 0xe0, 0x65, 0x22, 0x49, 0x01, 0x55, 0x5f, 0xb8, 0x82, 0x15,
				0x90, 0xa3, 0x3b, 0xac, 0xc6, 0x1e, 0x39, 0x70, 0x1c, 0xf9, 0xb4, 0x6b,
				0xd2, 0x5b, 0xf5, 0xf0, 0x59, 0x5b, 0xbe, 0x24, 0x65, 0x51, 0x41, 0x43,
				0x8e, 0x7a, 0x10, 0x0b,
			]);

			const publicKey = Ed25519.derivePublicKey(secretKey);
			expect(publicKey).toEqual(expectedPublicKey);

			const signature = Ed25519.sign(message, secretKey);
			expect(signature).toEqual(expectedSignature);

			const valid = Ed25519.verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		// Test vector 2 from RFC 8032
		it("verifies RFC 8032 test vector 2", () => {
			const secretKey = new Uint8Array([
				0x4c, 0xcd, 0x08, 0x9b, 0x28, 0xff, 0x96, 0xda, 0x9d, 0xb6, 0xc3, 0x46,
				0xec, 0x11, 0x4e, 0x0f, 0x5b, 0x8a, 0x31, 0x9f, 0x35, 0xab, 0xa6, 0x24,
				0xda, 0x8c, 0xf6, 0xed, 0x4f, 0xb8, 0xa6, 0xfb,
			]);

			const expectedPublicKey = new Uint8Array([
				0x3d, 0x40, 0x17, 0xc3, 0xe8, 0x43, 0x89, 0x5a, 0x92, 0xb7, 0x0a, 0xa7,
				0x4d, 0x1b, 0x7e, 0xbc, 0x9c, 0x98, 0x2c, 0xcf, 0x2e, 0xc4, 0x96, 0x8c,
				0xc0, 0xcd, 0x55, 0xf1, 0x2a, 0xf4, 0x66, 0x0c,
			]);

			const message = new Uint8Array([0x72]);

			const expectedSignature = new Uint8Array([
				0x92, 0xa0, 0x09, 0xa9, 0xf0, 0xd4, 0xca, 0xb8, 0x72, 0x0e, 0x82, 0x0b,
				0x5f, 0x64, 0x25, 0x40, 0xa2, 0xb2, 0x7b, 0x54, 0x16, 0x50, 0x3f, 0x8f,
				0xb3, 0x76, 0x22, 0x23, 0xeb, 0xdb, 0x69, 0xda, 0x08, 0x5a, 0xc1, 0xe4,
				0x3e, 0x15, 0x99, 0x6e, 0x45, 0x8f, 0x36, 0x13, 0xd0, 0xf1, 0x1d, 0x8c,
				0x38, 0x7b, 0x2e, 0xae, 0xb4, 0x30, 0x2a, 0xee, 0xb0, 0x0d, 0x29, 0x16,
				0x12, 0xbb, 0x0c, 0x00,
			]);

			const publicKey = Ed25519.derivePublicKey(secretKey);
			expect(publicKey).toEqual(expectedPublicKey);

			const signature = Ed25519.sign(message, secretKey);
			expect(signature).toEqual(expectedSignature);

			const valid = Ed25519.verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});

		// Test vector 3 from RFC 8032
		it("verifies RFC 8032 test vector 3", () => {
			const secretKey = new Uint8Array([
				0xc5, 0xaa, 0x8d, 0xf4, 0x3f, 0x9f, 0x83, 0x7b, 0xed, 0xb7, 0x44, 0x2f,
				0x31, 0xdc, 0xb7, 0xb1, 0x66, 0xd3, 0x85, 0x35, 0x07, 0x6f, 0x09, 0x4b,
				0x85, 0xce, 0x3a, 0x2e, 0x0b, 0x44, 0x58, 0xf7,
			]);

			const expectedPublicKey = new Uint8Array([
				0xfc, 0x51, 0xcd, 0x8e, 0x62, 0x18, 0xa1, 0xa3, 0x8d, 0xa4, 0x7e, 0xd0,
				0x02, 0x30, 0xf0, 0x58, 0x08, 0x16, 0xed, 0x13, 0xba, 0x33, 0x03, 0xac,
				0x5d, 0xeb, 0x91, 0x15, 0x48, 0x90, 0x80, 0x25,
			]);

			const message = new Uint8Array([0xaf, 0x82]);

			const expectedSignature = new Uint8Array([
				0x62, 0x91, 0xd6, 0x57, 0xde, 0xec, 0x24, 0x02, 0x48, 0x27, 0xe6, 0x9c,
				0x3a, 0xbe, 0x01, 0xa3, 0x0c, 0xe5, 0x48, 0xa2, 0x84, 0x74, 0x3a, 0x44,
				0x5e, 0x36, 0x80, 0xd7, 0xdb, 0x5a, 0xc3, 0xac, 0x18, 0xff, 0x9b, 0x53,
				0x8d, 0x16, 0xf2, 0x90, 0xae, 0x67, 0xf7, 0x60, 0x98, 0x4d, 0xc6, 0x59,
				0x4a, 0x7c, 0x15, 0xe9, 0x71, 0x6e, 0xd2, 0x8d, 0xc0, 0x27, 0xbe, 0xce,
				0xea, 0x1e, 0xc4, 0x0a,
			]);

			const publicKey = Ed25519.derivePublicKey(secretKey);
			expect(publicKey).toEqual(expectedPublicKey);

			const signature = Ed25519.sign(message, secretKey);
			expect(signature).toEqual(expectedSignature);

			const valid = Ed25519.verify(signature, message, publicKey);
			expect(valid).toBe(true);
		});
	});

	describe("Security Edge Cases", () => {
		it("rejects all-zero signature", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("test");
			const zeroSignature = new Uint8Array(64);

			const valid = Ed25519.verify(zeroSignature, message, keypair.publicKey);
			expect(valid).toBe(false);
		});

		it("rejects all-ones signature", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("test");
			const onesSignature = new Uint8Array(64).fill(0xff);

			const valid = Ed25519.verify(onesSignature, message, keypair.publicKey);
			expect(valid).toBe(false);
		});

		it("handles low-order public key (identity point)", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("test");
			const signature = Ed25519.sign(message, keypair.secretKey);

			// Identity point (1, 0) = 0x0100...00
			const identityPoint = new Uint8Array(32);
			identityPoint[0] = 0x01;

			const valid = Ed25519.verify(signature, message, identityPoint);
			expect(valid).toBe(false);
		});

		it("handles maximum scalar value", () => {
			// Maximum valid scalar (order - 1)
			const maxScalar = new Uint8Array(32).fill(0xff);
			// Ed25519 order is slightly less than 2^252
			maxScalar[31] = 0x0f; // Set top bits correctly

			const publicKey = Ed25519.derivePublicKey(maxScalar);
			const message = new TextEncoder().encode("test");
			const signature = Ed25519.sign(message, maxScalar);
			const valid = Ed25519.verify(signature, message, publicKey);

			expect(valid).toBe(true);
		});

		it("creates different signatures with different secret keys", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);
			const keypair1 = Ed25519.keypairFromSeed(seed1);
			const keypair2 = Ed25519.keypairFromSeed(seed2);
			const message = new TextEncoder().encode("same message");

			const signature1 = Ed25519.sign(message, keypair1.secretKey);
			const signature2 = Ed25519.sign(message, keypair2.secretKey);

			expect(signature1).not.toEqual(signature2);
		});

		it("handles large messages", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = Ed25519.keypairFromSeed(seed);
			// Create a large message (1MB)
			const largeMessage = new Uint8Array(1024 * 1024).fill(0x42);

			const signature = Ed25519.sign(largeMessage, keypair.secretKey);
			const valid = Ed25519.verify(signature, largeMessage, keypair.publicKey);

			expect(valid).toBe(true);
		});
	});

	describe("Constants", () => {
		it("has correct SECRET_KEY_SIZE", () => {
			expect(Ed25519.SECRET_KEY_SIZE).toBe(32);
		});

		it("has correct PUBLIC_KEY_SIZE", () => {
			expect(Ed25519.PUBLIC_KEY_SIZE).toBe(32);
		});

		it("has correct SIGNATURE_SIZE", () => {
			expect(Ed25519.SIGNATURE_SIZE).toBe(64);
		});

		it("has correct SEED_SIZE", () => {
			expect(Ed25519.SEED_SIZE).toBe(32);
		});
	});

	describe("Validation", () => {
		it("validates correct secret key", () => {
			const secretKey = crypto.getRandomValues(new Uint8Array(32));
			expect(() => Ed25519.validateSecretKey(secretKey)).not.toThrow();
		});

		it("validates correct public key", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = Ed25519.keypairFromSeed(seed);
			expect(() => Ed25519.validatePublicKey(keypair.publicKey)).not.toThrow();
		});

		it("validates correct seed", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			expect(() => Ed25519.validateSeed(seed)).not.toThrow();
		});
	});
});
