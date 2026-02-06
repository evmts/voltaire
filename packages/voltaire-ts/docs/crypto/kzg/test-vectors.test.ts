/**
 * Tests for code examples in docs/crypto/kzg/test-vectors.mdx
 *
 * Note: This MDX file is a placeholder with no code examples.
 * Tests here cover test vector validation for KZG operations.
 *
 * API Discrepancies documented:
 * - Docs are placeholder with no actual examples yet
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasNativeKzg } from "./test-utils.js";

describe.skipIf(!hasNativeKzg)("docs/crypto/kzg/test-vectors.mdx - Test Vectors", async () => {
	const {
		KZG,
		BYTES_PER_BLOB,
		BYTES_PER_COMMITMENT,
		BYTES_PER_PROOF,
		BYTES_PER_FIELD_ELEMENT,
		FIELD_ELEMENTS_PER_BLOB,
	} = await import("../../../src/crypto/KZG/index.js");

	beforeAll(() => {
		KZG.loadTrustedSetup();
	});

	afterAll(() => {
		KZG.freeTrustedSetup();
	});

	describe("Empty Blob Test Vector", () => {
		/**
		 * Empty blob (all zeros) should produce consistent commitment
		 */
		it("should produce consistent commitment for empty blob", () => {
			const emptyBlob = KZG.createEmptyBlob();

			// Verify all zeros
			expect(emptyBlob.every((b) => b === 0)).toBe(true);
			expect(emptyBlob.length).toBe(BYTES_PER_BLOB);

			// Commitment should be deterministic
			const commitment1 = KZG.Commitment(emptyBlob);
			const commitment2 = KZG.Commitment(emptyBlob);

			expect(commitment1).toEqual(commitment2);
			expect(commitment1.length).toBe(BYTES_PER_COMMITMENT);
		});

		it("should verify proof for empty blob at zero point", () => {
			const emptyBlob = KZG.createEmptyBlob();
			const commitment = KZG.Commitment(emptyBlob);

			const z = new Uint8Array(32); // Zero evaluation point
			const { proof, y } = KZG.Proof(emptyBlob, z);

			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});
	});

	describe("Single Field Element Test Vectors", () => {
		/**
		 * Blob with single non-zero field element
		 */
		it("should handle blob with first field element set", () => {
			const blob = KZG.createEmptyBlob();
			// Set second byte of first field element (first byte must be 0)
			blob[1] = 0x01;

			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);

			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});

		it("should handle blob with last field element set", () => {
			const blob = KZG.createEmptyBlob();
			// Set last field element
			const lastElementOffset = (FIELD_ELEMENTS_PER_BLOB - 1) * BYTES_PER_FIELD_ELEMENT;
			blob[lastElementOffset + 1] = 0xff;

			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);

			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});
	});

	describe("Max Value Field Element Test Vectors", () => {
		/**
		 * Field elements with maximum valid values (high byte = 0, rest = 0xff)
		 */
		it("should handle blob with max value field elements", () => {
			const blob = new Uint8Array(BYTES_PER_BLOB);

			// Set all field elements to max valid value
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0; // High byte must be 0
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = 0xff;
				}
			}

			// Should be valid
			expect(() => KZG.validateBlob(blob)).not.toThrow();

			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});
	});

	describe("Seeded Random Blob Test Vectors", () => {
		/**
		 * Seeded random blobs for reproducible tests
		 */
		it("should produce consistent results for seeded blobs", () => {
			const seed = 12345;

			const blob1 = KZG.generateRandomBlob(seed);
			const blob2 = KZG.generateRandomBlob(seed);

			expect(blob1).toEqual(blob2);

			const commitment1 = KZG.Commitment(blob1);
			const commitment2 = KZG.Commitment(blob2);

			expect(commitment1).toEqual(commitment2);
		});

		it("should produce different results for different seeds", () => {
			const blob1 = KZG.generateRandomBlob(1);
			const blob2 = KZG.generateRandomBlob(2);

			expect(blob1).not.toEqual(blob2);

			const commitment1 = KZG.Commitment(blob1);
			const commitment2 = KZG.Commitment(blob2);

			expect(commitment1).not.toEqual(commitment2);
		});
	});

	describe("Evaluation Point Test Vectors", () => {
		/**
		 * Test various evaluation points
		 */
		it("should verify proof at zero evaluation point", () => {
			const blob = KZG.generateRandomBlob(100);
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32); // All zeros

			const { proof, y } = KZG.Proof(blob, z);
			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});

		it("should verify proof at various evaluation points", () => {
			const blob = KZG.generateRandomBlob(200);
			const commitment = KZG.Commitment(blob);

			const testPoints = [
				0x00, 0x01, 0x10, 0x42, 0x80, 0xff
			];

			for (const p of testPoints) {
				const z = new Uint8Array(32);
				z[31] = p;

				const { proof, y } = KZG.Proof(blob, z);
				const valid = KZG.verifyKzgProof(commitment, z, y, proof);
				expect(valid).toBe(true);
			}
		});

		it("should verify proof at max valid evaluation point", () => {
			const blob = KZG.generateRandomBlob(300);
			const commitment = KZG.Commitment(blob);

			// Max valid field element (high byte = 0)
			const z = new Uint8Array(32);
			z[0] = 0;
			z.fill(0xff, 1);

			const { proof, y } = KZG.Proof(blob, z);
			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});
	});

	describe("Invalid Input Test Vectors", () => {
		/**
		 * Test rejection of invalid inputs
		 */
		it("should reject blob with wrong size", () => {
			const wrongSizes = [0, 100, 1000, BYTES_PER_BLOB - 1, BYTES_PER_BLOB + 1];

			for (const size of wrongSizes) {
				const wrongBlob = new Uint8Array(size);
				expect(() => KZG.validateBlob(wrongBlob)).toThrow();
			}
		});

		it("should reject blob with invalid field element", () => {
			const blob = KZG.createEmptyBlob();
			blob[0] = 1; // Invalid: high byte != 0

			expect(() => KZG.validateBlob(blob)).toThrow();
		});

		it("should reject proof with wrong commitment", () => {
			const blob1 = KZG.generateRandomBlob(1);
			const blob2 = KZG.generateRandomBlob(2);

			const commitment1 = KZG.Commitment(blob1);
			const commitment2 = KZG.Commitment(blob2);

			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob1, z);

			// Verify with wrong commitment
			const valid = KZG.verifyKzgProof(commitment2, z, y, proof);
			expect(valid).toBe(false);
		});

		it("should reject proof with corrupted proof bytes", () => {
			const blob = KZG.generateRandomBlob(400);
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			const corruptedProof = new Uint8Array(proof);
			corruptedProof[0]! ^= 1;

			const valid = KZG.verifyKzgProof(commitment, z, y, corruptedProof);
			expect(valid).toBe(false);
		});

		it("should reject proof with wrong y value", () => {
			const blob = KZG.generateRandomBlob(500);
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			const wrongY = new Uint8Array(y);
			wrongY[0]! ^= 1;

			const valid = KZG.verifyKzgProof(commitment, z, wrongY, proof);
			expect(valid).toBe(false);
		});
	});

	describe("Batch Verification Test Vectors", () => {
		/**
		 * Test batch verification edge cases
		 */
		it("should verify empty batch", () => {
			const valid = KZG.verifyBlobKzgProofBatch([], [], []);
			expect(valid).toBe(true);
		});

		it("should verify single blob batch", () => {
			const blob = KZG.generateRandomBlob(600);
			const commitment = KZG.Commitment(blob);
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			const valid = KZG.verifyBlobKzgProofBatch([blob], [commitment], [proof]);
			expect(valid).toBe(true);
		});

		it("should verify large batch", { timeout: 60000 }, () => {
			const numBlobs = 6; // Max per block
			const blobs: Uint8Array[] = [];
			const commitments: Uint8Array[] = [];
			const proofs: Uint8Array[] = [];

			for (let i = 0; i < numBlobs; i++) {
				const blob = KZG.generateRandomBlob(700 + i);
				const commitment = KZG.Commitment(blob);
				const proof = KZG.computeBlobKzgProof(blob, commitment);

				blobs.push(blob);
				commitments.push(commitment);
				proofs.push(proof);
			}

			const valid = KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
			expect(valid).toBe(true);
		});

		it("should reject batch with one invalid proof", { timeout: 60000 }, () => {
			const blobs = [KZG.generateRandomBlob(800), KZG.generateRandomBlob(801)];
			const commitments = blobs.map((b) => KZG.Commitment(b));

			// Create valid proof for first blob, invalid for second
			const validProof = KZG.computeBlobKzgProof(blobs[0]!, commitments[0]!);
			const invalidProof = KZG.computeBlobKzgProof(
				KZG.generateRandomBlob(999),
				KZG.Commitment(KZG.generateRandomBlob(999)),
			);

			const valid = KZG.verifyBlobKzgProofBatch(
				blobs,
				commitments,
				[validProof, invalidProof],
			);
			expect(valid).toBe(false);
		});
	});

	describe("Determinism Test Vectors", () => {
		/**
		 * Verify all operations are deterministic
		 */
		it("should produce identical commitments for identical blobs", { timeout: 60000 }, () => {
			const blob = KZG.generateRandomBlob(900);

			for (let i = 0; i < 5; i++) {
				const commitment = KZG.Commitment(blob);
				expect(commitment).toEqual(KZG.Commitment(blob));
			}
		});

		it("should produce identical proofs for identical inputs", { timeout: 60000 }, () => {
			const blob = KZG.generateRandomBlob(901);
			const z = new Uint8Array(32);
			z[31] = 0x42;

			for (let i = 0; i < 5; i++) {
				const result = KZG.Proof(blob, z);
				const result2 = KZG.Proof(blob, z);
				expect(result.proof).toEqual(result2.proof);
				expect(result.y).toEqual(result2.y);
			}
		});

		it("should produce identical blob proofs for identical inputs", { timeout: 60000 }, () => {
			const blob = KZG.generateRandomBlob(902);
			const commitment = KZG.Commitment(blob);

			for (let i = 0; i < 5; i++) {
				const proof = KZG.computeBlobKzgProof(blob, commitment);
				expect(proof).toEqual(KZG.computeBlobKzgProof(blob, commitment));
			}
		});
	});
});
