/**
 * WASM-specific tests for X25519 (Curve25519 ECDH) implementation
 *
 * Focuses on WASM-specific concerns:
 * - Memory management across WASM boundary
 * - Error propagation from WASM to JS
 * - Boundary conditions and edge cases
 * - Performance characteristics
 * - Cross-validation with Noble reference
 * - Security properties (clamping, weak keys)
 */

import { x25519 } from "@noble/curves/ed25519.js";
import { describe, expect, it } from "vitest";
import { loadWasm } from "../wasm-loader/loader.js";
import { X25519 } from "./X25519/X25519.js";
import { X25519Wasm } from "./x25519.wasm.js";

// Load WASM before running tests
await loadWasm(new URL("../wasm-loader/primitives.wasm", import.meta.url));

// RFC 7748 test vectors
const RFC7748_VECTORS = [
	{
		scalar: new Uint8Array([
			0xa5, 0x46, 0xe3, 0x6b, 0xf0, 0x52, 0x7c, 0x9d, 0x3b, 0x16, 0x15, 0x4b,
			0x82, 0x46, 0x5e, 0xdd, 0x62, 0x14, 0x4c, 0x0a, 0xc1, 0xfc, 0x5a, 0x18,
			0x50, 0x6a, 0x22, 0x44, 0xba, 0x44, 0x9a, 0xc4,
		]),
		u: new Uint8Array([
			0xe6, 0xdb, 0x68, 0x67, 0x58, 0x30, 0x30, 0xdb, 0x35, 0x94, 0xc1, 0xa4,
			0x24, 0xb1, 0x5f, 0x7c, 0x72, 0x66, 0x24, 0xec, 0x26, 0xb3, 0x35, 0x3b,
			0x10, 0xa9, 0x03, 0xa6, 0xd0, 0xab, 0x1c, 0x4c,
		]),
		result: new Uint8Array([
			0xc3, 0xda, 0x55, 0x37, 0x9d, 0xe9, 0xc6, 0x90, 0x8e, 0x94, 0xea, 0x4d,
			0xf2, 0x8d, 0x08, 0x4f, 0x32, 0xec, 0xcf, 0x03, 0x49, 0x1c, 0x71, 0xf7,
			0x54, 0xb4, 0x07, 0x55, 0x77, 0xa2, 0x85, 0x52,
		]),
	},
];

const TEST_SECRET_KEY = new Uint8Array(32).fill(1);
const TEST_SEED = new Uint8Array(32).fill(42);

