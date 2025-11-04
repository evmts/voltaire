import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	BYTES_PER_BLOB,
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
	FIELD_ELEMENTS_PER_BLOB,
	Kzg,
	KzgError,
	KzgInvalidBlobError,
	KzgNotInitializedError,
} from "./kzg.js";

describe("Kzg Constants", () => {
	it("should have correct EIP-4844 constants", () => {
		expect(BYTES_PER_BLOB).toBe(131072);
		expect(BYTES_PER_COMMITMENT).toBe(48);
		expect(BYTES_PER_PROOF).toBe(48);
		expect(BYTES_PER_FIELD_ELEMENT).toBe(32);
		expect(FIELD_ELEMENTS_PER_BLOB).toBe(4096);
	});
});

describe("Kzg Initialization", () => {
	afterAll(() => {
		// Ensure we leave tests with initialized state
		if (!Kzg.isInitialized()) {
			Kzg.loadTrustedSetup();
		}
	});

	it("should not be initialized before loadTrustedSetup", () => {
		Kzg.freeTrustedSetup();
		expect(Kzg.isInitialized()).toBe(false);
	});

	it("should initialize with embedded trusted setup", () => {
		Kzg.freeTrustedSetup();
		Kzg.loadTrustedSetup();
		expect(Kzg.isInitialized()).toBe(true);
	});

	it("should be idempotent when calling loadTrustedSetup multiple times", () => {
		Kzg.loadTrustedSetup();
		Kzg.loadTrustedSetup();
		Kzg.loadTrustedSetup();
		expect(Kzg.isInitialized()).toBe(true);
	});

	it("should free trusted setup", () => {
		Kzg.loadTrustedSetup();
		Kzg.freeTrustedSetup();
		expect(Kzg.isInitialized()).toBe(false);
	});

	it("should be safe to call freeTrustedSetup when not initialized", () => {
		Kzg.freeTrustedSetup();
		Kzg.freeTrustedSetup();
		expect(Kzg.isInitialized()).toBe(false);
	});
});

describe("Kzg Blob Validation", () => {
	beforeAll(() => {
		if (!Kzg.isInitialized()) {
			Kzg.loadTrustedSetup();
		}
	});

	it("should validate empty blob", () => {
		const blob = Kzg.createEmptyBlob();
		expect(() => Kzg.validateBlob(blob)).not.toThrow();
	});

	it("should reject non-Uint8Array", () => {
		expect(() => Kzg.validateBlob([] as any)).toThrow(KzgInvalidBlobError);
	});

	it("should reject wrong size blob", () => {
		const blob = new Uint8Array(1000);
		expect(() => Kzg.validateBlob(blob)).toThrow(KzgInvalidBlobError);
	});

	it("should reject blob with invalid field element", () => {
		const blob = new Uint8Array(BYTES_PER_BLOB);
		// Set top byte of first field element to non-zero
		blob[0] = 1;
		expect(() => Kzg.validateBlob(blob)).toThrow(KzgInvalidBlobError);
	});

	it("should validate random blob with correct format", () => {
		const blob = Kzg.generateRandomBlob(12345);
		expect(() => Kzg.validateBlob(blob)).not.toThrow();
	});
});

describe("Kzg Utility Functions", () => {
	it("should create empty blob", () => {
		const blob = Kzg.createEmptyBlob();
		expect(blob).toBeInstanceOf(Uint8Array);
		expect(blob.length).toBe(BYTES_PER_BLOB);
		expect(blob.every((b) => b === 0)).toBe(true);
	});

	it("should generate random blob", () => {
		const blob = Kzg.generateRandomBlob();
		expect(blob).toBeInstanceOf(Uint8Array);
		expect(blob.length).toBe(BYTES_PER_BLOB);
		// Should not be all zeros
		expect(blob.some((b) => b !== 0)).toBe(true);
	});

	it("should generate deterministic random blob with seed", () => {
		const blob1 = Kzg.generateRandomBlob(42);
		const blob2 = Kzg.generateRandomBlob(42);
		expect(blob1).toEqual(blob2);
	});

	it("should generate different blobs with different seeds", () => {
		const blob1 = Kzg.generateRandomBlob(1);
		const blob2 = Kzg.generateRandomBlob(2);
		expect(blob1).not.toEqual(blob2);
	});
});

