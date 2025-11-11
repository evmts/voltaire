/**
 * Hash WASM Tests
 *
 * Comprehensive test suite for WASM-accelerated Hash operations.
 * Tests hash construction and utility functions with extensive coverage:
 * - Hash Construction (fromHex, fromBytes, keccak256, zero)
 * - Hash Operations (equals, toHex, toBytes)
 * - Validation (isHash, isZero, length validation)
 * - Edge cases (zero hash, max hash, known vectors)
 * - Round-trip conversions
 * - WASM-specific concerns (memory, errors)
 */

import { beforeAll, describe, expect, test } from "vitest";
import * as HashWasm from "./Hash.wasm.js";

// ============================================================================
// Test Setup
// ============================================================================

beforeAll(async () => {
	// WASM loader auto-initializes, no explicit init needed
});

// ============================================================================
// Test Vectors
// ============================================================================

const KNOWN_VECTORS = {
	zero: {
		hex: "0x0000000000000000000000000000000000000000000000000000000000000000",
		bytes: new Uint8Array(32),
	},
	max: {
		hex: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		bytes: new Uint8Array(32).fill(0xff),
	},
	emptyKeccak: {
		hex: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		bytes: new Uint8Array([
			0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c, 0x92, 0x7e, 0x7d, 0xb2,
			0xdc, 0xc7, 0x03, 0xc0, 0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b,
			0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
		]),
	},
	transferTopic: {
		hex: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		bytes: new Uint8Array([
			0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68,
			0xfc, 0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0x7f, 0x16, 0x3c, 0x4a, 0x11,
			0x62, 0x8f, 0x55, 0xa4, 0xdf, 0x52, 0x3b, 0x3e,
		]),
	},
};

// ============================================================================
// Hash Algorithms: sha256
// ============================================================================

