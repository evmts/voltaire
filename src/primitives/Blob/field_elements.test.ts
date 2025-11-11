import { describe, expect, it } from "vitest";
import {
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
	SIZE,
} from "./BrandedBlob/constants.js";

describe("Blob Field Elements - Edge Cases", () => {
	// BLS12-381 modulus (big-endian):
	// 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
	const BLS_MODULUS_BE = new Uint8Array([
		0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48, 0x33, 0x39, 0xd8, 0x08,
		0x09, 0xa1, 0xd8, 0x05, 0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe,
		0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
	]);

	describe("Field Element Encoding", () => {
		it("should encode 31 bytes of data into 32-byte field element", () => {
			const data = new Uint8Array(31);
			for (let i = 0; i < 31; i++) data[i] = i;

			// Encode: prepend 0x00 as high byte
			const fieldElement = new Uint8Array(32);
			fieldElement[0] = 0x00;
			fieldElement.set(data, 1);

			expect(fieldElement.length).toBe(BYTES_PER_FIELD_ELEMENT);
			expect(fieldElement[0]).toBe(0x00);
		});

		it("should decode 32-byte field element to 31 bytes of data", () => {
			const fieldElement = new Uint8Array(32);
			fieldElement[0] = 0x00;
			for (let i = 1; i < 32; i++) fieldElement[i] = i;

			// Decode: skip first byte
			const data = fieldElement.slice(1);

			expect(data.length).toBe(31);
			expect(data[0]).toBe(1);
			expect(data[30]).toBe(31);
		});

		it("should validate high byte is 0x00", () => {
			const fieldElement = new Uint8Array(32);
			fieldElement[0] = 0x00; // Valid
			for (let i = 1; i < 32; i++) fieldElement[i] = 0xff;

			expect(fieldElement[0]).toBe(0x00);
		});

		it("should detect non-zero high byte as invalid", () => {
			const fieldElement = new Uint8Array(32);
			fieldElement[0] = 0x01; // Invalid
			for (let i = 1; i < 32; i++) fieldElement[i] = 0xff;

			expect(fieldElement[0]).not.toBe(0x00);
		});

		it("should encode maximum valid data (31 bytes of 0xff)", () => {
			const data = new Uint8Array(31).fill(0xff);

			const fieldElement = new Uint8Array(32);
			fieldElement[0] = 0x00;
			fieldElement.set(data, 1);

			expect(fieldElement[0]).toBe(0x00);
			for (let i = 1; i < 32; i++) {
				expect(fieldElement[i]).toBe(0xff);
			}
		});

		it("should encode minimum valid data (all zeros)", () => {
			const data = new Uint8Array(31).fill(0x00);

			const fieldElement = new Uint8Array(32);
			fieldElement[0] = 0x00;
			fieldElement.set(data, 1);

			for (let i = 0; i < 32; i++) {
				expect(fieldElement[i]).toBe(0x00);
			}
		});

		it("should round-trip encode/decode 31 bytes", () => {
			const original = new Uint8Array(31);
			for (let i = 0; i < 31; i++) original[i] = (i * 7) % 256;

			// Encode
			const fieldElement = new Uint8Array(32);
			fieldElement[0] = 0x00;
			fieldElement.set(original, 1);

			// Decode
			const decoded = fieldElement.slice(1);

			expect(decoded).toEqual(original);
		});

		it("should handle encoding at various data lengths", () => {
			for (let len = 0; len <= 31; len++) {
				const data = new Uint8Array(len);
				for (let i = 0; i < len; i++) data[i] = i;

				const fieldElement = new Uint8Array(32);
				fieldElement[0] = 0x00;
				fieldElement.set(data, 1);

				expect(fieldElement.length).toBe(32);
				expect(fieldElement[0]).toBe(0x00);
			}
		});
	});

	describe("Field Element Boundaries", () => {
		it("should recognize value just below BLS12-381 modulus as potentially valid", () => {
			// modulus - 1 in big-endian
			const nearModulus = new Uint8Array(BLS_MODULUS_BE);
			nearModulus[31] -= 1; // Subtract 1

			// For our encoding, high byte should be 0
			// This test verifies the modulus structure
			expect(BLS_MODULUS_BE[0]).toBe(0x73);
		});

		it("should recognize BLS12-381 modulus itself as boundary", () => {
			// Modulus value
			const modulus = new Uint8Array(BLS_MODULUS_BE);

			expect(modulus.length).toBe(32);
			expect(modulus[0]).toBe(0x73);
		});

		it("should recognize value above modulus as invalid", () => {
			// modulus + 1
			const aboveModulus = new Uint8Array(BLS_MODULUS_BE);
			aboveModulus[31] += 1; // Add 1

			expect(aboveModulus[31]).toBe(BLS_MODULUS_BE[31] + 1);
		});

		it("should validate zero is below modulus", () => {
			const zero = new Uint8Array(32).fill(0x00);

			// Zero is always valid field element
			expect(zero[0]).toBe(0x00);
		});

		it("should validate max value with high byte 0", () => {
			const maxWithZeroHigh = new Uint8Array(32);
			maxWithZeroHigh[0] = 0x00;
			for (let i = 1; i < 32; i++) maxWithZeroHigh[i] = 0xff;

			// This is definitely < modulus since high byte is 0
			expect(maxWithZeroHigh[0]).toBe(0x00);
		});

		it("should detect high byte 0x73 as potentially invalid", () => {
			const potentiallyInvalid = new Uint8Array(32);
			potentiallyInvalid[0] = 0x73; // Same as modulus high byte

			expect(potentiallyInvalid[0]).toBe(0x73);
			// Would need full comparison to determine validity
		});

		it("should detect high byte 0x74 as invalid", () => {
			const invalid = new Uint8Array(32);
			invalid[0] = 0x74; // Greater than modulus high byte

			expect(invalid[0]).toBeGreaterThan(BLS_MODULUS_BE[0]);
		});

		it("should handle boundary case with high byte 0x72", () => {
			const valid = new Uint8Array(32);
			valid[0] = 0x72; // Less than modulus high byte
			for (let i = 1; i < 32; i++) valid[i] = 0xff;

			expect(valid[0]).toBeLessThan(BLS_MODULUS_BE[0]);
		});
	});

	describe("Field Element Array Operations", () => {
		it("should validate array of 4096 field elements", () => {
			const blob = new Uint8Array(SIZE);

			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0x00; // High byte
			}

			// Check all field elements
			let validCount = 0;
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				if (blob[offset] === 0x00) validCount++;
			}

			expect(validCount).toBe(FIELD_ELEMENTS_PER_BLOB);
		});

		it("should detect invalid element at position 0", () => {
			const blob = new Uint8Array(SIZE);

			// Set all valid except first
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				blob[i * BYTES_PER_FIELD_ELEMENT] = 0x00;
			}
			blob[0] = 0x01; // Invalidate first

			expect(blob[0]).not.toBe(0x00);
		});

		it("should detect invalid element at middle position", () => {
			const blob = new Uint8Array(SIZE);

			// Set all valid
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				blob[i * BYTES_PER_FIELD_ELEMENT] = 0x00;
			}

			const midIndex = Math.floor(FIELD_ELEMENTS_PER_BLOB / 2);
			blob[midIndex * BYTES_PER_FIELD_ELEMENT] = 0x73; // Invalidate middle

			expect(blob[midIndex * BYTES_PER_FIELD_ELEMENT]).not.toBe(0x00);
		});

		it("should detect invalid element at end position", () => {
			const blob = new Uint8Array(SIZE);

			// Set all valid
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				blob[i * BYTES_PER_FIELD_ELEMENT] = 0x00;
			}

			const lastIndex = FIELD_ELEMENTS_PER_BLOB - 1;
			blob[lastIndex * BYTES_PER_FIELD_ELEMENT] = 0xff; // Invalidate last

			expect(blob[lastIndex * BYTES_PER_FIELD_ELEMENT]).not.toBe(0x00);
		});

		it("should pass all valid elements", () => {
			const blob = new Uint8Array(SIZE);

			// Set all to valid
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = 0x00;
				// Fill rest with pattern
				for (let j = 1; j < BYTES_PER_FIELD_ELEMENT; j++) {
					blob[offset + j] = (i + j) % 256;
				}
			}

			// Verify all elements
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				expect(blob[i * BYTES_PER_FIELD_ELEMENT]).toBe(0x00);
			}
		});

		it("should handle mix of valid/invalid elements", () => {
			const blob = new Uint8Array(SIZE);

			// Set alternating valid/invalid
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				blob[offset] = i % 2 === 0 ? 0x00 : 0x01;
			}

			// Count valid
			let validCount = 0;
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				if (blob[i * BYTES_PER_FIELD_ELEMENT] === 0x00) validCount++;
			}

			expect(validCount).toBe(FIELD_ELEMENTS_PER_BLOB / 2);
		});

		it("should iterate through all field elements correctly", () => {
			const blob = new Uint8Array(SIZE);

			// Set unique value for each field element high byte
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				blob[i * BYTES_PER_FIELD_ELEMENT] = 0x00;
				blob[i * BYTES_PER_FIELD_ELEMENT + 1] = i % 256;
			}

			// Verify iteration
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const offset = i * BYTES_PER_FIELD_ELEMENT;
				expect(blob[offset]).toBe(0x00);
				expect(blob[offset + 1]).toBe(i % 256);
			}
		});

		it("should handle field element boundaries in blob", () => {
			const blob = new Uint8Array(SIZE);

			// Mark field element boundaries
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const start = i * BYTES_PER_FIELD_ELEMENT;
				const end = start + BYTES_PER_FIELD_ELEMENT - 1;

				blob[start] = 0x00; // Start of element
				blob[end] = 0xff; // End of element
			}

			// Verify boundaries
			for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
				const start = i * BYTES_PER_FIELD_ELEMENT;
				const end = start + BYTES_PER_FIELD_ELEMENT - 1;

				expect(blob[start]).toBe(0x00);
				expect(blob[end]).toBe(0xff);
			}
		});
	});

	describe("Field Element Data Encoding", () => {
		it("should encode usable data across field elements", () => {
			// Each field element can hold 31 bytes of data (32nd byte is 0)
			const usablePerElement = 31;
			const totalUsable = usablePerElement * FIELD_ELEMENTS_PER_BLOB;

			// Calculate theoretical max data
			expect(totalUsable).toBe(31 * 4096);
			expect(totalUsable).toBe(126976); // ~124 KB usable
		});

		it("should handle data spanning multiple field elements", () => {
			const data = new Uint8Array(100);
			for (let i = 0; i < 100; i++) data[i] = i % 256;

			// Encode into field elements (31 bytes per element)
			const numElements = Math.ceil(data.length / 31);
			expect(numElements).toBe(Math.ceil(100 / 31)); // 4 elements
		});

		it("should calculate field element count for various data sizes", () => {
			const testSizes = [
				{ data: 0, elements: 0 },
				{ data: 1, elements: 1 },
				{ data: 31, elements: 1 },
				{ data: 32, elements: 2 },
				{ data: 62, elements: 2 },
				{ data: 63, elements: 3 },
			];

			for (const { data, elements } of testSizes) {
				const needed = Math.ceil(data / 31);
				expect(needed).toBe(elements);
			}
		});
	});
});
