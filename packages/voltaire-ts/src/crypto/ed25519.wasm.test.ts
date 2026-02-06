/**
 * WASM-specific tests for Ed25519 implementation
 *
 * Focuses on WASM-specific concerns:
 * - Memory management across WASM boundary
 * - Error propagation from WASM to JS
 * - Boundary conditions and edge cases
 * - Performance characteristics
 * - Cross-validation with Noble reference
 * - Security properties (determinism, validation)
 */

import { ed25519 } from "@noble/curves/ed25519.js";
import { describe, expect, it } from "vitest";
import { loadWasm } from "../wasm-loader/loader.js";
import { Ed25519Wasm } from "./ed25519.wasm.js";

// Load WASM before running tests
await loadWasm(new URL("../wasm-loader/primitives.wasm", import.meta.url));

// Test vectors from RFC 8032
const RFC8032_TEST_VECTORS = [
	{
		seed: new Uint8Array([
			0x9d, 0x61, 0xb1, 0x9d, 0xef, 0xfd, 0x5a, 0x60, 0xba, 0x84, 0x4a, 0xf4,
			0x92, 0xec, 0x2c, 0xc4, 0x44, 0x49, 0xc5, 0x69, 0x7b, 0x32, 0x69, 0x19,
			0x70, 0x3b, 0xac, 0x03, 0x1c, 0xae, 0x7f, 0x60,
		]),
		message: new Uint8Array(0),
		expectedPublicKey: new Uint8Array([
			0xd7, 0x5a, 0x98, 0x01, 0x82, 0xb1, 0x0a, 0xb7, 0xd5, 0x4b, 0xfe, 0xd3,
			0xc9, 0x64, 0x07, 0x3a, 0x0e, 0xe1, 0x72, 0xf3, 0xda, 0xa6, 0x23, 0x25,
			0xaf, 0x02, 0x1a, 0x68, 0xf7, 0x07, 0x51, 0x1a,
		]),
	},
	{
		seed: new Uint8Array([
			0x4c, 0xcd, 0x08, 0x9b, 0x28, 0xff, 0x96, 0xda, 0x9d, 0xb6, 0xc3, 0x46,
			0xec, 0x11, 0x4e, 0x0f, 0x5b, 0x8a, 0x31, 0x9f, 0x35, 0xab, 0xa6, 0x24,
			0xda, 0x8c, 0xf6, 0xed, 0x4f, 0xb8, 0xa6, 0xfb,
		]),
		message: new Uint8Array([0x72]),
		expectedPublicKey: new Uint8Array([
			0x3d, 0x40, 0x17, 0xc3, 0xe8, 0x43, 0x89, 0x5a, 0x92, 0xb7, 0x0a, 0xa7,
			0x4d, 0x1b, 0x7e, 0xbc, 0x9c, 0x98, 0x2c, 0xcf, 0x2e, 0xc4, 0x96, 0x8c,
			0xc0, 0xcd, 0x55, 0xf1, 0x2a, 0xf4, 0x66, 0x0c,
		]),
	},
];

const TEST_SEED = new Uint8Array(32).fill(1);
const TEST_MESSAGE = new TextEncoder().encode("Hello, Ed25519!");

