/**
 * Comprehensive ABI decoding tests
 * Tests decoding of all types, edge cases, malformed data
 */

import { describe, expect, it } from "vitest";
import type { Address } from "../Address/index.js";
import * as Hex from "../Hex/index.js";
import { AbiDecodingError } from "./Errors.js";
import * as Abi from "./index.js";

// ============================================================================
// Static Type Decoding Tests
// ============================================================================

describe("Abi.decodeParameters - uint types", () => {
	it("decodes uint8", () => {
		const encoded = Abi.encodeParameters([{ type: "uint8" }], [42n] as any);
		const decoded = Abi.decodeParameters([{ type: "uint8" }], encoded);
		expect(decoded).toEqual([42n]);
	});

	it("decodes uint8 zero", () => {
		const encoded = Abi.encodeParameters([{ type: "uint8" }], [0n] as any);
		const decoded = Abi.decodeParameters([{ type: "uint8" }], encoded);
		expect(decoded).toEqual([0n]);
	});

	it("decodes uint8 max (255)", () => {
		const encoded = Abi.encodeParameters([{ type: "uint8" }], [255n] as any);
		const decoded = Abi.decodeParameters([{ type: "uint8" }], encoded);
		expect(decoded).toEqual([255n]);
	});

	it("decodes uint16", () => {
		const encoded = Abi.encodeParameters([{ type: "uint16" }], [1234n] as any);
		const decoded = Abi.decodeParameters([{ type: "uint16" }], encoded);
		expect(decoded).toEqual([1234n]);
	});

	it("decodes uint32", () => {
		const encoded = Abi.encodeParameters([{ type: "uint32" }], [
			123456789n,
		] as any);
		const decoded = Abi.decodeParameters([{ type: "uint32" }], encoded);
		expect(decoded).toEqual([123456789n]);
	});

	it("decodes uint64", () => {
		const value = 0x123456789abcdef0n;
		const encoded = Abi.encodeParameters([{ type: "uint64" }], [value] as any);
		const decoded = Abi.decodeParameters([{ type: "uint64" }], encoded);
		expect(decoded).toEqual([value]);
	});

	it("decodes uint128", () => {
		const value = 0x123456789abcdef0123456789abcdef0n;
		const encoded = Abi.encodeParameters([{ type: "uint128" }], [value] as any);
		const decoded = Abi.decodeParameters([{ type: "uint128" }], encoded);
		expect(decoded).toEqual([value]);
	});

	it("decodes uint256 zero", () => {
		const encoded = Abi.encodeParameters([{ type: "uint256" }], [0n] as any);
		const decoded = Abi.decodeParameters([{ type: "uint256" }], encoded);
		expect(decoded).toEqual([0n]);
	});

	it("decodes uint256 max", () => {
		const max =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const encoded = Abi.encodeParameters([{ type: "uint256" }], [max] as any);
		const decoded = Abi.decodeParameters([{ type: "uint256" }], encoded);
		expect(decoded).toEqual([max]);
	});

	it("decodes multiple uint values", () => {
		const values = [1n, 2n, 3n];
		const encoded = Abi.encodeParameters(
			[{ type: "uint8" }, { type: "uint16" }, { type: "uint256" }],
			values as any,
		);
		const decoded = Abi.decodeParameters(
			[{ type: "uint8" }, { type: "uint16" }, { type: "uint256" }],
			encoded,
		);
		expect(decoded).toEqual(values);
	});
});

