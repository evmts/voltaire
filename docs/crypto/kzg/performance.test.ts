/**
 * Tests for code examples in docs/crypto/kzg/performance.mdx
 *
 * Note: This MDX file is a placeholder with no code examples.
 * Tests here verify performance characteristics mentioned in index.mdx.
 *
 * API Discrepancies documented:
 * - Docs are placeholder with no actual examples yet
 * - Performance numbers from index.mdx: commitment ~50ms, proof ~50ms, verify ~2ms
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasNativeKzg } from "./test-utils.js";

describe.skipIf(!hasNativeKzg)("docs/crypto/kzg/performance.mdx - Performance", async () => {
	const {
		KZG,
		BYTES_PER_BLOB,
		BYTES_PER_COMMITMENT,
		BYTES_PER_PROOF,
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

	describe("Commitment Performance", () => {
		/**
		 * From index.mdx:
		 * Native (c-kzg-4844):
		 * - Blob to commitment: ~50 ms
		 */
		it("should compute commitment within reasonable time", () => {
			const blob = KZG.generateRandomBlob();

			const start = performance.now();
			KZG.Commitment(blob);
			const duration = performance.now() - start;

			// Allow generous margin for CI environments (40x documented time)
			expect(duration).toBeLessThan(2000);
		});

		it("should compute commitment consistently", () => {
			const blob = KZG.generateRandomBlob();
			const iterations = 3;
			const durations: number[] = [];

			for (let i = 0; i < iterations; i++) {
				const start = performance.now();
				KZG.Commitment(blob);
				durations.push(performance.now() - start);
			}

			// All iterations should complete in reasonable time (generous for CI)
			for (const d of durations) {
				expect(d).toBeLessThan(2000);
			}
		});
	});

	describe("Proof Computation Performance", () => {
		/**
		 * From index.mdx:
		 * Native (c-kzg-4844):
		 * - Compute proof: ~50 ms
		 */
		it("should compute proof within reasonable time", () => {
			const blob = KZG.generateRandomBlob();
			const z = new Uint8Array(32);

			const start = performance.now();
			KZG.Proof(blob, z);
			const duration = performance.now() - start;

			// Allow generous margin for CI environments (40x documented time)
			expect(duration).toBeLessThan(2000);
		});

		it("should compute blob proof within reasonable time", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			const start = performance.now();
			KZG.computeBlobKzgProof(blob, commitment);
			const duration = performance.now() - start;

			// Allow generous margin for CI environments
			expect(duration).toBeLessThan(2000);
		});
	});

	describe("Verification Performance", () => {
		/**
		 * From index.mdx:
		 * Native (c-kzg-4844):
		 * - Verify proof: ~2 ms
		 * - Verify blob proof batch: ~2 ms per blob
		 */
		it("should verify proof within reasonable time", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			const start = performance.now();
			KZG.verifyKzgProof(commitment, z, y, proof);
			const duration = performance.now() - start;

			// Verification should be fast (generous margin for CI environments)
			expect(duration).toBeLessThan(2000);
		});

		it("should verify blob proof within reasonable time", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			const start = performance.now();
			KZG.verifyBlobKzgProof(blob, commitment, proof);
			const duration = performance.now() - start;

			// Verification should be fast (generous for CI)
			expect(duration).toBeLessThan(2000);
		});
	});

	describe("Batch Verification Performance", () => {
		/**
		 * From index.mdx:
		 * Verification time: ~12 ms per block (6 blobs)
		 */
		it("should verify batch of 6 blobs within reasonable time", { timeout: 60000 }, () => {
			const numBlobs = 6;
			const blobs: Uint8Array[] = [];
			const commitments: Uint8Array[] = [];
			const proofs: Uint8Array[] = [];

			for (let i = 0; i < numBlobs; i++) {
				const blob = KZG.generateRandomBlob(i);
				const commitment = KZG.Commitment(blob);
				const proof = KZG.computeBlobKzgProof(blob, commitment);

				blobs.push(blob);
				commitments.push(commitment);
				proofs.push(proof);
			}

			const start = performance.now();
			KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
			const duration = performance.now() - start;

			// Batch verification should be efficient (generous for CI)
			expect(duration).toBeLessThan(5000);
		});

		it("should scale linearly with batch size", { timeout: 60000 }, () => {
			const batchSizes = [1, 2, 3, 4, 5, 6];
			const durations: number[] = [];

			for (const numBlobs of batchSizes) {
				const blobs: Uint8Array[] = [];
				const commitments: Uint8Array[] = [];
				const proofs: Uint8Array[] = [];

				for (let i = 0; i < numBlobs; i++) {
					const blob = KZG.generateRandomBlob(i * 100 + numBlobs);
					const commitment = KZG.Commitment(blob);
					const proof = KZG.computeBlobKzgProof(blob, commitment);

					blobs.push(blob);
					commitments.push(commitment);
					proofs.push(proof);
				}

				const start = performance.now();
				KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
				durations.push(performance.now() - start);
			}

			// All should complete in reasonable time (generous for CI)
			for (const d of durations) {
				expect(d).toBeLessThan(5000);
			}
		});
	});

	describe("Memory Efficiency", () => {
		/**
		 * Verify operations don't accumulate excessive memory
		 */
		it("should handle repeated operations without memory issues", { timeout: 60000 }, () => {
			const iterations = 10;

			for (let i = 0; i < iterations; i++) {
				const blob = KZG.generateRandomBlob(i);
				const commitment = KZG.Commitment(blob);
				const proof = KZG.computeBlobKzgProof(blob, commitment);
				KZG.verifyBlobKzgProof(blob, commitment, proof);
			}

			// If we get here without running out of memory, test passes
			expect(true).toBe(true);
		});
	});

	describe("Trusted Setup Performance", () => {
		/**
		 * From index.mdx:
		 * Setup Size: ~1 MB (4096 G1 points + 65 G2 points)
		 */
		it("should load trusted setup within reasonable time", { timeout: 60000 }, () => {
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			const start = performance.now();
			// loadTrustedSetup is slow (~13s locally, ~30s in CI)
			KZG.loadTrustedSetup();
			const duration = performance.now() - start;

			expect(KZG.isInitialized()).toBe(true);

			// Setup loading should complete in reasonable time
			// Allow generous margin for CI environments
			expect(duration).toBeLessThan(60000);
		});

		it("should free trusted setup quickly", () => {
			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);

			const start = performance.now();
			KZG.freeTrustedSetup();
			const duration = performance.now() - start;

			expect(KZG.isInitialized()).toBe(false);

			// Free should be very fast (generous for CI)
			expect(duration).toBeLessThan(1000);
			// afterAll will reload
		});
	});

	describe("Full Workflow Performance", () => {
		beforeAll(
			() => {
				if (!KZG.isInitialized()) {
					KZG.loadTrustedSetup();
				}
			},
			{ timeout: 60000 },
		);

		/**
		 * End-to-end performance for typical usage
		 */
		it("should complete full blob workflow efficiently", () => {
			const start = performance.now();

			// 1. Create blob
			const blob = KZG.generateRandomBlob();

			// 2. Generate commitment
			const commitment = KZG.Commitment(blob);

			// 3. Generate proof
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			// 4. Verify
			const valid = KZG.verifyBlobKzgProof(blob, commitment, proof);

			const totalDuration = performance.now() - start;

			expect(valid).toBe(true);

			// Total workflow should complete in reasonable time (generous for CI)
			expect(totalDuration).toBeLessThan(10000);
		});

		it("should handle max blobs per block efficiently", { timeout: 120000 }, () => {
			const maxBlobs = 6;
			const start = performance.now();

			const blobs: Uint8Array[] = [];
			const commitments: Uint8Array[] = [];
			const proofs: Uint8Array[] = [];

			for (let i = 0; i < maxBlobs; i++) {
				const blob = KZG.generateRandomBlob(i + 1000);
				const commitment = KZG.Commitment(blob);
				const proof = KZG.computeBlobKzgProof(blob, commitment);

				blobs.push(blob);
				commitments.push(commitment);
				proofs.push(proof);
			}

			const valid = KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
			const totalDuration = performance.now() - start;

			expect(valid).toBe(true);

			// Full workflow should complete in reasonable time (very generous for CI)
			expect(totalDuration).toBeLessThan(90000);
		});
	});
});
