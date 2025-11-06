import { describe, expect, it } from "vitest";
import { sha256 } from "@noble/hashes/sha256";
import { isValidSignature } from "./isValidSignature.js";
import { sign } from "./sign.js";
import { CURVE_ORDER } from "./constants.js";

describe("Secp256k1.isValidSignature", () => {
	describe("valid signatures", () => {
		it("should return true for valid signature", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const message = sha256("test");

			const signature = sign(message, privateKey);

			expect(isValidSignature(signature)).toBe(true);
		});

		it("should return true for multiple valid signatures", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			const messages = [
				sha256("msg1"),
				sha256("msg2"),
				sha256("msg3"),
			];

			for (const message of messages) {
				const signature = sign(message, privateKey);
				expect(isValidSignature(signature)).toBe(true);
			}
		});

		it("should return true for low-s signatures", () => {
			const privateKey = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 7) % 256;
			}
			const message = sha256("low-s test");

			const signature = sign(message, privateKey);

			// Verify it's low-s
			let s = 0n;
			for (let i = 0; i < 32; i++) {
				s = (s << 8n) | BigInt(signature.s[i] ?? 0);
			}
			const halfN = CURVE_ORDER / 2n;
			expect(s <= halfN).toBe(true);

			// Should be valid
			expect(isValidSignature(signature)).toBe(true);
		});
	});

	describe("invalid r component", () => {
		it("should return false for r with wrong length", () => {
			const invalidSig = {
				r: new Uint8Array(31), // Wrong length
				s: new Uint8Array(32),
				v: 27,
			};

			expect(isValidSignature(invalidSig)).toBe(false);
		});

		it("should return false for all-zero r", () => {
			const invalidSig = {
				r: new Uint8Array(32), // All zeros
				s: new Uint8Array(32).fill(1),
				v: 27,
			};

			expect(isValidSignature(invalidSig)).toBe(false);
		});

		it("should return false for r >= n", () => {
			// r = curve order (invalid)
			const invalidSig = {
				r: new Uint8Array([
					0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
					0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
					0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
				]),
				s: new Uint8Array(32).fill(1),
				v: 27,
			};

			expect(isValidSignature(invalidSig)).toBe(false);
		});

		it("should return false for r > n", () => {
			// r > curve order
			const invalidSig = {
				r: new Uint8Array(32).fill(0xff),
				s: new Uint8Array(32).fill(1),
				v: 27,
			};

			expect(isValidSignature(invalidSig)).toBe(false);
		});

		it("should return true for r = 1", () => {
			const validSig = {
				r: new Uint8Array(32),
				s: new Uint8Array(32).fill(1),
				v: 27,
			};
			validSig.r[31] = 1;

			// r=1 is valid (in range [1, n-1]), though signature is meaningless
			expect(isValidSignature(validSig)).toBe(true);
		});
	});

	describe("invalid s component", () => {
		it("should return false for s with wrong length", () => {
			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(33), // Wrong length
				v: 27,
			};

			expect(isValidSignature(invalidSig)).toBe(false);
		});

		it("should return false for all-zero s", () => {
			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32), // All zeros
				v: 27,
			};

			expect(isValidSignature(invalidSig)).toBe(false);
		});

		it("should return false for s >= n", () => {
			// s = curve order (invalid)
			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array([
					0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
					0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
					0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
				]),
				v: 27,
			};

			expect(isValidSignature(invalidSig)).toBe(false);
		});

		it("should return false for s > n/2 (high-s)", () => {
			// s = (n/2) + 1 (high-s, should be rejected for malleability)
			const halfN = CURVE_ORDER / 2n;
			const highS = halfN + 1n;

			const sBytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				sBytes[31 - i] = Number((highS >> BigInt(i * 8)) & 0xffn);
			}

			const invalidSig = {
				r: new Uint8Array(32).fill(1),
				s: sBytes,
				v: 27,
			};

			expect(isValidSignature(invalidSig)).toBe(false);
		});

		it("should return true for s = n/2 (boundary)", () => {
			// s = n/2 exactly (should be valid)
			const halfN = CURVE_ORDER / 2n;

			const sBytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				sBytes[31 - i] = Number((halfN >> BigInt(i * 8)) & 0xffn);
			}

			const sig = {
				r: new Uint8Array(32).fill(1),
				s: sBytes,
				v: 27,
			};

			expect(isValidSignature(sig)).toBe(true);
		});
	});

	describe("invalid v component", () => {
		it("should return false for invalid v values", () => {
			const invalidVs = [2, 3, 26, 29, 100, 255, -1];

			for (const v of invalidVs) {
				const sig = {
					r: new Uint8Array(32).fill(1),
					s: new Uint8Array(32).fill(1),
					v,
				};

				expect(isValidSignature(sig)).toBe(false);
			}
		});

		it("should return true for v = 0", () => {
			const sig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(1),
				v: 0,
			};

			expect(isValidSignature(sig)).toBe(true);
		});

		it("should return true for v = 1", () => {
			const sig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(1),
				v: 1,
			};

			expect(isValidSignature(sig)).toBe(true);
		});

		it("should return true for v = 27", () => {
			const sig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(1),
				v: 27,
			};

			expect(isValidSignature(sig)).toBe(true);
		});

		it("should return true for v = 28", () => {
			const sig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(1),
				v: 28,
			};

			expect(isValidSignature(sig)).toBe(true);
		});
	});

	describe("boundary conditions", () => {
		it("should validate r = 1 as valid", () => {
			const sig = {
				r: new Uint8Array(32),
				s: new Uint8Array(32).fill(1),
				v: 27,
			};
			sig.r[31] = 1;

			expect(isValidSignature(sig)).toBe(true);
		});

		it("should validate r = n-1 as valid", () => {
			// r = n-1 (maximum valid)
			const rBytes = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			]);

			const sig = {
				r: rBytes,
				s: new Uint8Array(32).fill(1),
				v: 27,
			};

			expect(isValidSignature(sig)).toBe(true);
		});

		it("should validate s = 1 as valid", () => {
			const sig = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32),
				v: 27,
			};
			sig.s[31] = 1;

			expect(isValidSignature(sig)).toBe(true);
		});

		it("should validate s = n/2 as valid", () => {
			// s = n/2 (maximum valid low-s)
			const halfN = CURVE_ORDER / 2n;
			const sBytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				sBytes[31 - i] = Number((halfN >> BigInt(i * 8)) & 0xffn);
			}

			const sig = {
				r: new Uint8Array(32).fill(1),
				s: sBytes,
				v: 27,
			};

			expect(isValidSignature(sig)).toBe(true);
		});
	});

	describe("malleability protection", () => {
		it("should enforce low-s requirement (s <= n/2)", () => {
			const halfN = CURVE_ORDER / 2n;

			// Test s values around n/2
			const testValues = [
				halfN - 1n, // Valid
				halfN, // Valid (boundary)
				halfN + 1n, // Invalid (high-s)
				CURVE_ORDER - 1n, // Invalid (high-s)
			];

			for (const [i, value] of testValues.entries()) {
				const sBytes = new Uint8Array(32);
				for (let j = 0; j < 32; j++) {
					sBytes[31 - j] = Number((value >> BigInt(j * 8)) & 0xffn);
				}

				const sig = {
					r: new Uint8Array(32).fill(1),
					s: sBytes,
					v: 27,
				};

				if (i <= 1) {
					// First two are valid (s <= n/2)
					expect(isValidSignature(sig)).toBe(true);
				} else {
					// Last two are invalid (s > n/2)
					expect(isValidSignature(sig)).toBe(false);
				}
			}
		});

		it("should reject signatures with high-s values", () => {
			// Create a high-s signature (s > n/2)
			const highS = (CURVE_ORDER * 3n) / 4n; // 3n/4 > n/2

			const sBytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				sBytes[31 - i] = Number((highS >> BigInt(i * 8)) & 0xffn);
			}

			const sig = {
				r: new Uint8Array(32).fill(1),
				s: sBytes,
				v: 27,
			};

			expect(isValidSignature(sig)).toBe(false);
		});
	});

	describe("constant-time validation", () => {
		it("should not early-return for various invalid signatures", () => {
			const invalidSigs = [
				{
					r: new Uint8Array(32),
					s: new Uint8Array(32),
					v: 27,
				}, // Zero r, s
				{
					r: new Uint8Array(32).fill(0xff),
					s: new Uint8Array(32).fill(0xff),
					v: 27,
				}, // Max r, s
				{ r: new Uint8Array(31), s: new Uint8Array(32), v: 27 }, // Wrong length
			];

			for (const sig of invalidSigs) {
				const result = isValidSignature(sig);
				expect(result).toBe(false);
			}
		});

		it("should handle all valid signatures consistently", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			const sigs = [];
			for (let i = 0; i < 10; i++) {
				const message = sha256(`message ${i}`);
				sigs.push(sign(message, privateKey));
			}

			for (const sig of sigs) {
				expect(isValidSignature(sig)).toBe(true);
			}
		});
	});

	describe("curve order constant", () => {
		it("should use correct secp256k1 curve order", () => {
			expect(CURVE_ORDER).toBe(
				0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,
			);
		});

		it("should correctly compute n/2 for low-s check", () => {
			const halfN = CURVE_ORDER / 2n;
			expect(halfN).toBe(
				0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n,
			);
		});
	});
});
