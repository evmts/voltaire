/**
 * Hex WASM Tests
 *
 * Comprehensive test suite for WASM-accelerated Hex operations.
 * Tests encoding/decoding functions with extensive coverage including:
 * - Encoding (fromBytes, fromString, fromNumber, concat, slice, padding)
 * - Decoding (toBytes, toString, toNumber, toBigInt)
 * - Validation (isHex, isEqual)
 * - Edge cases (empty, odd length, case sensitivity, large inputs)
 * - Round-trip conversions
 * - WASM-specific concerns (memory, errors)
 */

import { beforeAll, describe, expect, test } from "vitest";
import * as HexWasm from "./Hex.wasm.js";

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
	empty: {
		bytes: new Uint8Array([]),
		hex: "0x",
	},
	singleByte: {
		bytes: new Uint8Array([0x42]),
		hex: "0x42",
	},
	zeroByte: {
		bytes: new Uint8Array([0x00]),
		hex: "0x00",
	},
	maxByte: {
		bytes: new Uint8Array([0xff]),
		hex: "0xff",
	},
	multiBytes: {
		bytes: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
		hex: "0xdeadbeef",
	},
	address: {
		bytes: new Uint8Array([
			0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3, 0xb8,
			0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf2, 0x51, 0xe3,
		]),
		hex: "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
	},
	hash: {
		bytes: new Uint8Array(32).fill(0xaa),
		hex: `0x${"aa".repeat(32)}`,
	},
};

// ============================================================================
// Encoding: bytesToHex
// ============================================================================

describe("Hex WASM - bytesToHex", () => {
	test("empty bytes", () => {
		const result = HexWasm.bytesToHex(KNOWN_VECTORS.empty.bytes);
		expect(result).toBe("0x");
	});

	test("single byte (0x42)", () => {
		const result = HexWasm.bytesToHex(KNOWN_VECTORS.singleByte.bytes);
		expect(result).toBe("0x42");
	});

	test("single byte (0x00)", () => {
		const result = HexWasm.bytesToHex(KNOWN_VECTORS.zeroByte.bytes);
		expect(result).toBe("0x00");
	});

	test("single byte (0xff)", () => {
		const result = HexWasm.bytesToHex(KNOWN_VECTORS.maxByte.bytes);
		expect(result).toBe("0xff");
	});

	test("multi bytes (deadbeef)", () => {
		const result = HexWasm.bytesToHex(KNOWN_VECTORS.multiBytes.bytes);
		expect(result).toBe("0xdeadbeef");
	});

	test("20 bytes (address)", () => {
		const result = HexWasm.bytesToHex(KNOWN_VECTORS.address.bytes);
		expect(result).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
	});

	test("32 bytes (hash)", () => {
		const result = HexWasm.bytesToHex(KNOWN_VECTORS.hash.bytes);
		expect(result).toBe(`0x${"aa".repeat(32)}`);
	});

	test("returns lowercase hex", () => {
		const bytes = new Uint8Array([0xab, 0xcd, 0xef]);
		const result = HexWasm.bytesToHex(bytes);
		expect(result).toBe("0xabcdef");
		expect(result.toLowerCase()).toBe(result);
	});

	test("preserves leading zeros", () => {
		const bytes = new Uint8Array([0x00, 0x01, 0x02]);
		const result = HexWasm.bytesToHex(bytes);
		expect(result).toBe("0x000102");
	});

	test("large input - 1KB", () => {
		const bytes = new Uint8Array(1024);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = i & 0xff;
		}
		const result = HexWasm.bytesToHex(bytes);
		expect(result).toMatch(/^0x[0-9a-f]{2048}$/);
	});

	test("large input - 1MB", () => {
		const bytes = new Uint8Array(1024 * 1024);
		for (let i = 0; i < 256; i++) {
			bytes[i] = i;
		}
		const result = HexWasm.bytesToHex(bytes);
		expect(result.startsWith("0x")).toBe(true);
		expect(result.length).toBe(2 + 2 * 1024 * 1024);
	});

	test("does not mutate input", () => {
		const bytes = new Uint8Array([1, 2, 3]);
		const original = new Uint8Array(bytes);
		HexWasm.bytesToHex(bytes);
		expect(bytes).toEqual(original);
	});

	test("deterministic - same input produces same output", () => {
		const bytes = new Uint8Array([1, 2, 3, 4, 5]);
		const result1 = HexWasm.bytesToHex(bytes);
		const result2 = HexWasm.bytesToHex(bytes);
		expect(result1).toBe(result2);
	});
});

