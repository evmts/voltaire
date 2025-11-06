/**
 * Comprehensive ABI encoding tests for dynamic types
 * Dynamic types: bytes, string, T[], T[k], tuples
 */

import { describe, expect, it } from "vitest";
import * as Abi from "./index.js";
import type { Address } from "../Address/index.js";

// ============================================================================
// Dynamic Bytes Type
// ============================================================================

describe("Abi.encodeParameters - dynamic bytes", () => {
	it("encodes empty bytes", () => {
		const encoded = Abi.encodeParameters([{ type: "bytes" }], ["0x"]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		// Offset (32) + Length (32) = 64 bytes
		expect(encoded.length).toBe(64);
		// First 32 bytes: offset to data (0x20 = 32)
		expect(encoded[31]).toBe(0x20);
		// Next 32 bytes: length = 0
		expect(encoded.slice(32, 64).every((b) => b === 0)).toBe(true);
	});

	it("encodes bytes with single byte", () => {
		const encoded = Abi.encodeParameters([{ type: "bytes" }], ["0x42"]);
		// Offset (32) + Length (32) + Data padded to 32 = 96 bytes
		expect(encoded.length).toBe(96);
		expect(encoded[31]).toBe(0x20); // offset
		expect(encoded[63]).toBe(1); // length
		expect(encoded[64]).toBe(0x42); // data
		expect(encoded.slice(65, 96).every((b) => b === 0)).toBe(true);
	});

	it("encodes bytes with multiple bytes", () => {
		const data = "0x123456789abcdef0";
		const encoded = Abi.encodeParameters([{ type: "bytes" }], [data]);
		// Offset (32) + Length (32) + Data padded to 32 = 96 bytes
		expect(encoded.length).toBe(96);
		expect(encoded[31]).toBe(0x20); // offset
		expect(encoded[63]).toBe(8); // length
		expect(encoded[64]).toBe(0x12);
		expect(encoded[71]).toBe(0xf0);
	});

	it("encodes bytes exactly 32 bytes", () => {
		const data = "0x" + "12".repeat(32);
		const encoded = Abi.encodeParameters([{ type: "bytes" }], [data]);
		// Offset (32) + Length (32) + Data (32) = 96 bytes
		expect(encoded.length).toBe(96);
		expect(encoded[63]).toBe(32); // length
		expect(encoded.slice(64, 96).every((b) => b === 0x12)).toBe(true);
	});

	it("encodes bytes longer than 32 bytes", () => {
		const data = "0x" + "ff".repeat(64);
		const encoded = Abi.encodeParameters([{ type: "bytes" }], [data]);
		// Offset (32) + Length (32) + Data (64) = 128 bytes
		expect(encoded.length).toBe(128);
		expect(encoded[63]).toBe(64); // length
		expect(encoded.slice(64, 128).every((b) => b === 0xff)).toBe(true);
	});

	it("encodes bytes with padding", () => {
		const data = "0x123456"; // 3 bytes
		const encoded = Abi.encodeParameters([{ type: "bytes" }], [data]);
		// Offset (32) + Length (32) + Data padded to 32 = 96 bytes
		expect(encoded.length).toBe(96);
		expect(encoded[63]).toBe(3); // length
		expect(encoded[64]).toBe(0x12);
		expect(encoded[65]).toBe(0x34);
		expect(encoded[66]).toBe(0x56);
		// Rest should be zero-padded
		expect(encoded.slice(67, 96).every((b) => b === 0)).toBe(true);
	});
});

// ============================================================================
// String Type
// ============================================================================

describe("Abi.encodeParameters - string", () => {
	it("encodes empty string", () => {
		const encoded = Abi.encodeParameters([{ type: "string" }], [""]);
		// Offset (32) + Length (32) = 64 bytes
		expect(encoded.length).toBe(64);
		expect(encoded[31]).toBe(0x20); // offset
		expect(encoded.slice(32, 64).every((b) => b === 0)).toBe(true);
	});

	it("encodes short string", () => {
		const encoded = Abi.encodeParameters([{ type: "string" }], ["hello"]);
		// Offset (32) + Length (32) + Data padded to 32 = 96 bytes
		expect(encoded.length).toBe(96);
		expect(encoded[31]).toBe(0x20); // offset
		expect(encoded[63]).toBe(5); // length
		// UTF-8 encoding of "hello"
		expect(encoded[64]).toBe(0x68); // 'h'
		expect(encoded[65]).toBe(0x65); // 'e'
		expect(encoded[66]).toBe(0x6c); // 'l'
		expect(encoded[67]).toBe(0x6c); // 'l'
		expect(encoded[68]).toBe(0x6f); // 'o'
		expect(encoded.slice(69, 96).every((b) => b === 0)).toBe(true);
	});

	it("encodes longer string", () => {
		const str = "The quick brown fox jumps over the lazy dog";
		const encoded = Abi.encodeParameters([{ type: "string" }], [str]);
		// Offset (32) + Length (32) + Data padded = 128 bytes
		expect(encoded.length).toBe(128);
		expect(encoded[31]).toBe(0x20); // offset
		expect(encoded[63]).toBe(44); // length
	});

	it("encodes string exactly 32 bytes", () => {
		const str = "0".repeat(32);
		const encoded = Abi.encodeParameters([{ type: "string" }], [str]);
		// Offset (32) + Length (32) + Data (32) = 96 bytes
		expect(encoded.length).toBe(96);
		expect(encoded[63]).toBe(32); // length
	});

	it("encodes UTF-8 string with emoji", () => {
		const str = "hello 🌍";
		const encoded = Abi.encodeParameters([{ type: "string" }], [str]);
		const utf8Bytes = new TextEncoder().encode(str);
		expect(encoded[63]).toBe(utf8Bytes.length);
	});

	it("encodes special characters", () => {
		const str = "Hello\nWorld\t!";
		const encoded = Abi.encodeParameters([{ type: "string" }], [str]);
		const utf8Bytes = new TextEncoder().encode(str);
		expect(encoded[63]).toBe(utf8Bytes.length);
	});
});

// ============================================================================
// Dynamic Arrays
// ============================================================================

describe("Abi.encodeParameters - dynamic arrays", () => {
	it("encodes empty uint256[]", () => {
		const encoded = Abi.encodeParameters([{ type: "uint256[]" }], [[]]);
		// Offset (32) + Length (32) = 64 bytes
		expect(encoded.length).toBe(64);
		expect(encoded[31]).toBe(0x20); // offset
		expect(encoded.slice(32, 64).every((b) => b === 0)).toBe(true);
	});

	it("encodes uint256[] with one element", () => {
		const encoded = Abi.encodeParameters([{ type: "uint256[]" }], [[42n]]);
		// Offset (32) + Length (32) + Data (32) = 96 bytes
		expect(encoded.length).toBe(96);
		expect(encoded[31]).toBe(0x20); // offset
		expect(encoded[63]).toBe(1); // length
		expect(encoded[95]).toBe(42); // data
	});

	it("encodes uint256[] with multiple elements", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "uint256[]" }],
			[[1n, 2n, 3n]],
		);
		// Offset (32) + Length (32) + Data (3*32) = 128 bytes
		expect(encoded.length).toBe(128);
		expect(encoded[31]).toBe(0x20); // offset
		expect(encoded[63]).toBe(3); // length
		expect(encoded[95]).toBe(1);
		expect(encoded[127]).toBe(3);
	});

	it("encodes address[] with multiple addresses", () => {
		const addrs = [
			"0x0000000000000000000000000000000000000001",
			"0x0000000000000000000000000000000000000002",
			"0x0000000000000000000000000000000000000003",
		] as Address[];
		const encoded = Abi.encodeParameters([{ type: "address[]" }], [addrs]);
		// Offset (32) + Length (32) + Data (3*32) = 128 bytes
		expect(encoded.length).toBe(128);
		expect(encoded[63]).toBe(3); // length
		expect(encoded[95]).toBe(1);
		expect(encoded[127]).toBe(2);
		expect(encoded[159]).toBe(3);
	});

	it("encodes bool[] array", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "bool[]" }],
			[[true, false, true, false]],
		);
		// Offset (32) + Length (32) + Data (4*32) = 160 bytes
		expect(encoded.length).toBe(160);
		expect(encoded[63]).toBe(4); // length
		expect(encoded[95]).toBe(1);
		expect(encoded[127]).toBe(0);
		expect(encoded[159]).toBe(1);
		expect(encoded[191]).toBe(0);
	});

	it("encodes bytes[] array", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "bytes[]" }],
			[[["0x12"], ["0x3456"]]],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("encodes string[] array", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "string[]" }],
			[[["hello", "world"]]],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});
});

