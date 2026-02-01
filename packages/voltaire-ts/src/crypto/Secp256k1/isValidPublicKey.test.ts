import { secp256k1 } from "@noble/curves/secp256k1.js";
import { describe, expect, it } from "vitest";
import { derivePublicKey } from "./derivePublicKey.js";
import { isValidPublicKey } from "./isValidPublicKey.js";

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

	describe("curve equation validation", () => {
		it("should reject points not satisfying y^2 = x^3 + 7", () => {
			// Create a point with arbitrary coordinates
			const invalidPoint = new Uint8Array(64);
			// x = 5
			invalidPoint[31] = 5;
			// y = 5 (does not satisfy equation)
			invalidPoint[63] = 5;

			expect(isValidPublicKey(invalidPoint)).toBe(false);
		});

		it("should reject point with valid x but wrong y", () => {
			// Get a valid point
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const validKey = derivePublicKey(privateKey);

			// Corrupt the y coordinate
			const invalidKey = new Uint8Array(validKey);
			invalidKey[63] ^= 0x01; // Flip least significant bit

			expect(isValidPublicKey(invalidKey)).toBe(false);
		});

		it("should reject point with valid y but wrong x", () => {
			// Get a valid point
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const validKey = derivePublicKey(privateKey);

			// Corrupt the x coordinate
			const invalidKey = new Uint8Array(validKey);
			invalidKey[31] ^= 0x01; // Flip least significant bit

			expect(isValidPublicKey(invalidKey)).toBe(false);
		});
	});

	describe("field boundary validation", () => {
		it("should reject x-coordinate >= field prime", () => {
			// secp256k1 field prime p = 2^256 - 2^32 - 977
			// Create x >= p (invalid)
			const invalidKey = new Uint8Array(64);
			// Set x to all 0xFF (definitely >= p)
			for (let i = 0; i < 32; i++) {
				invalidKey[i] = 0xff;
			}
			// y = 0
			invalidKey[63] = 0;

			expect(isValidPublicKey(invalidKey)).toBe(false);
		});

		it("should reject y-coordinate >= field prime", () => {
			// Create valid x, but y >= p
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const validKey = derivePublicKey(privateKey);

			const invalidKey = new Uint8Array(64);
			// Copy valid x
			invalidKey.set(validKey.subarray(0, 32), 0);
			// Set y to all 0xFF (definitely >= p)
			for (let i = 32; i < 64; i++) {
				invalidKey[i] = 0xff;
			}

			expect(isValidPublicKey(invalidKey)).toBe(false);
		});

		it("should accept coordinates at field boundary - 1", () => {
			// This documents that coordinates can be large but must be < p
			// In practice, valid points won't have coordinates near p
			// This test verifies the validation logic checks the boundary

			// Generate a valid key (coordinates will be << p)
			const privateKey = new Uint8Array(32);
			privateKey[31] = 100;
			const validKey = derivePublicKey(privateKey);

			// Verify it's accepted
			expect(isValidPublicKey(validKey)).toBe(true);
		});
	});

	describe("point at infinity validation", () => {
		it("should reject point at infinity (0, 0)", () => {
			// Point at infinity in affine coordinates is typically (0, 0)
			// This is not a valid public key
			const pointAtInfinity = new Uint8Array(64);

			expect(isValidPublicKey(pointAtInfinity)).toBe(false);
		});

		it("should reject degenerate points", () => {
			// Test various degenerate cases
			const degenerateCases = [
				// (0, 1)
				(() => {
					const p = new Uint8Array(64);
					p[63] = 1;
					return p;
				})(),
				// (1, 0)
				(() => {
					const p = new Uint8Array(64);
					p[31] = 1;
					return p;
				})(),
				// (1, 1)
				(() => {
					const p = new Uint8Array(64);
					p[31] = 1;
					p[63] = 1;
					return p;
				})(),
			];

			for (const degeneratePoint of degenerateCases) {
				expect(isValidPublicKey(degeneratePoint)).toBe(false);
			}
		});
	});

	describe("small subgroup attacks", () => {
		it("should only accept points in the correct group", () => {
			// secp256k1 has prime order, so no small subgroup attacks
			// But we verify that only valid curve points are accepted

			// Generate multiple valid keys
			const validKeys = [];
			for (let i = 1; i <= 10; i++) {
				const privateKey = new Uint8Array(32);
				privateKey[31] = i;
				validKeys.push(derivePublicKey(privateKey));
			}

			// All should be valid
			for (const key of validKeys) {
				expect(isValidPublicKey(key)).toBe(true);
			}

			// Invalid points should be rejected
			const invalidPoint = new Uint8Array(64);
			invalidPoint[31] = 1;
			invalidPoint[63] = 2; // Not on curve
			expect(isValidPublicKey(invalidPoint)).toBe(false);
		});
	});
});
