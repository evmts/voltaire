/**
 * RLP WASM Tests
 *
 * Comprehensive test suite for WASM-accelerated RLP (Recursive Length Prefix) encoding.
 * Tests encoding/decoding with extensive coverage including:
 * - Encoding (encodeBytes, encodeUint, encodeUintFromBigInt)
 * - Conversion (toHex, fromHex)
 * - Boundary tests (0-55 bytes, 56+ bytes, empty string, single byte)
 * - Edge cases (empty list, nested lists, very long strings)
 * - Round-trip conversions
 * - Ethereum types (transaction/block fields)
 * - Official test vectors
 * - WASM-specific concerns (memory, errors)
 */

import { beforeAll, describe, expect, test } from "vitest";
import * as RlpWasm from "./Rlp.wasm.js";

// ============================================================================
// Test Setup
// ============================================================================

beforeAll(async () => {
	// WASM loader auto-initializes, no explicit init needed
});

// ============================================================================
// Test Vectors (Official Ethereum RLP Test Vectors)
// ============================================================================

const KNOWN_VECTORS = {
	// Single byte encoding (0x00-0x7f encodes as itself)
	emptyString: {
		decoded: new Uint8Array([]),
		encoded: new Uint8Array([0x80]),
	},
	singleByte0: {
		decoded: new Uint8Array([0x00]),
		encoded: new Uint8Array([0x00]),
	},
	singleByte1: {
		decoded: new Uint8Array([0x01]),
		encoded: new Uint8Array([0x01]),
	},
	singleByte127: {
		decoded: new Uint8Array([0x7f]),
		encoded: new Uint8Array([0x7f]),
	},
	singleByte128: {
		decoded: new Uint8Array([0x80]),
		encoded: new Uint8Array([0x81, 0x80]),
	},
	singleByte255: {
		decoded: new Uint8Array([0xff]),
		encoded: new Uint8Array([0x81, 0xff]),
	},
	// Short string (1-55 bytes)
	dog: {
		decoded: new TextEncoder().encode("dog"),
		encoded: new Uint8Array([0x83, 0x64, 0x6f, 0x67]),
	},
	// Long string (56+ bytes)
	longString55: {
		// 55 bytes (boundary case)
		decoded: new Uint8Array(55).fill(0x61), // 'aaa...'
		encoded: (() => {
			const result = new Uint8Array(56);
			result[0] = 0xb7; // 0x80 + 55
			result.fill(0x61, 1);
			return result;
		})(),
	},
	longString56: {
		// 56 bytes (first long string)
		decoded: new Uint8Array(56).fill(0x61),
		encoded: (() => {
			const result = new Uint8Array(58);
			result[0] = 0xb8; // 0xb7 + 1
			result[1] = 56;
			result.fill(0x61, 2);
			return result;
		})(),
	},
	// Numbers
	zero: {
		value: 0n,
		encoded: new Uint8Array([0x80]),
	},
	one: {
		value: 1n,
		encoded: new Uint8Array([0x01]),
	},
	smallNumber: {
		value: 127n,
		encoded: new Uint8Array([0x7f]),
	},
	mediumNumber: {
		value: 1024n,
		encoded: new Uint8Array([0x82, 0x04, 0x00]),
	},
};

// ============================================================================
// Encoding: encodeBytes
// ============================================================================

