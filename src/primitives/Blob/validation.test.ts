import { describe, expect, it } from "vitest";
import {
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
	MAX_DATA_PER_BLOB,
	MAX_PER_TRANSACTION,
	SIZE,
} from "./constants.js";
import { Blob } from "./index.js";

describe("Blob Validation - Edge Cases", () => {
	describe("Blob Construction", () => {
		it("should create blob from data exactly at SIZE bytes", () => {
			// Max data is MAX_DATA_PER_BLOB (126972 bytes with field element encoding)
			const data = new Uint8Array(MAX_DATA_PER_BLOB);
			for (let i = 0; i < 100; i++) data[i] = i % 256;

			const blob = Blob.fromData(data);
			expect(blob.length).toBe(SIZE);
		});

		it("should throw when data too large (SIZE - 7 bytes)", () => {
			const tooLarge = new Uint8Array(MAX_DATA_PER_BLOB + 1);
			expect(() => Blob.fromData(tooLarge)).toThrow(/Data too large/);
		});

		it("should throw when data too large (SIZE bytes)", () => {
			const tooLarge = new Uint8Array(SIZE);
			expect(() => Blob.fromData(tooLarge)).toThrow(/Data too large/);
		});

		it("should create blob from small data with padding", () => {
			const smallData = new Uint8Array(100);
			for (let i = 0; i < smallData.length; i++) smallData[i] = i;

			const blob = Blob.fromData(smallData);
			expect(blob.length).toBe(SIZE);

			// Verify padded area is zeros (after data in field element encoding)
			// With new encoding, padding starts at different offsets per field element
			expect(blob[SIZE - 1]).toBe(0);
		});

		it("should create blob from empty data (all zeros)", () => {
			const empty = new Uint8Array(0);
			const blob = Blob.fromData(empty);
			expect(blob.length).toBe(SIZE);

			// First byte must be 0x00 (BLS field constraint)
			expect(blob[0]).toBe(0);
			// Length prefix should be 0 (bytes 1-4, big-endian)
			const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
			expect(view.getUint32(1, false)).toBe(0);
		});

		it("should create blob from all 0xff data", () => {
			const data = new Uint8Array(1000).fill(0xff);
			const blob = Blob.fromData(data);
			expect(blob.length).toBe(SIZE);

			const recovered = Blob.toData(blob);
			expect(recovered).toEqual(data);
		});

		it("should preserve exact byte content after roundtrip", () => {
			const data = new Uint8Array([1, 2, 3, 0xff, 0xfe, 0x80, 0x00, 0x7f]);
			const blob = Blob.fromData(data);
			const recovered = Blob.toData(blob);
			expect(recovered).toEqual(data);
		});
	});

	describe("Blob Data Integrity", () => {
		it("should handle round-trip for various data sizes", () => {
			const sizes = [0, 1, 31, 32, 100, 1000, 10000, MAX_DATA_PER_BLOB];

			for (const size of sizes) {
				const data = new Uint8Array(size);
				for (let i = 0; i < size; i++) data[i] = (i * 17) % 256;

				const blob = Blob.fromData(data);
				expect(blob.length).toBe(SIZE);

				const recovered = Blob.toData(blob);
				expect(recovered).toEqual(data);
			}
		});

		it("should fail toData on wrong size blob", () => {
			const wrongSize = new Uint8Array(SIZE - 1);
			expect(() => Blob.toData(wrongSize as any)).toThrow(/Invalid blob size/);
		});

		it("should fail toData on corrupted length prefix", () => {
			const blob = new Uint8Array(SIZE);
			// Set an invalid length prefix (larger than max)
			const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
			view.setUint32(1, MAX_DATA_PER_BLOB + 1000, false); // big-endian

			expect(() => Blob.toData(blob as any)).toThrow(/Invalid length prefix/);
		});

		it("should handle blob with all zeros", () => {
			const blob = new Uint8Array(SIZE);
			const data = Blob.toData(blob as any);
			expect(data.length).toBe(0);
		});

		it("should handle blob with truncated data", () => {
			const originalData = new Uint8Array(1000);
			for (let i = 0; i < 1000; i++) originalData[i] = i % 256;

			const blob = Blob.fromData(originalData);

			// Manually corrupt the blob by changing length prefix
			const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
			view.setUint32(1, 500, false); // Set length to 500

			const recovered = Blob.toData(blob);
			expect(recovered.length).toBe(500);
		});

		it("should reject corrupted blob (wrong size)", () => {
			const data = new Uint8Array(100);
			const blob = Blob.fromData(data);
			const corrupted = blob.slice(0, SIZE - 1);

			expect(() => Blob.toData(corrupted as any)).toThrow(/Invalid blob size/);
		});
	});

	describe("splitData / joinData", () => {
		it("should split data at exact blob boundary", () => {
			// Create data exactly 2 blobs worth
			const data = new Uint8Array(MAX_DATA_PER_BLOB * 2);
			for (let i = 0; i < data.length; i++) data[i] = i % 256;

			const blobs = Blob.splitData(data);
			expect(blobs.length).toBe(2);

			const recovered = Blob.joinData(blobs);
			expect(recovered).toEqual(data);
		});

		it("should split maximum size data (6 blobs worth)", () => {
			const data = new Uint8Array(MAX_DATA_PER_BLOB * MAX_PER_TRANSACTION);
			for (let i = 0; i < data.length; i++) data[i] = (i * 7) % 256;

			const blobs = Blob.splitData(data);
			expect(blobs.length).toBe(MAX_PER_TRANSACTION);

			const recovered = Blob.joinData(blobs);
			expect(recovered).toEqual(data);
		});

		it("should throw when data exceeds max transaction capacity", () => {
			const tooLarge = new Uint8Array(MAX_DATA_PER_BLOB * MAX_PER_TRANSACTION + 1);
			expect(() => Blob.splitData(tooLarge)).toThrow(/Data too large/);
		});

		it("should handle empty array input to joinData", () => {
			const joined = Blob.joinData([]);
			expect(joined.length).toBe(0);
		});
	});

	describe("estimateBlobCount", () => {
		it("should estimate 0 blobs for empty data", () => {
			expect(Blob.estimateBlobCount(0)).toBe(0);
		});

		it("should estimate 1 blob for small data", () => {
			expect(Blob.estimateBlobCount(1)).toBe(1);
			expect(Blob.estimateBlobCount(MAX_DATA_PER_BLOB)).toBe(1);
		});

		it("should estimate 2 blobs for data just over one blob", () => {
			expect(Blob.estimateBlobCount(MAX_DATA_PER_BLOB + 1)).toBe(2);
		});

		it("should estimate correctly for max transaction size", () => {
			expect(Blob.estimateBlobCount(MAX_DATA_PER_BLOB * MAX_PER_TRANSACTION)).toBe(
				MAX_PER_TRANSACTION,
			);
		});
	});
});
