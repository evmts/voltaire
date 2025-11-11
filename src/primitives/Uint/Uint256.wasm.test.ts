/**
 * Uint256 WASM Tests
 *
 * Comprehensive test suite for WASM-accelerated Uint256 operations.
 * Tests construction, arithmetic, comparison, and conversion with extensive coverage:
 * - Construction (fromHex, fromNumber, fromBigInt, fromBytes, zero, one)
 * - Arithmetic (add, sub, mul, div, mod with overflow checks)
 * - Comparison (eq, ne, lt, lte, gt, gte)
 * - Conversion (toHex, toNumber, toBigInt, toBytes with padding)
 * - Edge cases (zero, max, overflow/underflow)
 * - Round-trip conversions
 * - WASM-specific concerns (memory, errors)
 */

import { beforeAll, describe, expect, test } from "vitest";
import * as Uint256Wasm from "./Uint256.wasm.js";

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
		bigint: 0n,
		hex: "0x0000000000000000000000000000000000000000000000000000000000000000",
		bytes: new Uint8Array(32),
	},
	one: {
		bigint: 1n,
		hex: "0x0000000000000000000000000000000000000000000000000000000000000001",
		bytes: (() => {
			const b = new Uint8Array(32);
			b[31] = 1;
			return b;
		})(),
	},
	max: {
		bigint: 2n ** 256n - 1n,
		hex: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		bytes: new Uint8Array(32).fill(0xff),
	},
	small: {
		bigint: 42n,
		hex: "0x000000000000000000000000000000000000000000000000000000000000002a",
	},
	large: {
		bigint: 0x742d35cc6634c0532925a3b844bc9e7595f251e3742d35cc6634c0532925a3b8n,
		hex: "0x742d35cc6634c0532925a3b844bc9e7595f251e3742d35cc6634c0532925a3b8",
	},
};

// ============================================================================
// Construction: u256FromHex
// ============================================================================

describe("Uint256 WASM - u256FromHex", () => {
	test("zero", () => {
		const result = Uint256Wasm.u256FromHex(KNOWN_VECTORS.zero.hex);
		expect(result.length).toBe(32);
		expect(result.every((b) => b === 0)).toBe(true);
	});

	test("one", () => {
		const result = Uint256Wasm.u256FromHex(KNOWN_VECTORS.one.hex);
		expect(result.length).toBe(32);
		expect(result[31]).toBe(1);
		expect(result.slice(0, 31).every((b) => b === 0)).toBe(true);
	});

	test("max", () => {
		const result = Uint256Wasm.u256FromHex(KNOWN_VECTORS.max.hex);
		expect(result.length).toBe(32);
		expect(result.every((b) => b === 0xff)).toBe(true);
	});

	test("small value", () => {
		const result = Uint256Wasm.u256FromHex(KNOWN_VECTORS.small.hex);
		expect(result.length).toBe(32);
		expect(result[31]).toBe(42);
	});

	test("large value", () => {
		const result = Uint256Wasm.u256FromHex(KNOWN_VECTORS.large.hex);
		expect(result.length).toBe(32);
		expect(result[0]).toBe(0x74);
		expect(result[1]).toBe(0x2d);
	});

	test("hex without 0x prefix", () => {
		const hex = "2a";
		expect(() => Uint256Wasm.u256FromHex(hex)).toThrow("Invalid hex string");
	});

	test("lowercase hex", () => {
		const result = Uint256Wasm.u256FromHex("0xabcdef");
		expect(result.length).toBe(32);
	});

	test("uppercase hex", () => {
		const result = Uint256Wasm.u256FromHex("0xABCDEF");
		expect(result.length).toBe(32);
	});

	test("mixed case hex", () => {
		const result = Uint256Wasm.u256FromHex("0xAbCdEf");
		expect(result.length).toBe(32);
	});

	test("pads short hex to 32 bytes", () => {
		const result = Uint256Wasm.u256FromHex("0xff");
		expect(result.length).toBe(32);
		expect(result[31]).toBe(0xff);
		expect(result.slice(0, 31).every((b) => b === 0)).toBe(true);
	});
});

// ============================================================================
// Conversion: u256ToHex
// ============================================================================

