import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
	FIELD_ELEMENTS_PER_BLOB,
} from "../../crypto/KZG/constants.js";
import { KZG } from "../../crypto/KZG/index.js";
import { SHA256 } from "../../crypto/SHA256/index.js";
import {
	COMMITMENT_VERSION_KZG,
	GAS_PER_BLOB,
	MAX_PER_TRANSACTION,
	SIZE,
} from "./BrandedBlob/constants.js";
import { Blob } from "./index.js";

describe("Blob + KZG Integration - EIP-4844 Compliance", () => {
	beforeAll(() => {
		KZG.loadTrustedSetup();
	});

	afterAll(() => {
		KZG.freeTrustedSetup();
	});

	describe("End-to-End Workflow", () => {
		it("should complete full workflow: Data → Blob → Commitment → Verification", () => {
			// 1. Create data
			const data = new Uint8Array(10000);
			for (let i = 0; i < data.length; i++) {
				data[i] = (i * 13) % 256;
			}

			// 2. Create blob from data
			const blob = Blob.fromData(data);
			expect(blob.length).toBe(SIZE);

			// 3. Generate commitment
			const commitment = Blob.toCommitment(blob);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);

			// 4. Verify data round-trip
			const recovered = Blob.toData(blob);
			expect(recovered).toEqual(data);
		});

		it("should handle multiple blobs in transaction", () => {
			const numBlobs = 3;
			const blobs = [];
			const commitments = [];

			for (let i = 0; i < numBlobs; i++) {
				const data = new Uint8Array(5000);
				data.fill(i);

				const blob = Blob.fromData(data);
				const commitment = Blob.toCommitment(blob);

				blobs.push(blob);
				commitments.push(commitment);
			}

			expect(blobs.length).toBe(numBlobs);
			expect(commitments.length).toBe(numBlobs);

			// Each commitment should be unique
			expect(commitments[0]).not.toEqual(commitments[1]);
			expect(commitments[1]).not.toEqual(commitments[2]);
		});

		it("should handle real-world blob size data (contract code)", () => {
			// Simulate contract bytecode (~24KB)
			const contractCode = new Uint8Array(24000);
			for (let i = 0; i < contractCode.length; i++) {
				contractCode[i] = Math.floor(Math.random() * 256);
			}

			const blob = Blob.fromData(contractCode);
			const commitment = Blob.toCommitment(blob);
			const recovered = Blob.toData(blob);

			expect(recovered).toEqual(contractCode);
			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
		});

		it("should handle real-world blob size data (large calldata)", () => {
			// Simulate large calldata (~100KB)
			const calldata = new Uint8Array(100000);
			for (let i = 0; i < calldata.length; i++) {
				calldata[i] = i % 256;
			}

			const blob = Blob.fromData(calldata);
			const commitment = Blob.toCommitment(blob);
			const proof = Blob.toProof(blob);

			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
			expect(proof.length).toBe(BYTES_PER_PROOF);

			const recovered = Blob.toData(blob);
			expect(recovered).toEqual(calldata);
		});

		it("should process multiple blobs for large data split", () => {
			const maxPerBlob = SIZE - 8;
			const largeData = new Uint8Array(maxPerBlob * 2 + 5000);
			for (let i = 0; i < largeData.length; i++) {
				largeData[i] = (i * 7) % 256;
			}

			// Split into blobs
			const blobs = Blob.splitData(largeData);
			expect(blobs.length).toBe(3);

			// Generate commitments for each
			const commitments = blobs.map((b) => Blob.toCommitment(b));
			expect(commitments.length).toBe(3);

			// Verify data integrity
			const recovered = Blob.joinData(blobs);
			expect(recovered).toEqual(largeData);
		});
	});

	describe("EIP-4844 Compliance", () => {
		it("should calculate versioned hash correctly (SHA256(commitment)[0] = 0x01)", () => {
			const blob = Blob.fromData(new Uint8Array(1000));
			const commitment = Blob.toCommitment(blob);

			// Compute versioned hash
			const versionedHash = Blob.toVersionedHash(commitment);

			expect(versionedHash.length).toBe(32);
			expect(versionedHash[0]).toBe(COMMITMENT_VERSION_KZG);
			expect(COMMITMENT_VERSION_KZG).toBe(0x01);
		});

		it("should verify versioned hash format matches EIP-4844 spec", () => {
			const blob = Blob.fromData(new Uint8Array(100));
			const commitment = Blob.toCommitment(blob);

			// Manual calculation
			const hash = SHA256.hash(commitment);
			const expectedVersionedHash = new Uint8Array(32);
			expectedVersionedHash[0] = 0x01;
			expectedVersionedHash.set(hash.slice(1), 1);

			const actualVersionedHash = Blob.toVersionedHash(commitment);

			expect(actualVersionedHash).toEqual(expectedVersionedHash);
		});

		it("should calculate blob gas correctly", () => {
			const blobCount = 3;
			const totalGas = Blob.calculateGas(blobCount);

			expect(totalGas).toBe(blobCount * GAS_PER_BLOB);
			expect(GAS_PER_BLOB).toBe(131072); // 2^17
		});

		it("should verify max blobs per transaction is 6", () => {
			expect(MAX_PER_TRANSACTION).toBe(6);
		});

		it("should verify blob size is 128 KB (131072 bytes)", () => {
			expect(SIZE).toBe(131072);
			expect(SIZE).toBe(128 * 1024);
		});

		it("should verify field elements structure (4096 elements, 32 bytes each)", () => {
			expect(FIELD_ELEMENTS_PER_BLOB).toBe(4096);
			expect(BYTES_PER_FIELD_ELEMENT).toBe(32);
			expect(FIELD_ELEMENTS_PER_BLOB * BYTES_PER_FIELD_ELEMENT).toBe(SIZE);
		});

		it("should verify commitment version byte is 0x01", () => {
			expect(COMMITMENT_VERSION_KZG).toBe(0x01);
		});

		it("should estimate blob count correctly for various data sizes", () => {
			const maxPerBlob = SIZE - 8;

			const tests = [
				{ dataSize: 1000, expectedBlobs: 1 },
				{ dataSize: maxPerBlob, expectedBlobs: 1 },
				{ dataSize: maxPerBlob + 1, expectedBlobs: 2 },
				{ dataSize: maxPerBlob * 2, expectedBlobs: 2 },
				{ dataSize: maxPerBlob * 2 + 1, expectedBlobs: 3 },
				{ dataSize: maxPerBlob * 6, expectedBlobs: 6 },
			];

			for (const { dataSize, expectedBlobs } of tests) {
				const estimated = Blob.estimateBlobCount(dataSize);
				expect(estimated).toBe(expectedBlobs);
			}
		});
	});

	describe("Cross-Validation", () => {
		it("should verify commitment is deterministic", () => {
			const blob = Blob.fromData(new Uint8Array(5000).fill(0x42));

			const commitment1 = Blob.toCommitment(blob);
			const commitment2 = Blob.toCommitment(blob);
			const commitment3 = KZG.blobToKzgCommitment(blob);

			expect(commitment1).toEqual(commitment2);
			expect(commitment1).toEqual(commitment3);
		});

		it("should verify different data produces different commitments", () => {
			const blob1 = Blob.fromData(new Uint8Array(100).fill(0x01));
			const blob2 = Blob.fromData(new Uint8Array(100).fill(0x02));

			const commitment1 = Blob.toCommitment(blob1);
			const commitment2 = Blob.toCommitment(blob2);

			expect(commitment1).not.toEqual(commitment2);
		});

		it("should verify versioned hash is deterministic", () => {
			const blob = Blob.fromData(new Uint8Array(1000));
			const commitment = Blob.toCommitment(blob);

			const hash1 = Blob.toVersionedHash(commitment);
			const hash2 = Blob.toVersionedHash(commitment);

			expect(hash1).toEqual(hash2);
		});

		it("should verify commitment format (48 bytes, G1 point)", () => {
			const blob = Blob.fromData(new Uint8Array(1000));
			const commitment = Blob.toCommitment(blob);

			expect(commitment.length).toBe(BYTES_PER_COMMITMENT);
			expect(BYTES_PER_COMMITMENT).toBe(48); // BLS12-381 G1 point
		});
	});

	describe("Security Properties", () => {
		it("should verify blob validation enforces field element constraints", () => {
			const blob = new Uint8Array(SIZE);

			// Set invalid field element (high byte non-zero)
			blob[0] = 0x01;

			expect(() => KZG.validateBlob(blob)).toThrow();
		});

		it("should verify commitments are cryptographically binding", () => {
			// Two different blobs should produce different commitments
			const blob1 = Blob.fromData(new Uint8Array(100).fill(0xaa));
			const blob2 = Blob.fromData(new Uint8Array(100).fill(0xbb));

			const commitment1 = Blob.toCommitment(blob1);
			const commitment2 = Blob.toCommitment(blob2);

			expect(commitment1).not.toEqual(commitment2);

			// Even small differences should produce different commitments
			const blob3 = Blob.fromData(new Uint8Array(100).fill(0xaa));
			const data = Blob.toData(blob3);
			data[0] = 0xab; // Change one byte
			const blob4 = Blob.fromData(data);

			const commitment3 = Blob.toCommitment(blob3);
			const commitment4 = Blob.toCommitment(blob4);

			expect(commitment3).not.toEqual(commitment4);
		});

		it("should verify versioned hash links to commitment", () => {
			const blob = Blob.fromData(new Uint8Array(1000));
			const commitment = Blob.toCommitment(blob);
			const versionedHash = Blob.toVersionedHash(commitment);

			// Versioned hash should be different from commitment
			expect(versionedHash.length).toBe(32);
			expect(commitment.length).toBe(48);

			// Version byte should be 0x01
			expect(versionedHash[0]).toBe(0x01);

			// Rest should be derived from SHA256(commitment)
			const hash = SHA256.hash(commitment);
			for (let i = 1; i < 32; i++) {
				expect(versionedHash[i]).toBe(hash[i]);
			}
		});
	});
});