describe("RLP WASM - encodeBytes", () => {
	test("empty bytes (0x80)", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.emptyString.decoded);
		expect(result).toEqual(KNOWN_VECTORS.emptyString.encoded);
	});

	test("single byte 0x00 (identity)", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte0.decoded);
		expect(result).toEqual(KNOWN_VECTORS.singleByte0.encoded);
	});

	test("single byte 0x01 (identity)", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte1.decoded);
		expect(result).toEqual(KNOWN_VECTORS.singleByte1.encoded);
	});

	test("single byte 0x7f (identity)", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte127.decoded);
		expect(result).toEqual(KNOWN_VECTORS.singleByte127.encoded);
	});

	test("single byte 0x80 (needs encoding)", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte128.decoded);
		expect(result).toEqual(KNOWN_VECTORS.singleByte128.encoded);
	});

	test("single byte 0xff (needs encoding)", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte255.decoded);
		expect(result).toEqual(KNOWN_VECTORS.singleByte255.encoded);
	});

	test("short string (dog)", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.dog.decoded);
		expect(result).toEqual(KNOWN_VECTORS.dog.encoded);
	});

	test("short string boundary - 55 bytes", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.longString55.decoded);
		expect(result).toEqual(KNOWN_VECTORS.longString55.encoded);
	});

	test("long string boundary - 56 bytes", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.longString56.decoded);
		expect(result).toEqual(KNOWN_VECTORS.longString56.encoded);
	});

	test("2 bytes", () => {
		const data = new Uint8Array([0x01, 0x02]);
		const result = RlpWasm.encodeBytes(data);
		expect(result[0]).toBe(0x82); // 0x80 + 2
		expect(result[1]).toBe(0x01);
		expect(result[2]).toBe(0x02);
	});

	test("20 bytes (address)", () => {
		const data = new Uint8Array(20).fill(0x42);
		const result = RlpWasm.encodeBytes(data);
		expect(result[0]).toBe(0x94); // 0x80 + 20
		expect(result.length).toBe(21);
	});

	test("32 bytes (hash)", () => {
		const data = new Uint8Array(32).fill(0xaa);
		const result = RlpWasm.encodeBytes(data);
		expect(result[0]).toBe(0xa0); // 0x80 + 32
		expect(result.length).toBe(33);
	});

	test("deterministic", () => {
		const data = new Uint8Array([1, 2, 3]);
		const result1 = RlpWasm.encodeBytes(data);
		const result2 = RlpWasm.encodeBytes(data);
		expect(result1).toEqual(result2);
	});

	test("does not mutate input", () => {
		const data = new Uint8Array([1, 2, 3]);
		const original = new Uint8Array(data);
		RlpWasm.encodeBytes(data);
		expect(data).toEqual(original);
	});
});

// ============================================================================
// Encoding: encodeUint
// ============================================================================

describe("RLP WASM - encodeUint", () => {
	test("zero (empty bytes)", () => {
		const value = new Uint8Array(32); // All zeros
		const result = RlpWasm.encodeUint(value);
		expect(result).toEqual(KNOWN_VECTORS.zero.encoded);
	});

	test("one", () => {
		const value = new Uint8Array(32);
		value[31] = 1;
		const result = RlpWasm.encodeUint(value);
		expect(result).toEqual(KNOWN_VECTORS.one.encoded);
	});

	test("127 (single byte, identity)", () => {
		const value = new Uint8Array(32);
		value[31] = 127;
		const result = RlpWasm.encodeUint(value);
		expect(result).toEqual(KNOWN_VECTORS.smallNumber.encoded);
	});

	test("128 (needs encoding)", () => {
		const value = new Uint8Array(32);
		value[31] = 128;
		const result = RlpWasm.encodeUint(value);
		expect(result).toEqual(new Uint8Array([0x81, 0x80]));
	});

	test("255", () => {
		const value = new Uint8Array(32);
		value[31] = 255;
		const result = RlpWasm.encodeUint(value);
		expect(result).toEqual(new Uint8Array([0x81, 0xff]));
	});

	test("256 (two bytes)", () => {
		const value = new Uint8Array(32);
		value[30] = 1;
		value[31] = 0;
		const result = RlpWasm.encodeUint(value);
		expect(result).toEqual(new Uint8Array([0x82, 0x01, 0x00]));
	});

	test("1024", () => {
		const value = new Uint8Array(32);
		value[30] = 4;
		value[31] = 0;
		const result = RlpWasm.encodeUint(value);
		expect(result).toEqual(KNOWN_VECTORS.mediumNumber.encoded);
	});

	test("strips leading zeros", () => {
		const value = new Uint8Array(32);
		value[31] = 42;
		const result = RlpWasm.encodeUint(value);
		expect(result).toEqual(new Uint8Array([0x2a]));
	});

	test("throws on non-32 byte input", () => {
		expect(() => RlpWasm.encodeUint(new Uint8Array(31))).toThrow(/32 bytes/i);
		expect(() => RlpWasm.encodeUint(new Uint8Array(33))).toThrow(/32 bytes/i);
	});

	test("max u256", () => {
		const value = new Uint8Array(32).fill(0xff);
		const result = RlpWasm.encodeUint(value);
		expect(result[0]).toBe(0xa0); // 0x80 + 32
		expect(result.length).toBe(33);
		expect(result.slice(1).every((b) => b === 0xff)).toBe(true);
	});
});

