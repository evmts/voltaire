/**
 * WASM-specific tests for P256 (NIST P-256 / secp256r1) implementation
 *
 * Focuses on WASM-specific concerns:
 * - Memory management across WASM boundary
 * - Error propagation from WASM to JS
 * - Boundary conditions and edge cases
 * - Performance characteristics
 * - Cross-validation with Noble reference
 * - Security properties (malleability, validation)
 */

import { p256 } from "@noble/curves/p256.js";
import { describe, expect, it } from "vitest";
import type { BrandedHash } from "../primitives/Hash/BrandedHash/BrandedHash.js";
import { keccak256String } from "../primitives/Hash/BrandedHash/keccak256String.js";
import { loadWasm } from "../wasm-loader/loader.js";
import { P256 } from "./P256/index.js";
import { P256Wasm } from "./p256.wasm.js";

// Load WASM before running tests
await loadWasm(new URL("../wasm-loader/primitives.wasm", import.meta.url));

// Test vectors
const TEST_PRIVATE_KEY = new Uint8Array([
	0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
	0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a,
	0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
]);

const TEST_MESSAGE_HASH = keccak256String("Hello, P256!");

describe("P256 WASM Implementation", () => {
	describe("derivePublicKey", () => {
		it("derives public key from valid private key", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);

			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(64);
		});

		it("produces deterministic results", () => {
			const pk1 = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const pk2 = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const pk3 = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);

			expect(pk1).toEqual(pk2);
			expect(pk2).toEqual(pk3);
		});

		it("matches Noble implementation", () => {
			const wasmKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const nobleKey = P256.derivePublicKey(TEST_PRIVATE_KEY);

			expect(wasmKey).toEqual(nobleKey);
		});

		it("throws on zero-length private key", () => {
			const empty = new Uint8Array(0);
			expect(() => P256Wasm.derivePublicKey(empty)).toThrow(
				"Private key must be 32 bytes",
			);
		});

		it("throws on 16-byte private key", () => {
			const short = new Uint8Array(16);
			expect(() => P256Wasm.derivePublicKey(short)).toThrow(
				"Private key must be 32 bytes",
			);
		});

		it("throws on 31-byte private key", () => {
			const short = new Uint8Array(31);
			expect(() => P256Wasm.derivePublicKey(short)).toThrow(
				"Private key must be 32 bytes",
			);
		});

		it("throws on 33-byte private key", () => {
			const long = new Uint8Array(33);
			expect(() => P256Wasm.derivePublicKey(long)).toThrow(
				"Private key must be 32 bytes",
			);
		});

		it("throws on zero private key", () => {
			const zero = new Uint8Array(32);
			expect(() => P256Wasm.derivePublicKey(zero)).toThrow();
		});

		it("throws on private key >= curve order", () => {
			const largeKey = new Uint8Array(32);
			largeKey.fill(0xff);
			expect(() => P256Wasm.derivePublicKey(largeKey)).toThrow();
		});

		it("accepts private key = 1", () => {
			const one = new Uint8Array(32);
			one[31] = 1;

			const publicKey = P256Wasm.derivePublicKey(one);
			expect(publicKey.length).toBe(64);
		});

		it("accepts valid private key near curve order", () => {
			// Valid key (n-1 for P-256)
			const maxKey = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
				0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x50,
			]);

			const publicKey = P256Wasm.derivePublicKey(maxKey);
			expect(publicKey.length).toBe(64);
		});
	});

	describe("sign", () => {
		it("signs valid message hash", () => {
			const signature = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

			expect(signature.r).toBeInstanceOf(Uint8Array);
			expect(signature.r.length).toBe(32);
			expect(signature.s).toBeInstanceOf(Uint8Array);
			expect(signature.s.length).toBe(32);
		});

		it("produces deterministic signatures (RFC 6979)", () => {
			const sig1 = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
			const sig2 = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
			const sig3 = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

			expect(sig1.r).toEqual(sig2.r);
			expect(sig1.s).toEqual(sig2.s);
			expect(sig2.r).toEqual(sig3.r);
			expect(sig2.s).toEqual(sig3.s);
		});

		it("produces valid signatures that Noble can verify", () => {
			const wasmSig = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);

			// WASM signature should verify with Noble
			expect(P256.verify(wasmSig, TEST_MESSAGE_HASH, publicKey)).toBe(true);
		});

		it("signs all-zero message hash", () => {
			const zero = new Uint8Array(32) as BrandedHash;
			const signature = P256Wasm.sign(zero, TEST_PRIVATE_KEY);

			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
		});

		it("signs all-ones message hash", () => {
			const ones = new Uint8Array(32) as BrandedHash;
			ones.fill(0xff);
			const signature = P256Wasm.sign(ones, TEST_PRIVATE_KEY);

			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
		});

		it("produces low-s signatures (malleability protection)", () => {
			const signature = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

			// Convert s to bigint
			let s = 0n;
			for (let i = 0; i < 32; i++) {
				s = (s << 8n) | BigInt(signature.s[i] ?? 0);
			}

			const halfN = P256Wasm.CURVE_ORDER / 2n;
			expect(s).toBeLessThanOrEqual(halfN);
		});

		it("throws on invalid private key length", () => {
			const short = new Uint8Array(16);
			expect(() => P256Wasm.sign(TEST_MESSAGE_HASH, short)).toThrow(
				"Private key must be 32 bytes",
			);
		});

		it("handles multiple sequential signs", () => {
			const messages = [
				keccak256String("msg1"),
				keccak256String("msg2"),
				keccak256String("msg3"),
				keccak256String("msg4"),
				keccak256String("msg5"),
			];

			const signatures = messages.map((msg) =>
				P256Wasm.sign(msg, TEST_PRIVATE_KEY),
			);

			// All should be valid and unique
			for (let i = 0; i < signatures.length; i++) {
				expect(signatures[i]?.r.length).toBe(32);
				expect(signatures[i]?.s.length).toBe(32);

				// Should differ from others
				for (let j = i + 1; j < signatures.length; j++) {
					expect(signatures[i]?.r).not.toEqual(signatures[j]?.r);
				}
			}
		});
	});

	describe("verify", () => {
		it("verifies valid signature", () => {
			const signature = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);

			const valid = P256Wasm.verify(signature, TEST_MESSAGE_HASH, publicKey);
			expect(valid).toBe(true);
		});

		it("rejects signature with wrong message", () => {
			const signature = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const wrongHash = keccak256String("wrong message");

			const valid = P256Wasm.verify(signature, wrongHash, publicKey);
			expect(valid).toBe(false);
		});

		it("rejects signature with wrong public key", () => {
			const signature = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
			const wrongKey = new Uint8Array(32);
			wrongKey.fill(1);
			const wrongPublicKey = P256Wasm.derivePublicKey(wrongKey);

			const valid = P256Wasm.verify(
				signature,
				TEST_MESSAGE_HASH,
				wrongPublicKey,
			);
			expect(valid).toBe(false);
		});

		it("cross-validates with Noble signatures", () => {
			const nobleSig = P256.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);

			const valid = P256Wasm.verify(nobleSig, TEST_MESSAGE_HASH, publicKey);
			expect(valid).toBe(true);
		});

		it("throws on invalid public key length", () => {
			const signature = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
			const invalidKey = new Uint8Array(32);

			expect(() =>
				P256Wasm.verify(signature, TEST_MESSAGE_HASH, invalidKey),
			).toThrow("Public key must be 64 bytes");
		});

		it("throws on invalid r length", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const invalidSig = {
				r: new Uint8Array(16),
				s: new Uint8Array(32),
			};

			expect(() =>
				P256Wasm.verify(invalidSig, TEST_MESSAGE_HASH, publicKey),
			).toThrow("Signature r must be 32 bytes");
		});

		it("throws on invalid s length", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const invalidSig = {
				r: new Uint8Array(32),
				s: new Uint8Array(16),
			};

			expect(() =>
				P256Wasm.verify(invalidSig, TEST_MESSAGE_HASH, publicKey),
			).toThrow("Signature s must be 32 bytes");
		});

		it("rejects zero r", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const invalidSig = {
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			invalidSig.s.fill(1);

			const valid = P256Wasm.verify(invalidSig, TEST_MESSAGE_HASH, publicKey);
			expect(valid).toBe(false);
		});

		it("rejects zero s", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const invalidSig = {
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			invalidSig.r.fill(1);

			const valid = P256Wasm.verify(invalidSig, TEST_MESSAGE_HASH, publicKey);
			expect(valid).toBe(false);
		});

		it("rejects r >= curve order", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const invalidSig = {
				r: new Uint8Array(32).fill(0xff),
				s: new Uint8Array(32).fill(1),
			};

			const valid = P256Wasm.verify(invalidSig, TEST_MESSAGE_HASH, publicKey);
			expect(valid).toBe(false);
		});

		it("rejects s >= curve order", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(0xff),
			};

			const valid = P256Wasm.verify(invalidSig, TEST_MESSAGE_HASH, publicKey);
			expect(valid).toBe(false);
		});

		it("rejects high s value (malleability)", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const signature = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

			// Create malleable signature with high s (just above n/2)
			const highS = new Uint8Array([
				0x7f, 0xff, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00, 0x7f, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0xde, 0x73, 0x7d, 0x56, 0xd3, 0x8b, 0xcf, 0x42,
				0x79, 0xdc, 0xe5, 0x61, 0x7e, 0x31, 0x92, 0xa9,
			]);

			const malleableSig = { ...signature, s: highS };

			const valid = P256Wasm.verify(malleableSig, TEST_MESSAGE_HASH, publicKey);
			expect(valid).toBe(false);
		});
	});

	describe("ecdh", () => {
		it("computes shared secret", () => {
			const privateKey1 = new Uint8Array(32).fill(1);
			const privateKey2 = new Uint8Array(32).fill(2);
			const publicKey2 = P256Wasm.derivePublicKey(privateKey2);

			const shared = P256Wasm.ecdh(privateKey1, publicKey2);

			expect(shared).toBeInstanceOf(Uint8Array);
			expect(shared.length).toBe(32);
		});

		it("produces symmetric shared secrets", () => {
			const privateKey1 = new Uint8Array(32).fill(3);
			const privateKey2 = new Uint8Array(32).fill(4);
			const publicKey1 = P256Wasm.derivePublicKey(privateKey1);
			const publicKey2 = P256Wasm.derivePublicKey(privateKey2);

			const shared1 = P256Wasm.ecdh(privateKey1, publicKey2);
			const shared2 = P256Wasm.ecdh(privateKey2, publicKey1);

			expect(shared1).toEqual(shared2);
		});

		it("produces deterministic shared secrets", () => {
			const privateKey1 = new Uint8Array(32).fill(5);
			const privateKey2 = new Uint8Array(32).fill(6);
			const publicKey2 = P256Wasm.derivePublicKey(privateKey2);

			const shared1 = P256Wasm.ecdh(privateKey1, publicKey2);
			const shared2 = P256Wasm.ecdh(privateKey1, publicKey2);
			const shared3 = P256Wasm.ecdh(privateKey1, publicKey2);

			expect(shared1).toEqual(shared2);
			expect(shared2).toEqual(shared3);
		});

		it("produces different secrets for different keys", () => {
			const privateKey1 = new Uint8Array(32).fill(7);
			const privateKey2 = new Uint8Array(32).fill(8);
			const privateKey3 = new Uint8Array(32).fill(9);
			const publicKey = P256Wasm.derivePublicKey(new Uint8Array(32).fill(10));

			const shared1 = P256Wasm.ecdh(privateKey1, publicKey);
			const shared2 = P256Wasm.ecdh(privateKey2, publicKey);
			const shared3 = P256Wasm.ecdh(privateKey3, publicKey);

			expect(shared1).not.toEqual(shared2);
			expect(shared1).not.toEqual(shared3);
			expect(shared2).not.toEqual(shared3);
		});

		it("throws on invalid private key length", () => {
			const invalid = new Uint8Array(16);
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);

			expect(() => P256Wasm.ecdh(invalid, publicKey)).toThrow(
				"Private key must be 32 bytes",
			);
		});

		it("throws on invalid public key length", () => {
			const invalid = new Uint8Array(32);

			expect(() => P256Wasm.ecdh(TEST_PRIVATE_KEY, invalid)).toThrow(
				"Public key must be 64 bytes",
			);
		});

		it("handles multiple ECDH operations", () => {
			const keys: Uint8Array[] = [];
			for (let i = 0; i < 10; i++) {
				const pk = new Uint8Array(32).fill(i + 1);
				keys.push(pk);
			}

			const publicKeys = keys.map((k) => P256Wasm.derivePublicKey(k));

			// Each pair should have unique shared secret
			for (let i = 0; i < keys.length - 1; i++) {
				const shared1 = P256Wasm.ecdh(keys[i]!, publicKeys[i + 1]!);
				const shared2 = P256Wasm.ecdh(keys[i + 1]!, publicKeys[i]!);
				expect(shared1).toEqual(shared2);
			}
		});
	});

	describe("validatePrivateKey", () => {
		it("validates correct private key", () => {
			expect(P256Wasm.validatePrivateKey(TEST_PRIVATE_KEY)).toBe(true);
		});

		it("rejects wrong length", () => {
			expect(P256Wasm.validatePrivateKey(new Uint8Array(0))).toBe(false);
			expect(P256Wasm.validatePrivateKey(new Uint8Array(16))).toBe(false);
			expect(P256Wasm.validatePrivateKey(new Uint8Array(31))).toBe(false);
			expect(P256Wasm.validatePrivateKey(new Uint8Array(33))).toBe(false);
		});

		it("rejects zero", () => {
			const zero = new Uint8Array(32);
			expect(P256Wasm.validatePrivateKey(zero)).toBe(false);
		});

		it("accepts 1", () => {
			const one = new Uint8Array(32);
			one[31] = 1;
			expect(P256Wasm.validatePrivateKey(one)).toBe(true);
		});

		it("accepts n-1", () => {
			const nMinus1 = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
				0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x50,
			]);
			expect(P256Wasm.validatePrivateKey(nMinus1)).toBe(true);
		});

		it("rejects n (curve order)", () => {
			const n = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
				0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
			]);
			expect(P256Wasm.validatePrivateKey(n)).toBe(false);
		});

		it("rejects n+1", () => {
			const nPlus1 = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
				0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x52,
			]);
			expect(P256Wasm.validatePrivateKey(nPlus1)).toBe(false);
		});

		it("rejects max u256", () => {
			const max = new Uint8Array(32);
			max.fill(0xff);
			expect(P256Wasm.validatePrivateKey(max)).toBe(false);
		});
	});

	describe("validatePublicKey", () => {
		it("validates correct public key", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			expect(P256Wasm.validatePublicKey(publicKey)).toBe(true);
		});

		it("rejects wrong length", () => {
			expect(P256Wasm.validatePublicKey(new Uint8Array(0))).toBe(false);
			expect(P256Wasm.validatePublicKey(new Uint8Array(32))).toBe(false);
			expect(P256Wasm.validatePublicKey(new Uint8Array(63))).toBe(false);
			expect(P256Wasm.validatePublicKey(new Uint8Array(65))).toBe(false);
		});

		it("rejects all-zero key", () => {
			const zero = new Uint8Array(64);
			expect(P256Wasm.validatePublicKey(zero)).toBe(false);
		});

		it("validates known good public keys", () => {
			const privateKeys = [
				new Uint8Array(32).fill(1),
				TEST_PRIVATE_KEY,
				new Uint8Array(32).fill(0x42),
			];

			for (const pk of privateKeys) {
				const publicKey = P256Wasm.derivePublicKey(pk);
				expect(P256Wasm.validatePublicKey(publicKey)).toBe(true);
			}
		});
	});

	describe("Memory Management", () => {
		it("handles rapid successive operations", () => {
			const pk = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			for (let i = 0; i < 100; i++) {
				const msg = keccak256String(`message ${i}`);
				const sig = P256Wasm.sign(msg, TEST_PRIVATE_KEY);
				expect(P256Wasm.verify(sig, msg, pk)).toBe(true);
			}
		});

		it("handles large batch of public key derivations", () => {
			const keys: Uint8Array[] = [];

			for (let i = 0; i < 100; i++) {
				const privateKey = new Uint8Array(32);
				privateKey.fill(i + 1);

				const publicKey = P256Wasm.derivePublicKey(privateKey);
				keys.push(publicKey);
			}

			// All should be unique and valid
			expect(keys.length).toBe(100);
			for (const key of keys) {
				expect(P256Wasm.validatePublicKey(key)).toBe(true);
			}
		});

		it("handles interleaved operations", () => {
			const msg1 = keccak256String("message1");
			const msg2 = keccak256String("message2");

			const pk1 = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const sig1 = P256Wasm.sign(msg1, TEST_PRIVATE_KEY);
			const pk2 = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const sig2 = P256Wasm.sign(msg2, TEST_PRIVATE_KEY);

			expect(pk1).toEqual(pk2);
			expect(P256Wasm.verify(sig1, msg1, pk1)).toBe(true);
			expect(P256Wasm.verify(sig2, msg2, pk2)).toBe(true);
		});
	});

	describe("Error Handling", () => {
		it("provides clear error messages", () => {
			const short = new Uint8Array(16);

			try {
				P256Wasm.derivePublicKey(short);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("Private key must be 32");
			}
		});

		it("handles malformed signature gracefully", () => {
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			const badSig = {
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};

			expect(P256Wasm.verify(badSig, TEST_MESSAGE_HASH, publicKey)).toBe(false);
		});

		it("handles invalid ECDH gracefully", () => {
			const invalidPk = new Uint8Array(64).fill(0xff);

			try {
				P256Wasm.ecdh(TEST_PRIVATE_KEY, invalidPk);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});
	});

	describe("Cross-Validation with Noble", () => {
		it("public key derivation matches", () => {
			const testKeys = [
				TEST_PRIVATE_KEY,
				new Uint8Array(32).fill(1),
				new Uint8Array(32).fill(0x42),
			];

			for (const pk of testKeys) {
				const wasmPk = P256Wasm.derivePublicKey(pk);
				const noblePk = P256.derivePublicKey(pk);
				expect(wasmPk).toEqual(noblePk);
			}
		});

		it("signatures are valid across implementations", () => {
			const messages = [
				keccak256String("test1"),
				keccak256String("test2"),
				keccak256String("test3"),
			];

			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);

			for (const msg of messages) {
				const wasmSig = P256Wasm.sign(msg, TEST_PRIVATE_KEY);
				const nobleSig = P256.sign(msg, TEST_PRIVATE_KEY);

				// Each implementation's signatures should verify with both
				expect(P256Wasm.verify(wasmSig, msg, publicKey)).toBe(true);
				expect(P256.verify(wasmSig, msg, publicKey)).toBe(true);
				expect(P256Wasm.verify(nobleSig, msg, publicKey)).toBe(true);
				expect(P256.verify(nobleSig, msg, publicKey)).toBe(true);
			}
		});

		it("ECDH matches Noble", () => {
			const pk1 = new Uint8Array(32).fill(11);
			const pk2 = new Uint8Array(32).fill(22);
			const pub2Wasm = P256Wasm.derivePublicKey(pk2);
			const pub2Noble = p256.getPublicKey(pk2, false).slice(1);

			const wasmShared = P256Wasm.ecdh(pk1, pub2Wasm);
			const nobleShared = p256
				.getSharedSecret(pk1, pub2Noble, false)
				.slice(1, 33);

			expect(wasmShared).toEqual(nobleShared);
		});
	});

	describe("Security Properties", () => {
		it("enforces low-s malleability protection", () => {
			const signature = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

			let s = 0n;
			for (let i = 0; i < 32; i++) {
				s = (s << 8n) | BigInt(signature.s[i] ?? 0);
			}

			const halfN = P256Wasm.CURVE_ORDER / 2n;
			expect(s).toBeLessThanOrEqual(halfN);
		});

		it("validates signature components in range", () => {
			// r must be in [1, n-1]
			const sigR0 = {
				r: new Uint8Array(32),
				s: new Uint8Array(32).fill(1),
			};
			const publicKey = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
			expect(P256Wasm.verify(sigR0, TEST_MESSAGE_HASH, publicKey)).toBe(false);

			// s must be in [1, n-1]
			const sigS0 = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32),
			};
			expect(P256Wasm.verify(sigS0, TEST_MESSAGE_HASH, publicKey)).toBe(false);
		});

		it("validates deterministic signing", () => {
			const messages = [
				keccak256String("msg1"),
				keccak256String("msg2"),
				keccak256String("msg3"),
			];

			for (const msg of messages) {
				const sig1 = P256Wasm.sign(msg, TEST_PRIVATE_KEY);
				const sig2 = P256Wasm.sign(msg, TEST_PRIVATE_KEY);
				const sig3 = P256Wasm.sign(msg, TEST_PRIVATE_KEY);

				expect(sig1).toEqual(sig2);
				expect(sig2).toEqual(sig3);
			}
		});
	});

	describe("Constants", () => {
		it("exports correct CURVE_ORDER", () => {
			expect(P256Wasm.CURVE_ORDER).toBe(
				0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n,
			);
		});

		it("exports correct size constants", () => {
			expect(P256Wasm.PRIVATE_KEY_SIZE).toBe(32);
			expect(P256Wasm.PUBLIC_KEY_SIZE).toBe(64);
			expect(P256Wasm.SIGNATURE_COMPONENT_SIZE).toBe(32);
			expect(P256Wasm.SHARED_SECRET_SIZE).toBe(32);
		});
	});
});
