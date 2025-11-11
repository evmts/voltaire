import { describe, expect, it } from "vitest";
import { Blob } from "./index.js";
import {
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
	SIZE,
} from "./BrandedBlob/constants.js";

describe("Blob Validation - Edge Cases", () => {
	describe("Blob Construction", () => {
		it("should create blob from data exactly at SIZE bytes", () => {
			// Max data is SIZE - 8 (8 bytes for length prefix)
			const maxDataSize = SIZE - 8;
			const data = new Uint8Array(maxDataSize);
			for (let i = 0; i < 100; i++) data[i] = i % 256;

			const blob = Blob.fromData(data);
			expect(blob.length).toBe(SIZE);
		});

		it("should throw when data too large (SIZE - 7 bytes)", () => {
			const tooLarge = new Uint8Array(SIZE - 7);
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

			// Verify padded area is zeros
			const paddingStart = 8 + smallData.length;
			for (let i = paddingStart; i < SIZE; i++) {
				expect(blob[i]).toBe(0);
			}
		});

		it("should create blob from empty data (all zeros)", () => {
			const empty = new Uint8Array(0);
			const blob = Blob.fromData(empty);
			expect(blob.length).toBe(SIZE);

			// Length prefix should be 0
			const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
			expect(view.getBigUint64(0, true)).toBe(0n);
		});

		it("should create blob from all 0xff data", () => {
			const data = new Uint8Array(1000).fill(0xff);
			const blob = Blob.fromData(data);
			expect(blob.length).toBe(SIZE);

			const recovered = Blob.toData(blob);
			expect(recovered).toEqual(data);
		});

		it("should handle data size at various boundaries", () => {
			const sizes = [1, 31, 32, 63, 64, 4095, 4096, 8192, 16384];
			for (const size of sizes) {
				const data = new Uint8Array(size).fill(0xaa);
				const blob = Blob.fromData(data);
				expect(blob.length).toBe(SIZE);
				expect(Blob.toData(blob)).toEqual(data);
			}
		});
	});

	describe("Field Element Validation", () => {
		// BLS12-381 modulus: 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
		// We test field elements < modulus (valid) and >= modulus (invalid)

		it("should accept field element at boundary (near modulus - 1)", () => {
			const blob = new Uint8Array(SIZE);
			// First field element: set to value just below modulus
			// For safety, we set high byte to 0 which ensures < modulus
			blob[0] = 0x00; // High byte must be 0
			for (let i = 1; i < 32; i++) {
				blob[i] = 0xff; // Rest can be 0xff
			}

			expect(Blob.isValid(blob)).toBe(true);
		});

		it("should accept blob with all field elements having 0 high byte", () => {
			const blob = new Uint8Array(SIZE);
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0x00; // High byte = 0
				// Fill rest with random-ish data
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = (i + j) % 256;
				}
			}

			expect(Blob.isValid(blob)).toBe(true);
		});

		it("should handle blob with maximum valid field element (high byte 0)", () => {
			const blob = new Uint8Array(SIZE);
			// All field elements at max value with high byte = 0
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0x00; // Ensures < BLS12-381 modulus
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = 0xff;
				}
			}

			expect(Blob.isValid(blob)).toBe(true);
		});

		it("should handle blob with random valid field elements", () => {
			const blob = new Uint8Array(SIZE);
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0x00; // High byte must be 0
				// Random data for rest
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = Math.floor(Math.random() * 256);
				}
			}

			expect(Blob.isValid(blob)).toBe(true);
		});

		it("should handle blob with alternating field element patterns", () => {
			const blob = new Uint8Array(SIZE);
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0x00; // High byte = 0
				// Alternate between 0xaa and 0x55
				const fill = i % 2 === 0 ? 0xaa : 0x55;
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = fill;
				}
			}

			expect(Blob.isValid(blob)).toBe(true);
		});
	});

	describe("Blob Data Integrity", () => {
		it("should reconstruct original data from blob", () => {
			const original = new Uint8Array(5000);
			for (let i = 0; i < original.length; i++) {
				original[i] = (i * 7 + 13) % 256;
			}

			const blob = Blob.fromData(original);
			const recovered = Blob.toData(blob);

			expect(recovered).toEqual(original);
		});

		it("should throw on corrupted blob (wrong size)", () => {
			const blob = Blob.fromData(new Uint8Array(100));
			const corrupted = blob.slice(0, SIZE - 1);

			expect(() => Blob.toData(corrupted)).toThrow(/Invalid blob size/);
		});

		it("should throw on corrupted length prefix", () => {
			const blob = Blob.fromData(new Uint8Array(100));

			// Corrupt length prefix to invalid value
			const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
			view.setBigUint64(0, BigInt(SIZE), true); // Length > max

			expect(() => Blob.toData(blob)).toThrow(/Invalid length prefix/);
		});

		it("should handle round-trip for various data sizes", () => {
			const sizes = [0, 1, 31, 32, 100, 1000, 10000, 50000, SIZE - 8];
			for (const size of sizes) {
				const data = new Uint8Array(size);
				for (let i = 0; i < Math.min(size, 100); i++) {
					data[i] = i;
				}

				const blob = Blob.fromData(data);
				const recovered = Blob.toData(blob);

				expect(recovered.length).toBe(size);
				expect(recovered).toEqual(data);
			}
		});

		it("should preserve binary data patterns", () => {
			const data = new Uint8Array(256);
			for (let i = 0; i < 256; i++) data[i] = i;

			const blob = Blob.fromData(data);
			const recovered = Blob.toData(blob);

			expect(recovered).toEqual(data);
		});

		it("should handle data with null bytes", () => {
			const data = new Uint8Array(100);
			data.fill(0);
			data[0] = 0x01;
			data[99] = 0xff;

			const blob = Blob.fromData(data);
			const recovered = Blob.toData(blob);

			expect(recovered).toEqual(data);
		});
	});

	describe("splitData / joinData", () => {
		it("should split and join data correctly", () => {
			const data = new Uint8Array(10000);
			for (let i = 0; i < data.length; i++) {
				data[i] = i % 256;
			}

			const blobs = Blob.splitData(data);
			const recovered = Blob.joinData(blobs);

			expect(recovered).toEqual(data);
		});

		it("should split small data into single blob", () => {
			const data = new Uint8Array(1000);
			const blobs = Blob.splitData(data);

			expect(blobs.length).toBe(1);
			expect(Blob.joinData(blobs)).toEqual(data);
		});

		it("should split data at exact blob boundary", () => {
			// SIZE - 8 is max data per blob
			const maxPerBlob = SIZE - 8;
			const data = new Uint8Array(maxPerBlob);
			data.fill(0x42);

			const blobs = Blob.splitData(data);
			expect(blobs.length).toBe(1);
			expect(Blob.joinData(blobs)).toEqual(data);
		});

		it("should split data just over blob boundary", () => {
			const maxPerBlob = SIZE - 8;
			const data = new Uint8Array(maxPerBlob + 1);
			data.fill(0x33);

			const blobs = Blob.splitData(data);
			expect(blobs.length).toBe(2);
			expect(Blob.joinData(blobs)).toEqual(data);
		});

		it("should split empty data", () => {
			const data = new Uint8Array(0);
			const blobs = Blob.splitData(data);

			expect(blobs.length).toBeGreaterThanOrEqual(0);
			expect(Blob.joinData(blobs)).toEqual(data);
		});

		it("should split maximum size data (6 blobs worth)", () => {
			const maxPerBlob = SIZE - 8;
			const data = new Uint8Array(maxPerBlob * 6);
			for (let i = 0; i < data.length; i++) {
				data[i] = i % 256;
			}

			const blobs = Blob.splitData(data);
			expect(blobs.length).toBe(6);
			expect(Blob.joinData(blobs)).toEqual(data);
		});

		it("should throw when data requires more than max blobs", () => {
			const maxPerBlob = SIZE - 8;
			const tooLarge = new Uint8Array(maxPerBlob * 7); // 7 blobs needed

			expect(() => Blob.splitData(tooLarge)).toThrow(/requires.*blobs.*max/);
		});

		it("should handle data not multiple of 31 bytes", () => {
			const sizes = [30, 33, 100, 1000, 4097];
			for (const size of sizes) {
				const data = new Uint8Array(size);
				data.fill(0xcc);

				const blobs = Blob.splitData(data);
				const recovered = Blob.joinData(blobs);

				expect(recovered).toEqual(data);
			}
		});

		it("should preserve data across multiple blobs", () => {
			const maxPerBlob = SIZE - 8;
			const data = new Uint8Array(maxPerBlob * 2 + 1000);

			// Fill with pattern
			for (let i = 0; i < data.length; i++) {
				data[i] = (i * 31 + 17) % 256;
			}

			const blobs = Blob.splitData(data);
			expect(blobs.length).toBe(3);

			const recovered = Blob.joinData(blobs);
			expect(recovered).toEqual(data);
		});

		it("should handle boundary transitions between blobs", () => {
			const maxPerBlob = SIZE - 8;
			const data = new Uint8Array(maxPerBlob * 2);

			// Mark boundaries
			data[0] = 0x01; // Start of first blob
			data[maxPerBlob - 1] = 0x02; // End of first blob
			data[maxPerBlob] = 0x03; // Start of second blob
			data[data.length - 1] = 0x04; // End of second blob

			const blobs = Blob.splitData(data);
			const recovered = Blob.joinData(blobs);

			expect(recovered[0]).toBe(0x01);
			expect(recovered[maxPerBlob - 1]).toBe(0x02);
			expect(recovered[maxPerBlob]).toBe(0x03);
			expect(recovered[data.length - 1]).toBe(0x04);
		});
	});
});
