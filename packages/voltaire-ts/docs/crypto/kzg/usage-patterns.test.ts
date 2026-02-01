/**
 * Tests for code examples in docs/crypto/kzg/usage-patterns.mdx
 *
 * Note: This MDX file is a placeholder with no code examples.
 * Tests here cover common KZG usage patterns.
 *
 * API Discrepancies documented:
 * - Docs are placeholder with no actual examples yet
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasNativeKzg } from "./test-utils.js";

describe.skipIf(!hasNativeKzg)("docs/crypto/kzg/usage-patterns.mdx - Usage Patterns", async () => {
	const {
		KZG,
		BYTES_PER_BLOB,
		BYTES_PER_COMMITMENT,
		BYTES_PER_PROOF,
		FIELD_ELEMENTS_PER_BLOB,
		BYTES_PER_FIELD_ELEMENT,
	} = await import("../../../src/crypto/KZG/index.js");

	beforeAll(() => {
		KZG.loadTrustedSetup();
	});

	afterAll(() => {
		KZG.freeTrustedSetup();
	});

	describe("Basic Commitment Pattern", () => {
		/**
		 * Most common pattern: create blob, generate commitment
		 */
		it("should demonstrate basic commitment workflow", () => {
			// Create blob with data
			const blob = KZG.generateRandomBlob();

			// Generate commitment
			const commitment = KZG.Commitment(blob);

			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});
	});

	describe("Proof Generation Pattern", () => {
		/**
		 * Generate proofs for specific evaluation points
		 */
		it("should demonstrate proof generation at specific point", () => {
			const blob = KZG.generateRandomBlob();

			// Choose evaluation point
			const z = new Uint8Array(32);
			z[31] = 0x42;

			// Generate proof
			const { proof, y } = KZG.Proof(blob, z);

			expect(proof.length).toBe(BYTES_PER_PROOF);
			expect(y.length).toBe(32);
		});

		it("should demonstrate proof generation at multiple points", () => {
			const blob = KZG.generateRandomBlob();

			const evaluationPoints = [0x00, 0x11, 0x22, 0x33];
			const results = [];

			for (const p of evaluationPoints) {
				const z = new Uint8Array(32);
				z[31] = p;
				const { proof, y } = KZG.Proof(blob, z);
				results.push({ z, proof, y });
			}

			expect(results.length).toBe(4);
			for (const r of results) {
				expect(r.proof.length).toBe(BYTES_PER_PROOF);
			}
		});
	});

	describe("Verification Pattern", () => {
		/**
		 * Verify proofs against commitments
		 */
		it("should demonstrate single proof verification", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			// Verify
			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});

		it("should demonstrate blob proof verification", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			// Verify blob proof (more efficient for full blob verification)
			const valid = KZG.verifyBlobKzgProof(blob, commitment, proof);
			expect(valid).toBe(true);
		});
	});

	describe("Batch Verification Pattern", () => {
		/**
		 * Verify multiple blob proofs efficiently
		 */
		it("should demonstrate batch verification", () => {
			const numBlobs = 4;
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

			// Batch verify - more efficient than individual verification
			const allValid = KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
			expect(allValid).toBe(true);
		});
	});

	describe("L2 Integration Pattern", () => {
		/**
		 * Pattern for L2 rollup data posting
		 */
		it("should demonstrate L2 blob submission pattern", () => {
			// L2 prepares transaction batch data
			const txBatchBlob = KZG.generateRandomBlob(1234);

			// Generate commitment for on-chain reference
			const commitment = KZG.Commitment(txBatchBlob);

			// Generate proof for data availability
			const proof = KZG.computeBlobKzgProof(txBatchBlob, commitment);

			// Package for blob transaction
			const sidecar = {
				blobs: [txBatchBlob],
				commitments: [commitment],
				proofs: [proof],
			};

			expect(sidecar.blobs.length).toBe(1);
			expect(sidecar.commitments.length).toBe(1);
			expect(sidecar.proofs.length).toBe(1);
		});

		it("should demonstrate multi-blob L2 submission", () => {
			// Large batch requires multiple blobs
			const numBlobs = 3;
			const sidecar = {
				blobs: [] as Uint8Array[],
				commitments: [] as Uint8Array[],
				proofs: [] as Uint8Array[],
			};

			for (let i = 0; i < numBlobs; i++) {
				const blob = KZG.generateRandomBlob(i * 1000);
				const commitment = KZG.Commitment(blob);
				const proof = KZG.computeBlobKzgProof(blob, commitment);

				sidecar.blobs.push(blob);
				sidecar.commitments.push(commitment);
				sidecar.proofs.push(proof);
			}

			// Verify entire sidecar
			const valid = KZG.verifyBlobKzgProofBatch(
				sidecar.blobs,
				sidecar.commitments,
				sidecar.proofs,
			);
			expect(valid).toBe(true);
		});
	});

	describe("Data Availability Sampling Pattern", () => {
		/**
		 * Pattern for light client data availability sampling
		 */
		it("should demonstrate random point sampling for DA", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			// Light client samples random points
			const numSamples = 5;
			const samples = [];

			for (let i = 0; i < numSamples; i++) {
				// Random evaluation point (in practice, would use secure randomness)
				const z = new Uint8Array(32);
				z[31] = i * 37; // Pseudo-random for test

				const { proof, y } = KZG.Proof(blob, z);

				// Light client verifies each sample
				const valid = KZG.verifyKzgProof(commitment, z, y, proof);
				expect(valid).toBe(true);

				samples.push({ z, y, proof });
			}

			expect(samples.length).toBe(numSamples);
		});
	});

	describe("Error Recovery Pattern", () => {
		/**
		 * Pattern for handling initialization and errors
		 */
		it("should demonstrate safe initialization pattern", () => {
			// Check if already initialized
			if (!KZG.isInitialized()) {
				KZG.loadTrustedSetup();
			}

			expect(KZG.isInitialized()).toBe(true);

			// Now safe to use
			const blob = KZG.createEmptyBlob();
			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});

		it("should demonstrate blob validation before commitment", () => {
			const blob = KZG.generateRandomBlob();

			// Validate before expensive operations
			expect(() => KZG.validateBlob(blob)).not.toThrow();

			// Now safe to compute commitment
			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});
	});

	describe("Deterministic Blob Pattern", () => {
		/**
		 * Using seeded random blobs for reproducible tests
		 */
		it("should demonstrate deterministic blob generation", () => {
			const seed = 42;

			const blob1 = KZG.generateRandomBlob(seed);
			const blob2 = KZG.generateRandomBlob(seed);

			// Same seed produces same blob
			expect(blob1).toEqual(blob2);

			const commitment1 = KZG.Commitment(blob1);
			const commitment2 = KZG.Commitment(blob2);

			// Same blob produces same commitment
			expect(commitment1).toEqual(commitment2);
		});

		it("should demonstrate different seeds produce different blobs", () => {
			const blob1 = KZG.generateRandomBlob(1);
			const blob2 = KZG.generateRandomBlob(2);

			expect(blob1).not.toEqual(blob2);

			const commitment1 = KZG.Commitment(blob1);
			const commitment2 = KZG.Commitment(blob2);

			expect(commitment1).not.toEqual(commitment2);
		});
	});

	describe("Full Workflow Pattern", () => {
		/**
		 * Complete end-to-end workflow
		 */
		it("should demonstrate complete blob transaction workflow", () => {
			// 1. Prepare data
			const blob = KZG.generateRandomBlob(9999);

			// 2. Validate blob format
			KZG.validateBlob(blob);

			// 3. Generate commitment
			const commitment = KZG.Commitment(blob);

			// 4. Generate blob proof
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			// 5. Verify proof (what nodes do)
			const valid = KZG.verifyBlobKzgProof(blob, commitment, proof);
			expect(valid).toBe(true);

			// 6. Generate point proofs for specific queries
			const queryPoint = new Uint8Array(32);
			queryPoint[31] = 0x55;
			const { proof: queryProof, y } = KZG.Proof(blob, queryPoint);

			// 7. Verify point query
			const queryValid = KZG.verifyKzgProof(
				commitment,
				queryPoint,
				y,
				queryProof,
			);
			expect(queryValid).toBe(true);
		});
	});
});
