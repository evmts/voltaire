/**
 * BLAKE2b Tests
 *
 * Comprehensive test suite validating BLAKE2b implementation against known test vectors
 * Tests both Noble (Blake2) and WASM (Blake2Wasm) implementations
 */

import { describe, expect, it, beforeAll } from "vitest";
import { Blake2 } from "./blake2.js";
import { Blake2Wasm } from "./blake2.wasm.js";
import * as loader from "../wasm-loader/loader.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Load WASM module before tests
beforeAll(async () => {
	const wasmPath = join(import.meta.dirname, "../../wasm/crypto/blake2.wasm");
	const wasmBuffer = readFileSync(wasmPath);
	await loader.loadWasm(wasmBuffer.buffer);
});

describe("Blake2 (Noble)", () => {
	describe("hash", () => {
		it("should hash empty input with default 64-byte output", () => {
			const hash = Blake2.hash(new Uint8Array([]));
			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(64);

			// Known BLAKE2b-512 hash of empty input
			const expected = new Uint8Array([
				0x78, 0x6a, 0x02, 0xf7, 0x42, 0x01, 0x59, 0x03, 0xc6, 0xc6, 0xfd, 0x85,
				0x25, 0x52, 0xd2, 0x72, 0x91, 0x2f, 0x47, 0x40, 0xe1, 0x58, 0x47, 0x61,
				0x8a, 0x86, 0xe2, 0x17, 0xf7, 0x1f, 0x54, 0x19, 0xd2, 0x5e, 0x10, 0x31,
				0xaf, 0xee, 0x58, 0x53, 0x13, 0x89, 0x64, 0x44, 0x93, 0x4e, 0xb0, 0x4b,
				0x90, 0x3a, 0x68, 0x5b, 0x14, 0x48, 0xb7, 0x55, 0xd5, 0x6f, 0x70, 0x1a,
				0xfe, 0x9b, 0xe2, 0xce,
			]);

			expect(hash).toEqual(expected);
		});

		it("should hash 'abc' with 64-byte output", () => {
			const hash = Blake2.hash(new Uint8Array([0x61, 0x62, 0x63]));
			expect(hash.length).toBe(64);

			// Known BLAKE2b-512 hash of "abc"
			const expected = new Uint8Array([
				0xba, 0x80, 0xa5, 0x3f, 0x98, 0x1c, 0x4d, 0x0d, 0x6a, 0x27, 0x97, 0xb6,
				0x9f, 0x12, 0xf6, 0xe9, 0x4c, 0x21, 0x2f, 0x14, 0x68, 0x5a, 0xc4, 0xb7,
				0x4b, 0x12, 0xbb, 0x6f, 0xdb, 0xff, 0xa2, 0xd1, 0x7d, 0x87, 0xc5, 0x39,
				0x2a, 0xab, 0x79, 0x2d, 0xc2, 0x52, 0xd5, 0xde, 0x45, 0x33, 0xcc, 0x95,
				0x18, 0xd3, 0x8a, 0xa8, 0xdb, 0xf1, 0x92, 0x5a, 0xb9, 0x23, 0x86, 0xed,
				0xd4, 0x00, 0x99, 0x23,
			]);

			expect(hash).toEqual(expected);
		});

		it("should hash string input", () => {
			const hash = Blake2.hash("abc");
			expect(hash.length).toBe(64);

			// Should match the same hash as Uint8Array input
			const hashFromBytes = Blake2.hash(new Uint8Array([0x61, 0x62, 0x63]));
			expect(hash).toEqual(hashFromBytes);
		});

		it("should hash with 32-byte output (BLAKE2b-256)", () => {
			const hash = Blake2.hash(new Uint8Array([]), 32);
			expect(hash.length).toBe(32);

			// Known BLAKE2b-256 hash of empty input
			const expected = new Uint8Array([
				0x0e, 0x57, 0x51, 0xc0, 0x26, 0xe5, 0x43, 0xb2, 0xe8, 0xab, 0x2e, 0xb0,
				0x60, 0x99, 0xda, 0xa1, 0xd1, 0xe5, 0xdf, 0x47, 0x77, 0x8f, 0x77, 0x87,
				0xfa, 0xab, 0x45, 0xcd, 0xf1, 0x2f, 0xe3, 0xa8,
			]);

			expect(hash).toEqual(expected);
		});

		it("should hash with 48-byte output", () => {
			const hash = Blake2.hash(new Uint8Array([]), 48);
			expect(hash.length).toBe(48);

			// Verify it's different from 32-byte and 64-byte outputs
			const hash32 = Blake2.hash(new Uint8Array([]), 32);
			const hash64 = Blake2.hash(new Uint8Array([]), 64);

			expect(hash).not.toEqual(hash32);
			expect(hash).not.toEqual(hash64.slice(0, 48));
		});

		it("should produce different hashes for different output lengths", () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]);

			const hash20 = Blake2.hash(input, 20);
			const hash32 = Blake2.hash(input, 32);
			const hash48 = Blake2.hash(input, 48);
			const hash64 = Blake2.hash(input, 64);

			expect(hash20.length).toBe(20);
			expect(hash32.length).toBe(32);
			expect(hash48.length).toBe(48);
			expect(hash64.length).toBe(64);

			// Verify they're all different
			expect(hash20).not.toEqual(hash32.slice(0, 20));
			expect(hash32).not.toEqual(hash48.slice(0, 32));
			expect(hash48).not.toEqual(hash64.slice(0, 48));
		});

		it("should throw error for invalid output length (too small)", () => {
			expect(() => Blake2.hash(new Uint8Array([]), 0)).toThrow(
				"Invalid output length: 0. Must be between 1 and 64 bytes.",
			);

			expect(() => Blake2.hash(new Uint8Array([]), -1)).toThrow(
				"Invalid output length: -1. Must be between 1 and 64 bytes.",
			);
		});

		it("should throw error for invalid output length (too large)", () => {
			expect(() => Blake2.hash(new Uint8Array([]), 65)).toThrow(
				"Invalid output length: 65. Must be between 1 and 64 bytes.",
			);

			expect(() => Blake2.hash(new Uint8Array([]), 100)).toThrow(
				"Invalid output length: 100. Must be between 1 and 64 bytes.",
			);
		});

		it("should hash with minimum output length (1 byte)", () => {
			const hash = Blake2.hash(new Uint8Array([0x61, 0x62, 0x63]), 1);
			expect(hash.length).toBe(1);
			expect(hash).toBeInstanceOf(Uint8Array);
		});

		it("should hash longer inputs correctly", () => {
			const input = new Uint8Array(1000).fill(0x42);
			const hash = Blake2.hash(input);
			expect(hash.length).toBe(64);

			// Hash should be deterministic
			const hash2 = Blake2.hash(input);
			expect(hash).toEqual(hash2);
		});

		it("should produce different hashes for different inputs", () => {
			const hash1 = Blake2.hash(new Uint8Array([0x00]));
			const hash2 = Blake2.hash(new Uint8Array([0x01]));
			const hash3 = Blake2.hash(new Uint8Array([0x00, 0x00]));

			expect(hash1).not.toEqual(hash2);
			expect(hash1).not.toEqual(hash3);
			expect(hash2).not.toEqual(hash3);
		});

		it("should hash long string input", () => {
			const longString = "The quick brown fox jumps over the lazy dog";
			const hash = Blake2.hash(longString);
			expect(hash.length).toBe(64);

			// Should be deterministic
			const hash2 = Blake2.hash(longString);
			expect(hash).toEqual(hash2);
		});

		it("should handle unicode strings correctly", () => {
			const unicodeString = "Hello 世界 🌍";
			const hash = Blake2.hash(unicodeString);
			expect(hash.length).toBe(64);

			// Should match manual UTF-8 encoding
			const manualBytes = new TextEncoder().encode(unicodeString);
			const hashFromBytes = Blake2.hash(manualBytes);
			expect(hash).toEqual(hashFromBytes);
		});
	});

	describe("hashString", () => {
		it("should hash string with default 64-byte output", () => {
			const hash = Blake2.hashString("abc");
			expect(hash.length).toBe(64);
		});

		it("should hash string with custom output length", () => {
			const hash = Blake2.hashString("test", 32);
			expect(hash.length).toBe(32);
		});

		it("should produce same result as hash() with string input", () => {
			const str = "test string";
			const hash1 = Blake2.hashString(str);
			const hash2 = Blake2.hash(str);
			expect(hash1).toEqual(hash2);
		});

		it("should hash empty string", () => {
			const hash = Blake2.hashString("");
			expect(hash.length).toBe(64);

			// Should match empty byte array
			const hashEmpty = Blake2.hash(new Uint8Array([]));
			expect(hash).toEqual(hashEmpty);
		});

		it("should throw error for invalid output length", () => {
			expect(() => Blake2.hashString("test", 0)).toThrow(
				"Invalid output length: 0. Must be between 1 and 64 bytes.",
			);

			expect(() => Blake2.hashString("test", 65)).toThrow(
				"Invalid output length: 65. Must be between 1 and 64 bytes.",
			);
		});
	});

	describe("RFC 7693 test vectors", () => {
		it("should match RFC 7693 Appendix A test vector for 'abc'", () => {
			// This is the standard test vector from RFC 7693
			const input = new Uint8Array([0x61, 0x62, 0x63]); // "abc"
			const hash = Blake2.hash(input, 64);

			const expected = new Uint8Array([
				0xba, 0x80, 0xa5, 0x3f, 0x98, 0x1c, 0x4d, 0x0d, 0x6a, 0x27, 0x97, 0xb6,
				0x9f, 0x12, 0xf6, 0xe9, 0x4c, 0x21, 0x2f, 0x14, 0x68, 0x5a, 0xc4, 0xb7,
				0x4b, 0x12, 0xbb, 0x6f, 0xdb, 0xff, 0xa2, 0xd1, 0x7d, 0x87, 0xc5, 0x39,
				0x2a, 0xab, 0x79, 0x2d, 0xc2, 0x52, 0xd5, 0xde, 0x45, 0x33, 0xcc, 0x95,
				0x18, 0xd3, 0x8a, 0xa8, 0xdb, 0xf1, 0x92, 0x5a, 0xb9, 0x23, 0x86, 0xed,
				0xd4, 0x00, 0x99, 0x23,
			]);

			expect(hash).toEqual(expected);
		});

		it("should match test vector for single byte 0x00", () => {
			const input = new Uint8Array([0x00]);
			const hash = Blake2.hash(input, 64);

			const expected = new Uint8Array([
				0x2f, 0xa3, 0xf6, 0x86, 0xdf, 0x87, 0x69, 0x95, 0x16, 0x7e, 0x7c, 0x2e,
				0x5d, 0x74, 0xc4, 0xc7, 0xb6, 0xe4, 0x8f, 0x80, 0x68, 0xfe, 0x0e, 0x44,
				0x20, 0x83, 0x44, 0xd4, 0x80, 0xf7, 0x90, 0x4c, 0x36, 0x96, 0x3e, 0x44,
				0x11, 0x5f, 0xe3, 0xeb, 0x2a, 0x3a, 0xc8, 0x69, 0x4c, 0x28, 0xbc, 0xb4,
				0xf5, 0xa0, 0xf3, 0x27, 0x6f, 0x2e, 0x79, 0x48, 0x7d, 0x82, 0x19, 0x05,
				0x7a, 0x50, 0x6e, 0x4b,
			]);

			expect(hash).toEqual(expected);
		});

		it("should match test vector for two bytes 0x00 0x01", () => {
			const input = new Uint8Array([0x00, 0x01]);
			const hash = Blake2.hash(input, 64);

			const expected = new Uint8Array([
				0x1c, 0x08, 0x79, 0x8d, 0xc6, 0x41, 0xab, 0xa9, 0xde, 0xe4, 0x35, 0xe2,
				0x25, 0x19, 0xa4, 0x72, 0x9a, 0x09, 0xb2, 0xbf, 0xe0, 0xff, 0x00, 0xef,
				0x2d, 0xcd, 0x8e, 0xd6, 0xf8, 0xa0, 0x7d, 0x15, 0xea, 0xf4, 0xae, 0xe5,
				0x2b, 0xbf, 0x18, 0xab, 0x56, 0x08, 0xa6, 0x19, 0x0f, 0x70, 0xb9, 0x04,
				0x86, 0xc8, 0xa7, 0xd4, 0x87, 0x37, 0x10, 0xb1, 0x11, 0x5d, 0x3d, 0xeb,
				0xbb, 0x43, 0x27, 0xb5,
			]);

			expect(hash).toEqual(expected);
		});
	});

	describe("edge cases", () => {
		it("should handle large inputs efficiently", () => {
			// Test with 1MB input
			const largeInput = new Uint8Array(1024 * 1024);
			for (let i = 0; i < largeInput.length; i++) {
				largeInput[i] = i & 0xff;
			}

			const hash = Blake2.hash(largeInput);
			expect(hash.length).toBe(64);

			// Should be deterministic
			const hash2 = Blake2.hash(largeInput);
			expect(hash).toEqual(hash2);
		});

		it("should produce different outputs for similar inputs", () => {
			const input1 = new Uint8Array(100).fill(0);
			const input2 = new Uint8Array(100).fill(0);
			input2[99] = 1; // Single bit difference at the end

			const hash1 = Blake2.hash(input1);
			const hash2 = Blake2.hash(input2);

			expect(hash1).not.toEqual(hash2);

			// Count different bytes (avalanche effect)
			let differentBytes = 0;
			for (let i = 0; i < hash1.length; i++) {
				if (hash1[i] !== hash2[i]) differentBytes++;
			}

			// Should have significant avalanche effect (>= 25% different bytes)
			expect(differentBytes).toBeGreaterThanOrEqual(16);
		});

		it("should handle all output lengths from 1 to 64", () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]);

			for (let len = 1; len <= 64; len++) {
				const hash = Blake2.hash(input, len);
				expect(hash.length).toBe(len);
			}
		});
	});
});