describe("Kzg Blob to Commitment", () => {
	beforeAll(() => {
		if (!Kzg.isInitialized()) {
			Kzg.loadTrustedSetup();
		}
	});

	it("should throw if not initialized", () => {
		Kzg.freeTrustedSetup();
		const blob = Kzg.createEmptyBlob();
		expect(() => Kzg.blobToKzgCommitment(blob)).toThrow(KzgNotInitializedError);
		Kzg.loadTrustedSetup();
	});

	it("should compute commitment for empty blob", () => {
		const blob = Kzg.createEmptyBlob();
		const commitment = Kzg.blobToKzgCommitment(blob);
		expect(commitment).toBeInstanceOf(Uint8Array);
		expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
	});

	it("should compute commitment for random blob", () => {
		const blob = Kzg.generateRandomBlob(999);
		const commitment = Kzg.blobToKzgCommitment(blob);
		expect(commitment).toBeInstanceOf(Uint8Array);
		expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		// Commitment should not be all zeros for random blob
		expect(commitment.some((b) => b !== 0)).toBe(true);
	});

	it("should be deterministic", () => {
		const blob = Kzg.generateRandomBlob(12345);
		const commitment1 = Kzg.blobToKzgCommitment(blob);
		const commitment2 = Kzg.blobToKzgCommitment(blob);
		expect(commitment1).toEqual(commitment2);
	});

	it("should produce different commitments for different blobs", () => {
		const blob1 = Kzg.generateRandomBlob(1);
		const blob2 = Kzg.generateRandomBlob(2);
		const commitment1 = Kzg.blobToKzgCommitment(blob1);
		const commitment2 = Kzg.blobToKzgCommitment(blob2);
		expect(commitment1).not.toEqual(commitment2);
	});

	it("should reject invalid blob", () => {
		const blob = new Uint8Array(1000);
		expect(() => Kzg.blobToKzgCommitment(blob)).toThrow(KzgInvalidBlobError);
	});
});

describe("Kzg Compute Proof", () => {
	beforeAll(() => {
		if (!Kzg.isInitialized()) {
			Kzg.loadTrustedSetup();
		}
	});

	it("should throw if not initialized", () => {
		Kzg.freeTrustedSetup();
		const blob = Kzg.createEmptyBlob();
		const z = new Uint8Array(32);
		expect(() => Kzg.computeKzgProof(blob, z)).toThrow(KzgNotInitializedError);
		Kzg.loadTrustedSetup();
	});

	it("should compute proof for empty blob", () => {
		const blob = Kzg.createEmptyBlob();
		const z = new Uint8Array(32);
		const { proof, y } = Kzg.computeKzgProof(blob, z);
		expect(proof).toBeInstanceOf(Uint8Array);
		expect(proof.length).toBe(BYTES_PER_PROOF);
		expect(y).toBeInstanceOf(Uint8Array);
		expect(y.length).toBe(BYTES_PER_FIELD_ELEMENT);
	});

	it("should compute proof for random blob", () => {
		const blob = Kzg.generateRandomBlob(7777);
		const z = new Uint8Array(32);
		z[31] = 0x42;
		const { proof, y } = Kzg.computeKzgProof(blob, z);
		expect(proof).toBeInstanceOf(Uint8Array);
		expect(proof.length).toBe(BYTES_PER_PROOF);
		expect(y).toBeInstanceOf(Uint8Array);
		expect(y.length).toBe(BYTES_PER_FIELD_ELEMENT);
	});

	it("should be deterministic", () => {
		const blob = Kzg.generateRandomBlob(8888);
		const z = new Uint8Array(32);
		z[31] = 0x33;
		const result1 = Kzg.computeKzgProof(blob, z);
		const result2 = Kzg.computeKzgProof(blob, z);
		expect(result1.proof).toEqual(result2.proof);
		expect(result1.y).toEqual(result2.y);
	});

	it("should reject invalid blob", () => {
		const blob = new Uint8Array(1000);
		const z = new Uint8Array(32);
		expect(() => Kzg.computeKzgProof(blob, z)).toThrow(KzgInvalidBlobError);
	});

	it("should reject invalid evaluation point", () => {
		const blob = Kzg.createEmptyBlob();
		const z = new Uint8Array(16);
		expect(() => Kzg.computeKzgProof(blob, z)).toThrow(KzgError);
	});
});