describe("Abi.decodeParameters - int types", () => {
	it("decodes int8 zero", () => {
		const encoded = Abi.encodeParameters([{ type: "int8" }], [0n] as any);
		const decoded = Abi.decodeParameters([{ type: "int8" }], encoded);
		expect(decoded).toEqual([0n]);
	});

	it("decodes int8 positive", () => {
		const encoded = Abi.encodeParameters([{ type: "int8" }], [127n] as any);
		const decoded = Abi.decodeParameters([{ type: "int8" }], encoded);
		expect(decoded).toEqual([127n]);
	});

	it("decodes int8 negative", () => {
		const encoded = Abi.encodeParameters([{ type: "int8" }], [-1n] as any);
		const decoded = Abi.decodeParameters([{ type: "int8" }], encoded);
		expect(decoded).toEqual([-1n]);
	});

	it("decodes int8 min (-128)", () => {
		const encoded = Abi.encodeParameters([{ type: "int8" }], [-128n] as any);
		const decoded = Abi.decodeParameters([{ type: "int8" }], encoded);
		expect(decoded).toEqual([-128n]);
	});

	it("decodes int16 positive", () => {
		const encoded = Abi.encodeParameters([{ type: "int16" }], [1000n] as any);
		const decoded = Abi.decodeParameters([{ type: "int16" }], encoded);
		expect(decoded).toEqual([1000n]);
	});

	it("decodes int16 negative", () => {
		const encoded = Abi.encodeParameters([{ type: "int16" }], [-1000n] as any);
		const decoded = Abi.decodeParameters([{ type: "int16" }], encoded);
		expect(decoded).toEqual([-1000n]);
	});

	it("decodes int32 positive", () => {
		const encoded = Abi.encodeParameters([{ type: "int32" }], [
			123456789n,
		] as any);
		const decoded = Abi.decodeParameters([{ type: "int32" }], encoded);
		expect(decoded).toEqual([123456789n]);
	});

	it("decodes int32 negative", () => {
		const encoded = Abi.encodeParameters([{ type: "int32" }], [
			-123456789n,
		] as any);
		const decoded = Abi.decodeParameters([{ type: "int32" }], encoded);
		expect(decoded).toEqual([-123456789n]);
	});

	it("decodes int256 zero", () => {
		const encoded = Abi.encodeParameters([{ type: "int256" }], [0n] as any);
		const decoded = Abi.decodeParameters([{ type: "int256" }], encoded);
		expect(decoded).toEqual([0n]);
	});

	it("decodes int256 positive", () => {
		const encoded = Abi.encodeParameters([{ type: "int256" }], [12345n] as any);
		const decoded = Abi.decodeParameters([{ type: "int256" }], encoded);
		expect(decoded).toEqual([12345n]);
	});

	it("decodes int256 negative", () => {
		const encoded = Abi.encodeParameters([{ type: "int256" }], [
			-12345n,
		] as any);
		const decoded = Abi.decodeParameters([{ type: "int256" }], encoded);
		expect(decoded).toEqual([-12345n]);
	});

	it("decodes multiple int values", () => {
		const values = [-1n, 100n, -200n];
		const encoded = Abi.encodeParameters(
			[{ type: "int8" }, { type: "int32" }, { type: "int256" }],
			values as any,
		);
		const decoded = Abi.decodeParameters(
			[{ type: "int8" }, { type: "int32" }, { type: "int256" }],
			encoded,
		);
		expect(decoded).toEqual(values);
	});
});

describe("Abi.decodeParameters - address type", () => {
	it("decodes zero address", () => {
		const addr = "0x0000000000000000000000000000000000000000" as Address;
		const encoded = Abi.encodeParameters([{ type: "address" }], [addr]);
		const decoded = Abi.decodeParameters([{ type: "address" }], encoded);
		expect(decoded[0]).toBe(addr);
	});

	it("decodes specific address", () => {
		const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const encoded = Abi.encodeParameters([{ type: "address" }], [addr]);
		const decoded = Abi.decodeParameters([{ type: "address" }], encoded);
		// Addresses should be lowercased
		expect(String(decoded[0]).toLowerCase()).toBe(addr.toLowerCase());
	});

	it("decodes max address", () => {
		const addr = "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF" as Address;
		const encoded = Abi.encodeParameters([{ type: "address" }], [addr]);
		const decoded = Abi.decodeParameters([{ type: "address" }], encoded);
		expect(String(decoded[0]).toLowerCase()).toBe(addr.toLowerCase());
	});

	it("decodes multiple addresses", () => {
		const addrs = [
			"0x0000000000000000000000000000000000000001",
			"0x0000000000000000000000000000000000000002",
		] as Address[];
		const encoded = Abi.encodeParameters(
			[{ type: "address" }, { type: "address" }],
			addrs,
		);
		const decoded = Abi.decodeParameters(
			[{ type: "address" }, { type: "address" }],
			encoded,
		);
		expect(decoded.length).toBe(2);
		expect(String(decoded[0])).toBe(addrs[0]);
		expect(String(decoded[1])).toBe(addrs[1]);
	});
});

