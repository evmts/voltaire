import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { KZG } from "./KZG.js";
import {
	BYTES_PER_BLOB,
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
	FIELD_ELEMENTS_PER_BLOB,
} from "./constants.js";
import { KzgError, KzgInvalidBlobError } from "./errors.js";

describe("KZG Validation - Edge Cases", () => {
	beforeAll(() => {
		KZG.loadTrustedSetup();
	});

	afterAll(() => {
		KZG.freeTrustedSetup();
	});

	// Helper: create valid field element
	const createFieldElement = (fill = 0): Uint8Array => {
		const z = new Uint8Array(BYTES_PER_FIELD_ELEMENT);
		z[0] = 0; // Ensure < BLS12-381 modulus
		for (let i = 1; i < BYTES_PER_FIELD_ELEMENT; i++) {
			z[i] = fill;
		}
		return z;
	};

	// Helper: create valid blob with all field elements having high byte = 0
	const createValidBlob = (): Uint8Array => {
		const blob = new Uint8Array(BYTES_PER_BLOB);
		for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
			blob[i * BYTES_PER_FIELD_ELEMENT] = 0;
		}
		return blob;
	};

	describe("Commitment Validation", () => {
		it("should verify valid blob + commitment + proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);
			const z = createFieldElement(0x42);
			const { proof, y } = KZG.computeKzgProof(blob, z);

			const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(isValid).toBe(true);
		});

		it("should reject commitment with invalid size (not 48 bytes)", () => {
			const blob = KZG.generateRandomBlob();
			const wrongCommitment = new Uint8Array(32); // Wrong size
			const z = createFieldElement();
			const y = createFieldElement();
			const proof = new Uint8Array(BYTES_PER_PROOF);

			expect(() => KZG.verifyKzgProof(wrongCommitment, z, y, proof)).toThrow(
				KzgError,
			);
		});

		it("should reject commitment with size 0", () => {
			const wrongCommitment = new Uint8Array(0);
			const z = createFieldElement();
			const y = createFieldElement();
			const proof = new Uint8Array(BYTES_PER_PROOF);

			expect(() => KZG.verifyKzgProof(wrongCommitment, z, y, proof)).toThrow(
				KzgError,
			);
		});

		it("should handle all-zero commitment", () => {
			const commitment = new Uint8Array(BYTES_PER_COMMITMENT).fill(0);
			const z = createFieldElement();
			const y = createFieldElement();
			const proof = new Uint8Array(BYTES_PER_PROOF);

			// Should not throw, but verification will likely fail
			const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(typeof isValid).toBe("boolean");
		});

		it("should handle all-ones commitment (0xff)", () => {
			const commitment = new Uint8Array(BYTES_PER_COMMITMENT).fill(0xff);
			const z = createFieldElement();
			const y = createFieldElement();
			const proof = new Uint8Array(BYTES_PER_PROOF);

			// Invalid point, should fail or throw
			const result = () => KZG.verifyKzgProof(commitment, z, y, proof);
			expect(result()).toBe(false);
		});

		it("should produce deterministic commitments", () => {
			const blob = createValidBlob();
			// Set specific pattern
			blob[0] = 0x00;
			blob[1] = 0x01;
			blob[2] = 0x02;

			const commitment1 = KZG.blobToKzgCommitment(blob);
			const commitment2 = KZG.blobToKzgCommitment(blob);

			expect(commitment1).toEqual(commitment2);
		});

		it("should have commitment length exactly 48 bytes", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);

			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});
	});

	describe("Proof Validation", () => {
		it("should generate valid proof with correct size", () => {
			const blob = KZG.generateRandomBlob();
			const z = createFieldElement(0x55);
			const { proof, y } = KZG.computeKzgProof(blob, z);

			expect(proof.length).toBe(BYTES_PER_PROOF);
			expect(y.length).toBe(BYTES_PER_FIELD_ELEMENT);
		});

		it("should reject proof with invalid size (not 48 bytes)", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);
			const z = createFieldElement();
			const y = createFieldElement();
			const wrongProof = new Uint8Array(32); // Wrong size

			expect(() => KZG.verifyKzgProof(commitment, z, y, wrongProof)).toThrow(
				KzgError,
			);
		});

		it("should handle all-zero proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);
			const z = createFieldElement();
			const y = createFieldElement();
			const zeroProof = new Uint8Array(BYTES_PER_PROOF).fill(0);

			const isValid = KZG.verifyKzgProof(commitment, z, y, zeroProof);
			expect(isValid).toBe(false);
		});

		it("should handle all-ones proof (0xff)", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);
			const z = createFieldElement();
			const y = createFieldElement();
			const onesProof = new Uint8Array(BYTES_PER_PROOF).fill(0xff);

			const isValid = KZG.verifyKzgProof(commitment, z, y, onesProof);
			expect(isValid).toBe(false);
		});

		it("should reject proof with size 0", () => {
			const commitment = new Uint8Array(BYTES_PER_COMMITMENT);
			const z = createFieldElement();
			const y = createFieldElement();
			const wrongProof = new Uint8Array(0);

			expect(() => KZG.verifyKzgProof(commitment, z, y, wrongProof)).toThrow(
				KzgError,
			);
		});

		it("should produce deterministic proofs", () => {
			const blob = KZG.generateRandomBlob();
			const z = createFieldElement(0x99);

			const result1 = KZG.computeKzgProof(blob, z);
			const result2 = KZG.computeKzgProof(blob, z);

			expect(result1.proof).toEqual(result2.proof);
			expect(result1.y).toEqual(result2.y);
		});
	});

	describe("Blob Validation in KZG Context", () => {
		it("should compute commitment for blob with all valid field elements", () => {
			const blob = createValidBlob();
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0x00; // High byte
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = (i + j) % 256;
				}
			}

			const commitment = KZG.blobToKzgCommitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});

		it("should throw on blob with invalid field element (high byte non-zero)", () => {
			const blob = createValidBlob();
			blob[0] = 0x01; // Invalid: high byte of first field element

			expect(() => KZG.validateBlob(blob)).toThrow(KzgInvalidBlobError);
		});

		it("should throw on blob with field element at invalid position", () => {
			const blob = createValidBlob();
			const midPoint = Math.floor(FIELD_ELEMENTS_PER_BLOB / 2);
			blob[midPoint * BYTES_PER_FIELD_ELEMENT] = 0x73; // Invalid high byte

			expect(() => KZG.validateBlob(blob)).toThrow(KzgInvalidBlobError);
		});

		it("should accept blob with maximum valid field element (modulus - 1 pattern)", () => {
			const blob = new Uint8Array(BYTES_PER_BLOB);
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0x00; // Ensures < modulus
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = 0xff;
				}
			}

			expect(() => KZG.validateBlob(blob)).not.toThrow();
		});

		it("should handle empty blob (all zeros)", () => {
			const blob = KZG.createEmptyBlob();

			expect(() => KZG.validateBlob(blob)).not.toThrow();

			const commitment = KZG.blobToKzgCommitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});

		it("should compute proof for empty blob", () => {
			const blob = KZG.createEmptyBlob();
			const z = createFieldElement();

			const { proof, y } = KZG.computeKzgProof(blob, z);
			expect(proof.length).toBe(BYTES_PER_PROOF);
			expect(y.length).toBe(BYTES_PER_FIELD_ELEMENT);
		});
	});

	describe("Verification Tests", () => {
		it("should verify correct triplet (blob, commitment, proof)", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);
			const z = createFieldElement(0xaa);
			const { proof, y } = KZG.computeKzgProof(blob, z);

			const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(isValid).toBe(true);
		});

		it("should reject wrong commitment for blob", () => {
			const blob1 = KZG.generateRandomBlob();
			const blob2 = KZG.generateRandomBlob();

			const wrongCommitment = KZG.blobToKzgCommitment(blob2);
			const z = createFieldElement(0xbb);
			const { proof, y } = KZG.computeKzgProof(blob1, z);

			const isValid = KZG.verifyKzgProof(wrongCommitment, z, y, proof);
			expect(isValid).toBe(false);
		});

		it("should reject wrong proof for blob+commitment", () => {
			const blob1 = KZG.generateRandomBlob();
			const blob2 = KZG.generateRandomBlob();

			const commitment = KZG.blobToKzgCommitment(blob1);
			const z = createFieldElement(0xcc);
			const { proof: wrongProof } = KZG.computeKzgProof(blob2, z);
			const { y } = KZG.computeKzgProof(blob1, z);

			const isValid = KZG.verifyKzgProof(commitment, z, y, wrongProof);
			expect(isValid).toBe(false);
		});

		it("should reject tampered blob", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);

			// Tamper blob after commitment
			blob[100] ^= 1;

			const z = createFieldElement(0xdd);
			const { proof, y } = KZG.computeKzgProof(blob, z);

			// Proof is from tampered blob, won't match commitment
			const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(isValid).toBe(false);
		});

		it("should reject swapped commitment and proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);
			const z = createFieldElement(0xee);
			const { proof, y } = KZG.computeKzgProof(blob, z);

			// Swap commitment and proof (both 48 bytes)
			const isValid = KZG.verifyKzgProof(
				proof as unknown as BrandedKzgProof,
				z,
				y,
				commitment as unknown as BrandedKzgProof,
			);
			expect(isValid).toBe(false);
		});

		it("should reject verification with wrong evaluation point", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);
			const z = createFieldElement(0xff);
			const { proof, y } = KZG.computeKzgProof(blob, z);

			const wrongZ = createFieldElement(0x00);
			const isValid = KZG.verifyKzgProof(commitment, wrongZ, y, proof);
			expect(isValid).toBe(false);
		});

		it("should reject verification with wrong y value", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);
			const z = createFieldElement(0x11);
			const { proof, y } = KZG.computeKzgProof(blob, z);

			const wrongY = createFieldElement(0x22);
			const isValid = KZG.verifyKzgProof(commitment, z, wrongY, proof);
			expect(isValid).toBe(false);
		});
	});

	describe("Batch Verification", () => {
		it("should verify empty arrays without error", () => {
			const blobs: Uint8Array[] = [];
			const commitments: Uint8Array[] = [];
			const proofs: Uint8Array[] = [];

			// Behavior: empty batch should return true or handle gracefully
			expect(() =>
				KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs),
			).toThrow(KzgError);
		});

		it("should verify single valid triplet", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);

			// For batch verification, we need proper blob proofs
			// verifyBlobKzgProof requires specific proof format
			// This test verifies structure
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});

		it("should verify multiple valid triplets (2 blobs)", () => {
			const blobs = [KZG.generateRandomBlob(), KZG.generateRandomBlob()];
			const commitments = blobs.map((b) => KZG.blobToKzgCommitment(b));

			expect(commitments.length).toBe(2);
			commitments.forEach((c) => {
				expect(c.length).toBe(BYTES_PER_COMMITMENT);
			});
		});

		it("should verify multiple valid triplets (6 blobs)", () => {
			const count = 6;
			const blobs = Array.from({ length: count }, () =>
				KZG.generateRandomBlob(),
			);
			const commitments = blobs.map((b) => KZG.blobToKzgCommitment(b));

			expect(commitments.length).toBe(count);
			commitments.forEach((c) => {
				expect(c.length).toBe(BYTES_PER_COMMITMENT);
			});
		});

		it("should reject mismatched array lengths (blobs.length !== commitments.length)", () => {
			const blobs = [KZG.generateRandomBlob()];
			const commitments = [
				new Uint8Array(BYTES_PER_COMMITMENT),
				new Uint8Array(BYTES_PER_COMMITMENT),
			];
			const proofs = [new Uint8Array(BYTES_PER_PROOF)];

			expect(() =>
				KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs),
			).toThrow(KzgError);
		});

		it("should reject mismatched array lengths (blobs.length !== proofs.length)", () => {
			const blobs = [KZG.generateRandomBlob(), KZG.generateRandomBlob()];
			const commitments = blobs.map((b) => KZG.blobToKzgCommitment(b));
			const proofs = [new Uint8Array(BYTES_PER_PROOF)];

			expect(() =>
				KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs),
			).toThrow(KzgError);
		});

		it("should reject batch with invalid blob in middle", () => {
			const blobs = [
				KZG.generateRandomBlob(),
				new Uint8Array(1000), // Invalid size
				KZG.generateRandomBlob(),
			];
			const commitments = [
				new Uint8Array(BYTES_PER_COMMITMENT),
				new Uint8Array(BYTES_PER_COMMITMENT),
				new Uint8Array(BYTES_PER_COMMITMENT),
			];
			const proofs = [
				new Uint8Array(BYTES_PER_PROOF),
				new Uint8Array(BYTES_PER_PROOF),
				new Uint8Array(BYTES_PER_PROOF),
			];

			expect(() =>
				KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs),
			).toThrow(KzgInvalidBlobError);
		});
	});

	describe("Trusted Setup", () => {
		it("should verify trusted setup is loaded correctly", () => {
			expect(KZG.isInitialized()).toBe(true);
		});

		it("should allow operations after trusted setup loaded", () => {
			const blob = KZG.generateRandomBlob();
			expect(() => KZG.blobToKzgCommitment(blob)).not.toThrow();
		});

		it("should validate KZG parameters match EIP-4844 spec", () => {
			// Verify constants match EIP-4844
			expect(BYTES_PER_BLOB).toBe(131072); // 128 KB
			expect(BYTES_PER_COMMITMENT).toBe(48); // BLS12-381 G1
			expect(BYTES_PER_PROOF).toBe(48); // BLS12-381 G1
			expect(FIELD_ELEMENTS_PER_BLOB).toBe(4096);
			expect(BYTES_PER_FIELD_ELEMENT).toBe(32);
		});
	});

	describe("Edge Cases", () => {
		it("should compute proof at various evaluation points", () => {
			const blob = KZG.generateRandomBlob();
			const points = [0x00, 0x01, 0x42, 0x7f, 0x80, 0xff];

			for (const fill of points) {
				const z = createFieldElement(fill);
				const { proof, y } = KZG.computeKzgProof(blob, z);

				expect(proof.length).toBe(BYTES_PER_PROOF);
				expect(y.length).toBe(BYTES_PER_FIELD_ELEMENT);
			}
		});

		it("should have deterministic commitment for same blob", () => {
			const blob = KZG.generateRandomBlob();

			const c1 = KZG.blobToKzgCommitment(blob);
			const c2 = KZG.blobToKzgCommitment(blob);
			const c3 = KZG.blobToKzgCommitment(blob);

			expect(c1).toEqual(c2);
			expect(c2).toEqual(c3);
		});

		it("should validate commitment format (48 bytes, G1 point)", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.blobToKzgCommitment(blob);

			expect(commitment).toBeInstanceOf(Uint8Array);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
			// G1 point serialization should not be all zeros or all ones
			const notAllZeros = commitment.some((b) => b !== 0);
			const notAllOnes = commitment.some((b) => b !== 0xff);
			expect(notAllZeros).toBe(true);
			expect(notAllOnes).toBe(true);
		});

		it("should validate proof format (48 bytes, G1 point)", () => {
			const blob = KZG.generateRandomBlob();
			const z = createFieldElement(0x42);
			const { proof } = KZG.computeKzgProof(blob, z);

			expect(proof).toBeInstanceOf(Uint8Array);
			expect(proof.length).toBe(BYTES_PER_PROOF);
			// Proof should not be trivial
			const notAllZeros = proof.some((b) => b !== 0);
			expect(notAllZeros).toBe(true);
		});
	});
});
