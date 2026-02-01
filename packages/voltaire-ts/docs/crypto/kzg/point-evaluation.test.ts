/**
 * Tests for code examples in docs/crypto/kzg/point-evaluation.mdx
 *
 * Note: This MDX file is a placeholder with no code examples.
 * Tests here cover the point evaluation precompile functionality
 * based on EIP-4844 specification.
 *
 * API Discrepancies documented:
 * - Docs are placeholder with no actual examples yet
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasNativeKzg } from "./test-utils.js";

describe.skipIf(!hasNativeKzg)("docs/crypto/kzg/point-evaluation.mdx - Point Evaluation", async () => {
	const {
		KZG,
		BYTES_PER_COMMITMENT,
		BYTES_PER_PROOF,
		BYTES_PER_FIELD_ELEMENT,
	} = await import("../../../src/crypto/KZG/index.js");

	beforeAll(() => {
		KZG.loadTrustedSetup();
	});

	afterAll(() => {
		KZG.freeTrustedSetup();
	});

	describe("Point Evaluation Precompile (0x0a)", () => {
		/**
		 * From index.mdx (referenced by point-evaluation.mdx):
		 * Address: 0x0a (precompile 0x0a)
		 *
		 * Input format (192 bytes):
		 * - versionedHash: 32 bytes
		 * - z: 32 bytes (evaluation point)
		 * - y: 32 bytes (claimed value)
		 * - commitment: 48 bytes
		 * - proof: 48 bytes
		 *
		 * Gas Cost: 50,000 gas (fixed)
		 */
		it("should produce correctly sized inputs for point evaluation precompile", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			z[31] = 0x42;
			const { proof, y } = KZG.Proof(blob, z);

			// Verify component sizes match precompile input spec
			expect(z.length).toBe(32); // evaluation point
			expect(y.length).toBe(32); // claimed value
			expect(commitment.length).toBe(48); // KZG commitment
			expect(proof.length).toBe(48); // KZG proof

			// Total input size: 32 (versioned hash) + 32 (z) + 32 (y) + 48 (commitment) + 48 (proof)
			const totalInputSize = 32 + z.length + y.length + commitment.length + proof.length;
			expect(totalInputSize).toBe(192);
		});

		it("should verify proof that would pass precompile verification", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			// This is what the precompile would check
			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});

		it("should reject proof that would fail precompile verification", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = KZG.Proof(blob, z);

			// Corrupt y value
			const wrongY = new Uint8Array(y);
			wrongY[0]! ^= 1;

			// This is what the precompile would reject
			const valid = KZG.verifyKzgProof(commitment, z, wrongY, proof);
			expect(valid).toBe(false);
		});
	});

	describe("Evaluation Point Constraints", () => {
		/**
		 * Evaluation point z must be a valid field element (< BLS12-381 modulus)
		 */
		it("should accept zero evaluation point", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32); // All zeros

			const { proof, y } = KZG.Proof(blob, z);
			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});

		it("should accept various valid evaluation points", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			const testPoints = [0x00, 0x01, 0x42, 0x99, 0xff];

			for (const pointByte of testPoints) {
				const z = new Uint8Array(32);
				z[31] = pointByte;

				const { proof, y } = KZG.Proof(blob, z);
				const valid = KZG.verifyKzgProof(commitment, z, y, proof);
				expect(valid).toBe(true);
			}
		});

		it("should handle evaluation point with high byte = 0", () => {
			const blob = KZG.generateRandomBlob();
			const z = new Uint8Array(32);
			z[0] = 0; // High byte must be 0 (valid field element)
			z.fill(0xff, 1); // Rest can be max

			const { proof, y } = KZG.Proof(blob, z);
			const commitment = KZG.Commitment(blob);
			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});
	});

	describe("Verification Round-Trip", () => {
		/**
		 * Full point evaluation workflow matching precompile usage
		 */
		it("should complete full point evaluation round-trip", () => {
			// 1. Create blob with data
			const blob = KZG.generateRandomBlob(12345);

			// 2. Compute commitment
			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);

			// 3. Choose evaluation point
			const z = new Uint8Array(BYTES_PER_FIELD_ELEMENT);
			z[31] = 0x77;

			// 4. Compute proof and claimed value
			const { proof, y } = KZG.Proof(blob, z);
			expect(proof.length).toBe(BYTES_PER_PROOF);
			expect(y.length).toBe(BYTES_PER_FIELD_ELEMENT);

			// 5. Verify (this is what precompile 0x0a does)
			const valid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		});

		it("should support multiple evaluation points on same blob", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			// Evaluate at multiple points
			const points = [0x11, 0x22, 0x33, 0x44, 0x55];
			for (const p of points) {
				const z = new Uint8Array(32);
				z[31] = p;

				const { proof, y } = KZG.Proof(blob, z);
				const valid = KZG.verifyKzgProof(commitment, z, y, proof);
				expect(valid).toBe(true);
			}
		});
	});
});