describe("Kzg Verify Proof", () => {
	beforeAll(() => {
		if (!Kzg.isInitialized()) {
			Kzg.loadTrustedSetup();
		}
	});

	it("should throw if not initialized", () => {
		Kzg.freeTrustedSetup();
		const commitment = new Uint8Array(48);
		const z = new Uint8Array(32);
		const y = new Uint8Array(32);
		const proof = new Uint8Array(48);
		expect(() => Kzg.verifyKzgProof(commitment, z, y, proof)).toThrow(
			KzgNotInitializedError,
		);
		Kzg.loadTrustedSetup();
	});

	it("should verify valid proof", () => {
		const blob = Kzg.generateRandomBlob(9999);
		const commitment = Kzg.blobToKzgCommitment(blob);
		const z = new Uint8Array(32);
		z[31] = 0x44;
		const { proof, y } = Kzg.computeKzgProof(blob, z);
		const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
		expect(valid).toBe(true);
	});

	it("should reject invalid proof (corrupted)", () => {
		const blob = Kzg.generateRandomBlob(1111);
		const commitment = Kzg.blobToKzgCommitment(blob);
		const z = new Uint8Array(32);
		z[31] = 0x55;
		const { proof, y } = Kzg.computeKzgProof(blob, z);
		// Corrupt the proof
		const corruptedProof = new Uint8Array(proof);
		corruptedProof[0]! ^= 1;
		const valid = Kzg.verifyKzgProof(commitment, z, y, corruptedProof);
		expect(valid).toBe(false);
	});

	it("should reject proof with wrong commitment", () => {
		const blob1 = Kzg.generateRandomBlob(2222);
		const blob2 = Kzg.generateRandomBlob(3333);
		const commitment2 = Kzg.blobToKzgCommitment(blob2);
		const z = new Uint8Array(32);
		z[31] = 0x66;
		const { proof, y } = Kzg.computeKzgProof(blob1, z);
		// Verify with wrong commitment
		const valid = Kzg.verifyKzgProof(commitment2, z, y, proof);
		expect(valid).toBe(false);
	});

	it("should reject proof with wrong y value", () => {
		const blob = Kzg.generateRandomBlob(4444);
		const commitment = Kzg.blobToKzgCommitment(blob);
		const z = new Uint8Array(32);
		z[31] = 0x77;
		const { proof, y } = Kzg.computeKzgProof(blob, z);
		// Corrupt y value
		const wrongY = new Uint8Array(y);
		wrongY[0]! ^= 1;
		const valid = Kzg.verifyKzgProof(commitment, z, wrongY, proof);
		expect(valid).toBe(false);
	});

	it("should reject invalid commitment size", () => {
		const commitment = new Uint8Array(32);
		const z = new Uint8Array(32);
		const y = new Uint8Array(32);
		const proof = new Uint8Array(48);
		expect(() => Kzg.verifyKzgProof(commitment, z, y, proof)).toThrow(KzgError);
	});

	it("should reject invalid proof size", () => {
		const commitment = new Uint8Array(48);
		const z = new Uint8Array(32);
		const y = new Uint8Array(32);
		const proof = new Uint8Array(32);
		expect(() => Kzg.verifyKzgProof(commitment, z, y, proof)).toThrow(KzgError);
	});
});

describe("Kzg Verify Blob Proof", () => {
	beforeAll(() => {
		if (!Kzg.isInitialized()) {
			Kzg.loadTrustedSetup();
		}
	});

	it("should verify valid blob proof", () => {
		const blob = Kzg.generateRandomBlob(5555);
		const commitment = Kzg.blobToKzgCommitment(blob);
		// For blob proof, we need to use computeBlobKzgProof from c-kzg directly
		const ckzg = require("c-kzg");
		const proof = ckzg.computeBlobKzgProof(blob, commitment)!;
		const valid = Kzg.verifyBlobKzgProof(blob, commitment, proof);
		expect(valid).toBe(true);
	});

	it("should reject invalid blob", () => {
		const blob = new Uint8Array(1000);
		const commitment = new Uint8Array(48);
		const proof = new Uint8Array(48);
		expect(() => Kzg.verifyBlobKzgProof(blob, commitment, proof)).toThrow(
			KzgInvalidBlobError,
		);
	});
});

