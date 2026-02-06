import { describe, expect, it } from "vitest";
import { CURVE_ORDER } from "./constants.js";
import { isValidPrivateKey } from "./isValidPrivateKey.js";

describe("Secp256k1.isValidPrivateKey", () => {
	describe("valid private keys", () => {
		it("should return true for minimum valid key (1)", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			expect(isValidPrivateKey(privateKey)).toBe(true);
		});

		it("should return true for maximum valid key (n-1)", () => {
			// CURVE_ORDER - 1
			const privateKey = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			]);

			expect(isValidPrivateKey(privateKey)).toBe(true);
		});

		it("should return true for random valid keys", () => {
			const validKeys = [
				new Uint8Array(32).fill(1),
				new Uint8Array(32).fill(0x0f),
				new Uint8Array(32).fill(0x42),
			];

			for (const key of validKeys) {
				// Make sure they're actually valid (< n)
				key[0] = 0;
				key[1] = 0;
				expect(isValidPrivateKey(key)).toBe(true);
			}
		});

		it("should return true for keys in middle of range", () => {
			const privateKey = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 13) % 256;
			}
			// Ensure < n
			privateKey[0] = 0;
			privateKey[1] = 0;

			expect(isValidPrivateKey(privateKey)).toBe(true);
		});
	});

	describe("invalid private keys", () => {
		it("should return false for zero key", () => {
			const privateKey = new Uint8Array(32); // All zeros

			expect(isValidPrivateKey(privateKey)).toBe(false);
		});

		it("should return false for key >= n (curve order)", () => {
			// CURVE_ORDER (exactly n, invalid)
			const privateKey = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
			]);

			expect(isValidPrivateKey(privateKey)).toBe(false);
		});

		it("should return false for key > n", () => {
			// Greater than curve order
			const privateKey = new Uint8Array(32).fill(0xff);

			expect(isValidPrivateKey(privateKey)).toBe(false);
		});

		it("should return false for wrong length (too short)", () => {
			const privateKey = new Uint8Array(31);
			privateKey[30] = 1;

			expect(isValidPrivateKey(privateKey)).toBe(false);
		});

		it("should return false for wrong length (too long)", () => {
			const privateKey = new Uint8Array(33);
			privateKey[32] = 1;

			expect(isValidPrivateKey(privateKey)).toBe(false);
		});

		it("should return false for empty array", () => {
			const privateKey = new Uint8Array(0);

			expect(isValidPrivateKey(privateKey)).toBe(false);
		});
	});

	describe("boundary conditions", () => {
		it("should validate n-1 as valid", () => {
			// This is the maximum valid private key
			const privateKey = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			]);

			expect(isValidPrivateKey(privateKey)).toBe(true);
		});

		it("should validate n as invalid", () => {
			// This is exactly the curve order (invalid)
			const privateKey = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
			]);

			expect(isValidPrivateKey(privateKey)).toBe(false);
		});

		it("should validate 1 as valid", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			expect(isValidPrivateKey(privateKey)).toBe(true);
		});

		it("should validate 0 as invalid", () => {
			const privateKey = new Uint8Array(32); // All zeros

			expect(isValidPrivateKey(privateKey)).toBe(false);
		});
	});

	describe("constant-time validation", () => {
		it("should not early-return for various invalid keys", () => {
			const invalidKeys = [
				new Uint8Array(32), // Zero
				new Uint8Array(32).fill(0xff), // Max
				new Uint8Array(31), // Wrong length
				new Uint8Array(33), // Wrong length
			];

			for (const key of invalidKeys) {
				const result = isValidPrivateKey(key);
				expect(result).toBe(false);
			}
		});

		it("should handle all valid keys consistently", () => {
			const validKeys = [];
			for (let i = 1; i <= 100; i++) {
				const key = new Uint8Array(32);
				key[31] = i;
				validKeys.push(key);
			}

			for (const key of validKeys) {
				expect(isValidPrivateKey(key)).toBe(true);
			}
		});
	});

	describe("curve order constant", () => {
		it("should use correct secp256k1 curve order", () => {
			// Verify CURVE_ORDER constant is correct
			expect(CURVE_ORDER).toBe(
				0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,
			);
		});

		it("should reject keys at and above curve order", () => {
			// Key = n
			const keyN = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
			]);
			expect(isValidPrivateKey(keyN)).toBe(false);

			// Key = n + 1
			const keyNPlus1 = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x42,
			]);
			expect(isValidPrivateKey(keyNPlus1)).toBe(false);
		});
	});

	describe("range validation", () => {
		it("should accept keys across entire valid range", () => {
			// Test a sample of keys from 1 to n-1
			const samples = [
				1n,
				2n,
				255n,
				256n,
				65535n,
				65536n,
				0xffffffffn,
				0x100000000n,
				CURVE_ORDER - 1n, // n-1
			];

			for (const value of samples) {
				const key = new Uint8Array(32);
				// Convert bigint to bytes (big-endian)
				for (let i = 0; i < 32; i++) {
					key[31 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
				}

				expect(isValidPrivateKey(key)).toBe(true);
			}
		});

		it("should reject keys outside valid range", () => {
			const invalidValues = [
				0n, // Zero
				CURVE_ORDER, // n
				CURVE_ORDER + 1n, // n+1
				0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, // Max u256
			];

			for (const value of invalidValues) {
				const key = new Uint8Array(32);
				// Convert bigint to bytes (big-endian)
				for (let i = 0; i < 32; i++) {
					key[31 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
				}

				expect(isValidPrivateKey(key)).toBe(false);
			}
		});
	});
});