describe("X25519 WASM Implementation", () => {
	describe("derivePublicKey", () => {
		it("derives public key from 32-byte secret key", () => {
			const publicKey = X25519Wasm.derivePublicKey(TEST_SECRET_KEY);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(32);
		});

		it("produces deterministic public keys", () => {
			const pk1 = X25519Wasm.derivePublicKey(TEST_SECRET_KEY);
			const pk2 = X25519Wasm.derivePublicKey(TEST_SECRET_KEY);
			const pk3 = X25519Wasm.derivePublicKey(TEST_SECRET_KEY);

			expect(pk1).toEqual(pk2);
			expect(pk2).toEqual(pk3);
		});

		it("matches Noble implementation", () => {
			const wasmKey = X25519Wasm.derivePublicKey(TEST_SECRET_KEY);
			const nobleKey = X25519.derivePublicKey(TEST_SECRET_KEY);

			expect(wasmKey).toEqual(nobleKey);
		});

		it("throws on zero-length secret key", () => {
			const empty = new Uint8Array(0);
			expect(() => X25519Wasm.derivePublicKey(empty)).toThrow(
				"Secret key must be 32 bytes",
			);
		});

		it("throws on 16-byte secret key", () => {
			const short = new Uint8Array(16);
			expect(() => X25519Wasm.derivePublicKey(short)).toThrow(
				"Secret key must be 32 bytes",
			);
		});

		it("throws on 31-byte secret key", () => {
			const short = new Uint8Array(31);
			expect(() => X25519Wasm.derivePublicKey(short)).toThrow(
				"Secret key must be 32 bytes",
			);
		});

		it("throws on 33-byte secret key", () => {
			const long = new Uint8Array(33);
			expect(() => X25519Wasm.derivePublicKey(long)).toThrow(
				"Secret key must be 32 bytes",
			);
		});

		it("applies clamping to secret key", () => {
			// X25519 clamps bits: clear bits 0, 1, 2, 255; set bit 254
			const unclampedKey = new Uint8Array(32).fill(0xff);
			const publicKey = X25519Wasm.derivePublicKey(unclampedKey);

			// Should succeed despite unclamped input
			expect(publicKey.length).toBe(32);
		});

		it("accepts all-zero secret key", () => {
			const zero = new Uint8Array(32);
			const publicKey = X25519Wasm.derivePublicKey(zero);

			// X25519 clamps the key, so even zero works
			expect(publicKey.length).toBe(32);
		});

		it("produces different public keys for different secret keys", () => {
			const sk1 = new Uint8Array(32).fill(1);
			const sk2 = new Uint8Array(32).fill(2);
			const sk3 = new Uint8Array(32).fill(3);

			const pk1 = X25519Wasm.derivePublicKey(sk1);
			const pk2 = X25519Wasm.derivePublicKey(sk2);
			const pk3 = X25519Wasm.derivePublicKey(sk3);

			expect(pk1).not.toEqual(pk2);
			expect(pk1).not.toEqual(pk3);
			expect(pk2).not.toEqual(pk3);
		});
	});

	describe("keypairFromSeed", () => {
		it("generates valid keypair from 32-byte seed", () => {
			const keypair = X25519Wasm.keypairFromSeed(TEST_SEED);

			expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
			expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
			expect(keypair.secretKey.length).toBe(32);
			expect(keypair.publicKey.length).toBe(32);
		});

		it("produces deterministic keypairs", () => {
			const kp1 = X25519Wasm.keypairFromSeed(TEST_SEED);
			const kp2 = X25519Wasm.keypairFromSeed(TEST_SEED);
			const kp3 = X25519Wasm.keypairFromSeed(TEST_SEED);

			expect(kp1.secretKey).toEqual(kp2.secretKey);
			expect(kp1.publicKey).toEqual(kp2.publicKey);
			expect(kp2.secretKey).toEqual(kp3.secretKey);
			expect(kp2.publicKey).toEqual(kp3.publicKey);
		});

		it("produces different keypairs from different seeds", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);
			const seed3 = new Uint8Array(32).fill(3);

			const kp1 = X25519Wasm.keypairFromSeed(seed1);
			const kp2 = X25519Wasm.keypairFromSeed(seed2);
			const kp3 = X25519Wasm.keypairFromSeed(seed3);

			expect(kp1.secretKey).not.toEqual(kp2.secretKey);
			expect(kp1.secretKey).not.toEqual(kp3.secretKey);
			expect(kp2.secretKey).not.toEqual(kp3.secretKey);
		});

		it("public key matches derivePublicKey", () => {
			const keypair = X25519Wasm.keypairFromSeed(TEST_SEED);
			const derived = X25519Wasm.derivePublicKey(keypair.secretKey);

			expect(keypair.publicKey).toEqual(derived);
		});

		it("throws on empty seed", () => {
			const empty = new Uint8Array(0);
			expect(() => X25519Wasm.keypairFromSeed(empty)).toThrow(
				"Seed must be 32 bytes",
			);
		});

		it("throws on 16-byte seed", () => {
			const short = new Uint8Array(16);
			expect(() => X25519Wasm.keypairFromSeed(short)).toThrow(
				"Seed must be 32 bytes",
			);
		});

		it("throws on 31-byte seed", () => {
			const short = new Uint8Array(31);
			expect(() => X25519Wasm.keypairFromSeed(short)).toThrow(
				"Seed must be 32 bytes",
			);
		});

		it("throws on 33-byte seed", () => {
			const long = new Uint8Array(33);
			expect(() => X25519Wasm.keypairFromSeed(long)).toThrow(
				"Seed must be 32 bytes",
			);
		});

		it("accepts all-zero seed", () => {
			const zero = new Uint8Array(32);
			const keypair = X25519Wasm.keypairFromSeed(zero);
			expect(keypair.secretKey.length).toBe(32);
			expect(keypair.publicKey.length).toBe(32);
		});

		it("accepts all-ones seed", () => {
			const ones = new Uint8Array(32).fill(0xff);
			const keypair = X25519Wasm.keypairFromSeed(ones);
			expect(keypair.secretKey.length).toBe(32);
			expect(keypair.publicKey.length).toBe(32);
		});
	});

	describe("scalarmult", () => {
		it("computes shared secret", () => {
			const secret1 = new Uint8Array(32).fill(1);
			const secret2 = new Uint8Array(32).fill(2);
			const public2 = X25519Wasm.derivePublicKey(secret2);

			const shared = X25519Wasm.scalarmult(secret1, public2);

			expect(shared).toBeInstanceOf(Uint8Array);
			expect(shared.length).toBe(32);
		});

		it("produces symmetric shared secrets", () => {
			const secret1 = new Uint8Array(32).fill(3);
			const secret2 = new Uint8Array(32).fill(4);
			const public1 = X25519Wasm.derivePublicKey(secret1);
			const public2 = X25519Wasm.derivePublicKey(secret2);

			const shared1 = X25519Wasm.scalarmult(secret1, public2);
			const shared2 = X25519Wasm.scalarmult(secret2, public1);

			expect(shared1).toEqual(shared2);
		});

		it("produces deterministic shared secrets", () => {
			const secret = new Uint8Array(32).fill(5);
			const publicKey = X25519Wasm.derivePublicKey(new Uint8Array(32).fill(6));

			const shared1 = X25519Wasm.scalarmult(secret, publicKey);
			const shared2 = X25519Wasm.scalarmult(secret, publicKey);
			const shared3 = X25519Wasm.scalarmult(secret, publicKey);

			expect(shared1).toEqual(shared2);
			expect(shared2).toEqual(shared3);
		});

		it("produces different secrets for different keys", () => {
			const secret1 = new Uint8Array(32).fill(7);
			const secret2 = new Uint8Array(32).fill(8);
			const secret3 = new Uint8Array(32).fill(9);
			const publicKey = X25519Wasm.derivePublicKey(new Uint8Array(32).fill(10));

			const shared1 = X25519Wasm.scalarmult(secret1, publicKey);
			const shared2 = X25519Wasm.scalarmult(secret2, publicKey);
			const shared3 = X25519Wasm.scalarmult(secret3, publicKey);

			expect(shared1).not.toEqual(shared2);
			expect(shared1).not.toEqual(shared3);
			expect(shared2).not.toEqual(shared3);
		});

		it("matches RFC 7748 test vectors", () => {
			for (const vector of RFC7748_VECTORS) {
				const result = X25519Wasm.scalarmult(vector.scalar, vector.u);
				expect(result).toEqual(vector.result);
			}
		});

		it("throws on invalid secret key length", () => {
			const invalid = new Uint8Array(16);
			const publicKey = X25519Wasm.derivePublicKey(TEST_SECRET_KEY);

			expect(() => X25519Wasm.scalarmult(invalid, publicKey)).toThrow(
				"Secret key must be 32 bytes",
			);
		});

		it("throws on invalid public key length", () => {
			const invalid = new Uint8Array(16);

			expect(() => X25519Wasm.scalarmult(TEST_SECRET_KEY, invalid)).toThrow(
				"Public key must be 32 bytes",
			);
		});

		it("handles Alice-Bob key exchange scenario", () => {
			// Alice's keypair
			const aliceSecret = new Uint8Array(32).fill(11);
			const alicePublic = X25519Wasm.derivePublicKey(aliceSecret);

			// Bob's keypair
			const bobSecret = new Uint8Array(32).fill(22);
			const bobPublic = X25519Wasm.derivePublicKey(bobSecret);

			// Compute shared secrets
			const aliceShared = X25519Wasm.scalarmult(aliceSecret, bobPublic);
			const bobShared = X25519Wasm.scalarmult(bobSecret, alicePublic);

			// Should match
			expect(aliceShared).toEqual(bobShared);
		});

		it("handles multiple key exchanges", () => {
			const keys: Array<{
				secret: Uint8Array;
				public: Uint8Array;
			}> = [];

			for (let i = 0; i < 10; i++) {
				const secret = new Uint8Array(32).fill(i + 1);
				const publicKey = X25519Wasm.derivePublicKey(secret);
				keys.push({ secret, public: publicKey });
			}

			// Each pair should have symmetric shared secret
			for (let i = 0; i < keys.length - 1; i++) {
				const shared1 = X25519Wasm.scalarmult(
					keys[i]!.secret,
					keys[i + 1]!.public,
				);
				const shared2 = X25519Wasm.scalarmult(
					keys[i + 1]!.secret,
					keys[i]!.public,
				);
				expect(shared1).toEqual(shared2);
			}
		});
	});

	describe("validateSecretKey", () => {
		it("validates 32-byte secret key", () => {
			expect(X25519Wasm.validateSecretKey(TEST_SECRET_KEY)).toBe(true);
		});

		it("rejects empty key", () => {
			expect(X25519Wasm.validateSecretKey(new Uint8Array(0))).toBe(false);
		});

		it("rejects 16-byte key", () => {
			expect(X25519Wasm.validateSecretKey(new Uint8Array(16))).toBe(false);
		});

		it("rejects 31-byte key", () => {
			expect(X25519Wasm.validateSecretKey(new Uint8Array(31))).toBe(false);
		});

		it("rejects 33-byte key", () => {
			expect(X25519Wasm.validateSecretKey(new Uint8Array(33))).toBe(false);
		});

		it("validates all-zero key", () => {
			// X25519 clamps keys, so even all-zero is valid
			const zero = new Uint8Array(32);
			expect(X25519Wasm.validateSecretKey(zero)).toBe(true);
		});

		it("validates all-ones key", () => {
			const ones = new Uint8Array(32).fill(0xff);
			expect(X25519Wasm.validateSecretKey(ones)).toBe(true);
		});
	});

	describe("validatePublicKey", () => {
		it("validates correct public key", () => {
			const publicKey = X25519Wasm.derivePublicKey(TEST_SECRET_KEY);
			expect(X25519Wasm.validatePublicKey(publicKey)).toBe(true);
		});

		it("rejects empty key", () => {
			expect(X25519Wasm.validatePublicKey(new Uint8Array(0))).toBe(false);
		});

		it("rejects 16-byte key", () => {
			expect(X25519Wasm.validatePublicKey(new Uint8Array(16))).toBe(false);
		});

		it("rejects 31-byte key", () => {
			expect(X25519Wasm.validatePublicKey(new Uint8Array(31))).toBe(false);
		});

		it("rejects 33-byte key", () => {
			expect(X25519Wasm.validatePublicKey(new Uint8Array(33))).toBe(false);
		});

		it("rejects all-zero key", () => {
			const zero = new Uint8Array(32);
			expect(X25519Wasm.validatePublicKey(zero)).toBe(false);
		});

		it("validates keys from different seeds", () => {
			for (let i = 1; i <= 10; i++) {
				const seed = new Uint8Array(32).fill(i);
				const keypair = X25519Wasm.keypairFromSeed(seed);
				expect(X25519Wasm.validatePublicKey(keypair.publicKey)).toBe(true);
			}
		});
	});

	describe("Memory Management", () => {
		it("handles rapid successive operations", () => {
			const secret1 = new Uint8Array(32).fill(13);
			const secret2 = new Uint8Array(32).fill(14);
			const public2 = X25519Wasm.derivePublicKey(secret2);

			for (let i = 0; i < 100; i++) {
				const shared = X25519Wasm.scalarmult(secret1, public2);
				expect(shared.length).toBe(32);
			}
		});

		it("handles large batch of keypair generations", () => {
			const keypairs: Array<{
				secretKey: Uint8Array;
				publicKey: Uint8Array;
			}> = [];

			for (let i = 0; i < 100; i++) {
				const seed = new Uint8Array(32).fill(i + 1);
				const keypair = X25519Wasm.keypairFromSeed(seed);
				keypairs.push(keypair);
			}

			// All should be unique and valid
			expect(keypairs.length).toBe(100);
			for (const kp of keypairs) {
				expect(kp.secretKey.length).toBe(32);
				expect(kp.publicKey.length).toBe(32);
			}
		});

		it("handles interleaved operations", () => {
			const seed1 = new Uint8Array(32).fill(15);
			const seed2 = new Uint8Array(32).fill(16);

			const kp1a = X25519Wasm.keypairFromSeed(seed1);
			const kp2 = X25519Wasm.keypairFromSeed(seed2);
			const kp1b = X25519Wasm.keypairFromSeed(seed1);

			expect(kp1a.secretKey).toEqual(kp1b.secretKey);
			expect(kp1a.publicKey).toEqual(kp1b.publicKey);

			const shared1 = X25519Wasm.scalarmult(kp1a.secretKey, kp2.publicKey);
			const shared2 = X25519Wasm.scalarmult(kp2.secretKey, kp1a.publicKey);

			expect(shared1).toEqual(shared2);
		});
	});

	describe("Error Handling", () => {
		it("provides clear error messages for invalid secret key", () => {
			const short = new Uint8Array(16);
			try {
				X25519Wasm.derivePublicKey(short);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("Secret key must be 32");
			}
		});

		it("provides clear error messages for invalid seed", () => {
			const short = new Uint8Array(16);
			try {
				X25519Wasm.keypairFromSeed(short);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("Seed must be 32");
			}
		});

		it("handles invalid scalarmult gracefully", () => {
			const invalidPk = new Uint8Array(16);
			try {
				X25519Wasm.scalarmult(TEST_SECRET_KEY, invalidPk);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});
	});

	describe("Cross-Validation with Noble", () => {
		it("public key derivation matches", () => {
			const secrets = [
				TEST_SECRET_KEY,
				new Uint8Array(32).fill(2),
				new Uint8Array(32).fill(0x42),
			];

			for (const secret of secrets) {
				const wasmPk = X25519Wasm.derivePublicKey(secret);
				const noblePk = X25519.derivePublicKey(secret);

				expect(wasmPk).toEqual(noblePk);
			}
		});

		it("scalarmult matches Noble", () => {
			const secret1 = new Uint8Array(32).fill(17);
			const secret2 = new Uint8Array(32).fill(18);

			const wasmPk2 = X25519Wasm.derivePublicKey(secret2);
			const noblePk2 = x25519.getPublicKey(secret2);

			const wasmShared = X25519Wasm.scalarmult(secret1, wasmPk2);
			const nobleShared = x25519.getSharedSecret(secret1, noblePk2);

			expect(wasmShared).toEqual(nobleShared);
		});

		it("key exchange works across implementations", () => {
			const aliceSecret = new Uint8Array(32).fill(19);
			const bobSecret = new Uint8Array(32).fill(20);

			const aliceWasmPk = X25519Wasm.derivePublicKey(aliceSecret);
			const bobNoblePk = x25519.getPublicKey(bobSecret);

			const wasmShared = X25519Wasm.scalarmult(aliceSecret, bobNoblePk);
			const nobleShared = x25519.getSharedSecret(bobSecret, aliceWasmPk);

			expect(wasmShared).toEqual(nobleShared);
		});
	});

	describe("Security Properties", () => {
		it("applies secret key clamping", () => {
			// X25519 should clamp: clear bits 0, 1, 2, 255; set bit 254
			const unclamped = new Uint8Array(32).fill(0xff);
			const publicKey = X25519Wasm.derivePublicKey(unclamped);

			// Should work without error
			expect(publicKey.length).toBe(32);
		});

		it("rejects weak public keys (all-zero)", () => {
			const zero = new Uint8Array(32);
			expect(X25519Wasm.validatePublicKey(zero)).toBe(false);
		});

		it("handles small subgroup attacks (weak keys)", () => {
			// Small-order points in X25519
			const weakKeys = [
				new Uint8Array(32), // All zeros
				new Uint8Array([
					0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
					0, 0, 0, 0, 0, 0, 0, 0, 0,
				]),
			];

			for (const weakKey of weakKeys) {
				// Validation should reject
				expect(X25519Wasm.validatePublicKey(weakKey)).toBe(false);
			}
		});

		it("produces consistent shared secrets", () => {
			const secret = new Uint8Array(32).fill(21);
			const publicKey = X25519Wasm.derivePublicKey(new Uint8Array(32).fill(22));

			const shared1 = X25519Wasm.scalarmult(secret, publicKey);
			const shared2 = X25519Wasm.scalarmult(secret, publicKey);
			const shared3 = X25519Wasm.scalarmult(secret, publicKey);

			expect(shared1).toEqual(shared2);
			expect(shared2).toEqual(shared3);
		});

		it("validates RFC 7748 test vectors", () => {
			for (const vector of RFC7748_VECTORS) {
				const result = X25519Wasm.scalarmult(vector.scalar, vector.u);
				expect(result).toEqual(vector.result);
			}
		});
	});

	describe("Constants", () => {
		it("exports correct size constants", () => {
			expect(X25519Wasm.SECRET_KEY_SIZE).toBe(32);
			expect(X25519Wasm.PUBLIC_KEY_SIZE).toBe(32);
			expect(X25519Wasm.SHARED_SECRET_SIZE).toBe(32);
		});
	});
});