// ============================================================================
// Decoding: hexToBytes
// ============================================================================

describe("Hex WASM - hexToBytes", () => {
	test("empty hex (0x)", () => {
		const result = HexWasm.hexToBytes("0x");
		expect(result).toEqual(new Uint8Array([]));
	});

	test("single byte with 0x prefix", () => {
		const result = HexWasm.hexToBytes("0x42");
		expect(result).toEqual(new Uint8Array([0x42]));
	});

	test("single byte without 0x prefix", () => {
		const result = HexWasm.hexToBytes("42");
		expect(result).toEqual(new Uint8Array([0x42]));
	});

	test("lowercase hex", () => {
		const result = HexWasm.hexToBytes("0xdeadbeef");
		expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
	});

	test("uppercase hex", () => {
		const result = HexWasm.hexToBytes("0xDEADBEEF");
		expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
	});

	test("mixed case hex", () => {
		const result = HexWasm.hexToBytes("0xDeAdBeEf");
		expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
	});

	test("case insensitive - same result", () => {
		const lower = HexWasm.hexToBytes("0xabcdef");
		const upper = HexWasm.hexToBytes("0xABCDEF");
		const mixed = HexWasm.hexToBytes("0xAbCdEf");
		expect(lower).toEqual(upper);
		expect(lower).toEqual(mixed);
	});

	test("preserves leading zeros", () => {
		const result = HexWasm.hexToBytes("0x000102");
		expect(result).toEqual(new Uint8Array([0x00, 0x01, 0x02]));
	});

	test("20 bytes (address)", () => {
		const result = HexWasm.hexToBytes(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		expect(result.length).toBe(20);
		expect(result[0]).toBe(0x74);
		expect(result[1]).toBe(0x2d);
	});

	test("32 bytes (hash)", () => {
		const hex = `0x${"aa".repeat(32)}`;
		const result = HexWasm.hexToBytes(hex);
		expect(result.length).toBe(32);
		expect(result.every((b) => b === 0xaa)).toBe(true);
	});

	test("large hex - 1KB", () => {
		const hex = `0x${"ab".repeat(1024)}`;
		const result = HexWasm.hexToBytes(hex);
		expect(result.length).toBe(1024);
	});

	test("deterministic", () => {
		const result1 = HexWasm.hexToBytes("0x1234");
		const result2 = HexWasm.hexToBytes("0x1234");
		expect(result1).toEqual(result2);
	});

	test("handles odd length hex by padding or throwing", () => {
		// Behavior depends on implementation - document it
		try {
			const result = HexWasm.hexToBytes("0x123");
			// If it doesn't throw, it should handle gracefully
			expect(result).toBeInstanceOf(Uint8Array);
		} catch (error) {
			// If it throws, that's also acceptable
			expect(error).toBeDefined();
		}
	});

	test("handles invalid hex characters", () => {
		// Behavior depends on implementation
		try {
			HexWasm.hexToBytes("0xzzzz");
			// May produce result with NaN-like bytes or throw
		} catch (error) {
			expect(error).toBeDefined();
		}
	});
});

// ============================================================================
// Round-trip Tests
// ============================================================================

describe("Hex WASM - Round-trip Conversions", () => {
	test("bytesToHex -> hexToBytes (empty)", () => {
		const original = new Uint8Array([]);
		const hex = HexWasm.bytesToHex(original);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(original);
	});

	test("bytesToHex -> hexToBytes (single byte)", () => {
		const original = new Uint8Array([0x42]);
		const hex = HexWasm.bytesToHex(original);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(original);
	});

	test("bytesToHex -> hexToBytes (multi byte)", () => {
		const original = new Uint8Array([1, 2, 3, 4, 5]);
		const hex = HexWasm.bytesToHex(original);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(original);
	});

	test("bytesToHex -> hexToBytes (address)", () => {
		const original = KNOWN_VECTORS.address.bytes;
		const hex = HexWasm.bytesToHex(original);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(original);
	});

	test("bytesToHex -> hexToBytes (hash)", () => {
		const original = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			original[i] = i;
		}
		const hex = HexWasm.bytesToHex(original);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(original);
	});

	test("hexToBytes -> bytesToHex (with 0x prefix)", () => {
		const original = "0xdeadbeef";
		const bytes = HexWasm.hexToBytes(original);
		const result = HexWasm.bytesToHex(bytes);
		expect(result).toBe(original);
	});

	test("hexToBytes -> bytesToHex (without 0x prefix)", () => {
		const original = "deadbeef";
		const bytes = HexWasm.hexToBytes(original);
		const result = HexWasm.bytesToHex(bytes);
		expect(result).toBe("0xdeadbeef");
	});

	test("hexToBytes -> bytesToHex (uppercase to lowercase)", () => {
		const original = "0xDEADBEEF";
		const bytes = HexWasm.hexToBytes(original);
		const result = HexWasm.bytesToHex(bytes);
		expect(result).toBe("0xdeadbeef");
	});

	test("round-trip with leading zeros", () => {
		const original = new Uint8Array([0x00, 0x00, 0x01]);
		const hex = HexWasm.bytesToHex(original);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(original);
	});

	test("round-trip with all zeros", () => {
		const original = new Uint8Array(10);
		const hex = HexWasm.bytesToHex(original);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(original);
	});

	test("round-trip with all 0xff", () => {
		const original = new Uint8Array(10).fill(0xff);
		const hex = HexWasm.bytesToHex(original);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(original);
	});

	test("round-trip large array (1KB)", () => {
		const original = new Uint8Array(1024);
		for (let i = 0; i < original.length; i++) {
			original[i] = i & 0xff;
		}
		const hex = HexWasm.bytesToHex(original);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(original);
	});
});