describe("Blake2Wasm", () => {
	describe("hash", () => {
		it("should hash empty input with default 64-byte output", () => {
			const hash = Blake2Wasm.hash(new Uint8Array([]));
			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(64);
		});

		it("should hash 'abc' with 64-byte output", () => {
			const hash = Blake2Wasm.hash(new Uint8Array([0x61, 0x62, 0x63]));
			expect(hash.length).toBe(64);
		});

		it("should hash string input", () => {
			const hash = Blake2Wasm.hash("abc");
			expect(hash.length).toBe(64);

			// Should match the same hash as Uint8Array input
			const hashFromBytes = Blake2Wasm.hash(new Uint8Array([0x61, 0x62, 0x63]));
			expect(hash).toEqual(hashFromBytes);
		});

		it("should hash with 32-byte output (BLAKE2b-256)", () => {
			const hash = Blake2Wasm.hash(new Uint8Array([]), 32);
			expect(hash.length).toBe(32);
		});

		it("should throw error for invalid output length", () => {
			expect(() => Blake2Wasm.hash(new Uint8Array([]), 0)).toThrow(
				"Invalid output length: 0. Must be between 1 and 64 bytes.",
			);

			expect(() => Blake2Wasm.hash(new Uint8Array([]), 65)).toThrow(
				"Invalid output length: 65. Must be between 1 and 64 bytes.",
			);
		});

		it("should handle all output lengths from 1 to 64", () => {
			const input = new Uint8Array([0x61, 0x62, 0x63]);

			for (let len = 1; len <= 64; len++) {
				const hash = Blake2Wasm.hash(input, len);
				expect(hash.length).toBe(len);
			}
		});
	});

	describe("hashString", () => {
		it("should hash string with default 64-byte output", () => {
			const hash = Blake2Wasm.hashString("abc");
			expect(hash.length).toBe(64);
		});

		it("should hash string with custom output length", () => {
			const hash = Blake2Wasm.hashString("test", 32);
			expect(hash.length).toBe(32);
		});

		it("should produce same result as hash() with string input", () => {
			const str = "test string";
			const hash1 = Blake2Wasm.hashString(str);
			const hash2 = Blake2Wasm.hash(str);
			expect(hash1).toEqual(hash2);
		});
	});
});