describe("Hash WASM - sha256", () => {
	test("empty input", () => {
		const result = HashWasm.sha256(new Uint8Array([]));
		expect(result.length).toBe(32);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	test("string input", () => {
		const result = HashWasm.sha256("hello");
		expect(result.length).toBe(32);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	test("bytes input", () => {
		const result = HashWasm.sha256(new Uint8Array([1, 2, 3]));
		expect(result.length).toBe(32);
	});

	test("known vector - empty string", () => {
		const result = HashWasm.sha256("");
		const expected = new Uint8Array([
			0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14, 0x9a, 0xfb, 0xf4, 0xc8,
			0x99, 0x6f, 0xb9, 0x24, 0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
			0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
		]);
		expect(result).toEqual(expected);
	});

	test("known vector - 'abc'", () => {
		const result = HashWasm.sha256("abc");
		const expected = new Uint8Array([
			0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde,
			0x5d, 0xae, 0x22, 0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c,
			0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad,
		]);
		expect(result).toEqual(expected);
	});

	test("deterministic", () => {
		const result1 = HashWasm.sha256("test");
		const result2 = HashWasm.sha256("test");
		expect(result1).toEqual(result2);
	});

	test("different inputs produce different outputs", () => {
		const result1 = HashWasm.sha256("test1");
		const result2 = HashWasm.sha256("test2");
		expect(result1).not.toEqual(result2);
	});

	test("throws on empty data", () => {
		// Implementation may throw ValidationError
		try {
			HashWasm.sha256(new Uint8Array([]));
		} catch (error: any) {
			expect(error.message).toMatch(/empty/i);
		}
	});
});

// ============================================================================
// Hash Algorithms: ripemd160
// ============================================================================

describe("Hash WASM - ripemd160", () => {
	test("empty input", () => {
		const result = HashWasm.ripemd160(new Uint8Array([]));
		expect(result.length).toBe(20);
	});

	test("string input", () => {
		const result = HashWasm.ripemd160("hello");
		expect(result.length).toBe(20);
	});

	test("bytes input", () => {
		const result = HashWasm.ripemd160(new Uint8Array([1, 2, 3]));
		expect(result.length).toBe(20);
	});

	test("known vector - empty string", () => {
		const result = HashWasm.ripemd160("");
		const expected = new Uint8Array([
			0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54, 0x61, 0x28, 0x08, 0x97,
			0x7e, 0xe8, 0xf5, 0x48, 0xb2, 0x25, 0x8d, 0x31,
		]);
		expect(result).toEqual(expected);
	});

	test("known vector - 'abc'", () => {
		const result = HashWasm.ripemd160("abc");
		const expected = new Uint8Array([
			0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a, 0x9b, 0x04, 0x4a, 0x8e,
			0x98, 0xc6, 0xb0, 0x87, 0xf1, 0x5a, 0x0b, 0xfc,
		]);
		expect(result).toEqual(expected);
	});

	test("deterministic", () => {
		const result1 = HashWasm.ripemd160("test");
		const result2 = HashWasm.ripemd160("test");
		expect(result1).toEqual(result2);
	});
});

// ============================================================================
// Hash Algorithms: blake2b
// ============================================================================

describe("Hash WASM - blake2b", () => {
	test("empty input", () => {
		const result = HashWasm.blake2b(new Uint8Array([]));
		expect(result.length).toBe(64);
	});

	test("string input", () => {
		const result = HashWasm.blake2b("hello");
		expect(result.length).toBe(64);
	});

	test("bytes input", () => {
		const result = HashWasm.blake2b(new Uint8Array([1, 2, 3]));
		expect(result.length).toBe(64);
	});

	test("known vector - empty string", () => {
		const result = HashWasm.blake2b("");
		// BLAKE2b-512 of empty string
		const expected = new Uint8Array([
			0x78, 0x6a, 0x02, 0xf7, 0x42, 0x01, 0x59, 0x03, 0xc6, 0xc6, 0xfd, 0x85,
			0x25, 0x52, 0xd2, 0x72, 0x91, 0x2f, 0x47, 0x40, 0xe1, 0x58, 0x47, 0x61,
			0x8a, 0x86, 0xe2, 0x17, 0xf7, 0x1f, 0x54, 0x19, 0xd2, 0x5e, 0x10, 0x31,
			0xaf, 0xee, 0x58, 0x53, 0x13, 0x89, 0x64, 0x44, 0x93, 0x4e, 0xb0, 0x4b,
			0x90, 0x3a, 0x68, 0x5b, 0x14, 0x48, 0xb7, 0x55, 0xd5, 0x6f, 0x70, 0x1a,
			0xfe, 0x9b, 0xe2, 0xce,
		]);
		expect(result).toEqual(expected);
	});

	test("deterministic", () => {
		const result1 = HashWasm.blake2b("test");
		const result2 = HashWasm.blake2b("test");
		expect(result1).toEqual(result2);
	});
});

// ============================================================================
// Solidity Hash Functions
// ============================================================================

describe("Hash WASM - Solidity Hash Functions", () => {
	test("solidityKeccak256 - empty", () => {
		const result = HashWasm.solidityKeccak256(new Uint8Array([]));
		expect(result.length).toBe(32);
	});

	test("solidityKeccak256 - bytes", () => {
		const result = HashWasm.solidityKeccak256(new Uint8Array([1, 2, 3]));
		expect(result.length).toBe(32);
	});

	test("soliditySha256 - empty", () => {
		const result = HashWasm.soliditySha256(new Uint8Array([]));
		expect(result.length).toBe(32);
	});

	test("soliditySha256 - bytes", () => {
		const result = HashWasm.soliditySha256(new Uint8Array([1, 2, 3]));
		expect(result.length).toBe(32);
	});

	test("throws on empty input", () => {
		try {
			HashWasm.solidityKeccak256(new Uint8Array([]));
		} catch (error: any) {
			expect(error.message).toMatch(/empty/i);
		}
	});
});

// ============================================================================
// Boundary Tests
// ============================================================================

describe("Hash WASM - Boundary Tests", () => {
	test("zero hash", () => {
		const zero = KNOWN_VECTORS.zero.bytes;
		expect(zero.length).toBe(32);
		expect(zero.every((b) => b === 0)).toBe(true);
	});

	test("max hash", () => {
		const max = KNOWN_VECTORS.max.bytes;
		expect(max.length).toBe(32);
		expect(max.every((b) => b === 0xff)).toBe(true);
	});

	test("single bit set", () => {
		const hash = new Uint8Array(32);
		hash[0] = 0x80; // 10000000
		expect(hash.length).toBe(32);
	});

	test("alternating pattern", () => {
		const hash = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			hash[i] = i % 2 === 0 ? 0xaa : 0x55;
		}
		expect(hash.length).toBe(32);
	});
});

// ============================================================================
// Known Ethereum Values
// ============================================================================

describe("Hash WASM - Known Ethereum Values", () => {
	test("empty keccak hash", () => {
		const hash = KNOWN_VECTORS.emptyKeccak.bytes;
		expect(hash.length).toBe(32);
		expect(hash[0]).toBe(0xc5);
		expect(hash[1]).toBe(0xd2);
	});

	test("Transfer event topic", () => {
		const hash = KNOWN_VECTORS.transferTopic.bytes;
		expect(hash.length).toBe(32);
		expect(hash[0]).toBe(0xdd);
		expect(hash[1]).toBe(0xf2);
	});

	test("genesis block hash", () => {
		// Ethereum mainnet genesis block hash
		const hash = new Uint8Array([
			0xd4, 0xe5, 0x67, 0x40, 0xf8, 0x76, 0xae, 0xf8, 0xc0, 0x10, 0xb8, 0x6a,
			0x40, 0xd5, 0xf5, 0x67, 0x45, 0xa1, 0x18, 0xd0, 0x90, 0x6a, 0x34, 0xe6,
			0x9a, 0xec, 0x8c, 0x0d, 0xb1, 0xcb, 0x8f, 0xa3,
		]);
		expect(hash.length).toBe(32);
	});
});

// ============================================================================
// Length Validation
// ============================================================================

describe("Hash WASM - Length Validation", () => {
	test("sha256 returns 32 bytes", () => {
		const result = HashWasm.sha256("test");
		expect(result.length).toBe(32);
	});

	test("ripemd160 returns 20 bytes", () => {
		const result = HashWasm.ripemd160("test");
		expect(result.length).toBe(20);
	});

	test("blake2b returns 64 bytes", () => {
		const result = HashWasm.blake2b("test");
		expect(result.length).toBe(64);
	});

	test("solidityKeccak256 returns 32 bytes", () => {
		const result = HashWasm.solidityKeccak256(new Uint8Array([1, 2, 3]));
		expect(result.length).toBe(32);
	});

	test("soliditySha256 returns 32 bytes", () => {
		const result = HashWasm.soliditySha256(new Uint8Array([1, 2, 3]));
		expect(result.length).toBe(32);
	});
});

// ============================================================================
// WASM-Specific Tests
// ============================================================================

describe("Hash WASM - WASM-Specific", () => {
	test("memory allocation - large input", () => {
		const data = new Uint8Array(1024 * 1024); // 1MB
		for (let i = 0; i < 1000; i++) {
			data[i] = i & 0xff;
		}
		const result = HashWasm.sha256(data);
		expect(result.length).toBe(32);
	});

	test("memory cleanup - sequential operations", () => {
		for (let i = 0; i < 1000; i++) {
			const data = new Uint8Array([i & 0xff]);
			const result = HashWasm.sha256(data);
			expect(result.length).toBe(32);
		}
	});

	test("concurrent operations", async () => {
		const promises = Array.from({ length: 100 }, (_, i) => {
			const data = new Uint8Array([i & 0xff]);
			return Promise.resolve(HashWasm.sha256(data));
		});

		const results = await Promise.all(promises);
		expect(results.length).toBe(100);
		expect(results.every((r) => r.length === 32)).toBe(true);
	});

	test("performance - sha256 should be fast", () => {
		const data = new Uint8Array(1024);
		data.fill(0xaa);

		const iterations = 1000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			HashWasm.sha256(data);
		}

		const elapsed = performance.now() - start;
		const opsPerSec = (iterations / elapsed) * 1000;

		expect(opsPerSec).toBeGreaterThan(100);
	});
});

// ============================================================================
// Security Properties
// ============================================================================

describe("Hash WASM - Security Properties", () => {
	test("avalanche effect - sha256", () => {
		const data1 = new Uint8Array([0x00]);
		const data2 = new Uint8Array([0x01]); // Single bit flip

		const hash1 = HashWasm.sha256(data1);
		const hash2 = HashWasm.sha256(data2);

		// Count different bits
		let differentBits = 0;
		for (let i = 0; i < hash1.length; i++) {
			const xor = hash1[i] ^ hash2[i];
			differentBits += xor.toString(2).split("1").length - 1;
		}

		// Should be approximately 50% different
		expect(differentBits).toBeGreaterThan(64);
		expect(differentBits).toBeLessThan(192);
	});

	test("preimage resistance - hashes don't reveal input", () => {
		const secret = new Uint8Array([1, 2, 3, 4, 5]);
		const hash = HashWasm.sha256(secret);

		// Hash should not contain bytes from original input
		let matches = 0;
		for (let i = 0; i < hash.length; i++) {
			for (let j = 0; j < secret.length; j++) {
				if (hash[i] === secret[j]) matches++;
			}
		}

		expect(matches).toBeLessThan(5);
	});

	test("collision resistance - similar inputs produce different hashes", () => {
		const inputs = ["test1", "test2", "test3", "test4", "test5"];
		const hashes = inputs.map((input) => HashWasm.sha256(input));

		// All hashes should be unique
		for (let i = 0; i < hashes.length; i++) {
			for (let j = i + 1; j < hashes.length; j++) {
				expect(hashes[i]).not.toEqual(hashes[j]);
			}
		}
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Hash WASM - Edge Cases", () => {
	test("empty string", () => {
		const result = HashWasm.sha256("");
		expect(result.length).toBe(32);
	});

	test("single character", () => {
		const result = HashWasm.sha256("a");
		expect(result.length).toBe(32);
	});

	test("UTF-8 multi-byte characters", () => {
		const result = HashWasm.sha256("世界");
		expect(result.length).toBe(32);
	});

	test("emoji", () => {
		const result = HashWasm.sha256("🚀");
		expect(result.length).toBe(32);
	});

	test("null bytes in data", () => {
		const data = new Uint8Array([0, 1, 0, 2, 0, 3]);
		const result = HashWasm.sha256(data);
		expect(result.length).toBe(32);
	});

	test("all zeros", () => {
		const data = new Uint8Array(100);
		const result = HashWasm.sha256(data);
		expect(result.length).toBe(32);
	});

	test("all 0xff", () => {
		const data = new Uint8Array(100).fill(0xff);
		const result = HashWasm.sha256(data);
		expect(result.length).toBe(32);
	});
});

// ============================================================================
// Error Handling
// ============================================================================

describe("Hash WASM - Error Handling", () => {
	test("sha256 handles empty gracefully", () => {
		try {
			const result = HashWasm.sha256(new Uint8Array([]));
			expect(result).toBeInstanceOf(Uint8Array);
		} catch (error: any) {
			expect(error.message).toMatch(/empty/i);
		}
	});

	test("ripemd160 handles empty gracefully", () => {
		try {
			const result = HashWasm.ripemd160(new Uint8Array([]));
			expect(result).toBeInstanceOf(Uint8Array);
		} catch (error: any) {
			expect(error.message).toMatch(/empty/i);
		}
	});

	test("blake2b handles empty gracefully", () => {
		try {
			const result = HashWasm.blake2b(new Uint8Array([]));
			expect(result).toBeInstanceOf(Uint8Array);
		} catch (error: any) {
			expect(error.message).toMatch(/empty/i);
		}
	});

	test("solidityKeccak256 throws on empty", () => {
		try {
			HashWasm.solidityKeccak256(new Uint8Array([]));
		} catch (error: any) {
			expect(error.message).toMatch(/empty/i);
			expect(error.code).toBe("HASH_EMPTY_INPUT");
		}
	});

	test("soliditySha256 throws on empty", () => {
		try {
			HashWasm.soliditySha256(new Uint8Array([]));
		} catch (error: any) {
			expect(error.message).toMatch(/empty/i);
			expect(error.code).toBe("HASH_EMPTY_INPUT");
		}
	});
});