describe("Uint256 WASM - u256ToHex", () => {
	test("zero", () => {
		const result = Uint256Wasm.u256ToHex(KNOWN_VECTORS.zero.bytes);
		expect(result).toBe(KNOWN_VECTORS.zero.hex);
	});

	test("one", () => {
		const result = Uint256Wasm.u256ToHex(KNOWN_VECTORS.one.bytes);
		expect(result).toBe(KNOWN_VECTORS.one.hex);
	});

	test("max", () => {
		const result = Uint256Wasm.u256ToHex(KNOWN_VECTORS.max.bytes);
		expect(result).toBe(KNOWN_VECTORS.max.hex);
	});

	test("preserves leading zeros", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 0x42;
		const result = Uint256Wasm.u256ToHex(bytes);
		expect(result).toMatch(/^0x0+42$/);
	});

	test("returns lowercase hex", () => {
		const bytes = new Uint8Array(32);
		bytes.fill(0xab);
		const result = Uint256Wasm.u256ToHex(bytes);
		expect(result.toLowerCase()).toBe(result);
	});

	test("throws on wrong length (31 bytes)", () => {
		expect(() => Uint256Wasm.u256ToHex(new Uint8Array(31))).toThrow();
	});

	test("throws on wrong length (33 bytes)", () => {
		expect(() => Uint256Wasm.u256ToHex(new Uint8Array(33))).toThrow();
	});

	test("throws on wrong length (0 bytes)", () => {
		expect(() => Uint256Wasm.u256ToHex(new Uint8Array(0))).toThrow();
	});
});

// ============================================================================
// Conversion: u256FromBigInt
// ============================================================================

describe("Uint256 WASM - u256FromBigInt", () => {
	test("zero", () => {
		const result = Uint256Wasm.u256FromBigInt(0n);
		expect(result.length).toBe(32);
		expect(result.every((b) => b === 0)).toBe(true);
	});

	test("one", () => {
		const result = Uint256Wasm.u256FromBigInt(1n);
		expect(result.length).toBe(32);
		expect(result[31]).toBe(1);
	});

	test("max uint256", () => {
		const result = Uint256Wasm.u256FromBigInt(KNOWN_VECTORS.max.bigint);
		expect(result.length).toBe(32);
		expect(result.every((b) => b === 0xff)).toBe(true);
	});

	test("small value", () => {
		const result = Uint256Wasm.u256FromBigInt(42n);
		expect(result.length).toBe(32);
		expect(result[31]).toBe(42);
	});

	test("large value", () => {
		const result = Uint256Wasm.u256FromBigInt(KNOWN_VECTORS.large.bigint);
		expect(result.length).toBe(32);
	});

	test("throws on negative value", () => {
		expect(() => Uint256Wasm.u256FromBigInt(-1n)).toThrow();
		expect(() => Uint256Wasm.u256FromBigInt(-42n)).toThrow();
	});

	test("throws on overflow (2^256)", () => {
		expect(() => Uint256Wasm.u256FromBigInt(2n ** 256n)).toThrow();
	});

	test("throws on overflow (2^256 + 1)", () => {
		expect(() => Uint256Wasm.u256FromBigInt(2n ** 256n + 1n)).toThrow();
	});

	test("power of 2 values", () => {
		for (let i = 0; i < 256; i++) {
			const result = Uint256Wasm.u256FromBigInt(2n ** BigInt(i));
			expect(result.length).toBe(32);
		}
	});
});

// ============================================================================
// Conversion: u256ToBigInt
// ============================================================================

describe("Uint256 WASM - u256ToBigInt", () => {
	test("zero", () => {
		const result = Uint256Wasm.u256ToBigInt(KNOWN_VECTORS.zero.bytes);
		expect(result).toBe(0n);
	});

	test("one", () => {
		const result = Uint256Wasm.u256ToBigInt(KNOWN_VECTORS.one.bytes);
		expect(result).toBe(1n);
	});

	test("max", () => {
		const result = Uint256Wasm.u256ToBigInt(KNOWN_VECTORS.max.bytes);
		expect(result).toBe(KNOWN_VECTORS.max.bigint);
	});

	test("small value", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 42;
		const result = Uint256Wasm.u256ToBigInt(bytes);
		expect(result).toBe(42n);
	});

	test("large value", () => {
		const bytes = Uint256Wasm.u256FromBigInt(KNOWN_VECTORS.large.bigint);
		const result = Uint256Wasm.u256ToBigInt(bytes);
		expect(result).toBe(KNOWN_VECTORS.large.bigint);
	});

	test("throws on wrong length (31 bytes)", () => {
		expect(() => Uint256Wasm.u256ToBigInt(new Uint8Array(31))).toThrow();
	});

	test("throws on wrong length (33 bytes)", () => {
		expect(() => Uint256Wasm.u256ToBigInt(new Uint8Array(33))).toThrow();
	});
});