describe("Cross-validation: Blake2 (Noble) === Blake2Wasm", () => {
	it("should produce identical results for empty input", () => {
		const input = new Uint8Array([]);
		const nobleHash = Blake2.hash(input);
		const wasmHash = Blake2Wasm.hash(input);
		expect(wasmHash).toEqual(nobleHash);
	});

	it("should produce identical results for 'abc'", () => {
		const input = new Uint8Array([0x61, 0x62, 0x63]);
		const nobleHash = Blake2.hash(input);
		const wasmHash = Blake2Wasm.hash(input);
		expect(wasmHash).toEqual(nobleHash);
	});

	it("should produce identical results for various output lengths", () => {
		const input = new Uint8Array([0x61, 0x62, 0x63]);

		for (const len of [1, 20, 32, 48, 64]) {
			const nobleHash = Blake2.hash(input, len);
			const wasmHash = Blake2Wasm.hash(input, len);
			expect(wasmHash).toEqual(nobleHash);
		}
	});

	it("should produce identical results for string input", () => {
		const str = "The quick brown fox jumps over the lazy dog";
		const nobleHash = Blake2.hash(str);
		const wasmHash = Blake2Wasm.hash(str);
		expect(wasmHash).toEqual(nobleHash);
	});

	it("should produce identical results for large input", () => {
		const input = new Uint8Array(10000).fill(0x42);
		const nobleHash = Blake2.hash(input, 32);
		const wasmHash = Blake2Wasm.hash(input, 32);
		expect(wasmHash).toEqual(nobleHash);
	});

	it("should produce identical results for all RFC 7693 test vectors", () => {
		// Empty input
		const empty = new Uint8Array([]);
		expect(Blake2Wasm.hash(empty)).toEqual(Blake2.hash(empty));

		// "abc"
		const abc = new Uint8Array([0x61, 0x62, 0x63]);
		expect(Blake2Wasm.hash(abc)).toEqual(Blake2.hash(abc));

		// Single byte 0x00
		const zero = new Uint8Array([0x00]);
		expect(Blake2Wasm.hash(zero)).toEqual(Blake2.hash(zero));

		// Two bytes 0x00 0x01
		const twoBytes = new Uint8Array([0x00, 0x01]);
		expect(Blake2Wasm.hash(twoBytes)).toEqual(Blake2.hash(twoBytes));
	});
});
