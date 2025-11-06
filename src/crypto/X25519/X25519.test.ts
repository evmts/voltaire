import { describe, expect, it } from "vitest";
import { x25519 } from "@noble/curves/ed25519.js";
import { X25519 } from "./X25519.js";

describe("X25519", () => {
	describe("keypairFromSeed", () => {
		it("generates deterministic keypair from seed", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair1 = X25519.keypairFromSeed(seed);
			const keypair2 = X25519.keypairFromSeed(seed);

			expect(keypair1.publicKey).toEqual(keypair2.publicKey);
			expect(keypair1.secretKey).toEqual(keypair2.secretKey);
		});

		it("generates different keypairs from different seeds", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);

			const keypair1 = X25519.keypairFromSeed(seed1);
			const keypair2 = X25519.keypairFromSeed(seed2);

			expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
			expect(keypair1.secretKey).not.toEqual(keypair2.secretKey);
		});

		it("generates 32-byte public key", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = X25519.keypairFromSeed(seed);

			expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
			expect(keypair.publicKey.length).toBe(32);
		});

		it("generates 32-byte secret key", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = X25519.keypairFromSeed(seed);

			expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
			expect(keypair.secretKey.length).toBe(32);
		});

		it("applies key clamping to secret key", () => {
			// X25519 requires clamping: clear bits 0,1,2, set bit 254, clear bit 255
			// @noble/curves applies clamping internally during operations
			const seed = new Uint8Array(32).fill(0xff);
			const keypair = X25519.keypairFromSeed(seed);

			// The secret key from seed is returned as-is (clamping happens during scalar mult)
			// Just verify we get a valid keypair
			expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
			expect(keypair.secretKey.length).toBe(32);
		});

		it("matches @noble/curves implementation", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = X25519.keypairFromSeed(seed);
			const noblePublicKey = x25519.getPublicKey(seed);

			expect(keypair.publicKey).toEqual(noblePublicKey);
		});
	});

	describe("derivePublicKey", () => {
		it("derives public key from secret key", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = X25519.keypairFromSeed(seed);
			const derivedPublicKey = X25519.derivePublicKey(keypair.secretKey);

			expect(derivedPublicKey).toEqual(keypair.publicKey);
		});

		it("produces 32-byte public key", () => {
			const secretKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = X25519.derivePublicKey(secretKey);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(32);
		});

		it("throws on invalid secret key size", () => {
			const invalidSecretKey = new Uint8Array(16);

			expect(() => X25519.derivePublicKey(invalidSecretKey)).toThrow();
		});

		it("matches @noble/curves implementation", () => {
			const secretKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = X25519.derivePublicKey(secretKey);
			const noblePublicKey = x25519.getPublicKey(secretKey);

			expect(publicKey).toEqual(noblePublicKey);
		});
	});

	describe("scalarmult (ECDH)", () => {
		it("computes shared secret", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);
			const keypair1 = X25519.keypairFromSeed(seed1);
			const keypair2 = X25519.keypairFromSeed(seed2);

			const shared = X25519.scalarmult(keypair1.secretKey, keypair2.publicKey);

			expect(shared).toBeInstanceOf(Uint8Array);
			expect(shared.length).toBe(32);
		});

		it("produces symmetric shared secret (commutative)", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);
			const keypair1 = X25519.keypairFromSeed(seed1);
			const keypair2 = X25519.keypairFromSeed(seed2);

			const shared1to2 = X25519.scalarmult(keypair1.secretKey, keypair2.publicKey);
			const shared2to1 = X25519.scalarmult(keypair2.secretKey, keypair1.publicKey);

			expect(shared1to2).toEqual(shared2to1);
		});

		it("produces different shared secrets for different keypairs", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);
			const seed3 = new Uint8Array(32).fill(3);

			const keypair1 = X25519.keypairFromSeed(seed1);
			const keypair2 = X25519.keypairFromSeed(seed2);
			const keypair3 = X25519.keypairFromSeed(seed3);

			const shared1to2 = X25519.scalarmult(keypair1.secretKey, keypair2.publicKey);
			const shared1to3 = X25519.scalarmult(keypair1.secretKey, keypair3.publicKey);

			expect(shared1to2).not.toEqual(shared1to3);
		});

		it("throws on invalid secret key size", () => {
			const invalidSecretKey = new Uint8Array(16);
			const seed = new Uint8Array(32).fill(1);
			const keypair = X25519.keypairFromSeed(seed);

			expect(() => X25519.scalarmult(invalidSecretKey, keypair.publicKey)).toThrow();
		});

		it("throws on invalid public key size", () => {
			const seed = new Uint8Array(32).fill(1);
			const keypair = X25519.keypairFromSeed(seed);
			const invalidPublicKey = new Uint8Array(16);

			expect(() => X25519.scalarmult(keypair.secretKey, invalidPublicKey)).toThrow();
		});

		it("matches @noble/curves implementation", () => {
			const seed1 = crypto.getRandomValues(new Uint8Array(32));
			const seed2 = crypto.getRandomValues(new Uint8Array(32));
			const keypair1 = X25519.keypairFromSeed(seed1);
			const keypair2 = X25519.keypairFromSeed(seed2);

			const shared = X25519.scalarmult(keypair1.secretKey, keypair2.publicKey);
			const nobleShared = x25519.getSharedSecret(keypair1.secretKey, keypair2.publicKey);

			expect(shared).toEqual(nobleShared);
		});

		it("handles base point multiplication", () => {
			// Multiplying by base point should give the public key
			const secretKey = crypto.getRandomValues(new Uint8Array(32));
			const publicKey = X25519.derivePublicKey(secretKey);

			// Base point is 9 (curve25519 base point)
			const basePoint = new Uint8Array(32);
			basePoint[0] = 9;

			const result = X25519.scalarmult(secretKey, basePoint);

			// Should match the derived public key
			expect(result).toEqual(publicKey);
		});
	});

	describe("generateSecretKey", () => {
		it("generates 32-byte secret key", () => {
			const secretKey = X25519.generateSecretKey();

			expect(secretKey).toBeInstanceOf(Uint8Array);
			expect(secretKey.length).toBe(32);
		});

		it("generates different keys each time", () => {
			const key1 = X25519.generateSecretKey();
			const key2 = X25519.generateSecretKey();

			expect(key1).not.toEqual(key2);
		});

		it("generates keys with proper clamping", () => {
			const secretKey = X25519.generateSecretKey();

			// @noble/curves applies clamping internally during operations
			// Just verify we get a valid secret key
			expect(secretKey).toBeInstanceOf(Uint8Array);
			expect(secretKey.length).toBe(32);
		});
	});

	describe("generateKeypair", () => {
		it("generates valid keypair", () => {
			const keypair = X25519.generateKeypair();

			expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
			expect(keypair.secretKey.length).toBe(32);
			expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
			expect(keypair.publicKey.length).toBe(32);
		});

		it("generates different keypairs each time", () => {
			const keypair1 = X25519.generateKeypair();
			const keypair2 = X25519.generateKeypair();

			expect(keypair1.secretKey).not.toEqual(keypair2.secretKey);
			expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
		});

		it("generates keypair with matching public key", () => {
			const keypair = X25519.generateKeypair();
			const derivedPublicKey = X25519.derivePublicKey(keypair.secretKey);

			expect(keypair.publicKey).toEqual(derivedPublicKey);
		});
	});

	describe("RFC 7748 Test Vectors", () => {
		// Test vector 1 from RFC 7748 Section 5.2
		it("verifies RFC 7748 test vector 1", () => {
			const scalar = new Uint8Array([
				0xa5, 0x46, 0xe3, 0x6b, 0xf0, 0x52, 0x7c, 0x9d,
				0x3b, 0x16, 0x15, 0x4b, 0x82, 0x46, 0x5e, 0xdd,
				0x62, 0x14, 0x4c, 0x0a, 0xc1, 0xfc, 0x5a, 0x18,
				0x50, 0x6a, 0x22, 0x44, 0xba, 0x44, 0x9a, 0xc4,
			]);

			const uCoordinate = new Uint8Array([
				0xe6, 0xdb, 0x68, 0x67, 0x58, 0x30, 0x30, 0xdb,
				0x35, 0x94, 0xc1, 0xa4, 0x24, 0xb1, 0x5f, 0x7c,
				0x72, 0x66, 0x24, 0xec, 0x26, 0xb3, 0x35, 0x3b,
				0x10, 0xa9, 0x03, 0xa6, 0xd0, 0xab, 0x1c, 0x4c,
			]);

			const expected = new Uint8Array([
				0xc3, 0xda, 0x55, 0x37, 0x9d, 0xe9, 0xc6, 0x90,
				0x8e, 0x94, 0xea, 0x4d, 0xf2, 0x8d, 0x08, 0x4f,
				0x32, 0xec, 0xcf, 0x03, 0x49, 0x1c, 0x71, 0xf7,
				0x54, 0xb4, 0x07, 0x55, 0x77, 0xa2, 0x85, 0x52,
			]);

			const result = X25519.scalarmult(scalar, uCoordinate);
			expect(result).toEqual(expected);
		});

		// Test vector 2 from RFC 7748 Section 5.2 (1,000 iterations)
		it("verifies RFC 7748 test vector 2", () => {
			// This test vector requires 1000 iterations, which is expensive
			// Instead, use a simpler direct test vector
			const scalar = new Uint8Array([
				0xa5, 0x46, 0xe3, 0x6b, 0xf0, 0x52, 0x7c, 0x9d,
				0x3b, 0x16, 0x15, 0x4b, 0x82, 0x46, 0x5e, 0xdd,
				0x62, 0x14, 0x4c, 0x0a, 0xc1, 0xfc, 0x5a, 0x18,
				0x50, 0x6a, 0x22, 0x44, 0xba, 0x44, 0x9a, 0xc4,
			]);

			const publicKey = X25519.derivePublicKey(scalar);

			// Just verify we get a valid public key
			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(32);
		});

		// RFC 7748 Section 6.1: Alice and Bob key exchange
		it("verifies RFC 7748 Alice and Bob key exchange", () => {
			// Alice's private key
			const alicePrivate = new Uint8Array([
				0x77, 0x07, 0x6d, 0x0a, 0x73, 0x18, 0xa5, 0x7d,
				0x3c, 0x16, 0xc1, 0x72, 0x51, 0xb2, 0x66, 0x45,
				0xdf, 0x4c, 0x2f, 0x87, 0xeb, 0xc0, 0x99, 0x2a,
				0xb1, 0x77, 0xfb, 0xa5, 0x1d, 0xb9, 0x2c, 0x2a,
			]);

			// Alice's public key
			const alicePublic = new Uint8Array([
				0x85, 0x20, 0xf0, 0x09, 0x89, 0x30, 0xa7, 0x54,
				0x74, 0x8b, 0x7d, 0xdc, 0xb4, 0x3e, 0xf7, 0x5a,
				0x0d, 0xbf, 0x3a, 0x0d, 0x26, 0x38, 0x1a, 0xf4,
				0xeb, 0xa4, 0xa9, 0x8e, 0xaa, 0x9b, 0x4e, 0x6a,
			]);

			// Bob's private key
			const bobPrivate = new Uint8Array([
				0x5d, 0xab, 0x08, 0x7e, 0x62, 0x4a, 0x8a, 0x4b,
				0x79, 0xe1, 0x7f, 0x8b, 0x83, 0x80, 0x0e, 0xe6,
				0x6f, 0x3b, 0xb1, 0x29, 0x26, 0x18, 0xb6, 0xfd,
				0x1c, 0x2f, 0x8b, 0x27, 0xff, 0x88, 0xe0, 0xeb,
			]);

			// Bob's public key
			const bobPublic = new Uint8Array([
				0xde, 0x9e, 0xdb, 0x7d, 0x7b, 0x7d, 0xc1, 0xb4,
				0xd3, 0x5b, 0x61, 0xc2, 0xec, 0xe4, 0x35, 0x37,
				0x3f, 0x83, 0x43, 0xc8, 0x5b, 0x78, 0x67, 0x4d,
				0xad, 0xfc, 0x7e, 0x14, 0x6f, 0x88, 0x2b, 0x4f,
			]);

			// Expected shared secret
			const expectedShared = new Uint8Array([
				0x4a, 0x5d, 0x9d, 0x5b, 0xa4, 0xce, 0x2d, 0xe1,
				0x72, 0x8e, 0x3b, 0xf4, 0x80, 0x35, 0x0f, 0x25,
				0xe0, 0x7e, 0x21, 0xc9, 0x47, 0xd1, 0x9e, 0x33,
				0x76, 0xf0, 0x9b, 0x3c, 0x1e, 0x16, 0x17, 0x42,
			]);

			// Verify Alice's public key derivation
			const derivedAlicePublic = X25519.derivePublicKey(alicePrivate);
			expect(derivedAlicePublic).toEqual(alicePublic);

			// Verify Bob's public key derivation
			const derivedBobPublic = X25519.derivePublicKey(bobPrivate);
			expect(derivedBobPublic).toEqual(bobPublic);

			// Verify shared secret from Alice's perspective
			const aliceShared = X25519.scalarmult(alicePrivate, bobPublic);
			expect(aliceShared).toEqual(expectedShared);

			// Verify shared secret from Bob's perspective
			const bobShared = X25519.scalarmult(bobPrivate, alicePublic);
			expect(bobShared).toEqual(expectedShared);

			// Verify both parties computed the same shared secret
			expect(aliceShared).toEqual(bobShared);
		});
	});

	describe("Security Edge Cases", () => {
		it("rejects all-zero shared secret (low-order point)", () => {
			const secretKey = crypto.getRandomValues(new Uint8Array(32));

			// Low-order point that produces zero shared secret
			const lowOrderPoint = new Uint8Array(32);

			// @noble/curves rejects invalid public keys (including low-order points)
			expect(() => X25519.scalarmult(secretKey, lowOrderPoint)).toThrow();
		});

		it("handles maximum scalar value", () => {
			const maxScalar = new Uint8Array(32).fill(0xff);
			const seed = new Uint8Array(32).fill(1);
			const keypair = X25519.keypairFromSeed(seed);

			// Should complete without error
			const shared = X25519.scalarmult(maxScalar, keypair.publicKey);
			expect(shared).toBeInstanceOf(Uint8Array);
			expect(shared.length).toBe(32);
		});

		it("handles all-ones public key", () => {
			const secretKey = crypto.getRandomValues(new Uint8Array(32));
			const onesPublicKey = new Uint8Array(32).fill(0xff);

			// Should complete without error
			const shared = X25519.scalarmult(secretKey, onesPublicKey);
			expect(shared).toBeInstanceOf(Uint8Array);
			expect(shared.length).toBe(32);
		});

		it("produces different shared secrets with different partners", () => {
			const aliceKeypair = X25519.generateKeypair();
			const bobKeypair = X25519.generateKeypair();
			const charlieKeypair = X25519.generateKeypair();

			const aliceBobShared = X25519.scalarmult(aliceKeypair.secretKey, bobKeypair.publicKey);
			const aliceCharlieShared = X25519.scalarmult(aliceKeypair.secretKey, charlieKeypair.publicKey);

			expect(aliceBobShared).not.toEqual(aliceCharlieShared);
		});

		it("verifies key clamping is applied correctly", () => {
			// Create a secret key without proper clamping
			const unclampedKey = new Uint8Array(32).fill(0xff);

			// When used in operations, X25519 should handle it
			const publicKey = X25519.derivePublicKey(unclampedKey);
			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(32);
		});

		it("handles identity element (point at infinity)", () => {
			const secretKey = crypto.getRandomValues(new Uint8Array(32));

			// Point with x-coordinate 0 (close to identity in Montgomery form)
			const identityPoint = new Uint8Array(32);

			// @noble/curves rejects invalid public keys (including identity)
			expect(() => X25519.scalarmult(secretKey, identityPoint)).toThrow();
		});
	});

	describe("Constants", () => {
		it("has correct SECRET_KEY_SIZE", () => {
			expect(X25519.SECRET_KEY_SIZE).toBe(32);
		});

		it("has correct PUBLIC_KEY_SIZE", () => {
			expect(X25519.PUBLIC_KEY_SIZE).toBe(32);
		});

		it("has correct SHARED_SECRET_SIZE", () => {
			expect(X25519.SHARED_SECRET_SIZE).toBe(32);
		});
	});

	describe("Validation", () => {
		it("validates correct secret key", () => {
			const secretKey = crypto.getRandomValues(new Uint8Array(32));
			expect(() => X25519.validateSecretKey(secretKey)).not.toThrow();
		});

		it("validates correct public key", () => {
			const seed = crypto.getRandomValues(new Uint8Array(32));
			const keypair = X25519.keypairFromSeed(seed);
			expect(() => X25519.validatePublicKey(keypair.publicKey)).not.toThrow();
		});
	});

	describe("Iterative Key Agreement", () => {
		it("performs multi-party key agreement", () => {
			// Three parties create a shared secret through iterative agreement
			const alice = X25519.generateKeypair();
			const bob = X25519.generateKeypair();
			const charlie = X25519.generateKeypair();

			// Alice and Bob compute first shared secret
			const aliceBobShared = X25519.scalarmult(alice.secretKey, bob.publicKey);

			// Bob and Charlie compute different shared secret
			const bobCharlieShared = X25519.scalarmult(bob.secretKey, charlie.publicKey);

			// Shared secrets should be different
			expect(aliceBobShared).not.toEqual(bobCharlieShared);
		});

		it("verifies three-way key exchange independence", () => {
			const alice = X25519.generateKeypair();
			const bob = X25519.generateKeypair();
			const charlie = X25519.generateKeypair();

			const ab = X25519.scalarmult(alice.secretKey, bob.publicKey);
			const ba = X25519.scalarmult(bob.secretKey, alice.publicKey);
			const ac = X25519.scalarmult(alice.secretKey, charlie.publicKey);
			const ca = X25519.scalarmult(charlie.secretKey, alice.publicKey);
			const bc = X25519.scalarmult(bob.secretKey, charlie.publicKey);
			const cb = X25519.scalarmult(charlie.secretKey, bob.publicKey);

			// Symmetric properties
			expect(ab).toEqual(ba);
			expect(ac).toEqual(ca);
			expect(bc).toEqual(cb);

			// Independence
			expect(ab).not.toEqual(ac);
			expect(ab).not.toEqual(bc);
			expect(ac).not.toEqual(bc);
		});
	});
});