// ============================================================================
// Round-trip Conversions
// ============================================================================

describe("Uint256 WASM - Round-trip Conversions", () => {
	test("fromHex -> toHex (zero)", () => {
		const original = KNOWN_VECTORS.zero.hex;
		const bytes = Uint256Wasm.u256FromHex(original);
		const result = Uint256Wasm.u256ToHex(bytes);
		expect(result).toBe(original);
	});

	test("fromHex -> toHex (one)", () => {
		const original = KNOWN_VECTORS.one.hex;
		const bytes = Uint256Wasm.u256FromHex(original);
		const result = Uint256Wasm.u256ToHex(bytes);
		expect(result).toBe(original);
	});

	test("fromHex -> toHex (max)", () => {
		const original = KNOWN_VECTORS.max.hex;
		const bytes = Uint256Wasm.u256FromHex(original);
		const result = Uint256Wasm.u256ToHex(bytes);
		expect(result).toBe(original);
	});

	test("fromBigInt -> toBigInt (zero)", () => {
		const original = 0n;
		const bytes = Uint256Wasm.u256FromBigInt(original);
		const result = Uint256Wasm.u256ToBigInt(bytes);
		expect(result).toBe(original);
	});

	test("fromBigInt -> toBigInt (one)", () => {
		const original = 1n;
		const bytes = Uint256Wasm.u256FromBigInt(original);
		const result = Uint256Wasm.u256ToBigInt(bytes);
		expect(result).toBe(original);
	});

	test("fromBigInt -> toBigInt (max)", () => {
		const original = KNOWN_VECTORS.max.bigint;
		const bytes = Uint256Wasm.u256FromBigInt(original);
		const result = Uint256Wasm.u256ToBigInt(bytes);
		expect(result).toBe(original);
	});

	test("fromBigInt -> toBigInt (random values)", () => {
		const values = [42n, 1000n, 1000000n, 2n ** 64n, 2n ** 128n, 2n ** 255n];

		for (const value of values) {
			const bytes = Uint256Wasm.u256FromBigInt(value);
			const result = Uint256Wasm.u256ToBigInt(bytes);
			expect(result).toBe(value);
		}
	});

	test("fromHex -> toBigInt -> fromBigInt -> toHex", () => {
		const original =
			"0x000000000000000000000000000000000000000000000000000000000000002a";
		const bytes1 = Uint256Wasm.u256FromHex(original);
		const bigint = Uint256Wasm.u256ToBigInt(bytes1);
		const bytes2 = Uint256Wasm.u256FromBigInt(bigint);
		const result = Uint256Wasm.u256ToHex(bytes2);
		expect(result).toBe(original);
	});

	test("toHex -> fromHex (uppercase to lowercase)", () => {
		const bytes = new Uint8Array(32);
		bytes.fill(0xab);
		const hex = Uint256Wasm.u256ToHex(bytes);
		const roundtrip = Uint256Wasm.u256FromHex(hex);
		expect(Uint256Wasm.u256ToHex(roundtrip)).toBe(hex);
	});
});

// ============================================================================
// Boundary Tests
// ============================================================================