// ============================================================================
// Fixed-Size Arrays
// ============================================================================

describe("Abi.encodeParameters - fixed arrays", () => {
	it("encodes uint256[2]", () => {
		const encoded = Abi.encodeParameters([{ type: "uint256[2]" }], [[1n, 2n]]);
		// Fixed array is encoded inline: 2 * 32 = 64 bytes
		expect(encoded.length).toBe(64);
		expect(encoded[31]).toBe(1);
		expect(encoded[63]).toBe(2);
	});

	it("encodes uint256[3]", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "uint256[3]" }],
			[[10n, 20n, 30n]],
		);
		expect(encoded.length).toBe(96);
		expect(encoded[31]).toBe(10);
		expect(encoded[63]).toBe(20);
		expect(encoded[95]).toBe(30);
	});

	it("encodes address[2]", () => {
		const addrs = [
			"0x0000000000000000000000000000000000000001",
			"0x0000000000000000000000000000000000000002",
		] as Address[];
		const encoded = Abi.encodeParameters([{ type: "address[2]" }], [addrs]);
		expect(encoded.length).toBe(64);
		expect(encoded[31]).toBe(1);
		expect(encoded[63]).toBe(2);
	});

	it("encodes bool[4]", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "bool[4]" }],
			[[true, false, true, true]],
		);
		expect(encoded.length).toBe(128);
		expect(encoded[31]).toBe(1);
		expect(encoded[63]).toBe(0);
		expect(encoded[95]).toBe(1);
		expect(encoded[127]).toBe(1);
	});

	it("encodes bytes4[2]", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "bytes4[2]" }],
			[["0x12345678", "0x9abcdef0"]],
		);
		expect(encoded.length).toBe(64);
		expect(encoded[0]).toBe(0x12);
		expect(encoded[3]).toBe(0x78);
		expect(encoded[32]).toBe(0x9a);
		expect(encoded[35]).toBe(0xf0);
	});
});