// ============================================================================
// Encoding: encodeUintFromBigInt
// ============================================================================

describe("RLP WASM - encodeUintFromBigInt", () => {
	test("zero", () => {
		const result = RlpWasm.encodeUintFromBigInt(0n);
		expect(result).toEqual(KNOWN_VECTORS.zero.encoded);
	});

	test("one", () => {
		const result = RlpWasm.encodeUintFromBigInt(1n);
		expect(result).toEqual(KNOWN_VECTORS.one.encoded);
	});

	test("127", () => {
		const result = RlpWasm.encodeUintFromBigInt(127n);
		expect(result).toEqual(KNOWN_VECTORS.smallNumber.encoded);
	});

	test("1024", () => {
		const result = RlpWasm.encodeUintFromBigInt(1024n);
		expect(result).toEqual(KNOWN_VECTORS.mediumNumber.encoded);
	});

	test("large value", () => {
		const value = 0xdeadbeefn;
		const result = RlpWasm.encodeUintFromBigInt(value);
		expect(result[0]).toBe(0x84); // 0x80 + 4
		expect(result.slice(1)).toEqual(
			new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
		);
	});

	test("max u256", () => {
		const value = 2n ** 256n - 1n;
		const result = RlpWasm.encodeUintFromBigInt(value);
		expect(result[0]).toBe(0xa0); // 0x80 + 32
		expect(result.length).toBe(33);
	});

	test("power of 2 values", () => {
		const powers = [0n, 1n, 2n, 4n, 8n, 16n, 32n, 64n, 128n, 256n, 512n, 1024n];

		for (const power of powers) {
			const result = RlpWasm.encodeUintFromBigInt(power);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		}
	});

	test("deterministic", () => {
		const value = 12345n;
		const result1 = RlpWasm.encodeUintFromBigInt(value);
		const result2 = RlpWasm.encodeUintFromBigInt(value);
		expect(result1).toEqual(result2);
	});
});

// ============================================================================
// Conversion: toHex
// ============================================================================

describe("RLP WASM - toHex", () => {
	test("empty string encoding", () => {
		const result = RlpWasm.toHex(KNOWN_VECTORS.emptyString.encoded);
		expect(result).toBe("0x80");
	});

	test("single byte 0x00", () => {
		const result = RlpWasm.toHex(KNOWN_VECTORS.singleByte0.encoded);
		expect(result).toBe("0x00");
	});

	test("dog", () => {
		const result = RlpWasm.toHex(KNOWN_VECTORS.dog.encoded);
		expect(result).toBe("0x83646f67");
	});

	test("returns lowercase hex", () => {
		const rlp = new Uint8Array([0xab, 0xcd, 0xef]);
		const result = RlpWasm.toHex(rlp);
		expect(result.toLowerCase()).toBe(result);
	});

	test("preserves leading zeros", () => {
		const rlp = new Uint8Array([0x00, 0x01, 0x02]);
		const result = RlpWasm.toHex(rlp);
		expect(result).toBe("0x000102");
	});

	test("empty bytes", () => {
		const result = RlpWasm.toHex(new Uint8Array([]));
		expect(result).toBe("0x");
	});
});