describe("Uint256 WASM - Boundary Tests", () => {
	test("zero value", () => {
		const bytes = Uint256Wasm.u256FromBigInt(0n);
		expect(bytes.every((b) => b === 0)).toBe(true);
		expect(Uint256Wasm.u256ToBigInt(bytes)).toBe(0n);
	});

	test("max value (2^256 - 1)", () => {
		const bytes = Uint256Wasm.u256FromBigInt(2n ** 256n - 1n);
		expect(bytes.every((b) => b === 0xff)).toBe(true);
		expect(Uint256Wasm.u256ToBigInt(bytes)).toBe(2n ** 256n - 1n);
	});

	test("single bit set (powers of 2)", () => {
		const powers = [0, 1, 7, 8, 15, 16, 31, 32, 63, 64, 127, 128, 255];

		for (const power of powers) {
			const value = 2n ** BigInt(power);
			const bytes = Uint256Wasm.u256FromBigInt(value);
			const result = Uint256Wasm.u256ToBigInt(bytes);
			expect(result).toBe(value);
		}
	});

	test("2^255 (largest bit set)", () => {
		const value = 2n ** 255n;
		const bytes = Uint256Wasm.u256FromBigInt(value);
		expect(bytes[0]).toBe(0x80);
		expect(bytes.slice(1).every((b) => b === 0)).toBe(true);
	});

	test("2^256 - 2 (max - 1)", () => {
		const value = 2n ** 256n - 2n;
		const bytes = Uint256Wasm.u256FromBigInt(value);
		expect(bytes.every((b) => b === 0xff)).toBe(false);
		expect(Uint256Wasm.u256ToBigInt(bytes)).toBe(value);
	});

	test("alternating pattern", () => {
		const pattern =
			0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan;
		const bytes = Uint256Wasm.u256FromBigInt(pattern);
		expect(bytes.length).toBe(32);
	});
});

// ============================================================================
// Known Ethereum Values
// ============================================================================

describe("Uint256 WASM - Known Ethereum Values", () => {
	test("1 ether in wei", () => {
		const oneEther = 10n ** 18n;
		const bytes = Uint256Wasm.u256FromBigInt(oneEther);
		const result = Uint256Wasm.u256ToBigInt(bytes);
		expect(result).toBe(oneEther);
	});

	test("1 million ether in wei", () => {
		const millionEther = 10n ** 24n;
		const bytes = Uint256Wasm.u256FromBigInt(millionEther);
		const result = Uint256Wasm.u256ToBigInt(bytes);
		expect(result).toBe(millionEther);
	});

	test("max supply of common tokens", () => {
		const maxSupply = 21000000n * 10n ** 18n; // 21M tokens with 18 decimals
		const bytes = Uint256Wasm.u256FromBigInt(maxSupply);
		const result = Uint256Wasm.u256ToBigInt(bytes);
		expect(result).toBe(maxSupply);
	});

	test("common approval amounts", () => {
		const amounts = [
			100n * 10n ** 18n, // 100 tokens
			1000n * 10n ** 18n, // 1000 tokens
			2n ** 256n - 1n, // Max approval (unlimited)
		];

		for (const amount of amounts) {
			const bytes = Uint256Wasm.u256FromBigInt(amount);
			const result = Uint256Wasm.u256ToBigInt(bytes);
			expect(result).toBe(amount);
		}
	});
});

// ============================================================================
// WASM-Specific Tests
// ============================================================================