describe("Ed25519 WASM Implementation", () => {
	describe("keypairFromSeed", () => {
		it("generates valid keypair from 32-byte seed", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);

			expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
			expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
			expect(keypair.secretKey.length).toBe(64);
			expect(keypair.publicKey.length).toBe(32);
		});

		it("produces deterministic keypairs", () => {
			const kp1 = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const kp2 = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const kp3 = Ed25519Wasm.keypairFromSeed(TEST_SEED);

			expect(kp1.secretKey).toEqual(kp2.secretKey);
			expect(kp1.publicKey).toEqual(kp2.publicKey);
			expect(kp2.secretKey).toEqual(kp3.secretKey);
			expect(kp2.publicKey).toEqual(kp3.publicKey);
		});

		it("produces different keypairs from different seeds", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);
			const seed3 = new Uint8Array(32).fill(3);

			const kp1 = Ed25519Wasm.keypairFromSeed(seed1);
			const kp2 = Ed25519Wasm.keypairFromSeed(seed2);
			const kp3 = Ed25519Wasm.keypairFromSeed(seed3);

			expect(kp1.publicKey).not.toEqual(kp2.publicKey);
			expect(kp1.publicKey).not.toEqual(kp3.publicKey);
			expect(kp2.publicKey).not.toEqual(kp3.publicKey);
		});

		it("matches RFC 8032 test vectors", () => {
			for (const vector of RFC8032_TEST_VECTORS) {
				const keypair = Ed25519Wasm.keypairFromSeed(vector.seed);
				expect(keypair.publicKey).toEqual(vector.expectedPublicKey);
			}
		});

		it("throws on empty seed", () => {
			const empty = new Uint8Array(0);
			expect(() => Ed25519Wasm.keypairFromSeed(empty)).toThrow(
				"Seed must be 32 bytes",
			);
		});

		it("throws on 16-byte seed", () => {
			const short = new Uint8Array(16);
			expect(() => Ed25519Wasm.keypairFromSeed(short)).toThrow(
				"Seed must be 32 bytes",
			);
		});

		it("throws on 31-byte seed", () => {
			const short = new Uint8Array(31);
			expect(() => Ed25519Wasm.keypairFromSeed(short)).toThrow(
				"Seed must be 32 bytes",
			);
		});

		it("throws on 33-byte seed", () => {
			const long = new Uint8Array(33);
			expect(() => Ed25519Wasm.keypairFromSeed(long)).toThrow(
				"Seed must be 32 bytes",
			);
		});

		it("accepts all-zero seed", () => {
			const zero = new Uint8Array(32);
			const keypair = Ed25519Wasm.keypairFromSeed(zero);
			expect(keypair.secretKey.length).toBe(64);
			expect(keypair.publicKey.length).toBe(32);
		});

		it("accepts all-ones seed", () => {
			const ones = new Uint8Array(32).fill(0xff);
			const keypair = Ed25519Wasm.keypairFromSeed(ones);
			expect(keypair.secretKey.length).toBe(64);
			expect(keypair.publicKey.length).toBe(32);
		});
	});

	describe("derivePublicKey", () => {
		it("derives public key from 64-byte secret key", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const publicKey = Ed25519Wasm.derivePublicKey(keypair.secretKey);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(32);
		});

		it("produces deterministic public keys", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const pk1 = Ed25519Wasm.derivePublicKey(keypair.secretKey);
			const pk2 = Ed25519Wasm.derivePublicKey(keypair.secretKey);
			const pk3 = Ed25519Wasm.derivePublicKey(keypair.secretKey);

			expect(pk1).toEqual(pk2);
			expect(pk2).toEqual(pk3);
		});

		it("matches keypair public key", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const derived = Ed25519Wasm.derivePublicKey(keypair.secretKey);

			expect(derived).toEqual(keypair.publicKey);
		});

		it("accepts 32-byte secret key (treats as seed)", () => {
			const seed = new Uint8Array(32).fill(42);
			const publicKey = Ed25519Wasm.derivePublicKey(seed);

			expect(publicKey.length).toBe(32);
		});

		it("throws on empty secret key", () => {
			const empty = new Uint8Array(0);
			expect(() => Ed25519Wasm.derivePublicKey(empty)).toThrow(
				"Secret key must be 64 bytes",
			);
		});

		it("throws on 16-byte secret key", () => {
			const short = new Uint8Array(16);
			expect(() => Ed25519Wasm.derivePublicKey(short)).toThrow(
				"Secret key must be 64 bytes",
			);
		});

		it("throws on 31-byte secret key", () => {
			const short = new Uint8Array(31);
			expect(() => Ed25519Wasm.derivePublicKey(short)).toThrow(
				"Secret key must be 64 bytes",
			);
		});

		it("throws on 33-byte secret key", () => {
			const invalid = new Uint8Array(33);
			expect(() => Ed25519Wasm.derivePublicKey(invalid)).toThrow(
				"Secret key must be 64 bytes",
			);
		});

		it("throws on 63-byte secret key", () => {
			const short = new Uint8Array(63);
			expect(() => Ed25519Wasm.derivePublicKey(short)).toThrow(
				"Secret key must be 64 bytes",
			);
		});

		it("throws on 65-byte secret key", () => {
			const long = new Uint8Array(65);
			expect(() => Ed25519Wasm.derivePublicKey(long)).toThrow(
				"Secret key must be 64 bytes",
			);
		});
	});

	describe("sign", () => {
		it("signs message with valid secret key", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const signature = Ed25519Wasm.sign(TEST_MESSAGE, keypair.secretKey);

			expect(signature).toBeInstanceOf(Uint8Array);
			expect(signature.length).toBe(64);
		});

		it("produces deterministic signatures", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const sig1 = Ed25519Wasm.sign(TEST_MESSAGE, keypair.secretKey);
			const sig2 = Ed25519Wasm.sign(TEST_MESSAGE, keypair.secretKey);
			const sig3 = Ed25519Wasm.sign(TEST_MESSAGE, keypair.secretKey);

			expect(sig1).toEqual(sig2);
			expect(sig2).toEqual(sig3);
		});

		it("produces different signatures for different messages", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const msg1 = new TextEncoder().encode("message1");
			const msg2 = new TextEncoder().encode("message2");
			const msg3 = new TextEncoder().encode("message3");

			const sig1 = Ed25519Wasm.sign(msg1, keypair.secretKey);
			const sig2 = Ed25519Wasm.sign(msg2, keypair.secretKey);
			const sig3 = Ed25519Wasm.sign(msg3, keypair.secretKey);

			expect(sig1).not.toEqual(sig2);
			expect(sig1).not.toEqual(sig3);
			expect(sig2).not.toEqual(sig3);
		});

		it("signs empty message", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const empty = new Uint8Array(0);
			const signature = Ed25519Wasm.sign(empty, keypair.secretKey);

			expect(signature.length).toBe(64);
		});

		it("signs large message", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const large = new Uint8Array(10000).fill(0xaa);
			const signature = Ed25519Wasm.sign(large, keypair.secretKey);

			expect(signature.length).toBe(64);
		});

		it("throws on invalid secret key length", () => {
			const invalid = new Uint8Array(32);
			expect(() => Ed25519Wasm.sign(TEST_MESSAGE, invalid)).toThrow(
				"Secret key must be 64 bytes",
			);
		});

		it("handles multiple sequential signs", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const signatures: Uint8Array[] = [];

			for (let i = 0; i < 20; i++) {
				const msg = new TextEncoder().encode(`message ${i}`);
				const sig = Ed25519Wasm.sign(msg, keypair.secretKey);
				signatures.push(sig);
			}

			// All should be valid and unique
			expect(signatures.length).toBe(20);
			for (let i = 0; i < signatures.length; i++) {
				expect(signatures[i]?.length).toBe(64);
				for (let j = i + 1; j < signatures.length; j++) {
					expect(signatures[i]).not.toEqual(signatures[j]);
				}
			}
		});
	});

	describe("verify", () => {
		it("verifies valid signature", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const signature = Ed25519Wasm.sign(TEST_MESSAGE, keypair.secretKey);

			const valid = Ed25519Wasm.verify(
				signature,
				TEST_MESSAGE,
				keypair.publicKey,
			);
			expect(valid).toBe(true);
		});

		it("rejects signature with wrong message", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const signature = Ed25519Wasm.sign(TEST_MESSAGE, keypair.secretKey);
			const wrongMsg = new TextEncoder().encode("wrong message");

			const valid = Ed25519Wasm.verify(signature, wrongMsg, keypair.publicKey);
			expect(valid).toBe(false);
		});

		it("rejects signature with wrong public key", () => {
			const keypair1 = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const seed2 = new Uint8Array(32).fill(2);
			const keypair2 = Ed25519Wasm.keypairFromSeed(seed2);
			const signature = Ed25519Wasm.sign(TEST_MESSAGE, keypair1.secretKey);

			const valid = Ed25519Wasm.verify(
				signature,
				TEST_MESSAGE,
				keypair2.publicKey,
			);
			expect(valid).toBe(false);
		});

		it("rejects all-zero signature", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const zero = new Uint8Array(64);

			const valid = Ed25519Wasm.verify(zero, TEST_MESSAGE, keypair.publicKey);
			expect(valid).toBe(false);
		});

		it("rejects all-ones signature", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const ones = new Uint8Array(64).fill(0xff);

			const valid = Ed25519Wasm.verify(ones, TEST_MESSAGE, keypair.publicKey);
			expect(valid).toBe(false);
		});

		it("throws on invalid public key length", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const signature = Ed25519Wasm.sign(TEST_MESSAGE, keypair.secretKey);
			const invalid = new Uint8Array(16);

			expect(() =>
				Ed25519Wasm.verify(signature, TEST_MESSAGE, invalid),
			).toThrow("Public key must be 32 bytes");
		});

		it("throws on invalid signature length", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const invalid = new Uint8Array(32);

			expect(() =>
				Ed25519Wasm.verify(invalid, TEST_MESSAGE, keypair.publicKey),
			).toThrow("Signature must be 64 bytes");
		});

		it("verifies empty message signature", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const empty = new Uint8Array(0);
			const signature = Ed25519Wasm.sign(empty, keypair.secretKey);

			const valid = Ed25519Wasm.verify(signature, empty, keypair.publicKey);
			expect(valid).toBe(true);
		});

		it("verifies large message signature", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const large = new Uint8Array(10000).fill(0xbb);
			const signature = Ed25519Wasm.sign(large, keypair.secretKey);

			const valid = Ed25519Wasm.verify(signature, large, keypair.publicKey);
			expect(valid).toBe(true);
		});

		it("cross-validates with Noble signatures", () => {
			const seed = TEST_SEED;
			const keypair = Ed25519Wasm.keypairFromSeed(seed);

			// Noble uses 32-byte seed for signing
			const nobleSig = ed25519.sign(TEST_MESSAGE, seed);
			const wasmSig = Ed25519Wasm.sign(TEST_MESSAGE, keypair.secretKey);

			// WASM should verify Noble signature
			expect(
				Ed25519Wasm.verify(nobleSig, TEST_MESSAGE, keypair.publicKey),
			).toBe(true);

			// Noble should verify WASM signature
			expect(ed25519.verify(wasmSig, TEST_MESSAGE, keypair.publicKey)).toBe(
				true,
			);
		});
	});

	describe("validateSecretKey", () => {
		it("validates 64-byte secret key", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			expect(Ed25519Wasm.validateSecretKey(keypair.secretKey)).toBe(true);
		});

		it("rejects empty key", () => {
			expect(Ed25519Wasm.validateSecretKey(new Uint8Array(0))).toBe(false);
		});

		it("rejects 32-byte key", () => {
			expect(Ed25519Wasm.validateSecretKey(new Uint8Array(32))).toBe(false);
		});

		it("rejects 63-byte key", () => {
			expect(Ed25519Wasm.validateSecretKey(new Uint8Array(63))).toBe(false);
		});

		it("rejects 65-byte key", () => {
			expect(Ed25519Wasm.validateSecretKey(new Uint8Array(65))).toBe(false);
		});
	});

	describe("validatePublicKey", () => {
		it("validates correct public key", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			expect(Ed25519Wasm.validatePublicKey(keypair.publicKey)).toBe(true);
		});

		it("rejects empty key", () => {
			expect(Ed25519Wasm.validatePublicKey(new Uint8Array(0))).toBe(false);
		});

		it("rejects 16-byte key", () => {
			expect(Ed25519Wasm.validatePublicKey(new Uint8Array(16))).toBe(false);
		});

		it("rejects 31-byte key", () => {
			expect(Ed25519Wasm.validatePublicKey(new Uint8Array(31))).toBe(false);
		});

		it("rejects 33-byte key", () => {
			expect(Ed25519Wasm.validatePublicKey(new Uint8Array(33))).toBe(false);
		});

		it("rejects all-zero key", () => {
			const zero = new Uint8Array(32);
			expect(Ed25519Wasm.validatePublicKey(zero)).toBe(false);
		});

		it("validates keys from different seeds", () => {
			for (let i = 1; i <= 10; i++) {
				const seed = new Uint8Array(32).fill(i);
				const keypair = Ed25519Wasm.keypairFromSeed(seed);
				expect(Ed25519Wasm.validatePublicKey(keypair.publicKey)).toBe(true);
			}
		});
	});

	describe("validateSeed", () => {
		it("validates 32-byte seed", () => {
			expect(Ed25519Wasm.validateSeed(TEST_SEED)).toBe(true);
		});

		it("rejects empty seed", () => {
			expect(Ed25519Wasm.validateSeed(new Uint8Array(0))).toBe(false);
		});

		it("rejects 16-byte seed", () => {
			expect(Ed25519Wasm.validateSeed(new Uint8Array(16))).toBe(false);
		});

		it("rejects 31-byte seed", () => {
			expect(Ed25519Wasm.validateSeed(new Uint8Array(31))).toBe(false);
		});

		it("rejects 33-byte seed", () => {
			expect(Ed25519Wasm.validateSeed(new Uint8Array(33))).toBe(false);
		});

		it("validates all-zero seed", () => {
			const zero = new Uint8Array(32);
			expect(Ed25519Wasm.validateSeed(zero)).toBe(true);
		});

		it("validates all-ones seed", () => {
			const ones = new Uint8Array(32).fill(0xff);
			expect(Ed25519Wasm.validateSeed(ones)).toBe(true);
		});
	});

	describe("Memory Management", () => {
		it("handles rapid successive operations", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			for (let i = 0; i < 100; i++) {
				const msg = new TextEncoder().encode(`message ${i}`);
				const sig = Ed25519Wasm.sign(msg, keypair.secretKey);
				expect(Ed25519Wasm.verify(sig, msg, keypair.publicKey)).toBe(true);
			}
		});

		it("handles large batch of keypair generations", () => {
			const keypairs: Array<{
				secretKey: Uint8Array;
				publicKey: Uint8Array;
			}> = [];

			for (let i = 0; i < 100; i++) {
				const seed = new Uint8Array(32).fill(i + 1);
				const keypair = Ed25519Wasm.keypairFromSeed(seed);
				keypairs.push(keypair);
			}

			// All should be unique and valid
			expect(keypairs.length).toBe(100);
			for (const kp of keypairs) {
				expect(kp.secretKey.length).toBe(64);
				expect(kp.publicKey.length).toBe(32);
			}
		});

		it("handles interleaved operations", () => {
			const seed1 = new Uint8Array(32).fill(1);
			const seed2 = new Uint8Array(32).fill(2);
			const msg1 = new TextEncoder().encode("message1");
			const msg2 = new TextEncoder().encode("message2");

			const kp1 = Ed25519Wasm.keypairFromSeed(seed1);
			const sig1 = Ed25519Wasm.sign(msg1, kp1.secretKey);
			const kp2 = Ed25519Wasm.keypairFromSeed(seed2);
			const sig2 = Ed25519Wasm.sign(msg2, kp2.secretKey);

			expect(Ed25519Wasm.verify(sig1, msg1, kp1.publicKey)).toBe(true);
			expect(Ed25519Wasm.verify(sig2, msg2, kp2.publicKey)).toBe(true);
			expect(Ed25519Wasm.verify(sig1, msg1, kp2.publicKey)).toBe(false);
			expect(Ed25519Wasm.verify(sig2, msg2, kp1.publicKey)).toBe(false);
		});
	});

	describe("Error Handling", () => {
		it("provides clear error messages for invalid seed", () => {
			const short = new Uint8Array(16);
			try {
				Ed25519Wasm.keypairFromSeed(short);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("Seed must be 32");
			}
		});

		it("provides clear error messages for invalid secret key", () => {
			const short = new Uint8Array(32);
			try {
				Ed25519Wasm.sign(TEST_MESSAGE, short);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("Secret key must be 64");
			}
		});

		it("handles malformed signature gracefully", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const bad = new Uint8Array(64).fill(0x99);

			expect(Ed25519Wasm.verify(bad, TEST_MESSAGE, keypair.publicKey)).toBe(
				false,
			);
		});
	});

	describe("Cross-Validation with Noble", () => {
		it("public key derivation matches", () => {
			const seeds = [
				TEST_SEED,
				new Uint8Array(32).fill(2),
				new Uint8Array(32).fill(0x42),
			];

			for (const seed of seeds) {
				const wasmKp = Ed25519Wasm.keypairFromSeed(seed);
				const noblePk = ed25519.getPublicKey(seed);

				expect(wasmKp.publicKey).toEqual(noblePk);
			}
		});

		it("signatures are valid across implementations", () => {
			const messages = [
				new TextEncoder().encode("test1"),
				new TextEncoder().encode("test2"),
				new TextEncoder().encode("test3"),
			];

			for (const msg of messages) {
				const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
				const wasmSig = Ed25519Wasm.sign(msg, keypair.secretKey);
				const nobleSig = ed25519.sign(msg, TEST_SEED);

				// Each implementation's signatures should verify with both
				expect(Ed25519Wasm.verify(wasmSig, msg, keypair.publicKey)).toBe(true);
				expect(ed25519.verify(wasmSig, msg, keypair.publicKey)).toBe(true);
				expect(Ed25519Wasm.verify(nobleSig, msg, keypair.publicKey)).toBe(true);
				expect(ed25519.verify(nobleSig, msg, keypair.publicKey)).toBe(true);
			}
		});
	});

	describe("Security Properties", () => {
		it("enforces deterministic signatures", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const messages = [
				new TextEncoder().encode("msg1"),
				new TextEncoder().encode("msg2"),
				new TextEncoder().encode("msg3"),
			];

			for (const msg of messages) {
				const sig1 = Ed25519Wasm.sign(msg, keypair.secretKey);
				const sig2 = Ed25519Wasm.sign(msg, keypair.secretKey);
				const sig3 = Ed25519Wasm.sign(msg, keypair.secretKey);

				expect(sig1).toEqual(sig2);
				expect(sig2).toEqual(sig3);
			}
		});

		it("rejects identity point as public key", () => {
			// Ed25519 identity point (all zeros)
			const identity = new Uint8Array(32);
			expect(Ed25519Wasm.validatePublicKey(identity)).toBe(false);
		});

		it("validates signature non-malleability", () => {
			const keypair = Ed25519Wasm.keypairFromSeed(TEST_SEED);
			const signature = Ed25519Wasm.sign(TEST_MESSAGE, keypair.secretKey);

			// Ed25519 signatures should not be malleable
			// Verify original works
			expect(
				Ed25519Wasm.verify(signature, TEST_MESSAGE, keypair.publicKey),
			).toBe(true);

			// Mutated signature should fail
			const mutated = new Uint8Array(signature);
			mutated[0] = (mutated[0] ?? 0) ^ 0x01;
			expect(Ed25519Wasm.verify(mutated, TEST_MESSAGE, keypair.publicKey)).toBe(
				false,
			);
		});
	});

	describe("Constants", () => {
		it("exports correct size constants", () => {
			expect(Ed25519Wasm.SECRET_KEY_SIZE).toBe(64);
			expect(Ed25519Wasm.PUBLIC_KEY_SIZE).toBe(32);
			expect(Ed25519Wasm.SIGNATURE_SIZE).toBe(64);
			expect(Ed25519Wasm.SEED_SIZE).toBe(32);
		});
	});
});