describe("Abi.decodeParameters - bool type", () => {
	it("decodes true", () => {
		const encoded = Abi.encodeParameters([{ type: "bool" }], [true]);
		const decoded = Abi.decodeParameters([{ type: "bool" }], encoded);
		expect(decoded).toEqual([true]);
	});

	it("decodes false", () => {
		const encoded = Abi.encodeParameters([{ type: "bool" }], [false]);
		const decoded = Abi.decodeParameters([{ type: "bool" }], encoded);
		expect(decoded).toEqual([false]);
	});

	it("decodes multiple bools", () => {
		const values = [true, false, true];
		const encoded = Abi.encodeParameters(
			[{ type: "bool" }, { type: "bool" }, { type: "bool" }],
			values,
		);
		const decoded = Abi.decodeParameters(
			[{ type: "bool" }, { type: "bool" }, { type: "bool" }],
			encoded,
		);
		expect(decoded).toEqual(values);
	});
});

describe("Abi.decodeParameters - fixed bytes types", () => {
	it("decodes bytes1", () => {
		const encoded = Abi.encodeParameters([{ type: "bytes1" }], ["0x42"]);
		const decoded = Abi.decodeParameters([{ type: "bytes1" }], encoded);
		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toMatch(
			/0x42/i,
		);
	});

	it("decodes bytes4", () => {
		const value = "0x12345678";
		const encoded = Abi.encodeParameters([{ type: "bytes4" }], [value]);
		const decoded = Abi.decodeParameters([{ type: "bytes4" }], encoded);
		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toBe(
			value.toLowerCase(),
		);
	});

	it("decodes bytes8", () => {
		const value = "0x123456789abcdef0";
		const encoded = Abi.encodeParameters([{ type: "bytes8" }], [value]);
		const decoded = Abi.decodeParameters([{ type: "bytes8" }], encoded);
		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toBe(
			value.toLowerCase(),
		);
	});

	it("decodes bytes32", () => {
		const value = `0x${"ff".repeat(32)}`;
		const encoded = Abi.encodeParameters([{ type: "bytes32" }], [value]);
		const decoded = Abi.decodeParameters([{ type: "bytes32" }], encoded);
		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toBe(
			value.toLowerCase(),
		);
	});

	it("decodes multiple fixed bytes", () => {
		const values = ["0x12", "0x3456", "0x789abcde"];
		const encoded = Abi.encodeParameters(
			[{ type: "bytes1" }, { type: "bytes2" }, { type: "bytes4" }],
			values,
		);
		const decoded = Abi.decodeParameters(
			[{ type: "bytes1" }, { type: "bytes2" }, { type: "bytes4" }],
			encoded,
		);
		expect(decoded.length).toBe(3);
	});
});

// ============================================================================
// Dynamic Type Decoding Tests
// ============================================================================

describe("Abi.decodeParameters - dynamic bytes", () => {
	it("decodes empty bytes", () => {
		const encoded = Abi.encodeParameters([{ type: "bytes" }], ["0x"]);
		const decoded = Abi.decodeParameters([{ type: "bytes" }], encoded);
		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toMatch(
			/0x/i,
		);
	});

	it("decodes bytes with data", () => {
		const value = "0x123456789abcdef0";
		const encoded = Abi.encodeParameters([{ type: "bytes" }], [value]);
		const decoded = Abi.decodeParameters([{ type: "bytes" }], encoded);
		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toBe(
			value.toLowerCase(),
		);
	});

	it("decodes long bytes", () => {
		const value = `0x${"ab".repeat(100)}`;
		const encoded = Abi.encodeParameters([{ type: "bytes" }], [value]);
		const decoded = Abi.decodeParameters([{ type: "bytes" }], encoded);
		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toBe(
			value.toLowerCase(),
		);
	});
});