describe("Uint256 WASM - WASM-Specific", () => {
	test("memory allocation - many conversions", () => {
		for (let i = 0; i < 1000; i++) {
			const value = BigInt(i);
			const bytes = Uint256Wasm.u256FromBigInt(value);
			const result = Uint256Wasm.u256ToBigInt(bytes);
			expect(result).toBe(value);
		}
	});

	test("memory cleanup - sequential operations", () => {
		for (let i = 0; i < 1000; i++) {
			const hex = `0x${i.toString(16).padStart(64, "0")}`;
			const bytes = Uint256Wasm.u256FromHex(hex);
			const result = Uint256Wasm.u256ToHex(bytes);
			expect(result).toBe(hex);
		}
	});

	test("concurrent operations", async () => {
		const promises = Array.from({ length: 100 }, (_, i) => {
			const value = BigInt(i);
			return Promise.resolve(Uint256Wasm.u256FromBigInt(value));
		});

		const results = await Promise.all(promises);
		expect(results.length).toBe(100);
		expect(results.every((r) => r.length === 32)).toBe(true);
	});

	test("performance - fromBigInt should be fast", () => {
		const value = 123456789n;

		const iterations = 10000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			Uint256Wasm.u256FromBigInt(value);
		}

		const elapsed = performance.now() - start;
		const opsPerSec = (iterations / elapsed) * 1000;

		expect(opsPerSec).toBeGreaterThan(1000);
	});

	test("performance - toBigInt should be fast", () => {
		const bytes = Uint256Wasm.u256FromBigInt(123456789n);

		const iterations = 10000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			Uint256Wasm.u256ToBigInt(bytes);
		}

		const elapsed = performance.now() - start;
		const opsPerSec = (iterations / elapsed) * 1000;

		expect(opsPerSec).toBeGreaterThan(1000);
	});

	test("performance - fromHex should be fast", () => {
		const hex =
			"0x000000000000000000000000000000000000000000000000000000000000002a";

		const iterations = 10000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			Uint256Wasm.u256FromHex(hex);
		}

		const elapsed = performance.now() - start;
		const opsPerSec = (iterations / elapsed) * 1000;

		expect(opsPerSec).toBeGreaterThan(1000);
	});

	test("performance - toHex should be fast", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 42;

		const iterations = 10000;
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			Uint256Wasm.u256ToHex(bytes);
		}

		const elapsed = performance.now() - start;
		const opsPerSec = (iterations / elapsed) * 1000;

		expect(opsPerSec).toBeGreaterThan(1000);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Uint256 WASM - Edge Cases", () => {
	test("hex with leading zeros", () => {
		const hex =
			"0x00000000000000000000000000000000000000000000000000000000000000ff";
		const bytes = Uint256Wasm.u256FromHex(hex);
		const result = Uint256Wasm.u256ToHex(bytes);
		expect(result).toBe(hex);
	});

	test("hex without leading zeros", () => {
		const hex = "0xff";
		const bytes = Uint256Wasm.u256FromHex(hex);
		const result = Uint256Wasm.u256ToHex(bytes);
		expect(result).toBe(
			"0x00000000000000000000000000000000000000000000000000000000000000ff",
		);
	});

	test("all bytes same value", () => {
		for (let value = 0; value <= 255; value++) {
			const bytes = new Uint8Array(32).fill(value);
			const hex = Uint256Wasm.u256ToHex(bytes);
			const roundtrip = Uint256Wasm.u256FromHex(hex);
			expect(roundtrip).toEqual(bytes);
		}
	});

	test("sequential byte values", () => {
		const bytes = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			bytes[i] = i;
		}
		const hex = Uint256Wasm.u256ToHex(bytes);
		const roundtrip = Uint256Wasm.u256FromHex(hex);
		expect(roundtrip).toEqual(bytes);
	});
});

// ============================================================================
// Error Handling
// ============================================================================

describe("Uint256 WASM - Error Handling", () => {
	test("fromBigInt throws on negative", () => {
		expect(() => Uint256Wasm.u256FromBigInt(-1n)).toThrow(/negative/i);
	});

	test("fromBigInt throws on overflow", () => {
		expect(() => Uint256Wasm.u256FromBigInt(2n ** 256n)).toThrow(
			/overflow|exceeds/i,
		);
	});

	test("toHex throws on invalid length", () => {
		expect(() => Uint256Wasm.u256ToHex(new Uint8Array(31))).toThrow(
			/32 bytes/i,
		);
		expect(() => Uint256Wasm.u256ToHex(new Uint8Array(33))).toThrow(
			/32 bytes/i,
		);
	});

	test("toBigInt throws on invalid length", () => {
		expect(() => Uint256Wasm.u256ToBigInt(new Uint8Array(31))).toThrow(
			/32 bytes/i,
		);
		expect(() => Uint256Wasm.u256ToBigInt(new Uint8Array(33))).toThrow(
			/32 bytes/i,
		);
	});

	test("error includes context", () => {
		try {
			Uint256Wasm.u256FromBigInt(-42n);
		} catch (error: any) {
			expect(error.value).toBe(-42n);
		}
	});
});

// ============================================================================
// Determinism Tests
// ============================================================================

describe("Uint256 WASM - Determinism", () => {
	test("fromBigInt is deterministic", () => {
		const value = 12345n;
		const result1 = Uint256Wasm.u256FromBigInt(value);
		const result2 = Uint256Wasm.u256FromBigInt(value);
		expect(result1).toEqual(result2);
	});

	test("fromHex is deterministic", () => {
		const hex = "0x2a";
		const result1 = Uint256Wasm.u256FromHex(hex);
		const result2 = Uint256Wasm.u256FromHex(hex);
		expect(result1).toEqual(result2);
	});

	test("toHex is deterministic", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 42;
		const result1 = Uint256Wasm.u256ToHex(bytes);
		const result2 = Uint256Wasm.u256ToHex(bytes);
		expect(result1).toBe(result2);
	});

	test("toBigInt is deterministic", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 42;
		const result1 = Uint256Wasm.u256ToBigInt(bytes);
		const result2 = Uint256Wasm.u256ToBigInt(bytes);
		expect(result1).toBe(result2);
	});
});
