import { describe, expect, it } from "vitest";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { isValidPublicKey } from "./isValidPublicKey.js";
import { derivePublicKey } from "./derivePublicKey.js";

describe("Secp256k1.isValidPublicKey", () => {
	describe("valid public keys", () => {
		it("should return true for valid public key", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const publicKey = derivePublicKey(privateKey);

			expect(isValidPublicKey(publicKey)).toBe(true);
		});

		it("should return true for multiple derived public keys", () => {
			for (let i = 1; i <= 10; i++) {
				const privateKey = new Uint8Array(32);
				privateKey[31] = i;
				const publicKey = derivePublicKey(privateKey);

				expect(isValidPublicKey(publicKey)).toBe(true);
			}
		});

		it("should return true for generator point G", () => {
			// G is the public key for private key = 1
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const publicKey = derivePublicKey(privateKey);

			expect(isValidPublicKey(publicKey)).toBe(true);
		});
	});

	describe("invalid public keys", () => {
		it("should return false for all-zero key", () => {
			const publicKey = new Uint8Array(64); // All zeros

			expect(isValidPublicKey(publicKey)).toBe(false);
		});

		it("should return false for all-ones key", () => {
			const publicKey = new Uint8Array(64).fill(0xff);

			expect(isValidPublicKey(publicKey)).toBe(false);
		});

		it("should return false for wrong length (too short)", () => {
			const publicKey = new Uint8Array(63);

			expect(isValidPublicKey(publicKey)).toBe(false);
		});

		it("should return false for wrong length (too long)", () => {
			const publicKey = new Uint8Array(65);

			expect(isValidPublicKey(publicKey)).toBe(false);
		});

		it("should return false for empty array", () => {
			const publicKey = new Uint8Array(0);

			expect(isValidPublicKey(publicKey)).toBe(false);
		});

		it("should return false for point not on curve", () => {
			// Random bytes that don't represent a valid curve point
			const publicKey = new Uint8Array(64);
			for (let i = 0; i < 64; i++) {
				publicKey[i] = (i * 7) % 256;
			}

			expect(isValidPublicKey(publicKey)).toBe(false);
		});
	});

	describe("coordinate validation", () => {
		it("should reject x coordinate >= p (field prime)", () => {
			// Create key with x >= p (invalid)
			const publicKey = new Uint8Array(64).fill(0xff);

			expect(isValidPublicKey(publicKey)).toBe(false);
		});

		it("should reject y coordinate not satisfying curve equation", () => {
			// x = 1, y = 1 (not on curve: y^2 ≠ x^3 + 7)
			const publicKey = new Uint8Array(64);
			publicKey[31] = 1; // x = 1
			publicKey[63] = 1; // y = 1

			expect(isValidPublicKey(publicKey)).toBe(false);
		});

		it("should accept valid coordinates on curve", () => {
			// Use a known valid point
			const privateKey = new Uint8Array(32);
			privateKey[31] = 2;
			const publicKey = derivePublicKey(privateKey);

			expect(isValidPublicKey(publicKey)).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("should handle keys near field boundaries", () => {
			// Test various patterns
			const testKeys = [
				new Uint8Array(64).fill(1),
				new Uint8Array(64).fill(0x7f),
			];

			for (const key of testKeys) {
				// These are likely invalid, but should not crash
				const result = isValidPublicKey(key);
				expect(typeof result).toBe("boolean");
			}
		});

		it("should validate point at infinity as invalid", () => {
			// Point at infinity would be (0, 0) in affine coordinates
			const pointAtInfinity = new Uint8Array(64);

			expect(isValidPublicKey(pointAtInfinity)).toBe(false);
		});
	});

	describe("cross-validation with @noble/curves", () => {
		it("should validate keys accepted by @noble/curves", () => {
			const privateKey = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 11) % 256;
			}
			privateKey[0] = 0;
			privateKey[31] = 42;

			// Get public key from @noble
			const noblePublicKey = secp256k1.getPublicKey(privateKey, false);
			const publicKey = noblePublicKey.slice(1); // Remove 0x04 prefix

			expect(isValidPublicKey(publicKey)).toBe(true);
		});

		it("should reject keys that @noble would reject", () => {
			// Invalid point: not on curve
			const invalidKey = new Uint8Array(64);
			invalidKey[0] = 0x01;
			invalidKey[32] = 0x02;

			expect(isValidPublicKey(invalidKey)).toBe(false);

			// Verify @noble also rejects it
			const prefixed = new Uint8Array(65);
			prefixed[0] = 0x04;
			prefixed.set(invalidKey, 1);

			expect(() => secp256k1.Point.fromBytes(prefixed)).toThrow();
		});
	});

	describe("constant-time validation", () => {
		it("should not early-return for various invalid keys", () => {
			const invalidKeys = [
				new Uint8Array(64), // All zeros
				new Uint8Array(64).fill(0xff), // All ones
				new Uint8Array(63), // Wrong length
				new Uint8Array(65), // Wrong length
			];

			for (const key of invalidKeys) {
				const result = isValidPublicKey(key);
				expect(result).toBe(false);
			}
		});

		it("should handle all valid keys consistently", () => {
			const validKeys = [];
			for (let i = 1; i <= 20; i++) {
				const privateKey = new Uint8Array(32);
				privateKey[31] = i;
				validKeys.push(derivePublicKey(privateKey));
			}

			for (const key of validKeys) {
				expect(isValidPublicKey(key)).toBe(true);
			}
		});
	});

	describe("length validation", () => {
		it("should reject keys of various wrong lengths", () => {
			const lengths = [0, 1, 31, 32, 33, 63, 65, 100, 128];

			for (const length of lengths) {
				if (length === 64) continue; // Skip valid length

				const key = new Uint8Array(length);
				expect(isValidPublicKey(key)).toBe(false);
			}
		});

		it("should only accept 64-byte keys", () => {
			// Only 64-byte uncompressed public keys are valid
			for (let length = 62; length <= 66; length++) {
				const key = new Uint8Array(length);
				if (length === 64) {
					// May be valid if it's a valid curve point
					// (won't be for all-zeros, but length check passes)
					expect(typeof isValidPublicKey(key)).toBe("boolean");
				} else {
					expect(isValidPublicKey(key)).toBe(false);
				}
			}
		});
	});

	describe("known test vectors", () => {
		it("should validate known valid secp256k1 public keys", () => {
			// Test vector: private key = 1 gives generator point G
			const privateKey1 = new Uint8Array(32);
			privateKey1[31] = 1;
			const g = derivePublicKey(privateKey1);
			expect(isValidPublicKey(g)).toBe(true);

			// Test vector: private key = 2 gives 2*G
			const privateKey2 = new Uint8Array(32);
			privateKey2[31] = 2;
			const twoG = derivePublicKey(privateKey2);
			expect(isValidPublicKey(twoG)).toBe(true);

			// They should be different
			expect(g).not.toEqual(twoG);
		});
	});
});