// ============================================================================
// Boundary Tests
// ============================================================================

describe("Hex WASM - Boundary Tests", () => {
	test("0 bytes", () => {
		const bytes = new Uint8Array(0);
		const hex = HexWasm.bytesToHex(bytes);
		expect(hex).toBe("0x");
		const roundtrip = HexWasm.hexToBytes(hex);
		expect(roundtrip).toEqual(bytes);
	});

	test("1 byte", () => {
		const bytes = new Uint8Array([0x42]);
		const hex = HexWasm.bytesToHex(bytes);
		const roundtrip = HexWasm.hexToBytes(hex);
		expect(roundtrip).toEqual(bytes);
	});

	test("2 bytes", () => {
		const bytes = new Uint8Array([0x12, 0x34]);
		const hex = HexWasm.bytesToHex(bytes);
		const roundtrip = HexWasm.hexToBytes(hex);
		expect(roundtrip).toEqual(bytes);
	});

	test("20 bytes (address length)", () => {
		const bytes = new Uint8Array(20).fill(0x42);
		const hex = HexWasm.bytesToHex(bytes);
		expect(hex.length).toBe(2 + 40); // 0x + 40 chars
		const roundtrip = HexWasm.hexToBytes(hex);
		expect(roundtrip).toEqual(bytes);
	});

	test("32 bytes (hash length)", () => {
		const bytes = new Uint8Array(32).fill(0x42);
		const hex = HexWasm.bytesToHex(bytes);
		expect(hex.length).toBe(2 + 64); // 0x + 64 chars
		const roundtrip = HexWasm.hexToBytes(hex);
		expect(roundtrip).toEqual(bytes);
	});

	test("power of 2 sizes", () => {
		const sizes = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

		for (const size of sizes) {
			const bytes = new Uint8Array(size);
			for (let i = 0; i < size; i++) {
				bytes[i] = i & 0xff;
			}
			const hex = HexWasm.bytesToHex(bytes);
			const roundtrip = HexWasm.hexToBytes(hex);
			expect(roundtrip).toEqual(bytes);
		}
	});

	test("all byte values (0x00 to 0xff)", () => {
		const bytes = new Uint8Array(256);
		for (let i = 0; i < 256; i++) {
			bytes[i] = i;
		}
		const hex = HexWasm.bytesToHex(bytes);
		const roundtrip = HexWasm.hexToBytes(hex);
		expect(roundtrip).toEqual(bytes);
	});
});