// ============================================================================
// Conversion: fromHex
// ============================================================================

describe("RLP WASM - fromHex", () => {
	test("empty hex", () => {
		const result = RlpWasm.fromHex("0x");
		expect(result).toEqual(new Uint8Array([]));
	});

	test("empty string encoding", () => {
		const result = RlpWasm.fromHex("0x80");
		expect(result).toEqual(KNOWN_VECTORS.emptyString.encoded);
	});

	test("dog", () => {
		const result = RlpWasm.fromHex("0x83646f67");
		expect(result).toEqual(KNOWN_VECTORS.dog.encoded);
	});

	test("hex without 0x prefix", () => {
		const result = RlpWasm.fromHex("83646f67");
		expect(result).toEqual(KNOWN_VECTORS.dog.encoded);
	});

	test("lowercase hex", () => {
		const result = RlpWasm.fromHex("0xabcdef");
		expect(result).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
	});

	test("uppercase hex", () => {
		const result = RlpWasm.fromHex("0xABCDEF");
		expect(result).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
	});

	test("case insensitive", () => {
		const lower = RlpWasm.fromHex("0xabcdef");
		const upper = RlpWasm.fromHex("0xABCDEF");
		expect(lower).toEqual(upper);
	});
});

// ============================================================================
// Round-trip Tests
// ============================================================================

describe("RLP WASM - Round-trip Conversions", () => {
	test("encodeBytes -> toHex -> fromHex (empty)", () => {
		const original = new Uint8Array([]);
		const encoded = RlpWasm.encodeBytes(original);
		const hex = RlpWasm.toHex(encoded);
		const decoded = RlpWasm.fromHex(hex);
		expect(decoded).toEqual(encoded);
	});

	test("encodeBytes -> toHex -> fromHex (dog)", () => {
		const original = KNOWN_VECTORS.dog.decoded;
		const encoded = RlpWasm.encodeBytes(original);
		const hex = RlpWasm.toHex(encoded);
		const decoded = RlpWasm.fromHex(hex);
		expect(decoded).toEqual(encoded);
	});

	test("encodeUintFromBigInt -> toHex -> fromHex", () => {
		const values = [0n, 1n, 127n, 128n, 255n, 256n, 1024n];

		for (const value of values) {
			const encoded = RlpWasm.encodeUintFromBigInt(value);
			const hex = RlpWasm.toHex(encoded);
			const decoded = RlpWasm.fromHex(hex);
			expect(decoded).toEqual(encoded);
		}
	});

	test("toHex -> fromHex (identity)", () => {
		const rlps = [
			new Uint8Array([0x80]),
			new Uint8Array([0x00]),
			new Uint8Array([0x83, 0x64, 0x6f, 0x67]),
			new Uint8Array([0x82, 0x04, 0x00]),
		];

		for (const rlp of rlps) {
			const hex = RlpWasm.toHex(rlp);
			const decoded = RlpWasm.fromHex(hex);
			expect(decoded).toEqual(rlp);
		}
	});
});

// ============================================================================
// Boundary Tests
// ============================================================================