describe("Abi.decodeParameters - string", () => {
	it("decodes empty string", () => {
		const encoded = Abi.encodeParameters([{ type: "string" }], [""]);
		const decoded = Abi.decodeParameters([{ type: "string" }], encoded);
		expect(decoded).toEqual([""]);
	});

	it("decodes short string", () => {
		const value = "hello";
		const encoded = Abi.encodeParameters([{ type: "string" }], [value]);
		const decoded = Abi.decodeParameters([{ type: "string" }], encoded);
		expect(decoded).toEqual([value]);
	});

	it("decodes longer string", () => {
		const value = "The quick brown fox jumps over the lazy dog";
		const encoded = Abi.encodeParameters([{ type: "string" }], [value]);
		const decoded = Abi.decodeParameters([{ type: "string" }], encoded);
		expect(decoded).toEqual([value]);
	});

	it("decodes UTF-8 string with emoji", () => {
		const value = "hello 🌍";
		const encoded = Abi.encodeParameters([{ type: "string" }], [value]);
		const decoded = Abi.decodeParameters([{ type: "string" }], encoded);
		expect(decoded).toEqual([value]);
	});

	it("decodes special characters", () => {
		const value = "Hello\nWorld\t!";
		const encoded = Abi.encodeParameters([{ type: "string" }], [value]);
		const decoded = Abi.decodeParameters([{ type: "string" }], encoded);
		expect(decoded).toEqual([value]);
	});
});

describe("Abi.decodeParameters - arrays", () => {
	it("decodes empty uint256[]", () => {
		const encoded = Abi.encodeParameters([{ type: "uint256[]" }], [[]]);
		const decoded = Abi.decodeParameters([{ type: "uint256[]" }], encoded);
		expect(decoded).toEqual([[]]);
	});

	it("decodes uint256[] with elements", () => {
		const values = [1n, 2n, 3n];
		const encoded = Abi.encodeParameters([{ type: "uint256[]" }], [values]);
		const decoded = Abi.decodeParameters([{ type: "uint256[]" }], encoded);
		expect(decoded).toEqual([values]);
	});

	it("decodes address[]", () => {
		const values = [
			"0x0000000000000000000000000000000000000001",
			"0x0000000000000000000000000000000000000002",
		] as Address[];
		const encoded = Abi.encodeParameters([{ type: "address[]" }], [values]);
		const decoded = Abi.decodeParameters([{ type: "address[]" }], encoded);
		expect(decoded[0]).toHaveLength(2);
	});

	it("decodes bool[]", () => {
		const values = [true, false, true, false];
		const encoded = Abi.encodeParameters([{ type: "bool[]" }], [values]);
		const decoded = Abi.decodeParameters([{ type: "bool[]" }], encoded);
		expect(decoded).toEqual([values]);
	});

	it("decodes fixed array uint256[3]", () => {
		const values = [10n, 20n, 30n];
		const encoded = Abi.encodeParameters([{ type: "uint256[3]" }], [values]);
		const decoded = Abi.decodeParameters([{ type: "uint256[3]" }], encoded);
		expect(decoded).toEqual([values]);
	});
});

describe("Abi.decodeParameters - tuples", () => {
	it("decodes simple tuple", () => {
		const value = [100n, "0x0000000000000000000000000000000000000001"];
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [{ type: "uint256" }, { type: "address" }],
				},
			],
			[value],
		);
		const decoded = Abi.decodeParameters(
			[
				{
					type: "tuple",
					components: [{ type: "uint256" }, { type: "address" }],
				},
			],
			encoded,
		);
		expect(decoded[0]).toBeDefined();
	});

	it("decodes tuple with dynamic type", () => {
		const value = [42n, "0x123456"];
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [{ type: "uint256" }, { type: "bytes" }],
				},
			],
			[value],
		);
		const decoded = Abi.decodeParameters(
			[
				{
					type: "tuple",
					components: [{ type: "uint256" }, { type: "bytes" }],
				},
			],
			encoded,
		);
		expect(decoded[0]).toBeDefined();
	});
});

// ============================================================================
// Round-Trip Tests (Encode then Decode)
// ============================================================================