describe("Kzg Batch Verification", () => {
	beforeAll(() => {
		if (!Kzg.isInitialized()) {
			Kzg.loadTrustedSetup();
		}
	});

	it("should verify batch of valid proofs", () => {
		const blobs = [
			Kzg.generateRandomBlob(1),
			Kzg.generateRandomBlob(2),
			Kzg.generateRandomBlob(3),
		];
		const commitments = blobs.map((blob) => Kzg.blobToKzgCommitment(blob));
		// For blob batch verification, use computeBlobKzgProof
		const ckzg = require("c-kzg");
		const proofs = blobs.map((blob, i) =>
			ckzg.computeBlobKzgProof(blob, commitments[i]!),
		);
		const valid = Kzg.verifyBlobKzgProofBatch(blobs, commitments, proofs);
		expect(valid).toBe(true);
	});

	it("should reject mismatched array lengths", () => {
		const blobs = [Kzg.generateRandomBlob(1), Kzg.generateRandomBlob(2)];
		const commitments = [Kzg.blobToKzgCommitment(blobs[0]!)];
		const proofs = [Kzg.computeKzgProof(blobs[0]!, new Uint8Array(32)).proof];
		expect(() =>
			Kzg.verifyBlobKzgProofBatch(blobs, commitments, proofs),
		).toThrow(KzgError);
	});

	it("should handle empty arrays", () => {
		const valid = Kzg.verifyBlobKzgProofBatch([], [], []);
		expect(valid).toBe(true);
	});
});

describe("Kzg Integration Tests", () => {
	beforeAll(() => {
		if (!Kzg.isInitialized()) {
			Kzg.loadTrustedSetup();
		}
	});

	it("should complete full workflow", () => {
		// Create blob
		const blob = Kzg.generateRandomBlob(54321);

		// Generate commitment
		const commitment = Kzg.blobToKzgCommitment(blob);
		expect(commitment.length).toBe(BYTES_PER_COMMITMENT);

		// Compute proofs at multiple evaluation points
		const testPoints = [0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77];

		for (const pointByte of testPoints) {
			const z = new Uint8Array(32);
			z[31] = pointByte;

			// Generate proof
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			// Verify proof
			const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		}
	});

	it("should handle multiple blobs with same setup", () => {
		const numBlobs = 10;

		for (let i = 0; i < numBlobs; i++) {
			const blob = Kzg.generateRandomBlob(i * 1000);
			const commitment = Kzg.blobToKzgCommitment(blob);

			const z = new Uint8Array(32);
			z[31] = i;

			const { proof, y } = Kzg.computeKzgProof(blob, z);
			const valid = Kzg.verifyKzgProof(commitment, z, y, proof);

			expect(valid).toBe(true);
		}
	});

	it("should verify commitment uniqueness", () => {
		const blob1 = Kzg.generateRandomBlob(1);
		const blob2 = Kzg.generateRandomBlob(2);

		const commitment1 = Kzg.blobToKzgCommitment(blob1);
		const commitment2 = Kzg.blobToKzgCommitment(blob2);

		// Commitments should be different
		expect(commitment1).not.toEqual(commitment2);
	});

	it("should maintain proof consistency across multiple calls", () => {
		const blob = Kzg.generateRandomBlob(55555);
		const commitment = Kzg.blobToKzgCommitment(blob);

		const z = new Uint8Array(32);
		z[31] = 0xaa;

		// Generate same proof multiple times
		for (let i = 0; i < 5; i++) {
			const { proof, y } = Kzg.computeKzgProof(blob, z);
			const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
			expect(valid).toBe(true);
		}
	});
});

describe("Kzg Edge Cases", () => {
	beforeAll(() => {
		if (!Kzg.isInitialized()) {
			Kzg.loadTrustedSetup();
		}
	});

	it("should handle all-zero blob", () => {
		const blob = Kzg.createEmptyBlob();
		const commitment = Kzg.blobToKzgCommitment(blob);

		const z = new Uint8Array(32);
		z[31] = 0x01;
		const { proof, y } = Kzg.computeKzgProof(blob, z);

		const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
		expect(valid).toBe(true);
	});

	it("should handle zero evaluation point", () => {
		const blob = Kzg.generateRandomBlob(11111);
		const commitment = Kzg.blobToKzgCommitment(blob);

		const z = new Uint8Array(32);
		const { proof, y } = Kzg.computeKzgProof(blob, z);

		const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
		expect(valid).toBe(true);
	});

	it("should handle max-value evaluation point", () => {
		const blob = Kzg.generateRandomBlob(22222);
		const commitment = Kzg.blobToKzgCommitment(blob);

		const z = new Uint8Array(32);
		z.fill(0xff);
		z[0] = 0x00; // Keep within field

		const { proof, y } = Kzg.computeKzgProof(blob, z);
		const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
		expect(valid).toBe(true);
	});
});
