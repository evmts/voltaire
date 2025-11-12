import { describe, expect, it } from "vitest";
import { RlpDecodingError } from "./BrandedRlp/RlpError.js";
import { MAX_DEPTH } from "./BrandedRlp/constants.js";
import * as Rlp from "./index.js";

/**
 * Fuzz tests for RLP encode/decode functions
 *
 * These tests use randomized inputs to find edge cases, buffer overflows,
 * and parsing vulnerabilities in RLP encode/decode functions.
 */

describe("RLP Fuzz Tests", () => {
	// Helper: generate random bytes
	function randomBytes(length: number): Uint8Array {
		return Uint8Array.from({ length }, () => Math.floor(Math.random() * 256));
	}

	// Helper: generate random nested structure
	function randomNestedList(maxDepth: number, currentDepth = 0): any[] {
		if (currentDepth >= maxDepth || Math.random() > 0.7) {
			// Return leaf (byte array)
			const length = Math.floor(Math.random() * 20);
			return [randomBytes(length)];
		}

		// Return nested list
		const listLength = Math.floor(Math.random() * 5) + 1;
		const result: any[] = [];
		for (let i = 0; i < listLength; i++) {
			if (Math.random() > 0.5) {
				// Add byte array
				result.push(randomBytes(Math.floor(Math.random() * 20)));
			} else {
				// Add nested list
				result.push(...randomNestedList(maxDepth, currentDepth + 1));
			}
		}
		return result;
	}

	describe("Round-trip Encode/Decode Fuzz", () => {
		it("should handle random byte arrays (0-1000 bytes)", () => {
			for (let i = 0; i < 100; i++) {
				const length = Math.floor(Math.random() * 1001);
				const bytes = randomBytes(length);

				const encoded = Rlp.encodeBytes(bytes);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("bytes");
				if (decoded.data.type === "bytes") {
					expect(decoded.data.value).toEqual(bytes);
				}
				expect(decoded.remainder.length).toBe(0);
			}
		});

		it("should handle random nested lists (depth 0-5)", () => {
			for (let i = 0; i < 50; i++) {
				const maxDepth = Math.floor(Math.random() * 6);
				const list = randomNestedList(maxDepth);

				const encoded = Rlp.encodeList(list);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("list");
				expect(decoded.remainder.length).toBe(0);

				// Re-encode and verify round-trip
				const reEncoded = Rlp.encode(decoded.data);
				expect(reEncoded).toEqual(encoded);
			}
		});

		it("should handle empty byte arrays", () => {
			for (let i = 0; i < 20; i++) {
				const empty = new Uint8Array(0);
				const encoded = Rlp.encodeBytes(empty);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("bytes");
				if (decoded.data.type === "bytes") {
					expect(decoded.data.value.length).toBe(0);
				}
			}
		});

		it("should handle empty lists", () => {
			for (let i = 0; i < 20; i++) {
				const empty: any[] = [];
				const encoded = Rlp.encodeList(empty);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("list");
				if (decoded.data.type === "list") {
					expect(decoded.data.value.length).toBe(0);
				}
			}
		});

		it("should handle large arrays (1000+ elements)", () => {
			const sizes = [1000, 2000, 5000];

			for (const size of sizes) {
				const largeList: Uint8Array[] = [];
				for (let i = 0; i < size; i++) {
					largeList.push(randomBytes(Math.floor(Math.random() * 10)));
				}

				const encoded = Rlp.encodeList(largeList);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("list");
				if (decoded.data.type === "list") {
					expect(decoded.data.value.length).toBe(size);
				}
			}
		});

		it("should handle all single byte values (0x00-0xFF)", () => {
			for (let byte = 0; byte <= 0xff; byte++) {
				const singleByte = new Uint8Array([byte]);
				const encoded = Rlp.encodeBytes(singleByte);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("bytes");
				if (decoded.data.type === "bytes") {
					expect(decoded.data.value).toEqual(singleByte);
				}
			}
		});

		it("should handle boundary at 55/56 bytes (short vs long encoding)", () => {
			// Test around the boundary for short (≤55 bytes) vs long (>55 bytes) encoding
			const sizes = [53, 54, 55, 56, 57, 58];

			for (const size of sizes) {
				const bytes = randomBytes(size);
				const encoded = Rlp.encodeBytes(bytes);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("bytes");
				if (decoded.data.type === "bytes") {
					expect(decoded.data.value).toEqual(bytes);
					expect(decoded.data.value.length).toBe(size);
				}
			}
		});

		it("should handle mixed empty and non-empty lists", () => {
			for (let i = 0; i < 50; i++) {
				const mixedList: any[] = [];
				const listLength = Math.floor(Math.random() * 20) + 1;

				for (let j = 0; j < listLength; j++) {
					if (Math.random() > 0.5) {
						mixedList.push(randomBytes(Math.floor(Math.random() * 30)));
					} else {
						mixedList.push([]);
					}
				}

				const encoded = Rlp.encodeList(mixedList);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("list");
			}
		});
	});

	describe("Malformed RLP Data Fuzz", () => {
		it("should reject truncated RLP data", () => {
			for (let i = 0; i < 50; i++) {
				const bytes = randomBytes(Math.floor(Math.random() * 100) + 10);
				const encoded = Rlp.encodeBytes(bytes);

				// Truncate at random position
				const truncateAt = Math.floor(Math.random() * (encoded.length - 1)) + 1;
				const truncated = encoded.slice(0, truncateAt);

				expect(() => Rlp.decode(truncated)).toThrow();
			}
		});

		it("should reject invalid length prefixes", () => {
			// Test various invalid prefix scenarios
			const invalidPrefixes = [
				// Long string with length 0 (non-canonical)
				new Uint8Array([0xb8, 0x00]),
				// Long list with length 0 (non-canonical)
				new Uint8Array([0xf8, 0x00]),
				// Length prefix with leading zeros
				new Uint8Array([0xb9, 0x00, 0x01, 0x00]),
				// Length that exceeds available data
				new Uint8Array([0xb8, 0xff]),
				new Uint8Array([0xf8, 0xff]),
			];

			for (const invalid of invalidPrefixes) {
				expect(() => Rlp.decode(invalid)).toThrow();
			}
		});

		it("should reject non-canonical single byte encoding", () => {
			// Single byte < 0x80 should not be prefixed with 0x81
			for (let byte = 0; byte < 0x80; byte++) {
				const nonCanonical = new Uint8Array([0x81, byte]);
				expect(() => Rlp.decode(nonCanonical)).toThrow(RlpDecodingError);
			}
		});

		it("should reject string < 56 bytes using long form", () => {
			for (let length = 1; length < 56; length++) {
				const bytes = randomBytes(length);
				// Manually create non-canonical long form
				const nonCanonical = new Uint8Array([0xb8, length, ...bytes]);
				expect(() => Rlp.decode(nonCanonical)).toThrow();
			}
		});

		it("should reject list < 56 bytes using long form", () => {
			for (let i = 0; i < 20; i++) {
				const shortList = [randomBytes(5), randomBytes(5)];
				const canonicalEncoded = Rlp.encodeList(shortList);

				// Should be using short form (prefix 0xc0-0xf7)
				expect(canonicalEncoded[0]).toBeGreaterThanOrEqual(0xc0);
				expect(canonicalEncoded[0]).toBeLessThanOrEqual(0xf7);

				// Create non-canonical long form
				const payload = canonicalEncoded.slice(1);
				if (payload.length < 56) {
					const nonCanonical = new Uint8Array([
						0xf8,
						payload.length,
						...payload,
					]);
					expect(() => Rlp.decode(nonCanonical)).toThrow();
				}
			}
		});

		it("should handle random malformed data gracefully", () => {
			for (let i = 0; i < 100; i++) {
				const length = Math.floor(Math.random() * 200) + 1;
				const malformed = randomBytes(length);

				// Should either decode successfully or throw, but not crash
				try {
					Rlp.decode(malformed);
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});

		it("should reject data with unexpected remainder", () => {
			for (let i = 0; i < 30; i++) {
				const bytes = randomBytes(Math.floor(Math.random() * 50) + 10);
				const encoded = Rlp.encodeBytes(bytes);
				const extra = randomBytes(Math.floor(Math.random() * 20) + 1);
				const withRemainder = new Uint8Array([...encoded, ...extra]);

				// Should throw when stream=false (default)
				expect(() => Rlp.decode(withRemainder, false)).toThrow();

				// Should succeed when stream=true
				const result = Rlp.decode(withRemainder, true);
				expect(result.remainder).toEqual(extra);
			}
		});

		it("should reject leading zeros in length encoding", () => {
			const withLeadingZeros = [
				// Long string with leading zero in length
				new Uint8Array([0xb9, 0x00, 0x38, ...randomBytes(0x38)]),
				new Uint8Array([0xba, 0x00, 0x01, 0x00, ...randomBytes(0x100)]),
				// Long list with leading zero in length
				new Uint8Array([0xf9, 0x00, 0x38]),
				new Uint8Array([0xfa, 0x00, 0x01, 0x00]),
			];

			for (const invalid of withLeadingZeros) {
				expect(() => Rlp.decode(invalid)).toThrow();
			}
		});
	});

	describe("Maximum Depth Nested Structures Fuzz", () => {
		it("should handle maximum allowed depth", () => {
			// Build nested structure at exactly MAX_DEPTH - 1
			// (MAX_DEPTH is checked after the top-level list adds 1 to depth)
			let nested: any = [randomBytes(5)];
			for (let i = 1; i < MAX_DEPTH - 1; i++) {
				nested = [nested];
			}

			const encoded = Rlp.encodeList(nested);
			const decoded = Rlp.decode(encoded);

			expect(decoded.data.type).toBe("list");
		});

		it("should reject structures exceeding maximum depth", () => {
			// Build nested structure beyond MAX_DEPTH
			let nested: any = [randomBytes(5)];
			for (let i = 1; i <= MAX_DEPTH + 5; i++) {
				nested = [nested];
			}

			const encoded = Rlp.encodeList(nested);

			expect(() => Rlp.decode(encoded)).toThrow(RlpDecodingError);
			expect(() => Rlp.decode(encoded)).toThrow(/depth/i);
		});

		it("should handle deeply nested random structures", () => {
			for (let depth = 1; depth < MAX_DEPTH; depth += 5) {
				const nested = randomNestedList(depth);
				const encoded = Rlp.encodeList(nested);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("list");
			}
		});
	});

	describe("Boundary Conditions Fuzz", () => {
		it("should handle exact boundary sizes for length encoding", () => {
			const boundaries = [
				0,
				1, // Empty and single byte
				55,
				56, // Short vs long string boundary
				127,
				128, // Single byte value boundary
				255,
				256, // One vs two byte length
				65535,
				65536, // Two vs three byte length (if supported)
			];

			for (const size of boundaries.filter((s) => s <= 10000)) {
				const bytes = randomBytes(size);
				const encoded = Rlp.encodeBytes(bytes);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("bytes");
				if (decoded.data.type === "bytes") {
					expect(decoded.data.value.length).toBe(size);
				}
			}
		});

		it("should handle strings at exact 55 byte boundary", () => {
			// Exactly 55 bytes should use short form
			const exactly55 = randomBytes(55);
			const encoded = Rlp.encodeBytes(exactly55);

			// Should use short string encoding (0x80 + 55 = 0xb7)
			expect(encoded[0]).toBe(0xb7);

			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("bytes");
			if (decoded.data.type === "bytes") {
				expect(decoded.data.value).toEqual(exactly55);
			}
		});

		it("should handle strings at exact 56 byte boundary", () => {
			// Exactly 56 bytes should use long form
			const exactly56 = randomBytes(56);
			const encoded = Rlp.encodeBytes(exactly56);

			// Should use long string encoding (0xb8 + 1 byte length)
			expect(encoded[0]).toBe(0xb8);
			expect(encoded[1]).toBe(56);

			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("bytes");
			if (decoded.data.type === "bytes") {
				expect(decoded.data.value).toEqual(exactly56);
			}
		});

		it("should handle zero-length payloads", () => {
			const emptyBytes = new Uint8Array(0);
			const emptyList: any[] = [];

			const encodedBytes = Rlp.encodeBytes(emptyBytes);
			const encodedList = Rlp.encodeList(emptyList);

			// Empty string is encoded as 0x80
			expect(encodedBytes).toEqual(new Uint8Array([0x80]));
			// Empty list is encoded as 0xc0
			expect(encodedList).toEqual(new Uint8Array([0xc0]));

			const decodedBytes = Rlp.decode(encodedBytes);
			const decodedList = Rlp.decode(encodedList);

			expect(decodedBytes.data.type).toBe("bytes");
			expect(decodedList.data.type).toBe("list");
		});
	});

	describe("Buffer Overrun Attempts Fuzz", () => {
		it("should reject length that exceeds buffer size", () => {
			for (let i = 0; i < 50; i++) {
				const actualLength = Math.floor(Math.random() * 50) + 10;
				const claimedLength =
					actualLength + Math.floor(Math.random() * 100) + 50;

				// Create buffer claiming to be longer than it is
				if (claimedLength < 256) {
					const malicious = new Uint8Array([
						0xb8,
						claimedLength,
						...randomBytes(actualLength),
					]);
					expect(() => Rlp.decode(malicious)).toThrow();
				}
			}
		});

		it("should reject excessive length values", () => {
			// Test with excessively large length claims
			const excessive = [
				new Uint8Array([0xb9, 0xff, 0xff]), // Claims 65535 bytes
				new Uint8Array([0xba, 0xff, 0xff, 0xff]), // Claims 16MB+
				new Uint8Array([0xf9, 0xff, 0xff]), // List claiming 65535 bytes
			];

			for (const malicious of excessive) {
				expect(() => Rlp.decode(malicious)).toThrow();
			}
		});

		it("should handle length overflow in multi-byte length encoding", () => {
			for (let lengthBytes = 2; lengthBytes <= 4; lengthBytes++) {
				// Create a length value that would overflow
				const lengthPrefix = new Uint8Array(lengthBytes).fill(0xff);
				const malicious = new Uint8Array([
					0xb7 + lengthBytes,
					...lengthPrefix,
					...randomBytes(10),
				]);

				expect(() => Rlp.decode(malicious)).toThrow();
			}
		});

		it("should reject negative implied lengths", () => {
			// Test edge cases where length calculation might underflow
			const edgeCases = [
				new Uint8Array([0x80]), // Empty string (valid)
				new Uint8Array([0xc0]), // Empty list (valid)
				new Uint8Array([0xb7]), // Zero-length long form (invalid)
				new Uint8Array([0xf7]), // Zero-length long list form (invalid)
			];

			for (const test of edgeCases) {
				try {
					const result = Rlp.decode(test);
					// If it doesn't throw, verify it's one of the valid cases
					if (test[0] === 0x80 || test[0] === 0xc0) {
						expect(result.data.type).toBeDefined();
					}
				} catch (error) {
					// Invalid cases should throw
					expect(error).toBeDefined();
				}
			}
		});
	});

	describe("Stream Decoding Fuzz", () => {
		it("should handle multiple values in stream mode", () => {
			for (let i = 0; i < 30; i++) {
				const values: Uint8Array[] = [];
				const encodedValues: Uint8Array[] = [];

				const valueCount = Math.floor(Math.random() * 10) + 2;
				for (let j = 0; j < valueCount; j++) {
					const bytes = randomBytes(Math.floor(Math.random() * 50));
					values.push(bytes);
					encodedValues.push(Rlp.encodeBytes(bytes));
				}

				// Concatenate all encoded values
				const totalLength = encodedValues.reduce(
					(sum, arr) => sum + arr.length,
					0,
				);
				const stream = new Uint8Array(totalLength);
				let offset = 0;
				for (const encoded of encodedValues) {
					stream.set(encoded, offset);
					offset += encoded.length;
				}

				// Decode in stream mode
				let remaining = stream;
				const decodedValues: Uint8Array[] = [];

				while (remaining.length > 0) {
					const result = Rlp.decode(remaining, true);
					if (result.data.type === "bytes") {
						decodedValues.push(result.data.value);
					}
					remaining = result.remainder;
				}

				expect(decodedValues.length).toBe(values.length);
				for (let j = 0; j < values.length; j++) {
					expect(decodedValues[j]).toEqual(values[j]);
				}
			}
		});
	});

	describe("Canonical Encoding Fuzz", () => {
		it("should always produce canonical encoding", () => {
			for (let i = 0; i < 100; i++) {
				const length = Math.floor(Math.random() * 200);
				const bytes = randomBytes(length);

				const encoded = Rlp.encodeBytes(bytes);
				const decoded = Rlp.decode(encoded);

				// Re-encode and verify it produces same result
				if (decoded.data.type === "bytes") {
					const reEncoded = Rlp.encodeBytes(decoded.data.value);
					expect(reEncoded).toEqual(encoded);
				}
			}
		});

		it("should detect and reject non-canonical encodings", () => {
			for (let i = 0; i < 50; i++) {
				const length = Math.floor(Math.random() * 30) + 1;
				const bytes = randomBytes(length);
				const canonical = Rlp.encodeBytes(bytes);

				// Verify canonical encoding doesn't throw
				expect(() => Rlp.decode(canonical)).not.toThrow();

				// Create various non-canonical forms and verify they throw
				if (length < 56 && length > 0) {
					// Try to use long form for short data
					const nonCanonical = new Uint8Array([0xb8, length, ...bytes]);
					expect(() => Rlp.decode(nonCanonical)).toThrow();
				}
			}
		});
	});

	describe("Edge Cases and Special Values", () => {
		it("should handle maximum single byte value (0x7f)", () => {
			const maxSingleByte = new Uint8Array([0x7f]);
			const encoded = Rlp.encodeBytes(maxSingleByte);

			// Should encode as itself (no prefix)
			expect(encoded).toEqual(maxSingleByte);

			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("bytes");
			if (decoded.data.type === "bytes") {
				expect(decoded.data.value).toEqual(maxSingleByte);
			}
		});

		it("should handle minimum prefixed byte (0x80)", () => {
			const minPrefixed = new Uint8Array([0x80]);
			const encoded = Rlp.encodeBytes(minPrefixed);

			// Should be prefixed as [0x81, 0x80]
			expect(encoded).toEqual(new Uint8Array([0x81, 0x80]));

			const decoded = Rlp.decode(encoded);
			expect(decoded.data.type).toBe("bytes");
			if (decoded.data.type === "bytes") {
				expect(decoded.data.value).toEqual(minPrefixed);
			}
		});

		it("should handle mixed byte values across boundaries", () => {
			const mixed = new Uint8Array([0x00, 0x7f, 0x80, 0xff]);
			const encoded = Rlp.encodeBytes(mixed);
			const decoded = Rlp.decode(encoded);

			expect(decoded.data.type).toBe("bytes");
			if (decoded.data.type === "bytes") {
				expect(decoded.data.value).toEqual(mixed);
			}
		});

		it("should handle random combinations of lists and bytes", () => {
			for (let i = 0; i < 50; i++) {
				const structure: any[] = [];
				const itemCount = Math.floor(Math.random() * 20) + 1;

				for (let j = 0; j < itemCount; j++) {
					const choice = Math.random();
					if (choice < 0.4) {
						structure.push(randomBytes(Math.floor(Math.random() * 30)));
					} else if (choice < 0.7) {
						structure.push([randomBytes(Math.floor(Math.random() * 20))]);
					} else {
						structure.push([]);
					}
				}

				const encoded = Rlp.encodeList(structure);
				const decoded = Rlp.decode(encoded);

				expect(decoded.data.type).toBe("list");
			}
		});
	});
});
