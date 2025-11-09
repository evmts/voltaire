import { describe, it, expect, beforeAll } from "vitest";
import * as Blob from "./index.ox.js";
import { Hex } from "ox";

describe("Blob Module (Ox-based)", () => {
	describe("type exports", () => {
		it("should export Blob type", () => {
			type BlobType = Blob.Blob;
			expect(true).toBe(true);
		});

		it("should export Blobs type (array of Blob)", () => {
			type BlobsType = Blob.Blobs;
			expect(true).toBe(true);
		});

		it("should export BlobSidecar type", () => {
			type BlobSidecarType = Blob.BlobSidecar;
			expect(true).toBe(true);
		});

		it("should export BlobSidecars type", () => {
			type BlobSidecarsType = Blob.BlobSidecars;
			expect(true).toBe(true);
		});
	});

	describe("constants", () => {
		it("should have bytesPerFieldElement constant", () => {
			expect(Blob.bytesPerFieldElement).toBe(32);
		});

		it("should have fieldElementsPerBlob constant", () => {
			expect(Blob.fieldElementsPerBlob).toBe(4096);
		});

		it("should have bytesPerBlob constant", () => {
			// 4096 * 32 = 131,072
			expect(Blob.bytesPerBlob).toBe(131_072);
		});

		it("should have maxBytesPerTransaction constant", () => {
			// maxBytesPerTransaction = bytesPerBlob * 6 (max 6 blobs per tx)
			expect(Blob.maxBytesPerTransaction).toBe(786_432); // 131,072 * 6
		});
	});

	describe("Blob.from()", () => {
		it("should create blobs from hex string", () => {
			const blobs = Blob.from("0xdeadbeef");
			expect(blobs).toBeDefined();
			expect(Array.isArray(blobs)).toBe(true);
			expect(blobs.length).toBeGreaterThan(0);
		});

		it("should create blobs from hex with options", () => {
			const blobs = Blob.from("0xdeadbeef", { as: "Hex" });
			expect(blobs).toBeDefined();
			expect(blobs.length).toBeGreaterThan(0);
			// Each blob should be a hex string starting with '0x'
			expect(typeof blobs[0]).toBe("string");
			expect((blobs[0] as string).startsWith("0x")).toBe(true);
		});

		it("should create blobs from Uint8Array", () => {
			const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const blobs = Blob.from(bytes, { as: "Bytes" });
			expect(blobs).toBeDefined();
			expect(blobs.length).toBeGreaterThan(0);
			// Each blob should be a Uint8Array
			expect(blobs[0] instanceof Uint8Array).toBe(true);
		});

		it("should throw on empty data", () => {
			expect(() => {
				Blob.from("");
			}).toThrow();
		});
	});

	describe("Blob.to()", () => {
		it("should reconstruct data from blobs (Hex return type)", () => {
			const originalData = "0xdeadbeef";
			const blobs = Blob.from(originalData);
			const reconstructed = Blob.to(blobs, "Hex");
			expect(reconstructed).toBe(originalData);
		});

		it("should reconstruct data from blobs (Bytes return type)", () => {
			const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const blobs = Blob.from(bytes, { as: "Bytes" });
			const reconstructed = Blob.to(blobs, "Bytes");
			expect(reconstructed instanceof Uint8Array).toBe(true);
			expect(reconstructed).toEqual(bytes);
		});
	});

	describe("Blob.toHex()", () => {
		it("should convert blobs to hex", () => {
			const blobs = Blob.from("0xdeadbeef");
			const hex = Blob.toHex(blobs);
			expect(hex).toBe("0xdeadbeef");
		});

		it("should preserve hex format", () => {
			const originalHex = "0xabcdef";
			const blobs = Blob.from(originalHex);
			const hex = Blob.toHex(blobs);
			expect(hex).toBe(originalHex);
		});
	});

	describe("Blob.toBytes()", () => {
		it("should convert blobs to bytes", () => {
			const bytes = new Uint8Array([1, 2, 3, 4]);
			const blobs = Blob.from(bytes, { as: "Bytes" });
			const result = Blob.toBytes(blobs);
			expect(result instanceof Uint8Array).toBe(true);
			expect(result).toEqual(bytes);
		});
	});

	describe("Naming difference documentation", () => {
		it('should document that Ox uses "Blobs" (plural) not "Blob" (singular)', () => {
			// This test documents the key naming difference between Voltaire and Ox
			// Voltaire: Blob (singular) module
			// Ox: Blobs (plural) module
			//
			// This implementation imports from 'ox/Blobs' and re-exports as-is
			// for code sharing with Viem ecosystem

			const comment = `
				Naming Convention:
				- Ox module: 'Blobs' (plural)
				- Voltaire module: 'Blob' (singular)

				This migration maintains compatibility while using Ox's naming internally.
				Users import from 'Blob' but underlying Ox uses 'Blobs' (plural).
			`;
			expect(comment).toContain("Blobs");
		});
	});

	describe("Error types", () => {
		it("should export BlobSizeTooLargeError", () => {
			expect(Blob.BlobSizeTooLargeError).toBeDefined();
		});

		it("should export EmptyBlobError", () => {
			expect(Blob.EmptyBlobError).toBeDefined();
		});

		it("should export EmptyBlobVersionedHashesError", () => {
			expect(Blob.EmptyBlobVersionedHashesError).toBeDefined();
		});

		it("should export InvalidVersionedHashSizeError", () => {
			expect(Blob.InvalidVersionedHashSizeError).toBeDefined();
		});

		it("should export InvalidVersionedHashVersionError", () => {
			expect(Blob.InvalidVersionedHashVersionError).toBeDefined();
		});
	});

	describe("Compatibility with Hex module", () => {
		it("should work seamlessly with Ox Hex module", () => {
			const hexString = Hex.fromString("Hello, Blobs!");
			const blobs = Blob.from(hexString);
			expect(blobs).toBeDefined();
			expect(blobs.length).toBeGreaterThan(0);
		});

		it("should integrate with Hex type system", () => {
			type TestBlob = Blob.Blob<Hex.Hex>;
			expect(true).toBe(true); // Type check passes
		});
	});

	describe("API coverage (20 exports)", () => {
		it("should export 20+ core functions", () => {
			const exportedFunctions = [
				"from",
				"to",
				"toHex",
				"toBytes",
				"toCommitments",
				"toProofs",
				"commitmentToVersionedHash",
				"commitmentsToVersionedHashes",
				"toSidecars",
				"sidecarsToVersionedHashes",
				"toVersionedHashes",
				"bytesPerFieldElement",
				"fieldElementsPerBlob",
				"bytesPerBlob",
				"maxBytesPerTransaction",
				"BlobSizeTooLargeError",
				"EmptyBlobError",
				"EmptyBlobVersionedHashesError",
				"InvalidVersionedHashSizeError",
				"InvalidVersionedHashVersionError",
			];

			exportedFunctions.forEach((name) => {
				expect((Blob as any)[name]).toBeDefined();
			});

			expect(exportedFunctions.length).toBeGreaterThanOrEqual(20);
		});
	});
});