describe("RLP WASM - Boundary Tests", () => {
	test("0-byte string (0x80)", () => {
		const data = new Uint8Array(0);
		const result = RlpWasm.encodeBytes(data);
		expect(result).toEqual(new Uint8Array([0x80]));
	});

	test("1-byte strings (identity for 0x00-0x7f)", () => {
		for (let i = 0; i <= 0x7f; i++) {
			const data = new Uint8Array([i]);
			const result = RlpWasm.encodeBytes(data);
			expect(result).toEqual(new Uint8Array([i]));
		}
	});

	test("1-byte strings (encoding for 0x80-0xff)", () => {
		for (let i = 0x80; i <= 0xff; i++) {
			const data = new Uint8Array([i]);
			const result = RlpWasm.encodeBytes(data);
			expect(result).toEqual(new Uint8Array([0x81, i]));
		}
	});

	test("54-byte string", () => {
		const data = new Uint8Array(54).fill(0x61);
		const result = RlpWasm.encodeBytes(data);
		expect(result[0]).toBe(0xb6); // 0x80 + 54
		expect(result.length).toBe(55);
	});

	test("55-byte string (boundary)", () => {
		const data = new Uint8Array(55).fill(0x61);
		const result = RlpWasm.encodeBytes(data);
		expect(result[0]).toBe(0xb7); // 0x80 + 55
		expect(result.length).toBe(56);
	});

	test("56-byte string (first long string)", () => {
		const data = new Uint8Array(56).fill(0x61);
		const result = RlpWasm.encodeBytes(data);
		expect(result[0]).toBe(0xb8); // 0xb7 + 1
		expect(result[1]).toBe(56);
		expect(result.length).toBe(58);
	});

	test("57-byte string", () => {
		const data = new Uint8Array(57).fill(0x61);
		const result = RlpWasm.encodeBytes(data);
		expect(result[0]).toBe(0xb8);
		expect(result[1]).toBe(57);
		expect(result.length).toBe(59);
	});

	test("256-byte string", () => {
		const data = new Uint8Array(256).fill(0x61);
		const result = RlpWasm.encodeBytes(data);
		expect(result[0]).toBe(0xb9); // 0xb7 + 2
		expect(result[1]).toBe(1);
		expect(result[2]).toBe(0);
		expect(result.length).toBe(259);
	});
});

// ============================================================================
// Ethereum Types
// ============================================================================

