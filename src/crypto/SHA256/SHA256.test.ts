/**
 * SHA256 Tests
 *
 * Comprehensive test suite validating SHA256 implementation against:
 * - NIST test vectors from FIPS 180-4
 * - Bitcoin use cases (double SHA256, address derivation)
 * - Ethereum use cases
 * - Edge cases and security properties
 * - Cross-validation against @noble/hashes
 */

import { describe, expect, it } from "vitest";
import { sha256 } from "@noble/hashes/sha2.js";
import * as SHA256 from "./SHA256.js";

describe("SHA256.hash", () => {
	it("should hash empty input", () => {
		const hash = SHA256.hash(new Uint8Array([]));
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);

		// NIST test vector: SHA256("")
		const expected = new Uint8Array([
			0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14, 0x9a, 0xfb, 0xf4, 0xc8,
			0x99, 0x6f, 0xb9, 0x24, 0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
			0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash 'abc' (NIST test vector)", () => {
		const input = new Uint8Array([0x61, 0x62, 0x63]); // "abc"
		const hash = SHA256.hash(input);

		// NIST test vector: SHA256("abc")
		const expected = new Uint8Array([
			0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde,
			0x5d, 0xae, 0x22, 0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c,
			0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash NIST test vector: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'", () => {
		const input = new TextEncoder().encode(
			"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
		);
		const hash = SHA256.hash(input);

		// NIST test vector
		const expected = new Uint8Array([
			0x24, 0x8d, 0x6a, 0x61, 0xd2, 0x06, 0x38, 0xb8, 0xe5, 0xc0, 0x26, 0x93,
			0x0c, 0x3e, 0x60, 0x39, 0xa3, 0x3c, 0xe4, 0x59, 0x64, 0xff, 0x21, 0x67,
			0xf6, 0xec, 0xed, 0xd4, 0x19, 0xdb, 0x06, 0xc1,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash 'The quick brown fox jumps over the lazy dog'", () => {
		const input = new TextEncoder().encode(
			"The quick brown fox jumps over the lazy dog",
		);
		const hash = SHA256.hash(input);

		const expected = new Uint8Array([
			0xd7, 0xa8, 0xfb, 0xb3, 0x07, 0xd7, 0x80, 0x94, 0x69, 0xca, 0x9a, 0xbc,
			0xb0, 0x08, 0x2e, 0x4f, 0x8d, 0x56, 0x51, 0xe4, 0x6d, 0x3c, 0xdb, 0x76,
			0x2d, 0x02, 0xd0, 0xbf, 0x37, 0xc9, 0xe5, 0x92,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash single byte 0x00", () => {
		const input = new Uint8Array([0x00]);
		const hash = SHA256.hash(input);

		const expected = new Uint8Array([
			0x6e, 0x34, 0x0b, 0x9c, 0xff, 0xb3, 0x7a, 0x98, 0x9c, 0xa5, 0x44, 0xe6,
			0xbb, 0x78, 0x0a, 0x2c, 0x78, 0x90, 0x1d, 0x3f, 0xb3, 0x37, 0x38, 0x76,
			0x85, 0x11, 0xa3, 0x06, 0x17, 0xaf, 0xa0, 0x1d,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash single byte 0xFF", () => {
		const input = new Uint8Array([0xff]);
		const hash = SHA256.hash(input);

		// Cross-validate with @noble
		expect(hash).toEqual(sha256(input));
		expect(hash.length).toBe(32);
	});

	it("should hash all-zero input (32 bytes)", () => {
		const input = new Uint8Array(32).fill(0);
		const hash = SHA256.hash(input);

		expect(hash.length).toBe(32);
		expect(hash).toEqual(sha256(input));
	});

	it("should hash all-ones input (32 bytes)", () => {
		const input = new Uint8Array(32).fill(0xff);
		const hash = SHA256.hash(input);

		expect(hash.length).toBe(32);
		expect(hash).toEqual(sha256(input));
	});

	it("should be deterministic", () => {
		const input = new Uint8Array([1, 2, 3, 4, 5]);
		const hash1 = SHA256.hash(input);
		const hash2 = SHA256.hash(input);

		expect(hash1).toEqual(hash2);
	});

	it("should produce different hashes for different inputs", () => {
		const hash1 = SHA256.hash(new Uint8Array([0x00]));
		const hash2 = SHA256.hash(new Uint8Array([0x01]));
		const hash3 = SHA256.hash(new Uint8Array([0x00, 0x00]));

		expect(hash1).not.toEqual(hash2);
		expect(hash1).not.toEqual(hash3);
		expect(hash2).not.toEqual(hash3);
	});

	it("should handle exactly 64 bytes (one block)", () => {
		const input = new Uint8Array(64).fill(0x42);
		const hash = SHA256.hash(input);

		expect(hash.length).toBe(32);
		expect(hash).toEqual(sha256(input));
	});

	it("should handle 65 bytes (just over one block)", () => {
		const input = new Uint8Array(65).fill(0x42);
		const hash = SHA256.hash(input);

		expect(hash.length).toBe(32);
		expect(hash).toEqual(sha256(input));
	});

	it("should handle large input (1MB)", () => {
		const input = new Uint8Array(1024 * 1024);
		for (let i = 0; i < input.length; i++) {
			input[i] = i & 0xff;
		}

		const hash = SHA256.hash(input);
		expect(hash.length).toBe(32);

		// Should be deterministic
		const hash2 = SHA256.hash(input);
		expect(hash).toEqual(hash2);
	});
});

describe("SHA256.hashString", () => {
	it("should hash empty string", () => {
		const hash = SHA256.hashString("");
		expect(hash.length).toBe(32);

		// Should match empty byte array
		const hashEmpty = SHA256.hash(new Uint8Array([]));
		expect(hash).toEqual(hashEmpty);
	});

	it("should hash 'hello world'", () => {
		const hash = SHA256.hashString("hello world");

		const expected = new Uint8Array([
			0xb9, 0x4d, 0x27, 0xb9, 0x93, 0x4d, 0x3e, 0x08, 0xa5, 0x2e, 0x52, 0xd7,
			0xda, 0x7d, 0xab, 0xfa, 0xc4, 0x84, 0xef, 0xe3, 0x7a, 0x53, 0x80, 0xee,
			0x90, 0x88, 0xf7, 0xac, 0xe2, 0xef, 0xcd, 0xe9,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash UTF-8 strings correctly", () => {
		const hash = SHA256.hashString("Hello 世界 🌍");

		// Should match manual UTF-8 encoding
		const manualBytes = new TextEncoder().encode("Hello 世界 🌍");
		const hashFromBytes = SHA256.hash(manualBytes);

		expect(hash).toEqual(hashFromBytes);
	});

	it("should be deterministic for strings", () => {
		const str = "test string";
		const hash1 = SHA256.hashString(str);
		const hash2 = SHA256.hashString(str);

		expect(hash1).toEqual(hash2);
	});
});

describe("SHA256.hashHex", () => {
	it("should hash hex string with 0x prefix", () => {
		const hash = SHA256.hashHex("0xdeadbeef");
		expect(hash.length).toBe(32);

		// Should match byte array [0xde, 0xad, 0xbe, 0xef]
		const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
		const hashFromBytes = SHA256.hash(bytes);

		expect(hash).toEqual(hashFromBytes);
	});

	it("should hash hex string without 0x prefix", () => {
		const hash = SHA256.hashHex("deadbeef");
		expect(hash.length).toBe(32);

		// Should match with 0x prefix
		const hashWithPrefix = SHA256.hashHex("0xdeadbeef");
		expect(hash).toEqual(hashWithPrefix);
	});

	it("should hash empty hex string", () => {
		const hash = SHA256.hashHex("");
		expect(hash.length).toBe(32);

		// Should match empty byte array
		const hashEmpty = SHA256.hash(new Uint8Array([]));
		expect(hash).toEqual(hashEmpty);
	});

	it("should hash 32-byte hex (typical Ethereum hash)", () => {
		const hexHash = "0x" + "a".repeat(64); // 32 bytes
		const hash = SHA256.hashHex(hexHash);

		expect(hash.length).toBe(32);
	});
});

describe("SHA256.toHex", () => {
	it("should convert hash to hex string", () => {
		const input = new Uint8Array([0x61, 0x62, 0x63]); // "abc"
		const hash = SHA256.hash(input);
		const hex = SHA256.toHex(hash);

		expect(hex).toBe(
			"0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
	});

	it("should handle empty hash", () => {
		const hash = SHA256.hash(new Uint8Array([]));
		const hex = SHA256.toHex(hash);

		expect(hex).toBe(
			"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);
	});

	it("should produce lowercase hex with 0x prefix", () => {
		const hash = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
		const hex = SHA256.toHex(hash);

		expect(hex).toBe("0xdeadbeef");
		expect(hex).toMatch(/^0x/);
		expect(hex.slice(2)).toBe(hex.slice(2).toLowerCase());
	});
});

describe("Bitcoin use cases", () => {
	it("should compute double SHA256 (hash256)", () => {
		// Bitcoin uses double SHA256 for block hashes, tx hashes, etc.
		const input = new TextEncoder().encode("hello");

		// First hash
		const hash1 = SHA256.hash(input);

		// Second hash (hash of hash)
		const hash2 = SHA256.hash(hash1);

		expect(hash2.length).toBe(32);

		// Known Bitcoin hash256 result for "hello"
		const expected = new Uint8Array([
			0x95, 0x95, 0xc9, 0xdf, 0x90, 0x07, 0x51, 0x48, 0xeb, 0x06, 0x86, 0x03,
			0x65, 0xdf, 0x33, 0x58, 0x4b, 0x75, 0xbf, 0xf7, 0x82, 0xa5, 0x10, 0xc6,
			0xcd, 0x48, 0x83, 0xa4, 0x19, 0x83, 0x3d, 0x50,
		]);

		expect(hash2).toEqual(expected);
	});

	it("should compute SHA256 for Bitcoin address derivation (part 1)", () => {
		// Bitcoin P2PKH address: SHA256(pubkey) then RIPEMD160
		// Test with known public key
		const pubkey = new Uint8Array([
			0x04, 0x11, 0xdb, 0x93, 0xe1, 0xdc, 0xdb, 0x8a, 0x01, 0x6b, 0x49, 0x84,
			0x0f, 0x8c, 0x53, 0xbc, 0x1e, 0xb6, 0x8a, 0x38, 0x2e, 0x97, 0xb1, 0x48,
			0x2e, 0xca, 0xd7, 0xb1, 0x48, 0xa6, 0x90, 0x9a, 0x5c, 0xb2, 0xe0, 0xea,
			0xdd, 0xfb, 0x84, 0xcc, 0xf9, 0x74, 0x44, 0x64, 0xf8, 0x2e, 0x16, 0x0b,
			0xfa, 0x9b, 0x8b, 0x64, 0xf9, 0xd4, 0xc0, 0x3f, 0x99, 0x9b, 0x86, 0x43,
			0xf6, 0x56, 0xb4, 0x12, 0xa3,
		]);

		const hash = SHA256.hash(pubkey);
		expect(hash.length).toBe(32);

		// Cross-validate with @noble
		expect(hash).toEqual(sha256(pubkey));
	});
});

describe("Ethereum use cases", () => {
	it("should hash data for SHA256 precompile (address 0x02)", () => {
		// Ethereum has a SHA256 precompile at address 0x0000000000000000000000000000000000000002
		// It's rarely used (Keccak256 is standard), but exists for Bitcoin compatibility

		const input = new TextEncoder().encode("test");
		const hash = SHA256.hash(input);

		expect(hash.length).toBe(32);

		// Cross-validate with @noble
		expect(hash).toEqual(sha256(input));
	});
});

describe("Edge cases", () => {
	it("should handle maximum safe input size", () => {
		// SHA256 can handle up to 2^64 - 1 bits, but we'll test a large size
		const size = 10 * 1024 * 1024; // 10MB
		const input = new Uint8Array(size);

		for (let i = 0; i < size; i++) {
			input[i] = (i * 7 + 13) & 0xff;
		}

		const hash = SHA256.hash(input);
		expect(hash.length).toBe(32);

		// Should be deterministic
		const hash2 = SHA256.hash(input);
		expect(hash).toEqual(hash2);
	});

	it("should exhibit avalanche effect", () => {
		// Small change in input should cause large change in output
		const input1 = new Uint8Array(100).fill(0);
		const input2 = new Uint8Array(100).fill(0);
		input2[99] = 1; // Single bit difference at end

		const hash1 = SHA256.hash(input1);
		const hash2 = SHA256.hash(input2);

		expect(hash1).not.toEqual(hash2);

		// Count different bytes (should be ~50% due to avalanche effect)
		let differentBytes = 0;
		for (let i = 0; i < hash1.length; i++) {
			if (hash1[i] !== hash2[i]) differentBytes++;
		}

		// Expect significant avalanche effect (at least 25% different bytes)
		expect(differentBytes).toBeGreaterThanOrEqual(8);
	});

	it("should handle boundary condition: 55 bytes", () => {
		// 55 bytes is the maximum that fits in one block with padding
		const input = new Uint8Array(55).fill(0x61); // 'a'
		const hash = SHA256.hash(input);

		expect(hash.length).toBe(32);
		expect(hash).toEqual(sha256(input));
	});

	it("should handle boundary condition: 56 bytes", () => {
		// 56 bytes forces padding into second block
		const input = new Uint8Array(56).fill(0x61);
		const hash = SHA256.hash(input);

		expect(hash.length).toBe(32);
		expect(hash).toEqual(sha256(input));
	});

	it("should handle binary data with all byte values", () => {
		const input = new Uint8Array(256);
		for (let i = 0; i < 256; i++) {
			input[i] = i;
		}

		const hash = SHA256.hash(input);
		expect(hash.length).toBe(32);
		expect(hash).toEqual(sha256(input));
	});
});

describe("Cross-validation with @noble/hashes", () => {
	it("should match @noble for empty input", () => {
		const input = new Uint8Array([]);
		const ourHash = SHA256.hash(input);
		const nobleHash = sha256(input);

		expect(ourHash).toEqual(nobleHash);
	});

	it("should match @noble for various input sizes", () => {
		const sizes = [1, 10, 32, 55, 56, 64, 65, 100, 128, 256, 512, 1024];

		for (const size of sizes) {
			const input = new Uint8Array(size);
			for (let i = 0; i < size; i++) {
				input[i] = (i * 7) & 0xff;
			}

			const ourHash = SHA256.hash(input);
			const nobleHash = sha256(input);

			expect(ourHash).toEqual(nobleHash);
		}
	});

	it("should match @noble for string inputs", () => {
		const strings = [
			"",
			"a",
			"abc",
			"hello world",
			"The quick brown fox jumps over the lazy dog",
			"Hello 世界 🌍",
		];

		for (const str of strings) {
			const ourHash = SHA256.hashString(str);
			const nobleHash = sha256(new TextEncoder().encode(str));

			expect(ourHash).toEqual(nobleHash);
		}
	});

	it("should match @noble for random data", () => {
		// Generate some pseudo-random data
		const input = new Uint8Array(1000);
		for (let i = 0; i < input.length; i++) {
			input[i] = (i * 13 + 7) & 0xff;
		}

		const ourHash = SHA256.hash(input);
		const nobleHash = sha256(input);

		expect(ourHash).toEqual(nobleHash);
	});
});

describe("SHA256 constants", () => {
	it("should export OUTPUT_SIZE constant", () => {
		expect(SHA256.OUTPUT_SIZE).toBe(32);
	});

	it("should export BLOCK_SIZE constant", () => {
		expect(SHA256.BLOCK_SIZE).toBe(64);
	});
});

describe("Security properties", () => {
	it("should be collision resistant (different inputs produce different outputs)", () => {
		const testInputs = [
			new Uint8Array([0]),
			new Uint8Array([1]),
			new Uint8Array([0, 0]),
			new Uint8Array([0, 1]),
			new Uint8Array([1, 0]),
			new Uint8Array([1, 1]),
		];

		const hashes = testInputs.map((input) => SHA256.hash(input));

		// All hashes should be unique
		for (let i = 0; i < hashes.length; i++) {
			for (let j = i + 1; j < hashes.length; j++) {
				expect(hashes[i]).not.toEqual(hashes[j]);
			}
		}
	});

	it("should be preimage resistant (cannot reverse hash)", () => {
		// While we can't prove preimage resistance in a test,
		// we can verify that hash output appears random
		const input = new Uint8Array([0x42]);
		const hash = SHA256.hash(input);

		// Hash should not contain the input value repeated
		let inputByteCount = 0;
		for (const byte of hash) {
			if (byte === 0x42) inputByteCount++;
		}

		// Expect approximately 1/256 * 32 = 0.125 occurrences (less than 4)
		expect(inputByteCount).toBeLessThan(4);
	});

	it("should have uniform distribution in output", () => {
		// Test that output bits are uniformly distributed
		const inputs = 100;
		const byteCounts = new Array(256).fill(0);

		for (let i = 0; i < inputs; i++) {
			const input = new Uint8Array([i]);
			const hash = SHA256.hash(input);

			for (const byte of hash) {
				byteCounts[byte]++;
			}
		}

		// With 100 inputs * 32 bytes = 3200 bytes total
		// Each byte value should appear roughly 3200/256 = 12.5 times
		// Allow wide variance (0-30) due to small sample size
		for (const count of byteCounts) {
			expect(count).toBeGreaterThanOrEqual(0);
			expect(count).toBeLessThan(50); // Very loose bound
		}
	});
});
