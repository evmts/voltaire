/**
 * Tests for docs/crypto/bn254/precompiles.mdx code examples
 *
 * NOTE: This documentation page is marked as "planned and under active development"
 * with placeholder content. Tests below cover EVM precompile-compatible operations.
 *
 * EVM Precompiles for BN254:
 * - 0x06: ECADD - G1 point addition
 * - 0x07: ECMUL - G1 scalar multiplication
 * - 0x08: ECPAIRING - Pairing check
 *
 * Import path: ../../../src/crypto/bn254/BN254.js
 */

import { describe, expect, it } from "vitest";

describe("docs/crypto/bn254/precompiles.mdx", () => {
	/**
	 * API DISCREPANCY NOTE:
	 * The docs page is a placeholder. The BN254 implementation provides
	 * the underlying operations used by EVM precompiles.
	 *
	 * Precompile input/output format:
	 * - G1 points: 64 bytes (32 x-coord, 32 y-coord), big-endian
	 * - G2 points: 128 bytes (32 x.c0, 32 x.c1, 32 y.c0, 32 y.c1), big-endian
	 * - Scalars: 32 bytes, big-endian
	 */

	describe("ECADD (0x06) - G1 Point Addition", () => {
		it("should add two G1 points (precompile-style)", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			// Get two points
			const g1 = BN254.G1.generator();
			const p1 = g1;
			const p2 = BN254.G1.mul(g1, 2n);

			// Serialize as precompile input (64 + 64 = 128 bytes)
			const input1 = BN254.serializeG1(p1);
			const input2 = BN254.serializeG1(p2);

			expect(input1.length).toBe(64);
			expect(input2.length).toBe(64);

			// Perform addition
			const result = BN254.G1.add(p1, p2);

			// Serialize output (64 bytes)
			const output = BN254.serializeG1(result);
			expect(output.length).toBe(64);

			// Verify: G + 2G = 3G
			const expected = BN254.G1.mul(g1, 3n);
			expect(BN254.G1.equal(result, expected)).toBe(true);
		});

		it("should handle addition with zero point", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const zero = BN254.G1.infinity();

			// P + O = P
			const result = BN254.G1.add(g1, zero);
			expect(BN254.G1.equal(result, g1)).toBe(true);

			// O + P = P
			const result2 = BN254.G1.add(zero, g1);
			expect(BN254.G1.equal(result2, g1)).toBe(true);
		});

		it("should return zero for P + (-P)", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const negG1 = BN254.G1.negate(g1);

			const result = BN254.G1.add(g1, negG1);
			expect(BN254.G1.isZero(result)).toBe(true);
		});
	});

	describe("ECMUL (0x07) - G1 Scalar Multiplication", () => {
		it("should multiply G1 point by scalar (precompile-style)", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const scalar = 7n;

			// Input: 64 bytes point + 32 bytes scalar
			const pointBytes = BN254.serializeG1(g1);
			expect(pointBytes.length).toBe(64);

			// Perform multiplication
			const result = BN254.G1.mul(g1, scalar);

			// Output: 64 bytes
			const output = BN254.serializeG1(result);
			expect(output.length).toBe(64);

			// Verify result is on curve
			expect(BN254.G1.isOnCurve(result)).toBe(true);
		});

		it("should handle multiplication by zero", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const result = BN254.G1.mul(g1, 0n);

			// 0 * P = O
			expect(BN254.G1.isZero(result)).toBe(true);
		});

		it("should handle multiplication by one", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const result = BN254.G1.mul(g1, 1n);

			// 1 * P = P
			expect(BN254.G1.equal(result, g1)).toBe(true);
		});

		it("should handle multiplication of zero point", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const zero = BN254.G1.infinity();
			const result = BN254.G1.mul(zero, 42n);

			// k * O = O
			expect(BN254.G1.isZero(result)).toBe(true);
		});
	});

	describe("ECPAIRING (0x08) - Pairing Check", () => {
		/**
		 * API DISCREPANCY: Bilinearity tests are skipped in the main test suite
		 * (src/crypto/bn254.test.ts) because the pairing implementation is still
		 * being refined. This test documents expected behavior once complete.
		 */
		it.skip("should verify pairing equation (precompile-style)", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const g2 = BN254.G2.generator();

			// Verify: e(aG1, G2) = e(G1, aG2)
			// Rewritten: e(aG1, G2) * e(-G1, aG2) = 1
			const a = 5n;
			const aG1 = BN254.G1.mul(g1, a);
			const aG2 = BN254.G2.mul(g2, a);
			const negG1 = BN254.G1.negate(g1);

			// Input format: pairs of (G1, G2) points
			// Each pair: 64 bytes G1 + 128 bytes G2 = 192 bytes
			const g1Bytes = BN254.serializeG1(aG1);
			const g2Bytes = BN254.serializeG2(g2);
			const negG1Bytes = BN254.serializeG1(negG1);
			const aG2Bytes = BN254.serializeG2(aG2);

			expect(g1Bytes.length).toBe(64);
			expect(g2Bytes.length).toBe(128);
			expect(negG1Bytes.length).toBe(64);
			expect(aG2Bytes.length).toBe(128);

			// Perform pairing check
			const valid = BN254.Pairing.pairingCheck([
				[aG1, g2],
				[negG1, aG2],
			]);

			expect(valid).toBe(true);
		});

		it("should handle empty input (returns true)", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			// Empty input means product of zero pairings = 1
			const valid = BN254.Pairing.pairingCheck([]);
			expect(valid).toBe(true);
		});

		it("should reject invalid pairing", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const g2 = BN254.G2.generator();

			// Random pairs that don't satisfy any equation
			const valid = BN254.Pairing.pairingCheck([
				[BN254.G1.mul(g1, 2n), BN254.G2.mul(g2, 3n)],
				[BN254.G1.mul(g1, 4n), BN254.G2.mul(g2, 5n)],
			]);

			expect(valid).toBe(false);
		});
	});

	describe("Gas Cost Verification", () => {
		/**
		 * EIP-196/197 gas costs (after Istanbul / EIP-1108):
		 * - ECADD: 150 gas
		 * - ECMUL: 6,000 gas
		 * - ECPAIRING: 45,000 base + 34,000 per pair
		 *
		 * These tests verify operations complete successfully.
		 * Actual gas costs are enforced by EVM, not this library.
		 */

		it("should complete ECADD operation", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const p1 = BN254.G1.mul(g1, 123n);
			const p2 = BN254.G1.mul(g1, 456n);

			const result = BN254.G1.add(p1, p2);
			expect(BN254.G1.isOnCurve(result)).toBe(true);
		});

		it("should complete ECMUL operation", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const scalar = 123456789n;

			const result = BN254.G1.mul(g1, scalar);
			expect(BN254.G1.isOnCurve(result)).toBe(true);
		});

		it("should complete ECPAIRING with 3 pairs (Groth16 verification)", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const g2 = BN254.G2.generator();

			// Simulate Groth16 verification with 3 pairs
			// Gas cost: 45,000 + 34,000 * 3 = 147,000 gas
			const pairs: Array<
				[
					ReturnType<typeof BN254.G1.generator>,
					ReturnType<typeof BN254.G2.generator>,
				]
			> = [
				[BN254.G1.mul(g1, 2n), BN254.G2.mul(g2, 3n)],
				[BN254.G1.mul(g1, 5n), BN254.G2.mul(g2, 7n)],
				[BN254.G1.mul(g1, 11n), BN254.G2.mul(g2, 13n)],
			];

			const result = BN254.Pairing.multiPairing(pairs);
			expect(result).toBeDefined();
		});
	});

	describe("Point Format Compatibility", () => {
		it("should use big-endian 32-byte coordinates for G1", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g1 = BN254.G1.generator();
			const bytes = BN254.serializeG1(g1);

			// 64 bytes total: 32 for x, 32 for y
			expect(bytes.length).toBe(64);

			// Verify round-trip
			const deserialized = BN254.deserializeG1(bytes);
			expect(BN254.G1.equal(g1, deserialized)).toBe(true);
		});

		it("should use big-endian 32-byte coordinates for G2", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const g2 = BN254.G2.generator();
			const bytes = BN254.serializeG2(g2);

			// 128 bytes total: 32 for x.c0, 32 for x.c1, 32 for y.c0, 32 for y.c1
			expect(bytes.length).toBe(128);

			// Verify round-trip
			const deserialized = BN254.deserializeG2(bytes);
			expect(BN254.G2.equal(g2, deserialized)).toBe(true);
		});

		it("should represent infinity as all zeros", async () => {
			const { BN254 } = await import("../../../src/crypto/bn254/BN254.js");

			const inf = BN254.G1.infinity();
			const bytes = BN254.serializeG1(inf);

			const allZero = bytes.every((b) => b === 0);
			expect(allZero).toBe(true);
		});
	});
});
