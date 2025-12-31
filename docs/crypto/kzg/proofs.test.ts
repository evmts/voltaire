/**
 * Tests for code examples in docs/crypto/kzg/proofs.mdx
 *
 * API Discrepancies documented:
 * - Docs use `Kzg` but actual export is `KZG`
 * - Docs use `Blob(131072)` but actual API is `KZG.createEmptyBlob()`
 * - Docs use `Bytes32()` but actual API is `new Uint8Array(32)`
 * - Docs use `Kzg.verify()` but actual API is `KZG.verifyKzgProof()`
 * - Docs use `Kzg.verifyBlob()` but actual API is `KZG.verifyBlobKzgProof()`
 * - Docs use `Kzg.verifyBatch()` but actual API is `KZG.verifyBlobKzgProofBatch()`
 * - Docs show Factory API (`Kzg.ProofFactory`, etc.) which doesn't exist - use standalone factories
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasNativeKzg, hasCkzg } from "./test-utils.js";

describe.skipIf(!hasNativeKzg)("docs/crypto/kzg/proofs.mdx - KZG Proofs", async () => {
	const {
		KZG,
		BYTES_PER_PROOF,
		BYTES_PER_FIELD_ELEMENT,
		BYTES_PER_COMMITMENT,
		KzgError,
		KzgNotInitializedError,
		KzgInvalidBlobError,
		ComputeKzgProof,
		VerifyKzgProof,
		VerifyBlobKzgProof,
		VerifyBlobKzgProofBatch,
	} = await import("../../../src/crypto/KZG/index.js");

	beforeAll(() => {
		KZG.loadTrustedSetup();
	});

	afterAll(() => {
		// Ensure setup is initialized for other tests
		if (!KZG.isInitialized()) {
			KZG.loadTrustedSetup();
		}
	});

	describe("Compute Proof - Standard API", () => {
		/**
		 * From proofs.mdx:
		 * ```typescript
		 * import { Kzg, Blob, Bytes32 } from '@tevm/voltaire';
		 *
		 * Kzg.loadTrustedSetup();
		 *
		 * const blob = Blob(131072);
		 * const z = Bytes32(); // Evaluation point
		 *
		 * // Compute proof
		 * const { proof, y } = Kzg.Proof(blob, z);
		 * // proof: Uint8Array (48 bytes)
		 * // y: Uint8Array (32 bytes) - polynomial evaluation at z
		 * ```
		 *
		 * DISCREPANCY: Docs use `Kzg` but export is `KZG`
		 * DISCREPANCY: Docs use `Blob(131072)` but actual API is `KZG.createEmptyBlob()`
		 * DISCREPANCY: Docs use `Bytes32()` but actual API is `new Uint8Array(32)`
		 */
		it("should compute proof at evaluation point", () => {
			// Actual API (docs show Blob(131072))
			const blob = KZG.createEmptyBlob();

			// Actual API (docs show Bytes32())
			const z = new Uint8Array(32);
			z[31] = 0x42;

			// Compute proof - works as documented
			const { proof, y } = KZG.Proof(blob, z);

			expect(proof).toBeInstanceOf(Uint8Array);
			expect(proof.length).toBe(48);
			expect(y).toBeInstanceOf(Uint8Array);
			expect(y.length).toBe(32);
		});
	});

	describe.skipIf(!hasCkzg)("Compute Proof - Factory API", () => {
		/**
		 * From proofs.mdx:
		 * ```typescript
		 * const Proof = Kzg.ProofFactory({
		 *   computeKzgProof: ckzg.computeKzgProof
		 * });
		 *
		 * const blob = Blob(131072);
		 * const z = Bytes32();
		 * const { proof, y } = Proof(blob, z);
		 * ```
		 *
		 * DISCREPANCY: Docs show `Kzg.ProofFactory` but actual API is standalone `ComputeKzgProof` factory
		 */
		it("should compute proof using factory pattern", async () => {
			const ckzg = await import("c-kzg");

			// Ensure c-kzg's trusted setup is loaded (it's a separate instance from our KZG)
			try {
				// c-kzg uses embedded setup in newer versions
				// @ts-expect-error - loadTrustedSetup may not exist in type def
				if (typeof ckzg.loadTrustedSetup === "function" && !ckzg.loadTrustedSetup.__loaded) {
					ckzg.loadTrustedSetup();
				}
			} catch {
				// Already loaded or no-op
			}

			// Actual factory API (docs show Kzg.ProofFactory)
			const Proof = ComputeKzgProof({
				computeKzgProof: ckzg.computeKzgProof,
			});

			const blob = KZG.generateRandomBlob();
			const z = new Uint8Array(32);
			z[31] = 0x33;

			const { proof, y } = Proof(blob, z);

			expect(proof).toBeInstanceOf(Uint8Array);
			expect(proof.length).toBe(BYTES_PER_PROOF);
			expect(y).toBeInstanceOf(Uint8Array);
			expect(y.length).toBe(BYTES_PER_FIELD_ELEMENT);
		});
	});

	describe("Verify Proof - Standard API", () => {
		/**
		 * From proofs.mdx:
		 * ```typescript
		 * const commitment = Kzg.Commitment(blob);
		 * const z = Bytes32();
		 * const { proof, y } = Kzg.Proof(blob, z);
		 *
		 * // Verify proof
		 * const valid = Kzg.verify(commitment, z, y, proof);
		 * // Returns: boolean (true if valid, false otherwise)
		 * ```
		 *
		 * DISCREPANCY: Docs use `Kzg.verify()` but actual API is `KZG.verifyKzgProof()`
		 */
		it("should verify valid proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			z[31] = 0x55;
			const { proof, y } = KZG.Proof(blob, z);

			// Actual API (docs show Kzg.verify())
			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});

		it("should return false for invalid proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			// Corrupt the proof
			const corruptedProof = new Uint8Array(proof);
			corruptedProof[0]! ^= 1;

			const valid = KZG.verifyKzgProof(commitment, z, y, corruptedProof);
			expect(valid).toBe(false);
		});
	});

	describe.skipIf(!hasCkzg)("Verify Proof - Factory API", () => {
		/**
		 * From proofs.mdx:
		 * ```typescript
		 * const verify = Kzg.VerifyFactory({
		 *   verifyKzgProof: ckzg.verifyKzgProof
		 * });
		 *
		 * const valid = verify(commitment, z, y, proof);
		 * ```
		 *
		 * DISCREPANCY: Docs show `Kzg.VerifyFactory` but actual API is standalone `VerifyKzgProof` factory
		 */
		it("should verify proof using factory pattern", async () => {
			const ckzg = await import("c-kzg");

			// Actual factory API (docs show Kzg.VerifyFactory)
			const verify = VerifyKzgProof({
				verifyKzgProof: ckzg.verifyKzgProof,
			});

			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			const valid = verify(commitment, z, y, proof);
			expect(valid).toBe(true);
		});
	});

	describe("Blob Proof Verification - Standard API", () => {
		/**
		 * From proofs.mdx:
		 * ```typescript
		 * const blob = Blob(131072);
		 * const commitment = Kzg.Commitment(blob);
		 * const z = Bytes32();
		 * const { proof } = Kzg.Proof(blob, z);
		 *
		 * // Verify blob proof (optimized)
		 * const valid = Kzg.verifyBlob(blob, commitment, proof);
		 * ```
		 *
		 * DISCREPANCY: Docs use `Kzg.verifyBlob()` but actual API is `KZG.verifyBlobKzgProof()`
		 * NOTE: verifyBlobKzgProof uses computeBlobKzgProof, not Kzg.Proof
		 */
		it("should verify blob proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			// For blob proof verification, need to use computeBlobKzgProof
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			// Actual API (docs show Kzg.verifyBlob())
			const valid = KZG.verifyBlobKzgProof(blob, commitment, proof);
			expect(valid).toBe(true);
		});
	});

	describe.skipIf(!hasCkzg)("Blob Proof Verification - Factory API", () => {
		/**
		 * From proofs.mdx:
		 * ```typescript
		 * const verifyBlob = Kzg.VerifyBlobFactory({
		 *   verifyBlobKzgProof: ckzg.verifyBlobKzgProof
		 * });
		 *
		 * const valid = verifyBlob(blob, commitment, proof);
		 * ```
		 *
		 * DISCREPANCY: Docs show `Kzg.VerifyBlobFactory` but actual API is standalone `VerifyBlobKzgProof` factory
		 */
		it("should verify blob proof using factory pattern", async () => {
			const ckzg = await import("c-kzg");

			// Actual factory API
			const verifyBlob = VerifyBlobKzgProof({
				verifyBlobKzgProof: ckzg.verifyBlobKzgProof,
			});

			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			const valid = verifyBlob(blob, commitment, proof);
			expect(valid).toBe(true);
		});
	});

	describe("Batch Verification - Standard API", () => {
		/**
		 * From proofs.mdx:
		 * ```typescript
		 * const blobs = [blob1, blob2, blob3];
		 * const commitments = blobs.map(b => Kzg.Commitment(b));
		 * const proofs = [proof1, proof2, proof3];
		 *
		 * // Batch verify (more efficient than individual verification)
		 * const allValid = Kzg.verifyBatch(blobs, commitments, proofs);
		 * // Returns: boolean (true if ALL proofs valid, false otherwise)
		 * ```
		 *
		 * DISCREPANCY: Docs use `Kzg.verifyBatch()` but actual API is `KZG.verifyBlobKzgProofBatch()`
		 */
		it("should batch verify multiple blob proofs", () => {
			const blobs = [
				KZG.generateRandomBlob(1),
				KZG.generateRandomBlob(2),
				KZG.generateRandomBlob(3),
			];
			const commitments = blobs.map((b) => KZG.Commitment(b));
			const proofs = blobs.map((b, i) =>
				KZG.computeBlobKzgProof(b, commitments[i]!),
			);

			// Actual API (docs show Kzg.verifyBatch())
			const allValid = KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
			expect(allValid).toBe(true);
		});

		it("should return false if any proof is invalid", () => {
			const blobs = [KZG.generateRandomBlob(1), KZG.generateRandomBlob(2)];
			const commitments = blobs.map((b) => KZG.Commitment(b));

			// Use wrong commitment for second blob
			const wrongBlob = KZG.generateRandomBlob(999);
			const wrongCommitment = KZG.Commitment(wrongBlob);

			const proofs = [
				KZG.computeBlobKzgProof(blobs[0]!, commitments[0]!),
				KZG.computeBlobKzgProof(blobs[1]!, wrongCommitment), // Wrong!
			];

			const allValid = KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
			expect(allValid).toBe(false);
		});
	});

	describe.skipIf(!hasCkzg)("Batch Verification - Factory API", () => {
		/**
		 * From proofs.mdx:
		 * ```typescript
		 * const verifyBatch = Kzg.VerifyBatchFactory({
		 *   verifyBlobKzgProofBatch: ckzg.verifyBlobKzgProofBatch
		 * });
		 *
		 * const allValid = verifyBatch(blobs, commitments, proofs);
		 * ```
		 *
		 * DISCREPANCY: Docs show `Kzg.VerifyBatchFactory` but actual API is standalone `VerifyBlobKzgProofBatch` factory
		 */
		it("should batch verify using factory pattern", async () => {
			const ckzg = await import("c-kzg");

			// Actual factory API
			const verifyBatch = VerifyBlobKzgProofBatch({
				verifyBlobKzgProofBatch: ckzg.verifyBlobKzgProofBatch,
			});

			const blobs = [KZG.generateRandomBlob(1), KZG.generateRandomBlob(2)];
			const commitments = blobs.map((b) => KZG.Commitment(b));
			const proofs = blobs.map((b, i) =>
				KZG.computeBlobKzgProof(b, commitments[i]!),
			);

			const allValid = verifyBatch(blobs, commitments, proofs);
			expect(allValid).toBe(true);
		});
	});

	describe("Error Handling", () => {
		/**
		 * From proofs.mdx:
		 * ```typescript
		 * try {
		 *   const { proof, y } = Kzg.Proof(blob, z);
		 * } catch (error) {
		 *   if (error instanceof KzgNotInitializedError) {
		 *     // Trusted setup not loaded
		 *   } else if (error instanceof KzgInvalidBlobError) {
		 *     // Invalid blob format
		 *   } else if (error instanceof KzgError) {
		 *     // Computation failed
		 *     console.error('Code:', error.code);
		 *     console.error('Message:', error.message);
		 *   }
		 * }
		 * ```
		 */
		it(
			"should throw KzgNotInitializedError when trusted setup not loaded",
			{ timeout: 30000 },
			() => {
				try {
					KZG.freeTrustedSetup();

					const blob = KZG.createEmptyBlob();
					const z = new Uint8Array(32);

					expect(() => KZG.Proof(blob, z)).toThrow(KzgNotInitializedError);
				} finally {
					// Always restore
					if (!KZG.isInitialized()) {
						KZG.loadTrustedSetup();
					}
				}
			},
		);

		it("should throw KzgInvalidBlobError for invalid blob", () => {
			const wrongBlob = new Uint8Array(1000);
			const z = new Uint8Array(32);

			expect(() => KZG.Proof(wrongBlob, z)).toThrow(KzgInvalidBlobError);
		});

		it("should throw KzgError for invalid evaluation point size", () => {
			const blob = KZG.generateRandomBlob();
			const wrongZ = new Uint8Array(16);

			expect(() => KZG.Proof(blob, wrongZ)).toThrow(KzgError);
		});

		it("should demonstrate error handling pattern from docs", () => {
			const invalidBlob = new Uint8Array(1000);
			const z = new Uint8Array(32);

			try {
				KZG.Proof(invalidBlob, z);
				expect.fail("Should have thrown");
			} catch (error) {
				if (error instanceof KzgNotInitializedError) {
					// Trusted setup not loaded
				} else if (error instanceof KzgInvalidBlobError) {
					// Invalid blob format - expected path
					expect(error.message).toBeDefined();
				} else if (error instanceof KzgError) {
					// Computation failed
					expect(error.message).toBeDefined();
				}
			}
		});
	});

	describe("Proof Properties", () => {
		/**
		 * From proofs.mdx:
		 * - p(x) is the polynomial representing the blob
		 * - z is the evaluation point (32 bytes)
		 * - y is the claimed value (32 bytes)
		 * - Proof is 48 bytes
		 */
		it("should produce correctly sized proof components", () => {
			const blob = KZG.generateRandomBlob();
			const z = new Uint8Array(32);

			const { proof, y } = KZG.Proof(blob, z);

			expect(proof.length).toBe(48);
			expect(y.length).toBe(32);
		});

		it("should be deterministic - same inputs produce same proof", () => {
			const blob = KZG.generateRandomBlob(42);
			const z = new Uint8Array(32);
			z[31] = 0x77;

			const result1 = KZG.Proof(blob, z);
			const result2 = KZG.Proof(blob, z);

			expect(result1.proof).toEqual(result2.proof);
			expect(result1.y).toEqual(result2.y);
		});

		it("should produce different proofs for different evaluation points", () => {
			const blob = KZG.generateRandomBlob();

			const z1 = new Uint8Array(32);
			z1[31] = 0x01;

			const z2 = new Uint8Array(32);
			z2[31] = 0x02;

			const result1 = KZG.Proof(blob, z1);
			const result2 = KZG.Proof(blob, z2);

			expect(result1.proof).not.toEqual(result2.proof);
			expect(result1.y).not.toEqual(result2.y);
		});
	});

	describe("Legacy API Compatibility", () => {
		it("should support legacy computeKzgProof API", () => {
			const blob = KZG.generateRandomBlob();
			const z = new Uint8Array(32);

			// New API
			const result1 = KZG.Proof(blob, z);

			// Legacy API
			const result2 = KZG.computeKzgProof(blob, z);

			expect(result1.proof).toEqual(result2.proof);
			expect(result1.y).toEqual(result2.y);
		});
	});
});