// ============================================================================
// Tuples (Structs)
// ============================================================================

describe("Abi.encodeParameters - tuples", () => {
	it("encodes simple tuple (uint256, address)", () => {
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [{ type: "uint256" }, { type: "address" }],
				},
			],
			[[100n, "0x0000000000000000000000000000000000000001"]],
		);
		// Tuple with static types encoded inline: 64 bytes
		expect(encoded.length).toBe(64);
		expect(encoded[31]).toBe(100);
		expect(encoded[63]).toBe(1);
	});

	it("encodes tuple with all static types", () => {
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [
						{ type: "uint8" },
						{ type: "address" },
						{ type: "bool" },
						{ type: "bytes4" },
					],
				},
			],
			[
				[
					255n,
					"0x0000000000000000000000000000000000000001",
					true,
					"0x12345678",
				],
			],
		);
		expect(encoded.length).toBe(128);
	});

	it("encodes tuple with dynamic type (bytes)", () => {
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [{ type: "uint256" }, { type: "bytes" }],
				},
			],
			[[42n, "0x123456"]],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("encodes tuple with string", () => {
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [{ type: "address" }, { type: "string" }],
				},
			],
			[["0x0000000000000000000000000000000000000001", "hello"]],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("encodes nested tuple", () => {
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [
						{ type: "uint256" },
						{
							type: "tuple",
							components: [{ type: "address" }, { type: "uint256" }],
						},
					],
				},
			],
			[[100n, ["0x0000000000000000000000000000000000000001", 200n]]],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("encodes array of tuples", () => {
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple[]",
					components: [{ type: "uint256" }, { type: "address" }],
				},
			],
			[
				[
					[1n, "0x0000000000000000000000000000000000000001"],
					[2n, "0x0000000000000000000000000000000000000002"],
				],
			],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("encodes fixed array of tuples", () => {
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple[2]",
					components: [{ type: "uint256" }, { type: "bool" }],
				},
			],
			[
				[
					[1n, true],
					[2n, false],
				],
			],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});
});

