/**
 * Tests for docs/primitives/blob/index.mdx
 *
 * Validates that all code examples in the Blob documentation work correctly.
 */
import { describe, expect, it } from "vitest";

describe("Blob Documentation - index.mdx", () => {
	describe("Constants", () => {
		it("should have SIZE constant (131072 bytes)", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);
			expect(Blob.SIZE).toBe(131072);
		});

		it("should have FIELD_ELEMENTS_PER_BLOB constant (4096)", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);
			expect(Blob.FIELD_ELEMENTS_PER_BLOB).toBe(4096);
		});

		it("should have BYTES_PER_FIELD_ELEMENT constant (32)", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);
			expect(Blob.BYTES_PER_FIELD_ELEMENT).toBe(32);
		});

		it("should have MAX_PER_TRANSACTION constant (6)", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);
			expect(Blob.MAX_PER_TRANSACTION).toBe(6);
		});

		it("should have COMMITMENT_VERSION_KZG constant (0x01)", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);
			expect(Blob.COMMITMENT_VERSION_KZG).toBe(0x01);
		});

		it("should have GAS_PER_BLOB constant (131072 = 2^17)", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);
			expect(Blob.GAS_PER_BLOB).toBe(131072);
		});

		it("should have TARGET_GAS_PER_BLOCK constant (393216 = 3 blobs)", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);
			expect(Blob.TARGET_GAS_PER_BLOCK).toBe(393216);
		});
	});

	describe("Usage Patterns - Creating Blobs from Data", () => {
		it("should create blob from small data and extract it back", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			const data = new TextEncoder().encode("Rollup batch #1234");
			const blob = Blob.fromData(data);

			expect(data.length).toBeLessThan(131072);
			expect(blob.length).toBe(131072); // Always 131,072 bytes

			const decoded = Blob.toData(blob);
			expect(new TextDecoder().decode(decoded)).toBe("Rollup batch #1234");
		});
	});

	describe("Usage Patterns - Handling Large Data", () => {
		it("should estimate blob count for large data", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			const largeData = new Uint8Array(300_000); // 300 KB
			const blobCount = Blob.estimateBlobCount(largeData.length);

			// 300KB should require ~3 blobs (each blob holds ~128KB of data)
			expect(blobCount).toBeGreaterThanOrEqual(2);
			expect(blobCount).toBeLessThanOrEqual(4);
		});

		it("should split large data into multiple blobs and join back", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			// Create test data spanning multiple blobs
			const largeData = new Uint8Array(200_000);
			for (let i = 0; i < largeData.length; i++) {
				largeData[i] = i % 256;
			}

			const blobs = Blob.splitData(largeData);
			expect(blobs.length).toBeGreaterThan(1);

			const reconstructed = Blob.joinData(blobs);
			expect(reconstructed.length).toBe(largeData.length);

			// Verify data integrity
			for (let i = 0; i < largeData.length; i++) {
				expect(reconstructed[i]).toBe(largeData[i]);
			}
		});
	});

	describe("Validation", () => {
		it("should validate blob size with isValid", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			const validBlob = new Uint8Array(131072);
			const invalidBlob = new Uint8Array(1000);

			expect(Blob.isValid(validBlob)).toBe(true);
			expect(Blob.isValid(invalidBlob)).toBe(false);
		});
	});

	describe("Gas Cost Estimation", () => {
		it("should calculate gas cost for blob count", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			const blobCount = 2;
			const blobGas = Blob.calculateGas(blobCount);

			// Gas should be blobCount * GAS_PER_BLOB
			expect(blobGas).toBe(blobCount * 131072);
		});
	});

	describe("Nested Namespaces", () => {
		it("should have Commitment namespace with isValid", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			const validCommitment = new Uint8Array(48);
			const invalidCommitment = new Uint8Array(32);

			expect(Blob.Commitment.isValid(validCommitment)).toBe(true);
			expect(Blob.Commitment.isValid(invalidCommitment)).toBe(false);
		});

		it("should have Proof namespace with isValid", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			const validProof = new Uint8Array(48);
			const invalidProof = new Uint8Array(32);

			expect(Blob.Proof.isValid(validProof)).toBe(true);
			expect(Blob.Proof.isValid(invalidProof)).toBe(false);
		});

		it("should have VersionedHash namespace with isValid and getVersion", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			// Valid versioned hash: 32 bytes with version byte 0x01
			const validHash = new Uint8Array(32);
			validHash[0] = 0x01;

			// Invalid: wrong version byte
			const invalidHash = new Uint8Array(32);
			invalidHash[0] = 0x00;

			expect(Blob.VersionedHash.isValid(validHash)).toBe(true);
			expect(Blob.VersionedHash.isValid(invalidHash)).toBe(false);
			expect(Blob.VersionedHash.getVersion(validHash)).toBe(1);
		});
	});

	describe("Blob Constructor", () => {
		it("should create blob by size", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			const blob = Blob(131072);
			expect(blob.length).toBe(131072);
		});

		it("should create blob from raw data", async () => {
			const { Blob } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			const rawBlob = new Uint8Array(131072);
			rawBlob[0] = 0x42;
			const blob = Blob(rawBlob);

			expect(blob.length).toBe(131072);
			expect(blob[0]).toBe(0x42);
		});
	});

	describe("Tree-Shaking Imports", () => {
		it("should support direct function imports", async () => {
			const { fromData, toData, estimateBlobCount } = await import(
				"../../../src/primitives/Blob/index.js"
			);

			const data = new TextEncoder().encode("test");
			const blob = fromData(data);
			const decoded = toData(blob);
			const count = estimateBlobCount(1000);

			expect(new TextDecoder().decode(decoded)).toBe("test");
			expect(count).toBe(1);
		});
	});
});