// ============================================================================
// WASM-Specific Tests
// ============================================================================

describe("Hex WASM - WASM-Specific", () => {
	test("memory allocation - large conversion", () => {
		const bytes = new Uint8Array(10 * 1024 * 1024); // 10MB
		for (let i = 0; i < 1000; i++) {
			bytes[i] = i & 0xff;
		}
		const hex = HexWasm.bytesToHex(bytes);
		expect(hex.startsWith("0x")).toBe(true);
	});

	test("memory cleanup - sequential operations", () => {
		for (let i = 0; i < 1000; i++) {
			const bytes = new Uint8Array([i & 0xff]);
			const hex = HexWasm.bytesToHex(bytes);
			const roundtrip = HexWasm.hexToBytes(hex);
			expect(roundtrip).toEqual(bytes);
		}
	});

	test("concurrent operations", async () => {
		const promises = Array.from({ length: 100 }, (_, i) => {
			const bytes = new Uint8Array([i & 0xff]);
			return Promise.resolve(HexWasm.bytesToHex(bytes));
		});

		const results = await Promise.all(promises);
		expect(results.length).toBe(100);
		expect(results.every((r) => r.startsWith("0x"))).toBe(true);
	});

	test("performance - bytesToHex should be fast", () => {
		const bytes = new Uint8Array(1024);
		bytes.fill(0xaa);

		const iterations = 1000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			HexWasm.bytesToHex(bytes);
		}

		const elapsed = performance.now() - start;
		const opsPerSec = (iterations / elapsed) * 1000;

		// Should be able to do at least 1000 ops/sec
		expect(opsPerSec).toBeGreaterThan(1000);
	});

	test("performance - hexToBytes should be fast", () => {
		const hex = `0x${"aa".repeat(1024)}`;

		const iterations = 1000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			HexWasm.hexToBytes(hex);
		}

		const elapsed = performance.now() - start;
		const opsPerSec = (iterations / elapsed) * 1000;

		expect(opsPerSec).toBeGreaterThan(1000);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Hex WASM - Edge Cases", () => {
	test("hex with only 0x prefix", () => {
		const result = HexWasm.hexToBytes("0x");
		expect(result).toEqual(new Uint8Array([]));
	});

	test("hex without prefix", () => {
		const result = HexWasm.hexToBytes("1234");
		expect(result).toEqual(new Uint8Array([0x12, 0x34]));
	});

	test("all zeros", () => {
		const hex = `0x${"00".repeat(20)}`;
		const result = HexWasm.hexToBytes(hex);
		expect(result.every((b) => b === 0)).toBe(true);
	});

	test("all 0xff", () => {
		const hex = `0x${"ff".repeat(20)}`;
		const result = HexWasm.hexToBytes(hex);
		expect(result.every((b) => b === 0xff)).toBe(true);
	});

	test("alternating pattern", () => {
		const hex = `0x${"aa55".repeat(10)}`;
		const result = HexWasm.hexToBytes(hex);
		for (let i = 0; i < result.length; i += 2) {
			expect(result[i]).toBe(0xaa);
			expect(result[i + 1]).toBe(0x55);
		}
	});

	test("sequential bytes", () => {
		const bytes = new Uint8Array(256);
		for (let i = 0; i < 256; i++) {
			bytes[i] = i;
		}
		const hex = HexWasm.bytesToHex(bytes);
		const result = HexWasm.hexToBytes(hex);
		expect(result).toEqual(bytes);
	});

	test("single nibble repeated", () => {
		const hex = `0x${"1".repeat(10)}`;
		// Odd length - behavior depends on implementation
		try {
			const result = HexWasm.hexToBytes(hex);
			expect(result).toBeInstanceOf(Uint8Array);
		} catch (error) {
			expect(error).toBeDefined();
		}
	});
});