// ============================================================================
// Mixed Static and Dynamic Types
// ============================================================================

describe("Abi.encodeParameters - mixed types", () => {
	it("encodes uint256, bytes, uint256", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "uint256" }, { type: "bytes" }, { type: "uint256" }],
			[10n, "0x123456", 20n],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
		// First param: static (32 bytes)
		// Second param: offset pointer (32 bytes)
		// Third param: static (32 bytes)
		// Dynamic data follows
	});

	it("encodes address, string, uint256", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "address" }, { type: "string" }, { type: "uint256" }],
			["0x0000000000000000000000000000000000000001", "hello", 42n],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("encodes multiple dynamic arrays", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "uint256[]" }, { type: "address[]" }],
			[
				[1n, 2n, 3n],
				[
					"0x0000000000000000000000000000000000000001",
					"0x0000000000000000000000000000000000000002",
				],
			],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("encodes bytes, string, bytes", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "bytes" }, { type: "string" }, { type: "bytes" }],
			["0x1234", "hello", "0x5678"],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});
});

// ============================================================================
// Complex Real-World Examples
// ============================================================================

describe("Abi.encodeParameters - real-world examples", () => {
	it("encodes ERC721 safeTransferFrom", () => {
		const encoded = Abi.encodeParameters(
			[
				{ type: "address" },
				{ type: "address" },
				{ type: "uint256" },
				{ type: "bytes" },
			],
			[
				"0x0000000000000000000000000000000000000001",
				"0x0000000000000000000000000000000000000002",
				123n,
				"0x",
			],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("encodes Uniswap swap params", () => {
		const encoded = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [
						{ type: "address" }, // tokenIn
						{ type: "address" }, // tokenOut
						{ type: "uint24" }, // fee
						{ type: "address" }, // recipient
						{ type: "uint256" }, // deadline
						{ type: "uint256" }, // amountIn
						{ type: "uint256" }, // amountOutMinimum
						{ type: "uint160" }, // sqrtPriceLimitX96
					],
				},
			],
			[
				[
					"0x0000000000000000000000000000000000000001",
					"0x0000000000000000000000000000000000000002",
					3000n,
					"0x0000000000000000000000000000000000000003",
					1234567890n,
					1000000000000000000n,
					900000000000000000n,
					0n,
				],
			],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(256); // 8 * 32 bytes
	});

	it("encodes multicall with dynamic array of bytes", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "bytes[]" }],
			[[["0x12345678", "0x9abcdef0", "0x11223344"]]],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Abi.encodeParameters - dynamic edge cases", () => {
	it("encodes very long string", () => {
		const longStr = "a".repeat(1000);
		const encoded = Abi.encodeParameters([{ type: "string" }], [longStr]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded[63]).toBe(244); // length % 256
	});

	it("encodes large uint256 array", () => {
		const arr = Array.from({ length: 100 }, (_, i) => BigInt(i));
		const encoded = Abi.encodeParameters([{ type: "uint256[]" }], [arr]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded[63]).toBe(100); // array length
	});

	it("encodes empty arrays of different types", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "uint256[]" }, { type: "address[]" }, { type: "bytes[]" }],
			[[], [], []],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes nested arrays", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "uint256[][]" }],
			[
				[
					[1n, 2n],
					[3n, 4n, 5n],
				],
			],
		);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});
});