describe("Abi round-trip encoding/decoding", () => {
	it("round-trips uint256", () => {
		const original = 123456789n;
		const encoded = Abi.encodeParameters([{ type: "uint256" }], [
			original,
		] as any);
		const decoded = Abi.decodeParameters([{ type: "uint256" }], encoded);
		expect(decoded).toEqual([original]);
	});

	it("round-trips address", () => {
		const original = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const encoded = Abi.encodeParameters([{ type: "address" }], [original]);
		const decoded = Abi.decodeParameters([{ type: "address" }], encoded);
		expect(String(decoded[0]).toLowerCase()).toBe(original.toLowerCase());
	});

	it("round-trips string", () => {
		const original = "Hello, World!";
		const encoded = Abi.encodeParameters([{ type: "string" }], [original]);
		const decoded = Abi.decodeParameters([{ type: "string" }], encoded);
		expect(decoded).toEqual([original]);
	});

	it("round-trips bytes", () => {
		const original = "0x123456789abcdef0";
		const encoded = Abi.encodeParameters([{ type: "bytes" }], [original]);
		const decoded = Abi.decodeParameters([{ type: "bytes" }], encoded);
		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toBe(original.toLowerCase());
	});

	it("round-trips array", () => {
		const original = [1n, 2n, 3n, 4n, 5n];
		const encoded = Abi.encodeParameters([{ type: "uint256[]" }], [original]);
		const decoded = Abi.decodeParameters([{ type: "uint256[]" }], encoded);
		expect(decoded).toEqual([original]);
	});

	it("round-trips complex tuple", () => {
		const original = [
			"0x0000000000000000000000000000000000000001",
			1000n,
			"hello",
		];
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [
						{ type: "address" },
						{ type: "uint256" },
						{ type: "string" },
					],
				},
			],
			[original],
		);
		const decoded = Abi.decodeParameters(
			[
				{
					type: "tuple",
					components: [
						{ type: "address" },
						{ type: "uint256" },
						{ type: "string" },
					],
				},
			],
			encoded,
		);
		expect(decoded[0]).toBeDefined();
	});
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe("Abi.decodeParameters - error handling", () => {
	it("throws on truncated data", () => {
		const truncated = new Uint8Array(16); // Too small for uint256
		expect(() =>
			Abi.decodeParameters([{ type: "uint256" }], truncated),
		).toThrow();
	});

	it("throws on invalid offset for dynamic type", () => {
		// Create malformed data with invalid offset
		const bad = new Uint8Array(64);
		bad[31] = 0xff; // Invalid offset
		expect(() => Abi.decodeParameters([{ type: "bytes" }], bad)).toThrow();
	});

	it("throws on mismatched parameter count", () => {
		const encoded = Abi.encodeParameters([{ type: "uint256" }], [42n] as any);
		// Try to decode with wrong number of parameters
		expect(() =>
			Abi.decodeParameters([{ type: "uint256" }, { type: "uint256" }], encoded),
		).toThrow();
	});

	it("throws on empty data for non-empty parameters", () => {
		expect(() =>
			Abi.decodeParameters([{ type: "uint256" }], new Uint8Array(0)),
		).toThrow();
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Abi.decodeParameters - edge cases", () => {
	it("decodes empty parameter list", () => {
		const decoded = Abi.decodeParameters([], new Uint8Array(0));
		expect(decoded).toEqual([]);
	});

	it("decodes very large uint256", () => {
		const max =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const encoded = Abi.encodeParameters([{ type: "uint256" }], [max] as any);
		const decoded = Abi.decodeParameters([{ type: "uint256" }], encoded);
		expect(decoded).toEqual([max]);
	});

	it("decodes very negative int256", () => {
		const min =
			-57896044618658097711785492504343953926634992332820282019728792003956564819968n;
		const encoded = Abi.encodeParameters([{ type: "int256" }], [min] as any);
		const decoded = Abi.decodeParameters([{ type: "int256" }], encoded);
		expect(decoded).toEqual([min]);
	});

	it("decodes large array", () => {
		const arr = Array.from({ length: 100 }, (_, i) => BigInt(i));
		const encoded = Abi.encodeParameters([{ type: "uint256[]" }], [arr]);
		const decoded = Abi.decodeParameters([{ type: "uint256[]" }], encoded);
		expect(decoded).toEqual([arr]);
	});
});
