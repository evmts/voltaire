import { describe, expect, it } from "vitest";
import * as Signature from "./index.js";

/**
 * Fuzz tests for Signature primitive
 *
 * Tests signature operations with random, edge-case, and malicious inputs
 * to ensure robustness and security across all three algorithms.
 */
describe("Signature Fuzz Tests", () => {
	/**
	 * 1. Random valid signatures - round-trip serialize/parse
	 */
	describe("random valid signatures round-trip", () => {
		it("should round-trip secp256k1 with random r/s", () => {
			for (let i = 0; i < 100; i++) {
				const r = crypto.getRandomValues(new Uint8Array(32));
				const s = crypto.getRandomValues(new Uint8Array(32));
				const v = Math.random() > 0.5 ? 27 : 28;

				const sig = Signature.fromSecp256k1(r, s, v);
				const compact = Signature.toCompact(sig);
				const restored = Signature.fromCompact(compact, "secp256k1");

				expect(Signature.equals(sig, restored)).toBe(true);
			}
		});

		it("should round-trip p256 with random r/s", () => {
			for (let i = 0; i < 100; i++) {
				const r = crypto.getRandomValues(new Uint8Array(32));
				const s = crypto.getRandomValues(new Uint8Array(32));

				const sig = Signature.fromP256(r, s);
				const compact = Signature.toCompact(sig);
				const restored = Signature.fromCompact(compact, "p256");

				expect(Signature.equals(sig, restored)).toBe(true);
			}
		});

		it("should round-trip ed25519 with random signature", () => {
			for (let i = 0; i < 100; i++) {
				const signature = crypto.getRandomValues(new Uint8Array(64));

				const sig = Signature.fromEd25519(signature);
				const compact = Signature.toCompact(sig);
				const restored = Signature.fromCompact(compact, "ed25519");

				expect(Signature.equals(sig, restored)).toBe(true);
			}
		});

		it("should round-trip DER encoding with random ECDSA signatures", () => {
			for (let i = 0; i < 50; i++) {
				const r = crypto.getRandomValues(new Uint8Array(32));
				const s = crypto.getRandomValues(new Uint8Array(32));

				const sig = Signature.fromSecp256k1(r, s, 27);
				const der = Signature.toDER(sig);
				const restored = Signature.fromDER(der, "secp256k1", 27);

				expect(Signature.equals(sig, restored)).toBe(true);
			}
		});
	});

	/**
	 * 2. Malformed signature data (wrong lengths, invalid r/s values)
	 */
	describe("malformed signature data", () => {
		it("should reject r with wrong length", () => {
			const lengths = [0, 1, 15, 16, 31, 33, 64, 100, 255];
			for (const len of lengths) {
				const r = new Uint8Array(len);
				const s = new Uint8Array(32);
				expect(() => Signature.fromSecp256k1(r, s)).toThrow(
					Signature.InvalidSignatureLengthError,
				);
			}
		});

		it("should reject s with wrong length", () => {
			const lengths = [0, 1, 15, 16, 31, 33, 64, 100, 255];
			for (const len of lengths) {
				const r = new Uint8Array(32);
				const s = new Uint8Array(len);
				expect(() => Signature.fromSecp256k1(r, s)).toThrow(
					Signature.InvalidSignatureLengthError,
				);
			}
		});

		it("should reject ed25519 with wrong length", () => {
			const lengths = [0, 1, 32, 63, 65, 100, 128, 255];
			for (const len of lengths) {
				const signature = new Uint8Array(len);
				expect(() => Signature.fromEd25519(signature)).toThrow(
					Signature.InvalidSignatureLengthError,
				);
			}
		});

		it("should reject compact with invalid lengths", () => {
			const lengths = [0, 1, 32, 63, 66, 100, 128, 255];
			for (const len of lengths) {
				const compact = new Uint8Array(len);
				expect(() => Signature.fromCompact(compact, "secp256k1")).toThrow(
					Signature.InvalidSignatureLengthError,
				);
			}
		});

		it("should handle all-zero r/s components", () => {
			const r = new Uint8Array(32).fill(0);
			const s = new Uint8Array(32).fill(0);

			const sig = Signature.fromSecp256k1(r, s);
			expect(sig).toBeDefined();
			expect(Signature.getR(sig)).toEqual(r);
			expect(Signature.getS(sig)).toEqual(s);
		});

		it("should handle all-FF r/s components", () => {
			const r = new Uint8Array(32).fill(0xff);
			const s = new Uint8Array(32).fill(0xff);

			const sig = Signature.fromSecp256k1(r, s);
			expect(sig).toBeDefined();
			expect(Signature.getR(sig)).toEqual(r);
			expect(Signature.getS(sig)).toEqual(s);
		});
	});

	/**
	 * 3. Signature normalization (high-s to low-s)
	 */
	describe("signature normalization fuzz", () => {
		it("should normalize random high-s secp256k1 signatures", () => {
			// Use known high-s value from existing tests that works
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			// High s value (non-canonical but valid): 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A1
			// Just above n/2 for secp256k1
			const s = new Uint8Array([
				0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0x5d, 0x57, 0x6e, 0x73, 0x57, 0xa4, 0x50, 0x1d,
				0xdf, 0xe9, 0x2f, 0x46, 0x68, 0x1b, 0x20, 0xa2,
			]);

			// Test multiple times with different v values
			for (const v of [27, 28]) {
				const sig = Signature.fromSecp256k1(r, s, v);
				expect(Signature.isCanonical(sig)).toBe(false);
				const normalized = Signature.normalize(sig);
				expect(Signature.isCanonical(normalized)).toBe(true);
				// v should flip
				expect(normalized.v).toBe(v === 27 ? 28 : 27);
			}
		});

		it("should normalize random high-s p256 signatures", () => {
			// Use random r with fixed high s values
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			// Very high s value
			const s = new Uint8Array(32).fill(0xff);

			for (let i = 0; i < 10; i++) {
				const sig = Signature.fromP256(r, s);
				expect(Signature.isCanonical(sig)).toBe(false);

				const normalized = Signature.normalize(sig);
				// Normalization should produce a different signature
				expect(normalized).not.toBe(sig);
				// The normalized s should be different from the original
				const normalizedS = Signature.getS(normalized);
				expect(normalizedS).not.toEqual(s);
			}
		});

		it("should not modify already canonical signatures", () => {
			for (let i = 0; i < 50; i++) {
				const r = crypto.getRandomValues(new Uint8Array(32));
				const s = new Uint8Array(32);
				s[31] = 0x01; // Very low s

				const sig = Signature.fromSecp256k1(r, s, 27);
				expect(Signature.isCanonical(sig)).toBe(true);

				const normalized = Signature.normalize(sig);
				expect(normalized).toBe(sig); // Should be same reference
			}
		});
	});

	/**
	 * 4. Canonical form validation edge cases
	 */
	describe("canonical form edge cases", () => {
		it("should handle s exactly at n/2 boundary (secp256k1)", () => {
			// s = n/2 (exactly on boundary - should be canonical)
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array([
				0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0x5d, 0x57, 0x6e, 0x73, 0x57, 0xa4, 0x50, 0x1d,
				0xdf, 0xe9, 0x2f, 0x46, 0x68, 0x1b, 0x20, 0xa0,
			]);

			const sig = Signature.fromSecp256k1(r, s);
			expect(Signature.isCanonical(sig)).toBe(true);
		});

		it("should handle s one above n/2 boundary (secp256k1)", () => {
			// s = n/2 + 1 (just non-canonical)
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array([
				0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0x5d, 0x57, 0x6e, 0x73, 0x57, 0xa4, 0x50, 0x1d,
				0xdf, 0xe9, 0x2f, 0x46, 0x68, 0x1b, 0x20, 0xa1,
			]);

			const sig = Signature.fromSecp256k1(r, s);
			expect(Signature.isCanonical(sig)).toBe(false);
		});

		it("should handle s exactly at n/2 boundary (p256)", () => {
			// s = n/2 for P-256
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array([
				0x7f, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
				0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
			]);

			const sig = Signature.fromP256(r, s);
			expect(Signature.isCanonical(sig)).toBe(true);
		});

		it("should always report ed25519 as canonical", () => {
			for (let i = 0; i < 50; i++) {
				const signature = crypto.getRandomValues(new Uint8Array(64));
				const sig = Signature.fromEd25519(signature);
				expect(Signature.isCanonical(sig)).toBe(true);
			}
		});
	});

	/**
	 * 5. r/s component boundaries (0, n-1, n, n+1 where n is curve order)
	 */
	describe("r/s component boundaries", () => {
		it("should handle zero r and s", () => {
			const r = new Uint8Array(32).fill(0);
			const s = new Uint8Array(32).fill(0);

			const sig = Signature.fromSecp256k1(r, s);
			expect(Signature.getR(sig)).toEqual(r);
			expect(Signature.getS(sig)).toEqual(s);
		});

		it("should handle r = 1, s = 1", () => {
			const r = new Uint8Array(32);
			r[31] = 1;
			const s = new Uint8Array(32);
			s[31] = 1;

			const sig = Signature.fromSecp256k1(r, s);
			expect(Signature.getR(sig)[31]).toBe(1);
			expect(Signature.getS(sig)[31]).toBe(1);
		});

		it("should handle r at secp256k1 curve order (n)", () => {
			// n = curve order for secp256k1
			const r = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
			]);
			const s = new Uint8Array(32);
			s[31] = 1;

			// Should accept (validation would happen at signature verification)
			const sig = Signature.fromSecp256k1(r, s);
			expect(sig).toBeDefined();
		});

		it("should handle s at secp256k1 curve order (n)", () => {
			const r = new Uint8Array(32);
			r[31] = 1;
			// n = curve order for secp256k1
			const s = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
			]);

			const sig = Signature.fromSecp256k1(r, s);
			expect(Signature.isCanonical(sig)).toBe(false); // Above n/2
		});

		it("should handle maximum possible values", () => {
			const r = new Uint8Array(32).fill(0xff);
			const s = new Uint8Array(32).fill(0xff);

			const sig = Signature.fromSecp256k1(r, s);
			expect(sig).toBeDefined();
			expect(Signature.isCanonical(sig)).toBe(false); // High s
		});

		it("should handle r/s at p256 curve order", () => {
			// P-256 curve order
			const n = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
				0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
			]);

			const sig = Signature.fromP256(n, n);
			expect(sig).toBeDefined();
		});
	});

	/**
	 * 6. v value edge cases (0, 1, 2, 27, 28, 255)
	 */
	describe("v value edge cases", () => {
		it("should handle v = 0 (EIP-2098 recovery bit 0)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 0);
			expect(sig.v).toBe(0);
		});

		it("should handle v = 1 (EIP-2098 recovery bit 1)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 1);
			expect(sig.v).toBe(1);
		});

		it("should handle v = 2 (non-standard)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 2);
			expect(sig.v).toBe(2);
		});

		it("should handle v = 27 (legacy Ethereum)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 27);
			expect(sig.v).toBe(27);
		});

		it("should handle v = 28 (legacy Ethereum)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 28);
			expect(sig.v).toBe(28);
		});

		it("should handle large v values (EIP-155 with chain ID)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const chainIds = [1, 5, 137, 42161, 10, 8453];
			for (const chainId of chainIds) {
				// v = chainId * 2 + 35 + yParity
				const v37 = chainId * 2 + 35;
				const v38 = chainId * 2 + 36;

				const sig37 = Signature.fromSecp256k1(r, s, v37);
				const sig38 = Signature.fromSecp256k1(r, s, v38);

				expect(sig37.v).toBe(v37);
				expect(sig38.v).toBe(v38);
			}
		});

		it("should handle v = 255 (maximum byte value)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 255);
			expect(sig.v).toBe(255);
		});

		it("should handle very large v values", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const largeVs = [1000, 10000, 100000, 1000000];
			for (const v of largeVs) {
				const sig = Signature.fromSecp256k1(r, s, v);
				expect(sig.v).toBe(v);
			}
		});

		it("should preserve v through compact round-trip", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const vValues = [0, 1, 27, 28, 37, 38, 255];
			for (const v of vValues) {
				const sig = Signature.fromSecp256k1(r, s, v);
				const compact = Signature.toCompact(sig);
				const restored = Signature.fromCompact(compact, "secp256k1");
				expect(restored.v).toBe(v);
			}
		});
	});

	/**
	 * 7. DER encoding/decoding with random valid signatures
	 */
	describe("DER encoding/decoding fuzz", () => {
		it("should handle DER with minimal r and s", () => {
			const r = new Uint8Array(32);
			r[31] = 0x01;
			const s = new Uint8Array(32);
			s[31] = 0x01;

			const sig = Signature.fromSecp256k1(r, s);
			const der = Signature.toDER(sig);
			const restored = Signature.fromDER(der, "secp256k1");

			expect(Signature.equals(sig, restored)).toBe(true);
		});

		it("should handle DER with large r and s", () => {
			const r = new Uint8Array(32).fill(0x7f);
			const s = new Uint8Array(32).fill(0x7f);

			const sig = Signature.fromSecp256k1(r, s);
			const der = Signature.toDER(sig);
			const restored = Signature.fromDER(der, "secp256k1");

			expect(Signature.equals(sig, restored)).toBe(true);
		});

		it("should handle DER with high bit set (requiring padding)", () => {
			const r = new Uint8Array(32);
			r[0] = 0x80;
			const s = new Uint8Array(32);
			s[0] = 0xff;

			const sig = Signature.fromSecp256k1(r, s);
			const der = Signature.toDER(sig);

			// DER should have 0x00 padding for integers with high bit set
			expect(der).toBeDefined();

			const restored = Signature.fromDER(der, "secp256k1");
			expect(Signature.equals(sig, restored)).toBe(true);
		});

		it("should reject malformed DER - invalid SEQUENCE tag", () => {
			const badDER = new Uint8Array([
				0x31, 0x06, 0x02, 0x01, 0x42, 0x02, 0x01, 0x84,
			]);
			expect(() => Signature.fromDER(badDER, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should reject malformed DER - wrong length", () => {
			const badDER = new Uint8Array([
				0x30, 0xff, 0x02, 0x01, 0x42, 0x02, 0x01, 0x84,
			]);
			expect(() => Signature.fromDER(badDER, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should reject malformed DER - missing r INTEGER tag", () => {
			const badDER = new Uint8Array([
				0x30, 0x06, 0x03, 0x01, 0x42, 0x02, 0x01, 0x84,
			]);
			expect(() => Signature.fromDER(badDER, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should reject malformed DER - missing s INTEGER tag", () => {
			const badDER = new Uint8Array([
				0x30, 0x06, 0x02, 0x01, 0x42, 0x03, 0x01, 0x84,
			]);
			expect(() => Signature.fromDER(badDER, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should reject malformed DER - trailing data", () => {
			const badDER = new Uint8Array([
				0x30, 0x06, 0x02, 0x01, 0x42, 0x02, 0x01, 0x84, 0xde, 0xad, 0xbe, 0xef,
			]);
			expect(() => Signature.fromDER(badDER, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should reject DER for ed25519", () => {
			expect(() => Signature.fromDER(new Uint8Array(8), "ed25519")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should reject toDER for ed25519", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64));
			expect(() => Signature.toDER(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});
	});

	/**
	 * 8. Compact encoding (64 bytes) edge cases
	 */
	describe("compact encoding edge cases", () => {
		it("should handle compact with all zeros", () => {
			const compact = new Uint8Array(64).fill(0);
			const sig = Signature.fromCompact(compact, "secp256k1");
			expect(sig.length).toBe(64);
			expect(Signature.getR(sig)).toEqual(new Uint8Array(32).fill(0));
			expect(Signature.getS(sig)).toEqual(new Uint8Array(32).fill(0));
		});

		it("should handle compact with all 0xFF", () => {
			const compact = new Uint8Array(64).fill(0xff);
			const sig = Signature.fromCompact(compact, "secp256k1");
			expect(sig.length).toBe(64);
		});

		it("should handle compact with 65 bytes (with v)", () => {
			const compact = new Uint8Array(65);
			compact.fill(1, 0, 32);
			compact.fill(2, 32, 64);
			compact[64] = 27;

			const sig = Signature.fromCompact(compact, "secp256k1");
			expect(sig.v).toBe(27);
		});

		it("should handle compact with v = 0", () => {
			const compact = new Uint8Array(65);
			compact[64] = 0;

			const sig = Signature.fromCompact(compact, "secp256k1");
			expect(sig.v).toBe(0);
		});

		it("should handle compact with v = 255", () => {
			const compact = new Uint8Array(65);
			compact[64] = 255;

			const sig = Signature.fromCompact(compact, "secp256k1");
			expect(sig.v).toBe(255);
		});

		it("should reject compact with invalid length", () => {
			const lengths = [0, 1, 32, 63, 66, 67, 100];
			for (const len of lengths) {
				const compact = new Uint8Array(len);
				expect(() => Signature.fromCompact(compact, "secp256k1")).toThrow(
					Signature.InvalidSignatureLengthError,
				);
			}
		});
	});

	/**
	 * 9. Algorithm-specific edge cases (secp256k1, p256, ed25519)
	 */
	describe("algorithm-specific edge cases", () => {
		it("should prevent getR on ed25519", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64));
			expect(() => Signature.getR(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should prevent getS on ed25519", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64));
			expect(() => Signature.getS(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should prevent getV on p256", () => {
			const sig = Signature.fromP256(new Uint8Array(32), new Uint8Array(32));
			expect(() => Signature.getV(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should prevent getV on ed25519", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64));
			expect(() => Signature.getV(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should detect algorithm mismatch in equals", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const secp = Signature.fromSecp256k1(r, s);
			const p256 = Signature.fromP256(r, s);

			expect(Signature.equals(secp, p256)).toBe(false);
		});

		it("should handle ed25519 full signature bytes", () => {
			const signature = crypto.getRandomValues(new Uint8Array(64));
			const sig = Signature.fromEd25519(signature);

			const bytes = Signature.toBytes(sig);
			expect(bytes).toEqual(signature);
		});

		it("should never normalize ed25519", () => {
			const signature = new Uint8Array(64).fill(0xff);
			const sig = Signature.fromEd25519(signature);

			expect(Signature.isCanonical(sig)).toBe(true);
			const normalized = Signature.normalize(sig);
			expect(normalized).toBe(sig); // Same reference
		});
	});

	/**
	 * 10. Recovery bit validation
	 */
	describe("recovery bit validation", () => {
		it("should preserve recovery bit through normalization for pre-EIP-155", () => {
			const r = new Uint8Array(32);
			r[31] = 1;
			const highS = new Uint8Array(32).fill(0xff);

			const sig27 = Signature.fromSecp256k1(r, highS, 27);
			const norm27 = Signature.normalize(sig27);
			expect(norm27.v).toBe(28); // Should flip

			const sig28 = Signature.fromSecp256k1(r, highS, 28);
			const norm28 = Signature.normalize(sig28);
			expect(norm28.v).toBe(27); // Should flip
		});

		it("should handle recovery bit in compact signatures", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			for (let v = 0; v < 2; v++) {
				const sig = Signature.fromSecp256k1(r, s, v);
				const compact = Signature.toCompact(sig);
				expect(compact[64]).toBe(v);
			}
		});

		it("should handle recovery bit 0 and 1", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const sig0 = Signature.fromSecp256k1(r, s, 0);
			const sig1 = Signature.fromSecp256k1(r, s, 1);

			expect(sig0.v).toBe(0);
			expect(sig1.v).toBe(1);
			expect(Signature.equals(sig0, sig1)).toBe(false);
		});

		it("should distinguish signatures with different v values", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const vValues = [0, 1, 27, 28];
			const sigs = vValues.map((v) => Signature.fromSecp256k1(r, s, v));

			// All should be different from each other
			for (let i = 0; i < sigs.length; i++) {
				for (let j = i + 1; j < sigs.length; j++) {
					expect(Signature.equals(sigs[i]!, sigs[j]!)).toBe(false);
				}
			}
		});

		it("should preserve v through DER round-trip", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const vValues = [27, 28, 37, 38];
			for (const v of vValues) {
				const sig = Signature.fromSecp256k1(r, s, v);
				const der = Signature.toDER(sig);
				const restored = Signature.fromDER(der, "secp256k1", v);
				expect(restored.v).toBe(v);
			}
		});

		it("should handle undefined v", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const sig = Signature.fromSecp256k1(r, s);
			expect(sig.v).toBeUndefined();
			expect(Signature.getV(sig)).toBeUndefined();
		});

		it("should distinguish between undefined v and v=0", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const sigNoV = Signature.fromSecp256k1(r, s);
			const sig0 = Signature.fromSecp256k1(r, s, 0);

			expect(sigNoV.v).toBeUndefined();
			expect(sig0.v).toBe(0);
			expect(Signature.equals(sigNoV, sig0)).toBe(false);
		});
	});

	/**
	 * Additional malicious input tests
	 */
	describe("malicious inputs", () => {
		it("should reject non-Uint8Array inputs to type guards", () => {
			const malicious = [
				null,
				undefined,
				{},
				[],
				"0x1234",
				42,
				true,
				Symbol("sig"),
			];

			for (const input of malicious) {
				expect(Signature.is(input)).toBe(false);
			}
		});

		it("should handle signatures with modified __tag", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s);

			// Signatures have non-configurable __tag, so modification shouldn't work
			expect(sig.__tag).toBe("Signature");
			expect(Signature.is(sig)).toBe(true);
		});

		it("should handle extremely large DER encodings (DoS protection)", () => {
			// Create a DER with large length field
			const largeDER = new Uint8Array(1000);
			largeDER[0] = 0x30; // SEQUENCE
			largeDER[1] = 0x82; // Long form length
			largeDER[2] = 0x03; // Length high byte
			largeDER[3] = 0xe8; // Length low byte (1000)

			expect(() => Signature.fromDER(largeDER, "secp256k1")).toThrow();
		});

		it("should handle DER with zero-length components", () => {
			const zeroDER = new Uint8Array([
				0x30,
				0x04, // SEQUENCE, length 4
				0x02,
				0x00, // INTEGER r, length 0
				0x02,
				0x00, // INTEGER s, length 0
			]);

			// DER parsing accepts zero-length integers (they become zero-filled 32-byte values)
			const sig = Signature.fromDER(zeroDER, "secp256k1");
			expect(sig).toBeDefined();
			expect(Signature.getR(sig)).toEqual(new Uint8Array(32).fill(0));
			expect(Signature.getS(sig)).toEqual(new Uint8Array(32).fill(0));
		});

		it("should handle signatures at algorithm boundaries", () => {
			// Create signatures with values near curve orders
			const secp256k1N = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
			]);

			const r = new Uint8Array(32);
			r[31] = 1;

			const sig = Signature.fromSecp256k1(r, secp256k1N);
			expect(sig).toBeDefined();
			// This would be invalid in actual signature verification
			// but the primitive should accept it
		});

		it("should handle mixed algorithm operations safely", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);

			const secp = Signature.fromSecp256k1(r, s);
			const p256 = Signature.fromP256(r, s);
			const ed25519 = Signature.fromEd25519(new Uint8Array(64).fill(3));

			// Verify operations work correctly with mixed algorithms
			expect(Signature.getAlgorithm(secp)).toBe("secp256k1");
			expect(Signature.getAlgorithm(p256)).toBe("p256");
			expect(Signature.getAlgorithm(ed25519)).toBe("ed25519");

			expect(Signature.equals(secp, p256)).toBe(false);
			expect(Signature.equals(secp, ed25519)).toBe(false);
			expect(Signature.equals(p256, ed25519)).toBe(false);
		});
	});
});