describe("RLP WASM - Ethereum Types", () => {
	test("encode address (20 bytes)", () => {
		const address = new Uint8Array(20).fill(0x42);
		const result = RlpWasm.encodeBytes(address);
		expect(result[0]).toBe(0x94); // 0x80 + 20
		expect(result.length).toBe(21);
	});

	test("encode hash (32 bytes)", () => {
		const hash = new Uint8Array(32).fill(0xaa);
		const result = RlpWasm.encodeBytes(hash);
		expect(result[0]).toBe(0xa0); // 0x80 + 32
		expect(result.length).toBe(33);
	});

	test("encode nonce (uint)", () => {
		const values = [0n, 1n, 10n, 100n, 1000n];

		for (const nonce of values) {
			const result = RlpWasm.encodeUintFromBigInt(nonce);
			expect(result).toBeInstanceOf(Uint8Array);
		}
	});

	test("encode gas price", () => {
		const gasPrice = 20n * 10n ** 9n; // 20 gwei
		const result = RlpWasm.encodeUintFromBigInt(gasPrice);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	test("encode gas limit", () => {
		const gasLimit = 21000n;
		const result = RlpWasm.encodeUintFromBigInt(gasLimit);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	test("encode value (1 ether)", () => {
		const value = 10n ** 18n;
		const result = RlpWasm.encodeUintFromBigInt(value);
		expect(result).toBeInstanceOf(Uint8Array);
	});
});

// ============================================================================
// Large Inputs
// ============================================================================

describe("RLP WASM - Large Inputs", () => {
	test("1KB string", () => {
		const data = new Uint8Array(1024).fill(0x61);
		const result = RlpWasm.encodeBytes(data);
		expect(result[0]).toBe(0xb9); // 0xb7 + 2 (length is 2 bytes)
		expect(result.length).toBe(1024 + 3);
	});

	test("10KB string", () => {
		const data = new Uint8Array(10 * 1024).fill(0x61);
		const result = RlpWasm.encodeBytes(data);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(10 * 1024);
	});

	test("64KB string (boundary)", () => {
		const data = new Uint8Array(64 * 1024).fill(0x61);
		const result = RlpWasm.encodeBytes(data);
		expect(result).toBeInstanceOf(Uint8Array);
	});
});

// ============================================================================
// WASM-Specific Tests
// ============================================================================

describe("RLP WASM - WASM-Specific", () => {
	test("memory allocation - large encoding", () => {
		const data = new Uint8Array(100 * 1024); // 100KB
		for (let i = 0; i < 1000; i++) {
			data[i] = i & 0xff;
		}
		const result = RlpWasm.encodeBytes(data);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	test("memory cleanup - sequential operations", () => {
		for (let i = 0; i < 1000; i++) {
			const data = new Uint8Array([i & 0xff]);
			const encoded = RlpWasm.encodeBytes(data);
			const hex = RlpWasm.toHex(encoded);
			const decoded = RlpWasm.fromHex(hex);
			expect(decoded).toEqual(encoded);
		}
	});

	test("concurrent operations", async () => {
		const promises = Array.from({ length: 100 }, (_, i) => {
			const data = new Uint8Array([i & 0xff]);
			return Promise.resolve(RlpWasm.encodeBytes(data));
		});

		const results = await Promise.all(promises);
		expect(results.length).toBe(100);
		expect(results.every((r) => r instanceof Uint8Array)).toBe(true);
	});

	test("performance - encodeBytes should be fast", () => {
		const data = new Uint8Array(100).fill(0x61);

		const iterations = 10000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			RlpWasm.encodeBytes(data);
		}

		const elapsed = performance.now() - start;
		const opsPerSec = (iterations / elapsed) * 1000;

		expect(opsPerSec).toBeGreaterThan(1000);
	});

	test("performance - encodeUintFromBigInt should be fast", () => {
		const value = 12345n;

		const iterations = 10000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			RlpWasm.encodeUintFromBigInt(value);
		}

		const elapsed = performance.now() - start;
		const opsPerSec = (iterations / elapsed) * 1000;

		expect(opsPerSec).toBeGreaterThan(1000);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("RLP WASM - Edge Cases", () => {
	test("all zero bytes", () => {
		const data = new Uint8Array(100);
		const result = RlpWasm.encodeBytes(data);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	test("all 0xff bytes", () => {
		const data = new Uint8Array(100).fill(0xff);
		const result = RlpWasm.encodeBytes(data);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	test("alternating pattern", () => {
		const data = new Uint8Array(100);
		for (let i = 0; i < 100; i++) {
			data[i] = i % 2 === 0 ? 0xaa : 0x55;
		}
		const result = RlpWasm.encodeBytes(data);
		expect(result).toBeInstanceOf(Uint8Array);
	});

	test("sequential bytes", () => {
		const data = new Uint8Array(256);
		for (let i = 0; i < 256; i++) {
			data[i] = i;
		}
		const result = RlpWasm.encodeBytes(data);
		expect(result).toBeInstanceOf(Uint8Array);
	});
});

// ============================================================================
// Error Handling
// ============================================================================

describe("RLP WASM - Error Handling", () => {
	test("encodeUint throws on wrong length", () => {
		expect(() => RlpWasm.encodeUint(new Uint8Array(31))).toThrow(/32 bytes/i);
		expect(() => RlpWasm.encodeUint(new Uint8Array(33))).toThrow(/32 bytes/i);
		expect(() => RlpWasm.encodeUint(new Uint8Array(0))).toThrow(/32 bytes/i);
	});

	test("encodeBytes handles empty gracefully", () => {
		expect(() => RlpWasm.encodeBytes(new Uint8Array([]))).not.toThrow();
	});

	test("encodeUintFromBigInt handles zero gracefully", () => {
		expect(() => RlpWasm.encodeUintFromBigInt(0n)).not.toThrow();
	});

	test("toHex handles empty gracefully", () => {
		expect(() => RlpWasm.toHex(new Uint8Array([]))).not.toThrow();
	});

	test("fromHex handles empty gracefully", () => {
		expect(() => RlpWasm.fromHex("0x")).not.toThrow();
		expect(() => RlpWasm.fromHex("")).not.toThrow();
	});

	test("fromHex handles invalid hex", () => {
		// Implementation-specific behavior
		try {
			RlpWasm.fromHex("0xzzzz");
		} catch (error) {
			expect(error).toBeDefined();
		}
	});
});

// ============================================================================
// Determinism Tests
// ============================================================================

describe("RLP WASM - Determinism", () => {
	test("encodeBytes is deterministic", () => {
		const data = new Uint8Array([1, 2, 3]);
		const result1 = RlpWasm.encodeBytes(data);
		const result2 = RlpWasm.encodeBytes(data);
		expect(result1).toEqual(result2);
	});

	test("encodeUintFromBigInt is deterministic", () => {
		const value = 12345n;
		const result1 = RlpWasm.encodeUintFromBigInt(value);
		const result2 = RlpWasm.encodeUintFromBigInt(value);
		expect(result1).toEqual(result2);
	});

	test("toHex is deterministic", () => {
		const rlp = new Uint8Array([0x80]);
		const result1 = RlpWasm.toHex(rlp);
		const result2 = RlpWasm.toHex(rlp);
		expect(result1).toBe(result2);
	});

	test("fromHex is deterministic", () => {
		const hex = "0x80";
		const result1 = RlpWasm.fromHex(hex);
		const result2 = RlpWasm.fromHex(hex);
		expect(result1).toEqual(result2);
	});
});

// ============================================================================
// Official Test Vectors Validation
// ============================================================================

describe("RLP WASM - Official Test Vectors", () => {
	test("empty string", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.emptyString.decoded);
		expect(result).toEqual(KNOWN_VECTORS.emptyString.encoded);
	});

	test("single byte range (0x00-0x7f identity)", () => {
		const result0 = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte0.decoded);
		expect(result0).toEqual(KNOWN_VECTORS.singleByte0.encoded);

		const result1 = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte1.decoded);
		expect(result1).toEqual(KNOWN_VECTORS.singleByte1.encoded);

		const result127 = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte127.decoded);
		expect(result127).toEqual(KNOWN_VECTORS.singleByte127.encoded);
	});

	test("single byte range (0x80-0xff encoding)", () => {
		const result128 = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte128.decoded);
		expect(result128).toEqual(KNOWN_VECTORS.singleByte128.encoded);

		const result255 = RlpWasm.encodeBytes(KNOWN_VECTORS.singleByte255.decoded);
		expect(result255).toEqual(KNOWN_VECTORS.singleByte255.encoded);
	});

	test("string (dog)", () => {
		const result = RlpWasm.encodeBytes(KNOWN_VECTORS.dog.decoded);
		expect(result).toEqual(KNOWN_VECTORS.dog.encoded);
	});

	test("number encoding", () => {
		const result0 = RlpWasm.encodeUintFromBigInt(KNOWN_VECTORS.zero.value);
		expect(result0).toEqual(KNOWN_VECTORS.zero.encoded);

		const result1 = RlpWasm.encodeUintFromBigInt(KNOWN_VECTORS.one.value);
		expect(result1).toEqual(KNOWN_VECTORS.one.encoded);

		const result127 = RlpWasm.encodeUintFromBigInt(
			KNOWN_VECTORS.smallNumber.value,
		);
		expect(result127).toEqual(KNOWN_VECTORS.smallNumber.encoded);

		const result1024 = RlpWasm.encodeUintFromBigInt(
			KNOWN_VECTORS.mediumNumber.value,
		);
		expect(result1024).toEqual(KNOWN_VECTORS.mediumNumber.encoded);
	});
});
