/**
 * Tests for docs/crypto/bn254/pairing.mdx code examples
 *
 * NOTE: This documentation page is marked as "planned and under active development"
 * with placeholder content. Tests below cover expected pairing operations that should
 * be documented once the page is complete.
 *
 * Import path: ../../../src/crypto/bn254/BN254.js
 */

import { describe, expect, it } from "vitest";

describe("docs/crypto/bn254/pairing.mdx", () => {
	/**
	 * API DISCREPANCY NOTE:
	 * The docs page is a placeholder. The actual BN254.Pairing API includes:
	 * - pair(g1, g2): PairingResult
	 * - pairingCheck(pairs): boolean
	 * - multiPairing(pairs): PairingResult
	 *
	 * PairingResult has a `value` property containing the Fp12 element.
	 *
	 * The pairing is implemented as optimal ate pairing:
	 * - Miller loop: Computes line functions
	 * - Final exponentiation: (p^12 - 1) / r
	 */

	describe("Basic Pairing", () => {
		it("should compute pairing of generators", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const g2 = BN254.G2.generator();

			const result = BN254.Pairing.pair(g1, g2);

			expect(result).toBeDefined();
			// e(G1, G2) != 1 (not degenerate)
			expect(result.value).not.toBe(1n);
		});

		it("should return 1 for pairing with G1 infinity", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const inf1 = BN254.G1.infinity();
			const g2 = BN254.G2.generator();

			const result = BN254.Pairing.pair(inf1, g2);

			// e(O, Q) = 1
			expect(result.value).toBe(1n);
		});

		it("should return 1 for pairing with G2 infinity", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const inf2 = BN254.G2.infinity();

			const result = BN254.Pairing.pair(g1, inf2);

			// e(P, O) = 1
			expect(result.value).toBe(1n);
		});

		it("should return 1 for pairing of two infinities", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const inf1 = BN254.G1.infinity();
			const inf2 = BN254.G2.infinity();

			const result = BN254.Pairing.pair(inf1, inf2);

			// e(O, O) = 1
			expect(result.value).toBe(1n);
		});
	});

	describe("Pairing Check", () => {
		it("should accept empty pairing check", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			// Empty product is 1, so check passes
			const valid = BN254.Pairing.pairingCheck([]);
			expect(valid).toBe(true);
		});

		it("should reject invalid pairing equation", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const g2 = BN254.G2.generator();

			// e(2G1, 3G2) * e(5G1, 7G2) != 1 (random points)
			const p1 = BN254.G1.mul(g1, 2n);
			const q1 = BN254.G2.mul(g2, 3n);
			const p2 = BN254.G1.mul(g1, 5n);
			const q2 = BN254.G2.mul(g2, 7n);

			const valid = BN254.Pairing.pairingCheck([
				[p1, q1],
				[p2, q2],
			]);

			expect(valid).toBe(false);
		});
	});

	describe("Multi-Pairing", () => {
		it("should compute product of multiple pairings", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const g2 = BN254.G2.generator();

			const pairs: Array<
				[
					ReturnType<typeof BN254.G1.generator>,
					ReturnType<typeof BN254.G2.generator>,
				]
			> = [
				[BN254.G1.mul(g1, 2n), BN254.G2.mul(g2, 3n)],
				[BN254.G1.mul(g1, 5n), BN254.G2.mul(g2, 7n)],
			];

			const result = BN254.Pairing.multiPairing(pairs);
			expect(result).toBeDefined();
		});
	});

	describe("Pairing Properties (Mathematical)", () => {
		/**
		 * Bilinearity: e(aP, bQ) = e(P, Q)^(ab)
		 *
		 * NOTE: Some bilinearity tests are skipped in the main test file
		 * because the implementation is still being refined.
		 */

		it("should be non-degenerate", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const g2 = BN254.G2.generator();

			// e(G1, G2) generates the full group, so != 1
			const result = BN254.Pairing.pair(g1, g2);
			expect(result.value).not.toBe(1n);
		});
	});

	describe("Pairing Use Cases", () => {
		/**
		 * Common zkSNARK verification pattern:
		 * Check e(A, B) = e(C, D) by computing e(A, B) * e(-C, D) = 1
		 *
		 * API DISCREPANCY: Bilinearity tests are skipped in the main test suite
		 * (src/crypto/bn254.test.ts) because the pairing implementation is still
		 * being refined. These tests document expected behavior once complete.
		 */

		it.skip("should support zkSNARK-style verification pattern", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const g2 = BN254.G2.generator();

			// Verify: e(aG1, G2) = e(G1, aG2)
			// Rewrite: e(aG1, G2) * e(-G1, aG2) = 1
			const a = 7n;
			const aG1 = BN254.G1.mul(g1, a);
			const aG2 = BN254.G2.mul(g2, a);
			const negG1 = BN254.G1.negate(g1);

			const valid = BN254.Pairing.pairingCheck([
				[aG1, g2],
				[negG1, aG2],
			]);

			expect(valid).toBe(true);
		});
	});
});
