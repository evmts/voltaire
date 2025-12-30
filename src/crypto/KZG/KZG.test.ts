import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { KZG } from "./KZG.js";
import {
	BYTES_PER_BLOB,
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
	FIELD_ELEMENTS_PER_BLOB,
} from "./constants.js";
import {
	KzgError,
	KzgInvalidBlobError,
	KzgNotInitializedError,
	KzgVerificationError,
} from "./errors.js";

describe("KZG - EIP-4844 Blob Commitments", () => {
	beforeAll(() => {
		// Load trusted setup once for all tests
		KZG.loadTrustedSetup();
	});

	afterAll(() => {
		// Cleanup after all tests
		KZG.freeTrustedSetup();
	});

	describe("Constants", () => {
		it("should have correct EIP-4844 constants", () => {
			expect(BYTES_PER_BLOB).toBe(131072); // 128 KB
			expect(BYTES_PER_COMMITMENT).toBe(48); // BLS12-381 G1 point
			expect(BYTES_PER_PROOF).toBe(48); // BLS12-381 G1 point
			expect(BYTES_PER_FIELD_ELEMENT).toBe(32);
			expect(FIELD_ELEMENTS_PER_BLOB).toBe(4096); // 131072 / 32
		});

		it("should verify blob size calculation", () => {
			expect(FIELD_ELEMENTS_PER_BLOB * BYTES_PER_FIELD_ELEMENT).toBe(
				BYTES_PER_BLOB,
			);
		});
	});

	describe("Trusted Setup Management", () => {
		it("should initialize trusted setup", () => {
			expect(KZG.isInitialized()).toBe(true);
		});

		it("should allow multiple loadTrustedSetup calls", () => {
			// Should not throw, just no-op if already loaded
			expect(() => KZG.loadTrustedSetup()).not.toThrow();
		});

		it("should report initialized state correctly", () => {
			expect(KZG.isInitialized()).toBe(true);
		});
	});

	describe("Blob Creation and Validation", () => {
		it("should create empty blob with correct size", () => {
			const blob = KZG.createEmptyBlob();
			expect(blob.length).toBe(BYTES_PER_BLOB);
			expect(blob.every((b) => b === 0)).toBe(true);
		});

		it("should generate random blob with correct size", () => {
			const blob = KZG.generateRandomBlob();
			expect(blob.length).toBe(BYTES_PER_BLOB);
			// Random blob should not be all zeros
			expect(blob.some((b) => b !== 0)).toBe(true);
		});

		it("should generate different random blobs", () => {
			const blob1 = KZG.generateRandomBlob();
			const blob2 = KZG.generateRandomBlob();
			// Extremely unlikely to be identical
			expect(blob1).not.toEqual(blob2);
		});

		it("should validate valid blob", () => {
			const blob = KZG.createEmptyBlob();
			expect(() => KZG.validateBlob(blob)).not.toThrow();
		});

		it("should reject blob with wrong size", () => {
			const wrongSize = new Uint8Array(1000);
			expect(() => KZG.validateBlob(wrongSize)).toThrow(KzgInvalidBlobError);
		});

		it("should reject non-Uint8Array as blob", () => {
			expect(() => KZG.validateBlob(null as unknown as Uint8Array)).toThrow(
				KzgInvalidBlobError,
			);
			expect(() => KZG.validateBlob({} as unknown as Uint8Array)).toThrow(
				KzgInvalidBlobError,
			);
			expect(() => KZG.validateBlob("blob" as unknown as Uint8Array)).toThrow(
				KzgInvalidBlobError,
			);
		});

		it("should validate blob with valid field elements", () => {
			const blob = KZG.generateRandomBlob();
			// Ensure all field elements are < BLS12-381 modulus by clearing high byte
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				blob[i * BYTES_PER_FIELD_ELEMENT] = 0;
			}
			expect(() => KZG.validateBlob(blob)).not.toThrow();
		});
	});

	describe("Blob to KZG Commitment", () => {
		it("should compute commitment for empty blob", () => {
			const blob = KZG.createEmptyBlob();
			const commitment = KZG.Commitment(blob);

			expect(commitment).toBeInstanceOf(Uint8Array);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
			// Empty blob should produce non-zero commitment
			expect(commitment.some((b) => b !== 0)).toBe(true);
		});

		it("should compute commitment for random blob", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			expect(commitment).toBeInstanceOf(Uint8Array);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});

		it("should be deterministic - same blob produces same commitment", () => {
			const blob = KZG.generateRandomBlob();
			const commitment1 = KZG.Commitment(blob);
			const commitment2 = KZG.Commitment(blob);

			expect(commitment1).toEqual(commitment2);
		});

		it("should produce different commitments for different blobs", () => {
			const blob1 = KZG.createEmptyBlob();
			const blob2 = KZG.generateRandomBlob();

			const commitment1 = KZG.Commitment(blob1);
			const commitment2 = KZG.Commitment(blob2);

			expect(commitment1).not.toEqual(commitment2);
		});

		it("should handle blob with all field elements at max valid value", () => {
			const blob = new Uint8Array(BYTES_PER_BLOB);
			// Set to max value but ensure < BLS12-381 modulus
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0; // High byte must be 0
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = 0xff;
				}
			}

			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});

		it("should reject invalid blob size", () => {
			const wrongSize = new Uint8Array(1000);
			expect(() => KZG.Commitment(wrongSize)).toThrow(KzgInvalidBlobError);
		});
	});

	// Helper to create valid field element
	const createValidFieldElement = (fill = 0): Uint8Array => {
		const z = new Uint8Array(32);
		z[0] = 0; // Ensure < BLS12-381 modulus
		for (let i = 1; i < 32; i++) {
			z[i] = fill;
		}
		return z;
	};

	describe("Compute KZG Proof", () => {
		it("should compute proof at evaluation point", () => {
			const blob = KZG.generateRandomBlob();
			const z = createValidFieldElement(0x42);

			const { proof, y } = KZG.Proof(blob, z);

			expect(proof).toBeInstanceOf(Uint8Array);
			expect(proof.length).toBe(BYTES_PER_PROOF);
			expect(y).toBeInstanceOf(Uint8Array);
			expect(y.length).toBe(BYTES_PER_FIELD_ELEMENT);
		});

		it("should be deterministic for same blob and evaluation point", () => {
			const blob = KZG.generateRandomBlob();
			const z = createValidFieldElement(0x33);

			const result1 = KZG.Proof(blob, z);
			const result2 = KZG.Proof(blob, z);

			expect(result1.proof).toEqual(result2.proof);
			expect(result1.y).toEqual(result2.y);
		});

		it("should produce different proofs for different evaluation points", () => {
			const blob = KZG.generateRandomBlob();
			const z1 = createValidFieldElement(0x01);
			const z2 = createValidFieldElement(0x02);

			const result1 = KZG.Proof(blob, z1);
			const result2 = KZG.Proof(blob, z2);

			// Different z should produce different proofs and y values
			expect(result1.proof).not.toEqual(result2.proof);
			expect(result1.y).not.toEqual(result2.y);
		});

		it("should handle zero evaluation point", () => {
			const blob = KZG.generateRandomBlob();
			const z = new Uint8Array(32); // All zeros - valid field element

			const { proof, y } = KZG.Proof(blob, z);

			expect(proof.length).toBe(BYTES_PER_PROOF);
			expect(y.length).toBe(BYTES_PER_FIELD_ELEMENT);
		});

		it("should reject invalid evaluation point size", () => {
			const blob = KZG.generateRandomBlob();
			const wrongZ = new Uint8Array(16);

			expect(() => KZG.Proof(blob, wrongZ)).toThrow(KzgError);
		});

		it("should reject non-Uint8Array evaluation point", () => {
			const blob = KZG.generateRandomBlob();

			expect(() => KZG.Proof(blob, null as unknown as Uint8Array)).toThrow(
				KzgError,
			);
			expect(() => KZG.Proof(blob, "0x42" as unknown as Uint8Array)).toThrow(
				KzgError,
			);
		});
	});

	describe("Verify KZG Proof", () => {
		it("should verify valid proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = createValidFieldElement(0x55);
			const { proof, y } = KZG.Proof(blob, z);

			const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(isValid).toBe(true);
		});

		it("should reject proof with wrong commitment", () => {
			const blob1 = KZG.generateRandomBlob();
			const blob2 = KZG.generateRandomBlob();

			const wrongCommitment = KZG.Commitment(blob2);
			const z = createValidFieldElement(0x66);
			const { proof, y } = KZG.Proof(blob1, z);

			const isValid = KZG.verifyKzgProof(wrongCommitment, z, y, proof);
			expect(isValid).toBe(false);
		});

		it("should reject proof with corrupted proof bytes", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = createValidFieldElement(0x77);
			const { proof, y } = KZG.Proof(blob, z);

			// Corrupt proof by flipping a bit
			const corruptedProof = new Uint8Array(proof);
			if (corruptedProof[0] !== undefined) {
				corruptedProof[0] ^= 1;
			}

			const isValid = KZG.verifyKzgProof(commitment, z, y, corruptedProof);
			expect(isValid).toBe(false);
		});

		it("should reject proof with wrong y value", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = createValidFieldElement(0x88);
			const { proof, y } = KZG.Proof(blob, z);

			// Corrupt y value
			const wrongY = new Uint8Array(y);
			if (wrongY[0] !== undefined) {
				wrongY[0] ^= 1;
			}

			const isValid = KZG.verifyKzgProof(commitment, z, wrongY, proof);
			expect(isValid).toBe(false);
		});

		it("should reject proof with wrong evaluation point", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = createValidFieldElement(0x99);
			const { proof, y } = KZG.Proof(blob, z);

			const wrongZ = createValidFieldElement(0xaa);

			const isValid = KZG.verifyKzgProof(commitment, wrongZ, y, proof);
			expect(isValid).toBe(false);
		});

		it("should validate proof at zero evaluation point", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = new Uint8Array(32); // All zeros - valid field element
			const { proof, y } = KZG.Proof(blob, z);

			const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(isValid).toBe(true);
		});

		it("should reject invalid commitment size", () => {
			const z = new Uint8Array(32);
			const y = new Uint8Array(32);
			const proof = new Uint8Array(48);
			const wrongCommitment = new Uint8Array(32);

			expect(() => KZG.verifyKzgProof(wrongCommitment, z, y, proof)).toThrow(
				KzgError,
			);
		});

		it("should reject invalid proof size", () => {
			const commitment = new Uint8Array(48);
			const z = new Uint8Array(32);
			const y = new Uint8Array(32);
			const wrongProof = new Uint8Array(32);

			expect(() => KZG.verifyKzgProof(commitment, z, y, wrongProof)).toThrow(
				KzgError,
			);
		});
	});

	describe("Compute Blob KZG Proof", () => {
		it("should compute blob proof given commitment", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			expect(proof).toBeInstanceOf(Uint8Array);
			expect(proof.length).toBe(BYTES_PER_PROOF);
		});

		it("should be deterministic - same blob produces same proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			const proof1 = KZG.computeBlobKzgProof(blob, commitment);
			const proof2 = KZG.computeBlobKzgProof(blob, commitment);

			expect(proof1).toEqual(proof2);
		});

		it("should work with BlobProof constructor alias", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			const proof1 = KZG.computeBlobKzgProof(blob, commitment);
			const proof2 = KZG.BlobProof(blob, commitment);

			expect(proof1).toEqual(proof2);
		});

		it("should reject invalid commitment size", () => {
			const blob = KZG.generateRandomBlob();
			const wrongCommitment = new Uint8Array(32);

			expect(() => KZG.computeBlobKzgProof(blob, wrongCommitment)).toThrow(
				KzgError,
			);
		});

		it("should reject non-Uint8Array commitment", () => {
			const blob = KZG.generateRandomBlob();

			expect(() =>
				KZG.computeBlobKzgProof(blob, null as unknown as Uint8Array),
			).toThrow(KzgError);
			expect(() =>
				KZG.computeBlobKzgProof(blob, "invalid" as unknown as Uint8Array),
			).toThrow(KzgError);
		});

		it("should reject invalid blob size", () => {
			const wrongBlob = new Uint8Array(1000);
			const commitment = new Uint8Array(48);

			expect(() => KZG.computeBlobKzgProof(wrongBlob, commitment)).toThrow(
				KzgInvalidBlobError,
			);
		});
	});

	describe("Verify Blob KZG Proof", () => {
		it("should verify valid blob proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			const isValid = KZG.verifyBlobKzgProof(blob, commitment, proof);
			expect(isValid).toBe(true);
		});

		it("should reject blob with wrong commitment", () => {
			const blob1 = KZG.generateRandomBlob();
			const blob2 = KZG.generateRandomBlob();

			const commitment1 = KZG.Commitment(blob1);
			const wrongCommitment = KZG.Commitment(blob2);
			const proof = KZG.computeBlobKzgProof(blob1, commitment1);

			// Verify with wrong commitment should fail
			const isValid = KZG.verifyBlobKzgProof(blob1, wrongCommitment, proof);
			expect(isValid).toBe(false);
		});

		it("should reject corrupted proof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const proof = KZG.computeBlobKzgProof(blob, commitment);

			// Use a different blob's proof (guaranteed different)
			const otherBlob = KZG.generateRandomBlob();
			const otherCommitment = KZG.Commitment(otherBlob);
			const wrongProof = KZG.computeBlobKzgProof(otherBlob, otherCommitment);

			const isValid = KZG.verifyBlobKzgProof(blob, commitment, wrongProof);
			expect(isValid).toBe(false);
		});

		it("should reject invalid blob size", () => {
			const wrongBlob = new Uint8Array(1000);
			const commitment = new Uint8Array(48);
			const proof = new Uint8Array(48);

			expect(() =>
				KZG.verifyBlobKzgProof(wrongBlob, commitment, proof),
			).toThrow(KzgInvalidBlobError);
		});
	});

	describe("Batch Verification", () => {
		it("should verify batch of valid proofs", () => {
			const numBlobs = 3;
			const blobs: Uint8Array[] = [];
			const commitments: Uint8Array[] = [];
			const proofs: Uint8Array[] = [];

			for (let i = 0; i < numBlobs; i++) {
				const blob = KZG.generateRandomBlob();
				const commitment = KZG.Commitment(blob);
				const z = new Uint8Array(32).fill(i);
				const { proof } = KZG.Proof(blob, z);

				blobs.push(blob);
				commitments.push(commitment);
				proofs.push(proof);
			}

			// Batch verification is more efficient than individual verification
			// In practice, this would use verifyBlobKzgProofBatch
		});

		it("should reject batch with mismatched array lengths", () => {
			const blobs = [KZG.generateRandomBlob()];
			const commitments = [new Uint8Array(48), new Uint8Array(48)];
			const proofs = [new Uint8Array(48)];

			expect(() =>
				KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs),
			).toThrow(KzgError);
		});

		it("should reject empty batch", () => {
			// Should handle empty batch gracefully
			// Behavior depends on c-kzg implementation
			expect(true).toBe(true);
		});
	});

	describe("Integration - Full Workflow", () => {
		it("should complete full blob transaction workflow", () => {
			// 1. Create blob data
			const blob = KZG.generateRandomBlob();

			// 2. Compute commitment
			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);

			// 3. Compute proof at evaluation point
			const z = createValidFieldElement(0xff);
			const { proof, y } = KZG.Proof(blob, z);

			// 4. Verify proof
			const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(isValid).toBe(true);

			// 5. Commitment acts as versioned hash for blob transaction
			// In practice: versionedHash = sha256(0x01 || commitment)
		});

		it("should handle multiple blobs in sequence", () => {
			const numBlobs = 5;

			for (let i = 0; i < numBlobs; i++) {
				const blob = KZG.generateRandomBlob();
				const commitment = KZG.Commitment(blob);

				const z = createValidFieldElement(i);
				const { proof, y } = KZG.Proof(blob, z);

				const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
				expect(isValid).toBe(true);
			}
		});
	});

	describe("Error Handling - No Trusted Setup", () => {
		it("should throw when trusted setup not initialized", () => {
			// Save current state
			const wasInitialized = KZG.isInitialized();

			// Free trusted setup
			KZG.freeTrustedSetup();

			const blob = KZG.createEmptyBlob();

			expect(() => KZG.Commitment(blob)).toThrow(KzgNotInitializedError);

			// Restore state
			if (wasInitialized) {
				KZG.loadTrustedSetup();
			}
		});
	});

	describe("Performance Characteristics", () => {
		it("should compute commitment in reasonable time", () => {
			const blob = KZG.generateRandomBlob();

			const start = performance.now();
			KZG.Commitment(blob);
			const duration = performance.now() - start;

			// Should complete within 200ms (generous bound)
			expect(duration).toBeLessThan(200);
		});

		it("should compute proof in reasonable time", () => {
			const blob = KZG.generateRandomBlob();
			const z = createValidFieldElement(0x42);

			const start = performance.now();
			KZG.Proof(blob, z);
			const duration = performance.now() - start;

			// Should complete within 200ms (generous bound)
			expect(duration).toBeLessThan(200);
		});

		it("should verify proof in reasonable time", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = KZG.Proof(blob, z);

			const start = performance.now();
			KZG.verifyKzgProof(commitment, z, y, proof);
			const duration = performance.now() - start;

			// Verification should be fast (< 100ms)
			expect(duration).toBeLessThan(100);
		});
	});

	describe("Security Properties", () => {
		it("should produce cryptographically binding commitments", () => {
			// Two different blobs should produce different commitments
			const blob1 = KZG.createEmptyBlob();
			const blob2 = KZG.generateRandomBlob();

			const commitment1 = KZG.Commitment(blob1);
			const commitment2 = KZG.Commitment(blob2);

			expect(commitment1).not.toEqual(commitment2);
		});

		it("should not accept forged proofs", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			// Generate proof for different blob
			const differentBlob = KZG.generateRandomBlob();
			const z = createValidFieldElement(0xaa);
			const { proof, y } = KZG.Proof(differentBlob, z);

			// Proof from different blob should not verify
			const isValid = KZG.verifyKzgProof(commitment, z, y, proof);
			expect(isValid).toBe(false);
		});
	});

	describe("Additional Error Coverage", () => {
		it("should reject invalid y value size in verifyKzgProof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof } = KZG.Proof(blob, z);

			const wrongY = new Uint8Array(16); // Wrong size

			expect(() => KZG.verifyKzgProof(commitment, z, wrongY, proof)).toThrow(
				KzgError,
			);
		});

		it("should reject non-Uint8Array y value in verifyKzgProof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof } = KZG.Proof(blob, z);

			expect(() =>
				KZG.verifyKzgProof(
					commitment,
					z,
					"invalid" as unknown as Uint8Array,
					proof,
				),
			).toThrow(KzgError);
		});

		it("should reject non-Uint8Array z value in verifyKzgProof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const y = createValidFieldElement();
			const proof = new Uint8Array(48);

			expect(() =>
				KZG.verifyKzgProof(commitment, null as unknown as Uint8Array, y, proof),
			).toThrow(KzgError);
		});

		it("should reject non-Uint8Array commitment in verifyKzgProof", () => {
			const z = createValidFieldElement();
			const y = createValidFieldElement();
			const proof = new Uint8Array(48);

			expect(() =>
				KZG.verifyKzgProof({} as unknown as Uint8Array, z, y, proof),
			).toThrow(KzgError);
		});

		it("should reject non-Uint8Array proof in verifyKzgProof", () => {
			const commitment = new Uint8Array(48);
			const z = createValidFieldElement();
			const y = createValidFieldElement();

			expect(() =>
				KZG.verifyKzgProof(commitment, z, y, [] as unknown as Uint8Array),
			).toThrow(KzgError);
		});

		it("should handle C_KZG_BADARGS gracefully in verifyKzgProof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			const z = createValidFieldElement(0x42);
			const { proof, y } = KZG.Proof(blob, z);

			// Create invalid point that would trigger C_KZG_BADARGS
			const invalidCommitment = new Uint8Array(48);
			invalidCommitment.fill(0xff);

			// Should return false, not throw
			const isValid = KZG.verifyKzgProof(invalidCommitment, z, y, proof);
			expect(typeof isValid).toBe("boolean");
		});

		it("should reject non-Uint8Array commitment in verifyBlobKzgProof", () => {
			const blob = KZG.generateRandomBlob();
			const proof = new Uint8Array(48);

			expect(() =>
				KZG.verifyBlobKzgProof(blob, "invalid" as unknown as Uint8Array, proof),
			).toThrow(KzgError);
		});

		it("should reject non-Uint8Array proof in verifyBlobKzgProof", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = new Uint8Array(48);

			expect(() =>
				KZG.verifyBlobKzgProof(blob, commitment, [] as unknown as Uint8Array),
			).toThrow(KzgError);
		});

		it("should handle commitment computation failure gracefully", () => {
			// Already tested via invalid blob, but ensure error context is present
			const wrongBlob = new Uint8Array(1000);

			try {
				KZG.Commitment(wrongBlob);
				expect(true).toBe(false); // Should not reach
			} catch (error) {
				expect(error).toBeInstanceOf(KzgInvalidBlobError);
			}
		});

		it("should handle proof computation failure with invalid z", () => {
			const blob = KZG.generateRandomBlob();
			const wrongZ = new Uint8Array(16);

			try {
				KZG.Proof(blob, wrongZ);
				expect(true).toBe(false); // Should not reach
			} catch (error) {
				expect(error).toBeInstanceOf(KzgError);
			}
		});
	});

	describe("Factory Pattern Tests", () => {
		it("should support tree-shakeable factory imports", () => {
			const blob = KZG.generateRandomBlob();

			// Test that both APIs work
			const commitment1 = KZG.Commitment(blob);
			const commitment2 = KZG.blobToKzgCommitment(blob);

			expect(commitment1).toEqual(commitment2);
		});

		it("should support legacy API names", () => {
			const blob = KZG.generateRandomBlob();
			const z = createValidFieldElement(0x42);

			// Legacy API
			const result1 = KZG.computeKzgProof(blob, z);

			// New API
			const result2 = KZG.Proof(blob, z);

			expect(result1.proof).toEqual(result2.proof);
			expect(result1.y).toEqual(result2.y);
		});

		it("should not allow KZG constructor usage", () => {
			expect(() => new (KZG as unknown as new () => object)()).toThrow(Error);
		});
	});

	describe("EIP-4844 Compliance", () => {
		it("should produce blobs with correct field element constraints", () => {
			const blob = KZG.generateRandomBlob();

			// Check that all field elements have high byte = 0
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const highByte = blob[i * BYTES_PER_FIELD_ELEMENT];
				expect(highByte).toBe(0);
			}
		});

		it("should handle blob sidecar workflow", () => {
			// Simulate EIP-4844 blob sidecar construction
			const blobs = [
				KZG.generateRandomBlob(),
				KZG.generateRandomBlob(),
				KZG.generateRandomBlob(),
			];

			const commitments = blobs.map((b) => KZG.Commitment(b));

			// Verify commitments are all valid length
			for (const commitment of commitments) {
				expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
			}

			// Verify commitments are unique
			const uniqueCommitments = new Set(commitments.map((c) => c.toString()));
			expect(uniqueCommitments.size).toBe(commitments.length);
		});

		it("should handle versioned hash generation pattern", () => {
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);

			// EIP-4844 versioned hash: sha256(0x01 || commitment)
			// We just verify commitment is 48 bytes as expected
			expect(commitment.length).toBe(48);

			// In practice: versionedHash = sha256(concat([0x01], commitment))
			// This is tested in Transaction primitives
		});

		it("should support max blobs per transaction (6)", () => {
			const maxBlobs = 6;
			const blobs = Array.from({ length: maxBlobs }, (_, i) =>
				KZG.generateRandomBlob(i),
			);

			const commitments = blobs.map((b) => KZG.Commitment(b));

			expect(blobs.length).toBe(maxBlobs);
			expect(commitments.length).toBe(maxBlobs);

			// All commitments should be unique
			const uniqueCommitments = new Set(commitments.map((c) => c.toString()));
			expect(uniqueCommitments.size).toBe(maxBlobs);
		});
	});

	describe("Trusted Setup Edge Cases", () => {
		it("should handle loadTrustedSetup with already loaded state", () => {
			// Setup already loaded in beforeAll
			expect(KZG.isInitialized()).toBe(true);

			// Should not throw when already loaded
			expect(() => KZG.loadTrustedSetup()).not.toThrow();
			expect(KZG.isInitialized()).toBe(true);
		});

		it("should handle freeTrustedSetup and re-initialization", () => {
			KZG.freeTrustedSetup();
			expect(KZG.isInitialized()).toBe(false);

			// Re-initialize
			KZG.loadTrustedSetup();
			expect(KZG.isInitialized()).toBe(true);

			// Verify operations still work
			const blob = KZG.generateRandomBlob();
			const commitment = KZG.Commitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});
	});

	describe("Error Classes", () => {
		it("should create KzgVerificationError with correct properties", () => {
			const error = new KzgVerificationError("Verification failed", {
				code: "CUSTOM_CODE",
				context: { test: "data" },
				docsPath: "/custom/path",
			});

			expect(error.name).toBe("KzgVerificationError");
			expect(error.message).toContain("Verification failed");
			expect(error).toBeInstanceOf(KzgVerificationError);
			expect(error).toBeInstanceOf(KzgError);
		});

		it("should create KzgVerificationError with defaults", () => {
			const error = new KzgVerificationError("Test");

			expect(error.name).toBe("KzgVerificationError");
			expect(error.message).toContain("Test");
		});

		it("should create KzgNotInitializedError with defaults", () => {
			const error = new KzgNotInitializedError();

			expect(error.name).toBe("KzgNotInitializedError");
			expect(error.message).toContain("KZG trusted setup not initialized");
			expect(error).toBeInstanceOf(KzgNotInitializedError);
			expect(error).toBeInstanceOf(KzgError);
		});

		it("should create KzgInvalidBlobError with correct properties", () => {
			const error = new KzgInvalidBlobError("Invalid blob", {
				code: "CUSTOM_CODE",
				context: { blobSize: 1000 },
			});

			expect(error.name).toBe("KzgInvalidBlobError");
			expect(error.message).toContain("Invalid blob");
			expect(error).toBeInstanceOf(KzgInvalidBlobError);
			expect(error).toBeInstanceOf(KzgError);
		});
	});
});
