import { describe, expect, it } from "bun:test";
import { X25519 } from "./x25519.js";

describe("X25519", () => {
	describe("Key Derivation", () => {
		it("derivePublicKey should generate valid 32-byte public key", () => {
			const secretKey = new Uint8Array(32).fill(1);
			const publicKey = X25519.derivePublicKey(secretKey);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(32);
		});

		it("derivePublicKey should be deterministic", () => {
			const secretKey = new Uint8Array(32).fill(42);
			const publicKey1 = X25519.derivePublicKey(secretKey);
			const publicKey2 = X25519.derivePublicKey(secretKey);

			expect(publicKey1).toEqual(publicKey2);
		});

		it("derivePublicKey should throw for invalid key length", () => {
			const invalidKey = new Uint8Array(16);
			expect(() => X25519.derivePublicKey(invalidKey)).toThrow();
		});
	});

	describe("Keypair Generation", () => {
		it("keypairFromSeed should generate valid keys", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = X25519.keypairFromSeed(seed);

			expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
			expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
			expect(keypair.secretKey.length).toBe(32);
			expect(keypair.publicKey.length).toBe(32);
		});

		it("keypairFromSeed should be deterministic", () => {
			const seed = new Uint8Array(32).fill(7);
			const keypair1 = X25519.keypairFromSeed(seed);
			const keypair2 = X25519.keypairFromSeed(seed);

			expect(keypair1.secretKey).toEqual(keypair2.secretKey);
			expect(keypair1.publicKey).toEqual(keypair2.publicKey);
		});

		it("keypairFromSeed should match derivePublicKey", () => {
			const seed = new Uint8Array(32).fill(99);
			const keypair = X25519.keypairFromSeed(seed);
			const derived = X25519.derivePublicKey(seed);

			expect(keypair.publicKey).toEqual(derived);
		});

		it("keypairFromSeed should throw for invalid seed length", () => {
			const invalidSeed = new Uint8Array(16);
			expect(() => X25519.keypairFromSeed(invalidSeed)).toThrow();
		});

		it("generateSecretKey should generate 32-byte key", () => {
			const secretKey = X25519.generateSecretKey();
			expect(secretKey.length).toBe(32);
		});

		it("generateKeypair should generate valid keypair", () => {
			const keypair = X25519.generateKeypair();
			expect(keypair.secretKey.length).toBe(32);
			expect(keypair.publicKey.length).toBe(32);
		});
	});

	describe("Key Exchange", () => {
		it("scalarmult should produce 32-byte shared secret", () => {
			const secret1 = new Uint8Array(32).fill(1);
			const secret2 = new Uint8Array(32).fill(2);
			const public2 = X25519.derivePublicKey(secret2);

			const shared = X25519.scalarmult(secret1, public2);

			expect(shared).toBeInstanceOf(Uint8Array);
			expect(shared.length).toBe(32);
		});

		it("scalarmult should be symmetric (ECDH property)", () => {
			const secret1 = new Uint8Array(32).fill(3);
			const secret2 = new Uint8Array(32).fill(4);
			const public1 = X25519.derivePublicKey(secret1);
			const public2 = X25519.derivePublicKey(secret2);

			const shared1 = X25519.scalarmult(secret1, public2);
			const shared2 = X25519.scalarmult(secret2, public1);

			expect(shared1).toEqual(shared2);
		});

		it("scalarmult should throw for invalid secret key length", () => {
			const invalidSecret = new Uint8Array(16);
			const publicKey = X25519.derivePublicKey(new Uint8Array(32).fill(5));

			expect(() => X25519.scalarmult(invalidSecret, publicKey)).toThrow();
		});

		it("scalarmult should throw for invalid public key length", () => {
			const secretKey = new Uint8Array(32).fill(6);
			const invalidPublic = new Uint8Array(16);

			expect(() => X25519.scalarmult(secretKey, invalidPublic)).toThrow();
		});

		it("scalarmult with different keys should produce different secrets", () => {
			const secret1 = new Uint8Array(32).fill(7);
			const secret2 = new Uint8Array(32).fill(8);
			const secret3 = new Uint8Array(32).fill(9);

			const public2 = X25519.derivePublicKey(secret2);
			const public3 = X25519.derivePublicKey(secret3);

			const shared12 = X25519.scalarmult(secret1, public2);
			const shared13 = X25519.scalarmult(secret1, public3);

			expect(shared12).not.toEqual(shared13);
		});
	});

	describe("Validation", () => {
		it("validateSecretKey should accept valid key", () => {
			const validKey = new Uint8Array(32).fill(1);
			expect(X25519.validateSecretKey(validKey)).toBe(true);
		});

		it("validateSecretKey should reject invalid length", () => {
			const invalidKey = new Uint8Array(16);
			expect(X25519.validateSecretKey(invalidKey)).toBe(false);
		});

		it("validatePublicKey should accept valid key", () => {
			const secret = new Uint8Array(32).fill(10);
			const publicKey = X25519.derivePublicKey(secret);
			expect(X25519.validatePublicKey(publicKey)).toBe(true);
		});

		it("validatePublicKey should reject invalid length", () => {
			const invalidKey = new Uint8Array(16);
			expect(X25519.validatePublicKey(invalidKey)).toBe(false);
		});

		it("validatePublicKey should reject all-zero key", () => {
			const zeroKey = new Uint8Array(32);
			expect(X25519.validatePublicKey(zeroKey)).toBe(false);
		});
	});

	describe("Constants", () => {
		it("should have correct constant values", () => {
			expect(X25519.SECRET_KEY_SIZE).toBe(32);
			expect(X25519.PUBLIC_KEY_SIZE).toBe(32);
			expect(X25519.SHARED_SECRET_SIZE).toBe(32);
		});
	});

	describe("End-to-End Key Exchange", () => {
		it("should perform complete key exchange successfully", () => {
			// Alice generates keypair
			const aliceSeed = new Uint8Array(32).fill(11);
			const aliceKeypair = X25519.keypairFromSeed(aliceSeed);

			// Bob generates keypair
			const bobSeed = new Uint8Array(32).fill(12);
			const bobKeypair = X25519.keypairFromSeed(bobSeed);

			// Alice computes shared secret with Bob's public key
			const aliceShared = X25519.scalarmult(
				aliceKeypair.secretKey,
				bobKeypair.publicKey,
			);

			// Bob computes shared secret with Alice's public key
			const bobShared = X25519.scalarmult(
				bobKeypair.secretKey,
				aliceKeypair.publicKey,
			);

			// Both should have the same shared secret
			expect(aliceShared).toEqual(bobShared);
			expect(aliceShared.length).toBe(32);
		});
	});
});
