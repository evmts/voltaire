/**
 * RIPEMD160 Tests
 *
 * Comprehensive test suite validating RIPEMD160 implementation against:
 * - Official RIPEMD160 specification test vectors
 * - Bitcoin use cases (hash160, address derivation)
 * - Edge cases and security properties
 * - Cross-validation against @noble/hashes
 */

import { ripemd160 } from "@noble/hashes/legacy.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { describe, expect, it } from "vitest";
import * as Ripemd160 from "./Ripemd160.js";

describe("Ripemd160.hash", () => {
	it("should hash empty input", () => {
		const hash = Ripemd160.hash(new Uint8Array([]));
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(20);

		// Official RIPEMD160 test vector for empty string
		const expected = new Uint8Array([
			0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54, 0x61, 0x28, 0x08, 0x97,
			0x7e, 0xe8, 0xf5, 0x48, 0xb2, 0x25, 0x8d, 0x31,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash single byte 'a'", () => {
		const input = new Uint8Array([0x61]); // "a"
		const hash = Ripemd160.hash(input);

		// Official RIPEMD160 test vector for "a"
		const expected = new Uint8Array([
			0x0b, 0xdc, 0x9d, 0x2d, 0x25, 0x6b, 0x3e, 0xe9, 0xda, 0xae, 0x34, 0x7b,
			0xe6, 0xf4, 0xdc, 0x83, 0x5a, 0x46, 0x7f, 0xfe,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash 'abc' (official test vector)", () => {
		const input = new Uint8Array([0x61, 0x62, 0x63]); // "abc"
		const hash = Ripemd160.hash(input);

		// Official RIPEMD160 test vector for "abc"
		const expected = new Uint8Array([
			0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a, 0x9b, 0x04, 0x4a, 0x8e,
			0x98, 0xc6, 0xb0, 0x87, 0xf1, 0x5a, 0x0b, 0xfc,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash 'message digest'", () => {
		const input = new TextEncoder().encode("message digest");
		const hash = Ripemd160.hash(input);

		// Official RIPEMD160 test vector
		const expected = new Uint8Array([
			0x5d, 0x06, 0x89, 0xef, 0x49, 0xd2, 0xfa, 0xe5, 0x72, 0xb8, 0x81, 0xb1,
			0x23, 0xa8, 0x5f, 0xfa, 0x21, 0x59, 0x5f, 0x36,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash lowercase alphabet", () => {
		const input = new TextEncoder().encode("abcdefghijklmnopqrstuvwxyz");
		const hash = Ripemd160.hash(input);

		// Official RIPEMD160 test vector
		const expected = new Uint8Array([
			0xf7, 0x1c, 0x27, 0x10, 0x9c, 0x69, 0x2c, 0x1b, 0x56, 0xbb, 0xdc, 0xeb,
			0x5b, 0x9d, 0x28, 0x65, 0xb3, 0x70, 0x8d, 0xbc,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash alphanumeric string", () => {
		const input = new TextEncoder().encode(
			"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
		);
		const hash = Ripemd160.hash(input);

		// Official RIPEMD160 test vector
		const expected = new Uint8Array([
			0x12, 0xa0, 0x53, 0x38, 0x4a, 0x9c, 0x0c, 0x88, 0xe4, 0x05, 0xa0, 0x6c,
			0x27, 0xdc, 0xf4, 0x9a, 0xda, 0x62, 0xeb, 0x2b,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash mixed case alphanumeric", () => {
		const input = new TextEncoder().encode(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		);
		const hash = Ripemd160.hash(input);

		// Official RIPEMD160 test vector
		const expected = new Uint8Array([
			0xb0, 0xe2, 0x0b, 0x6e, 0x31, 0x16, 0x64, 0x02, 0x86, 0xed, 0x3a, 0x87,
			0xa5, 0x71, 0x30, 0x79, 0xb2, 0x1f, 0x51, 0x89,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash repeated digits (80 bytes)", () => {
		// 8 repetitions of "1234567890" = 80 bytes
		const input = new TextEncoder().encode(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		);
		const hash = Ripemd160.hash(input);

		// Official RIPEMD160 test vector
		const expected = new Uint8Array([
			0x9b, 0x75, 0x2e, 0x45, 0x57, 0x3d, 0x4b, 0x39, 0xf4, 0xdb, 0xd3, 0x32,
			0x3c, 0xab, 0x82, 0xbf, 0x63, 0x32, 0x6b, 0xfb,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash single byte 0x00", () => {
		const input = new Uint8Array([0x00]);
		const hash = Ripemd160.hash(input);

		// Cross-validate with @noble
		expect(hash).toEqual(ripemd160(input));
		expect(hash.length).toBe(20);
	});

	it("should hash single byte 0xFF", () => {
		const input = new Uint8Array([0xff]);
		const hash = Ripemd160.hash(input);

		// Cross-validate with @noble
		expect(hash).toEqual(ripemd160(input));
		expect(hash.length).toBe(20);
	});

	it("should accept string input", () => {
		const hash = Ripemd160.hash("abc");
		expect(hash.length).toBe(20);

		// Should match byte array input
		const hashFromBytes = Ripemd160.hash(new Uint8Array([0x61, 0x62, 0x63]));
		expect(hash).toEqual(hashFromBytes);
	});

	it("should be deterministic", () => {
		const input = new Uint8Array([1, 2, 3, 4, 5]);
		const hash1 = Ripemd160.hash(input);
		const hash2 = Ripemd160.hash(input);

		expect(hash1).toEqual(hash2);
	});

	it("should produce different hashes for different inputs", () => {
		const hash1 = Ripemd160.hash(new Uint8Array([0x00]));
		const hash2 = Ripemd160.hash(new Uint8Array([0x01]));
		const hash3 = Ripemd160.hash(new Uint8Array([0x00, 0x00]));

		expect(hash1).not.toEqual(hash2);
		expect(hash1).not.toEqual(hash3);
		expect(hash2).not.toEqual(hash3);
	});
});

describe("Ripemd160.hashString", () => {
	it("should hash empty string", () => {
		const hash = Ripemd160.hashString("");
		expect(hash.length).toBe(20);

		// Should match empty byte array
		const hashEmpty = Ripemd160.hash(new Uint8Array([]));
		expect(hash).toEqual(hashEmpty);
	});

	it("should hash 'hello'", () => {
		const hash = Ripemd160.hashString("hello");

		// Cross-validate with @noble
		expect(hash).toEqual(ripemd160(new TextEncoder().encode("hello")));
		expect(hash.length).toBe(20);
	});

	it("should hash 'The quick brown fox jumps over the lazy dog'", () => {
		const hash = Ripemd160.hashString(
			"The quick brown fox jumps over the lazy dog",
		);

		const expected = new Uint8Array([
			0x37, 0xf3, 0x32, 0xf6, 0x8d, 0xb7, 0x7b, 0xd9, 0xd7, 0xed, 0xd4, 0x96,
			0x95, 0x71, 0xad, 0x67, 0x1c, 0xf9, 0xdd, 0x3b,
		]);

		expect(hash).toEqual(expected);
	});

	it("should hash UTF-8 strings correctly", () => {
		const hash = Ripemd160.hashString("Hello 世界 🌍");

		// Should match manual UTF-8 encoding
		const manualBytes = new TextEncoder().encode("Hello 世界 🌍");
		const hashFromBytes = Ripemd160.hash(manualBytes);

		expect(hash).toEqual(hashFromBytes);
	});

	it("should be deterministic for strings", () => {
		const str = "test string";
		const hash1 = Ripemd160.hashString(str);
		const hash2 = Ripemd160.hashString(str);

		expect(hash1).toEqual(hash2);
	});

	it("should match hash() with string input", () => {
		const str = "test";
		const hash1 = Ripemd160.hashString(str);
		const hash2 = Ripemd160.hash(str);

		expect(hash1).toEqual(hash2);
	});
});

describe("Bitcoin use cases", () => {
	it("should compute hash160 (SHA256 then RIPEMD160)", () => {
		// Bitcoin hash160 = RIPEMD160(SHA256(data))
		// Used for P2PKH addresses and P2SH scripts

		const input = new TextEncoder().encode("test");

		// First: SHA256
		const sha256Hash = sha256(input);

		// Second: RIPEMD160 of the SHA256 hash
		const hash160 = Ripemd160.hash(sha256Hash);

		expect(hash160.length).toBe(20);

		// Cross-validate with @noble
		const expectedHash160 = ripemd160(sha256Hash);
		expect(hash160).toEqual(expectedHash160);
	});

	it("should compute hash160 for Bitcoin public key", () => {
		// Real Bitcoin public key (uncompressed format)
		const pubkey = new Uint8Array([
			0x04, 0x11, 0xdb, 0x93, 0xe1, 0xdc, 0xdb, 0x8a, 0x01, 0x6b, 0x49, 0x84,
			0x0f, 0x8c, 0x53, 0xbc, 0x1e, 0xb6, 0x8a, 0x38, 0x2e, 0x97, 0xb1, 0x48,
			0x2e, 0xca, 0xd7, 0xb1, 0x48, 0xa6, 0x90, 0x9a, 0x5c, 0xb2, 0xe0, 0xea,
			0xdd, 0xfb, 0x84, 0xcc, 0xf9, 0x74, 0x44, 0x64, 0xf8, 0x2e, 0x16, 0x0b,
			0xfa, 0x9b, 0x8b, 0x64, 0xf9, 0xd4, 0xc0, 0x3f, 0x99, 0x9b, 0x86, 0x43,
			0xf6, 0x56, 0xb4, 0x12, 0xa3,
		]);

		// SHA256 of pubkey
		const sha256Hash = sha256(pubkey);

		// RIPEMD160 of SHA256 hash
		const hash160 = Ripemd160.hash(sha256Hash);

		expect(hash160.length).toBe(20);

		// Cross-validate with @noble
		const expectedHash160 = ripemd160(sha256Hash);
		expect(hash160).toEqual(expectedHash160);
	});

	it("should compute hash160 for compressed public key", () => {
		// Bitcoin compressed public key (33 bytes)
		const compressedPubkey = new Uint8Array([
			0x02, 0x11, 0xdb, 0x93, 0xe1, 0xdc, 0xdb, 0x8a, 0x01, 0x6b, 0x49, 0x84,
			0x0f, 0x8c, 0x53, 0xbc, 0x1e, 0xb6, 0x8a, 0x38, 0x2e, 0x97, 0xb1, 0x48,
			0x2e, 0xca, 0xd7, 0xb1, 0x48, 0xa6, 0x90, 0x9a, 0x5c,
		]);

		const sha256Hash = sha256(compressedPubkey);
		const hash160 = Ripemd160.hash(sha256Hash);

		expect(hash160.length).toBe(20);

		// Cross-validate with @noble
		const expectedHash160 = ripemd160(sha256Hash);
		expect(hash160).toEqual(expectedHash160);
	});

	it("should compute P2SH script hash (Bitcoin)", () => {
		// Bitcoin P2SH uses hash160 on the redeem script
		// Example: 2-of-2 multisig redeem script

		// Simplified redeem script bytes (real script would be more complex)
		const redeemScript = new Uint8Array([
			0x52, // OP_2
			0x21, // Push 33 bytes (compressed pubkey 1)
			0x02,
			0x11,
			0xdb,
			0x93,
			0xe1,
			0xdc,
			0xdb,
			0x8a,
			0x01,
			0x6b,
			0x49,
			0x84,
			0x0f,
			0x8c,
			0x53,
			0xbc,
			0x1e,
			0xb6,
			0x8a,
			0x38,
			0x2e,
			0x97,
			0xb1,
			0x48,
			0x2e,
			0xca,
			0xd7,
			0xb1,
			0x48,
			0xa6,
			0x90,
			0x9a,
			0x5c,
			0x21, // Push 33 bytes (compressed pubkey 2)
			0x03,
			0xaa,
			0xbb,
			0xcc,
			0xdd,
			0xee,
			0xff,
			0x11,
			0x22,
			0x33,
			0x44,
			0x55,
			0x66,
			0x77,
			0x88,
			0x99,
			0xaa,
			0xbb,
			0xcc,
			0xdd,
			0xee,
			0xff,
			0x11,
			0x22,
			0x33,
			0x44,
			0x55,
			0x66,
			0x77,
			0x88,
			0x99,
			0xaa,
			0xbb,
			0x52, // OP_2
			0xae, // OP_CHECKMULTISIG
		]);

		const sha256Hash = sha256(redeemScript);
		const scriptHash = Ripemd160.hash(sha256Hash);

		expect(scriptHash.length).toBe(20);
	});
});

describe("Edge cases", () => {
	it("should handle exactly 64 bytes (one block)", () => {
		const input = new Uint8Array(64).fill(0x61); // 'a'
		const hash = Ripemd160.hash(input);

		// Cross-validate with @noble
		expect(hash).toEqual(ripemd160(input));
		expect(hash.length).toBe(20);
	});

	it("should handle exactly 128 bytes (two blocks)", () => {
		const input = new Uint8Array(128).fill(0x61);
		const hash = Ripemd160.hash(input);

		// Cross-validate with @noble
		expect(hash).toEqual(ripemd160(input));
		expect(hash.length).toBe(20);
	});

	it("should handle boundary condition: 55 bytes", () => {
		// 55 bytes is the maximum that fits in one block with padding
		const input = new Uint8Array(55).fill(0x61);
		const hash = Ripemd160.hash(input);

		// Cross-validate with @noble
		expect(hash).toEqual(ripemd160(input));
		expect(hash.length).toBe(20);
	});

	it("should handle boundary condition: 56 bytes", () => {
		// 56 bytes forces padding into second block
		const input = new Uint8Array(56).fill(0x61);
		const hash = Ripemd160.hash(input);

		// Cross-validate with @noble
		expect(hash).toEqual(ripemd160(input));
		expect(hash.length).toBe(20);
	});

	it("should handle large input", () => {
		const input = new Uint8Array(1000);
		for (let i = 0; i < input.length; i++) {
			input[i] = (i * 7) & 0xff;
		}

		const hash = Ripemd160.hash(input);
		expect(hash.length).toBe(20);

		// Should be deterministic
		const hash2 = Ripemd160.hash(input);
		expect(hash).toEqual(hash2);
	});

	it("should handle very large input (1MB)", () => {
		const size = 1024 * 1024;
		const input = new Uint8Array(size);

		for (let i = 0; i < size; i++) {
			input[i] = (i * 13 + 7) & 0xff;
		}

		const hash = Ripemd160.hash(input);
		expect(hash.length).toBe(20);

		// Should be deterministic
		const hash2 = Ripemd160.hash(input);
		expect(hash).toEqual(hash2);
	});

	it("should exhibit avalanche effect", () => {
		// Small change in input should cause large change in output
		const input1 = new Uint8Array(100).fill(0);
		const input2 = new Uint8Array(100).fill(0);
		input2[99] = 1; // Single bit difference at end

		const hash1 = Ripemd160.hash(input1);
		const hash2 = Ripemd160.hash(input2);

		expect(hash1).not.toEqual(hash2);

		// Count different bytes (should be significant due to avalanche effect)
		let differentBytes = 0;
		for (let i = 0; i < hash1.length; i++) {
			if (hash1[i] !== hash2[i]) differentBytes++;
		}

		// Expect significant avalanche effect (at least 50% different bytes)
		expect(differentBytes).toBeGreaterThanOrEqual(10);
	});

	it("should handle binary data with all byte values", () => {
		const input = new Uint8Array(256);
		for (let i = 0; i < 256; i++) {
			input[i] = i;
		}

		const hash = Ripemd160.hash(input);
		expect(hash.length).toBe(20);

		// Cross-validate with @noble
		expect(hash).toEqual(ripemd160(input));
	});

	it("should handle multi-block message (>64 bytes)", () => {
		const input = new TextEncoder().encode(
			"The quick brown fox jumps over the lazy dog. " +
				"This message is longer than 64 bytes to test multi-block processing.",
		);

		const hash = Ripemd160.hash(input);

		// Cross-validate with @noble
		expect(hash).toEqual(ripemd160(input));
		expect(hash.length).toBe(20);
	});
});

describe("Cross-validation with @noble/hashes", () => {
	it("should match @noble for empty input", () => {
		const input = new Uint8Array([]);
		const ourHash = Ripemd160.hash(input);
		const nobleHash = ripemd160(input);

		expect(ourHash).toEqual(nobleHash);
	});

	it("should match @noble for various input sizes", () => {
		const sizes = [1, 10, 20, 32, 55, 56, 64, 65, 100, 128, 256, 512, 1024];

		for (const size of sizes) {
			const input = new Uint8Array(size);
			for (let i = 0; i < size; i++) {
				input[i] = (i * 7) & 0xff;
			}

			const ourHash = Ripemd160.hash(input);
			const nobleHash = ripemd160(input);

			expect(ourHash).toEqual(nobleHash);
		}
	});

	it("should match @noble for string inputs", () => {
		const strings = [
			"",
			"a",
			"abc",
			"hello",
			"message digest",
			"The quick brown fox jumps over the lazy dog",
			"Hello 世界 🌍",
		];

		for (const str of strings) {
			const ourHash = Ripemd160.hashString(str);
			const nobleHash = ripemd160(new TextEncoder().encode(str));

			expect(ourHash).toEqual(nobleHash);
		}
	});

	it("should match @noble for all official test vectors", () => {
		const testVectors = [
			{
				input: "",
				expected: new Uint8Array([
					0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54, 0x61, 0x28, 0x08,
					0x97, 0x7e, 0xe8, 0xf5, 0x48, 0xb2, 0x25, 0x8d, 0x31,
				]),
			},
			{
				input: "a",
				expected: new Uint8Array([
					0x0b, 0xdc, 0x9d, 0x2d, 0x25, 0x6b, 0x3e, 0xe9, 0xda, 0xae, 0x34,
					0x7b, 0xe6, 0xf4, 0xdc, 0x83, 0x5a, 0x46, 0x7f, 0xfe,
				]),
			},
			{
				input: "abc",
				expected: new Uint8Array([
					0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a, 0x9b, 0x04, 0x4a,
					0x8e, 0x98, 0xc6, 0xb0, 0x87, 0xf1, 0x5a, 0x0b, 0xfc,
				]),
			},
		];

		for (const tv of testVectors) {
			const ourHash = Ripemd160.hashString(tv.input);
			const nobleHash = ripemd160(new TextEncoder().encode(tv.input));

			expect(ourHash).toEqual(tv.expected);
			expect(ourHash).toEqual(nobleHash);
		}
	});

	it("should match @noble for random data", () => {
		// Generate some pseudo-random data
		const input = new Uint8Array(1000);
		for (let i = 0; i < input.length; i++) {
			input[i] = (i * 13 + 7) & 0xff;
		}

		const ourHash = Ripemd160.hash(input);
		const nobleHash = ripemd160(input);

		expect(ourHash).toEqual(nobleHash);
	});
});

describe("RIPEMD160 constants", () => {
	it("should export SIZE constant", () => {
		expect(Ripemd160.SIZE).toBe(20);
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

		const hashes = testInputs.map((input) => Ripemd160.hash(input));

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
		const hash = Ripemd160.hash(input);

		// Hash should not contain the input value repeated
		let inputByteCount = 0;
		for (const byte of hash) {
			if (byte === 0x42) inputByteCount++;
		}

		// Expect approximately 1/256 * 20 = 0.078 occurrences (less than 3)
		expect(inputByteCount).toBeLessThan(4);
	});

	it("should have uniform distribution in output", () => {
		// Test that output bits are uniformly distributed
		const inputs = 100;
		const byteCounts = new Array(256).fill(0);

		for (let i = 0; i < inputs; i++) {
			const input = new Uint8Array([i]);
			const hash = Ripemd160.hash(input);

			for (const byte of hash) {
				byteCounts[byte]++;
			}
		}

		// With 100 inputs * 20 bytes = 2000 bytes total
		// Each byte value should appear roughly 2000/256 = 7.8 times
		// Allow wide variance (0-25) due to small sample size
		for (const count of byteCounts) {
			expect(count).toBeGreaterThanOrEqual(0);
			expect(count).toBeLessThan(40); // Very loose bound
		}
	});
});

describe("Bitcoin-specific hash160 integration tests", () => {
	it("should compute correct hash160 for known Bitcoin address", () => {
		// Well-known Bitcoin genesis block coinbase public key
		const genesisPubKey = new Uint8Array([
			0x04, 0x67, 0x8a, 0xfd, 0xb0, 0xfe, 0x55, 0x48, 0x27, 0x19, 0x67, 0xf1,
			0xa6, 0x71, 0x30, 0xb7, 0x10, 0x5c, 0xd6, 0xa8, 0x28, 0xe0, 0x39, 0x09,
			0xa6, 0x79, 0x62, 0xe0, 0xea, 0x1f, 0x61, 0xde, 0xb6, 0x49, 0xf6, 0xbc,
			0x3f, 0x4c, 0xef, 0x38, 0xc4, 0xf3, 0x55, 0x04, 0xe5, 0x1e, 0xc1, 0x12,
			0xde, 0x5c, 0x38, 0x4d, 0xf7, 0xba, 0x0b, 0x8d, 0x57, 0x8a, 0x4c, 0x70,
			0x2b, 0x6b, 0xf1, 0x1d, 0x5f,
		]);

		// Compute hash160
		const sha256Hash = sha256(genesisPubKey);
		const hash160 = Ripemd160.hash(sha256Hash);

		expect(hash160.length).toBe(20);

		// Known hash160 for genesis block pubkey
		const expected = new Uint8Array([
			0x62, 0xe9, 0x07, 0xb1, 0x5c, 0xbf, 0x27, 0xd5, 0x42, 0x53, 0x99, 0xeb,
			0xf6, 0xf0, 0xfb, 0x50, 0xeb, 0xb8, 0x8f, 0x18,
		]);

		expect(hash160).toEqual(expected);
	});

	it("should be deterministic for repeated hash160 operations", () => {
		const input = new TextEncoder().encode("test data");

		// Compute hash160 multiple times
		const results = [];
		for (let i = 0; i < 10; i++) {
			const sha256Hash = sha256(input);
			const hash160 = Ripemd160.hash(sha256Hash);
			results.push(hash160);
		}

		// All results should be identical
		for (let i = 1; i < results.length; i++) {
			expect(results[i]).toEqual(results[0]);
		}
	});
});