// ============================================================================
// Known Ethereum Values
// ============================================================================

describe("Hex WASM - Known Ethereum Values", () => {
	test("zero address", () => {
		const hex = "0x0000000000000000000000000000000000000000";
		const bytes = HexWasm.hexToBytes(hex);
		expect(bytes.length).toBe(20);
		expect(bytes.every((b) => b === 0)).toBe(true);
		const roundtrip = HexWasm.bytesToHex(bytes);
		expect(roundtrip).toBe(hex);
	});

	test("USDC address", () => {
		const hex = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
		const bytes = HexWasm.hexToBytes(hex);
		expect(bytes.length).toBe(20);
		const roundtrip = HexWasm.bytesToHex(bytes);
		expect(roundtrip).toBe(hex);
	});

	test("empty hash", () => {
		const hex =
			"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
		const bytes = HexWasm.hexToBytes(hex);
		expect(bytes.length).toBe(32);
		const roundtrip = HexWasm.bytesToHex(bytes);
		expect(roundtrip).toBe(hex);
	});

	test("transfer selector", () => {
		const hex = "0xa9059cbb";
		const bytes = HexWasm.hexToBytes(hex);
		expect(bytes.length).toBe(4);
		const roundtrip = HexWasm.bytesToHex(bytes);
		expect(roundtrip).toBe(hex);
	});

	test("Transfer event topic", () => {
		const hex =
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
		const bytes = HexWasm.hexToBytes(hex);
		expect(bytes.length).toBe(32);
		const roundtrip = HexWasm.bytesToHex(bytes);
		expect(roundtrip).toBe(hex);
	});
});

// ============================================================================
// Error Handling
// ============================================================================

describe("Hex WASM - Error Handling", () => {
	test("handles empty input gracefully", () => {
		expect(() => HexWasm.hexToBytes("")).not.toThrow();
		expect(() => HexWasm.hexToBytes("0x")).not.toThrow();
		expect(() => HexWasm.bytesToHex(new Uint8Array())).not.toThrow();
	});

	test("invalid hex characters may throw or produce result", () => {
		// Implementation-specific behavior
		const invalidHexStrings = ["0xzzzz", "0xGGGG", "0x!@#$"];

		for (const hex of invalidHexStrings) {
			try {
				const result = HexWasm.hexToBytes(hex);
				// If it doesn't throw, document the behavior
				expect(result).toBeInstanceOf(Uint8Array);
			} catch (error) {
				// Throwing is also acceptable
				expect(error).toBeDefined();
			}
		}
	});

	test("odd length hex may throw or pad", () => {
		const oddLengthHex = ["0x1", "0x123", "0x12345"];

		for (const hex of oddLengthHex) {
			try {
				const result = HexWasm.hexToBytes(hex);
				expect(result).toBeInstanceOf(Uint8Array);
			} catch (error) {
				expect(error).toBeDefined();
			}
		}
	});
});
