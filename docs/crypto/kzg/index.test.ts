/**
 * Tests for code examples in docs/crypto/kzg/index.mdx
 *
 * API Discrepancies documented:
 * - Docs use `Kzg` but actual export is `KZG`
 * - Docs use `Kzg.verify()` but actual API is `KZG.verifyKzgProof()`
 * - Docs use `Kzg.verifyBatch()` but actual API is `KZG.verifyBlobKzgProofBatch()`
 * - Docs use `Blob(131072)` but actual API uses `KZG.createEmptyBlob()` or `KZG.generateRandomBlob()`
 * - Docs show Factory API (`Kzg.CommitmentFactory`) which doesn't exist - use `BlobToKzgCommitment` factory
 * - randomFieldElement() function shown in docs doesn't exist
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasNativeKzg } from "./test-utils.js";

describe.skipIf(!hasNativeKzg)(
	"docs/crypto/kzg/index.mdx - KZG Commitments",
	async () => {
		// Import KZG module
		const {
			KZG,
			BYTES_PER_BLOB,
			BYTES_PER_COMMITMENT,
			BYTES_PER_PROOF,
			BYTES_PER_FIELD_ELEMENT,
			FIELD_ELEMENTS_PER_BLOB,
			KzgError,
			KzgNotInitializedError,
			KzgInvalidBlobError,
		} = await import("../../../src/crypto/KZG/index.js");

		beforeAll(() => {
			if (!KZG.isInitialized()) {
				KZG.loadTrustedSetup();
			}
		});

		afterAll(() => {
			KZG.freeTrustedSetup();
		});

	describe("Quick Start - Standard API", () => {
		/**
		 * From index.mdx:
		 * ```typescript
		 * // Load trusted setup (once, required before operations)
		 * Kzg.loadTrustedSetup();
		 *
		 * // Create blob (131,072 bytes = 4096 field elements × 32 bytes)
		 * const blob = Blob(131072);
		 *
		 * // Kzg.Commitment(blob) → 48-byte commitment
		 * const commitment = Kzg.Commitment(blob);
		 *
		 * // Kzg.Proof(blob, z) → proof at evaluation point
		 * const z = randomFieldElement();
		 * const { proof, y } = Kzg.Proof(blob, z);
		 *
		 * // Kzg.verify(commitment, z, y, proof) → boolean
		 * const valid = Kzg.verify(commitment, z, y, proof);
		 * ```
		 *
		 * DISCREPANCY: Docs use `Kzg` but export is `KZG`
		 * DISCREPANCY: Docs use `Blob(131072)` but actual API is `KZG.createEmptyBlob()`
		 * DISCREPANCY: Docs use `Kzg.verify()` but actual API is `KZG.verifyKzgProof()`
		 */
		it("should demonstrate basic KZG workflow", () => {
			// Trusted setup already loaded in beforeAll

			// Create blob - actual API (docs show Blob(131072))
			const blob = KZG.createEmptyBlob();
			expect(blob.length).toBe(BYTES_PER_BLOB);
			expect(blob.length).toBe(131072);

			// Generate commitment - works as documented
			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(48);

			// Create evaluation point (docs show randomFieldElement())
			const z = new Uint8Array(32);
			z[31] = 0x42;

			// Compute proof - works as documented
			const { proof, y } = KZG.Proof(blob, z);
			expect(proof.length).toBe(48);
			expect(y.length).toBe(32);

			// Verify proof - actual API (docs show Kzg.verify())
			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});

		it("should verify blob size matches documentation", () => {
			// Docs state: "131,072 bytes = 4096 field elements × 32 bytes"
			expect(BYTES_PER_BLOB).toBe(131072);
			expect(FIELD_ELEMENTS_PER_BLOB).toBe(4096);
			expect(BYTES_PER_FIELD_ELEMENT).toBe(32);
			expect(FIELD_ELEMENTS_PER_BLOB * BYTES_PER_FIELD_ELEMENT).toBe(
				BYTES_PER_BLOB,
			);
		});

		it("should verify commitment size matches documentation", () => {
			// Docs state: "48-byte commitment"
			expect(BYTES_PER_COMMITMENT).toBe(48);
		});
	});

	describe("EIP-4844 Constants", () => {
		/**
		 * From index.mdx:
		 * - Size: 131,072 bytes (~126 KB)
		 * - Structure: 4,096 field elements × 32 bytes
		 * - Constraint: Each element < BLS12-381 scalar field modulus
		 */
		it("should have correct EIP-4844 blob constants", () => {
			expect(BYTES_PER_BLOB).toBe(131072);
			expect(FIELD_ELEMENTS_PER_BLOB).toBe(4096);
			expect(BYTES_PER_FIELD_ELEMENT).toBe(32);
		});

		it("should have correct proof/commitment sizes", () => {
			// From docs: "Succinct: 48-byte commitment for ~126 KB blob"
			expect(BYTES_PER_COMMITMENT).toBe(48);
			expect(BYTES_PER_PROOF).toBe(48);
		});
	});

	describe("Mathematical Foundation - Polynomial Commitments", () => {
		/**
		 * From index.mdx:
		 * Represent blob as polynomial:
		 * p(x) = a₀ + a₁x + a₂x² + ... + a₄₀₉₅x⁴⁰⁹⁵
		 *
		 * Commitment: C = [p(τ)]₁ (G1 point on BLS12-381)
		 */
		it("should produce binding commitments", () => {
			const blob1 = KZG.createEmptyBlob();
			const blob2 = KZG.generateRandomBlob();

			const commitment1 = KZG.Commitment(blob1);
			const commitment2 = KZG.Commitment(blob2);

			// Different blobs must produce different commitments
			expect(commitment1).not.toEqual(commitment2);
		});

		it("should produce deterministic commitments", () => {
			const blob = KZG.generateRandomBlob(12345);

			const commitment1 = KZG.Commitment(blob);
			const commitment2 = KZG.Commitment(blob);

			// Same blob must produce same commitment
			expect(commitment1).toEqual(commitment2);
		});
	});

	describe("Trusted Setup", () => {
		/**
		 * From index.mdx:
		 * - 140,000+ participants (Ethereum KZG ceremony 2023)
		 * - Setup Size: ~1 MB (4096 G1 points + 65 G2 points)
		 */
		it("should require trusted setup before operations", () => {
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			const blob = KZG.createEmptyBlob();
			expect(() => KZG.Commitment(blob)).toThrow(KzgNotInitializedError);

			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);
		});

		it("should allow idempotent loadTrustedSetup calls", () => {
			KZG.loadTrustedSetup();
			KZG.loadTrustedSetup();
			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);
		});
	});

	describe("Point Evaluation Precompile", () => {
		/**
		 * From index.mdx:
		 * Address: 0x0a (precompile 0x0a)
		 * Gas Cost: 50,000 gas (fixed)
		 *
		 * Input format (192 bytes):
		 * - versionedHash: 32 bytes
		 * - z: 32 bytes (evaluation point)
		 * - y: 32 bytes (claimed value)
		 * - commitment: 48 bytes
		 * - proof: 48 bytes
		 */
		it("should produce correctly sized components for precompile input", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			// Precompile input sizes
			expect(z.length).toBe(32); // evaluation point
			expect(y.length).toBe(32); // claimed value
			expect(commitment.length).toBe(48); // KZG commitment
			expect(proof.length).toBe(48); // KZG proof

			// Total: 32 + 32 + 32 + 48 + 48 = 192 bytes (matching docs)
			const totalInputSize = 32 + z.length + y.length + commitment.length + proof.length;
			expect(totalInputSize).toBe(192);
		});
	});

	describe("Batch Verification", () => {
		/**
		 * From index.mdx:
		 * ```typescript
		 * const batchValid = Kzg.verifyBatch(
		 *   blobs, commitments, proofs
		 * );
		 * ```
		 *
		 * DISCREPANCY: Docs use `Kzg.verifyBatch()` but actual API is `KZG.verifyBlobKzgProofBatch()`
		 */
		it("should verify batch of blob proofs", () => {
			const blobs = [
				KZG.generateRandomBlob(1),
				KZG.generateRandomBlob(2),
				KZG.generateRandomBlob(3),
			];
			const commitments = blobs.map((blob) => KZG.Commitment(blob));
			const proofs = blobs.map((blob, i) =>
				KZG.computeBlobKzgProof(blob, commitments[i]!),
			);

			// Actual API (docs show Kzg.verifyBatch)
			const allValid = KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
			expect(allValid).toBe(true);
		});

		it("should handle empty batch", () => {
			const valid = KZG.verifyBlobKzgProofBatch([], [], []);
			expect(valid).toBe(true);
		});

		it("should reject mismatched array lengths", () => {
			const blobs = [KZG.generateRandomBlob(1)];
			const commitments = [new Uint8Array(48), new Uint8Array(48)];
			const proofs = [new Uint8Array(48)];

			expect(() =>
				KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs),
			).toThrow(KzgError);
		});
	});

	describe("Performance Characteristics", () => {
		/**
		 * From index.mdx:
		 * Native (c-kzg-4844):
		 * - Blob to commitment: ~50 ms
		 * - Compute proof: ~50 ms
		 * - Verify proof: ~2 ms
		 */
		it("should compute commitment within performance bounds", () => {
			const blob = KZG.generateRandomBlob();

			const start = performance.now();
			KZG.Commitment(blob);
			const duration = performance.now() - start;

			// Generous bound (docs claim ~50ms)
			expect(duration).toBeLessThan(200);
		});

		it("should compute proof within performance bounds", () => {
			const blob = KZG.generateRandomBlob();
			const z = new Uint8Array(32);

			const start = performance.now();
			KZG.Proof(blob, z);
			const duration = performance.now() - start;

			// Generous bound (docs claim ~50ms)
			expect(duration).toBeLessThan(200);
		});

		it("should verify proof within performance bounds", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			const start = performance.now();
			KZG.verifyKzgProof(commitment, z, y, proof);
			const duration = performance.now() - start;

			// Generous bound (docs claim ~2ms)
			expect(duration).toBeLessThan(100);
		});
	});

	describe("Gas Economics", () => {
		/**
		 * From index.mdx:
		 * - Target: 3 blobs per block (~393 KB)
		 * - Max: 6 blobs per block (~786 KB)
		 */
		it("should support max blobs per block (6)", () => {
			const maxBlobs = 6;
			const blobs = Array.from({ length: maxBlobs }, (_, i) =>
				KZG.generateRandomBlob(i),
			);

			const commitments = blobs.map((b) => KZG.Commitment(b));
			const proofs = blobs.map((b, i) =>
				KZG.computeBlobKzgProof(b, commitments[i]!),
			);

			const allValid = KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
			expect(allValid).toBe(true);
		});

		it("should verify total blob data size per block", () => {
			// Target: 3 blobs = 3 * 131072 = 393,216 bytes (~393 KB)
			expect(3 * BYTES_PER_BLOB).toBe(393216);

			// Max: 6 blobs = 6 * 131072 = 786,432 bytes (~786 KB)
			expect(6 * BYTES_PER_BLOB).toBe(786432);
		});
	});

	describe("Security Properties", () => {
		/**
		 * From index.mdx:
		 * - Binding: Cannot change blob after commitment
		 * - Cannot forge proof for wrong evaluation value
		 */
		it("should produce binding commitments (cannot change blob after)", () => {
			const blob1 = KZG.generateRandomBlob(1);
			const blob2 = KZG.generateRandomBlob(2);

			const commitment1 = KZG.Commitment(blob1);
			const commitment2 = KZG.Commitment(blob2);

			// Different blobs produce different commitments
			expect(commitment1).not.toEqual(commitment2);
		});

		it("should reject forged proofs", () => {
			const blob1 = KZG.generateRandomBlob(1);
			const blob2 = KZG.generateRandomBlob(2);

			const commitment1 = KZG.Commitment(blob1);
			const z = new Uint8Array(32);

			// Create proof for blob2
			const { proof: forgedProof, y: forgedY } = KZG.Proof(blob2, z);

			// Try to verify with commitment1 - should fail
			const valid = KZG.verifyKzgProof(commitment1, z, forgedY, forgedProof);
			expect(valid).toBe(false);
		});

		it("should reject corrupted proofs", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			// Corrupt proof
			const corruptedProof = new Uint8Array(proof);
			corruptedProof[0]! ^= 1;

			const valid = KZG.verifyKzgProof(commitment, z, y, corruptedProof);
			expect(valid).toBe(false);
		});
	});
});
