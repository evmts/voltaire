/**
 * Comprehensive ABI encoding tests for static types
 */

import { describe, expect, it } from "vitest";
import * as Abi from "./index.js";
import type { Address } from "../Address/index.js";

// ============================================================================
// Static Type Encoding Tests
// ============================================================================

describe("Abi.encodeParameters - uint types", () => {
	it("encodes uint8 zero", () => {
		const encoded = Abi.encodeParameters([{ type: "uint8" }], [0n] as any);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("encodes uint8 max value (255)", () => {
		const encoded = Abi.encodeParameters([{ type: "uint8" }], [255n] as any);
		expect(encoded.length).toBe(32);
		expect(encoded[31]).toBe(255);
		// All other bytes should be 0
		expect(encoded.slice(0, 31).every((b) => b === 0)).toBe(true);
	});

	it("encodes uint16 max value (65535)", () => {
		const encoded = Abi.encodeParameters([{ type: "uint16" }], [65535n] as any);
		expect(encoded.length).toBe(32);
		expect(encoded[30]).toBe(0xff);
		expect(encoded[31]).toBe(0xff);
		expect(encoded.slice(0, 30).every((b) => b === 0)).toBe(true);
	});

	it("encodes uint32", () => {
		const value = 0x12345678n;
		const encoded = Abi.encodeParameters([{ type: "uint32" }], [value] as any);
		expect(encoded.length).toBe(32);
		expect(encoded[28]).toBe(0x12);
		expect(encoded[29]).toBe(0x34);
		expect(encoded[30]).toBe(0x56);
		expect(encoded[31]).toBe(0x78);
	});

	it("encodes uint64", () => {
		const value = 0x123456789abcdef0n;
		const encoded = Abi.encodeParameters([{ type: "uint64" }], [value] as any);
		expect(encoded.length).toBe(32);
		expect(encoded[24]).toBe(0x12);
		expect(encoded[31]).toBe(0xf0);
	});

	it("encodes uint128", () => {
		const value = 0x123456789abcdef0123456789abcdef0n;
		const encoded = Abi.encodeParameters(
			[{ type: "uint128" }],
			[value] as any,
		);
		expect(encoded.length).toBe(32);
		expect(encoded[16]).toBe(0x12);
		expect(encoded[31]).toBe(0xf0);
	});

	it("encodes uint256 zero", () => {
		const encoded = Abi.encodeParameters([{ type: "uint256" }], [0n] as any);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("encodes uint256 max value", () => {
		const max =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const encoded = Abi.encodeParameters([{ type: "uint256" }], [max] as any);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0xff)).toBe(true);
	});

	it("encodes uint256 specific value", () => {
		const value = 42n;
		const encoded = Abi.encodeParameters([{ type: "uint256" }], [value] as any);
		expect(encoded.length).toBe(32);
		expect(encoded[31]).toBe(42);
		expect(encoded.slice(0, 31).every((b) => b === 0)).toBe(true);
	});

	it("encodes multiple uint values", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "uint8" }, { type: "uint16" }, { type: "uint256" }],
			[1n, 2n, 3n] as any,
		);
		expect(encoded.length).toBe(96); // 3 * 32 bytes
		expect(encoded[31]).toBe(1);
		expect(encoded[63]).toBe(2);
		expect(encoded[95]).toBe(3);
	});
});

describe("Abi.encodeParameters - int types", () => {
	it("encodes int8 zero", () => {
		const encoded = Abi.encodeParameters([{ type: "int8" }], [0n] as any);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("encodes int8 positive (127)", () => {
		const encoded = Abi.encodeParameters([{ type: "int8" }], [127n] as any);
		expect(encoded.length).toBe(32);
		expect(encoded[31]).toBe(127);
		expect(encoded.slice(0, 31).every((b) => b === 0)).toBe(true);
	});

	it("encodes int8 negative (-1)", () => {
		const encoded = Abi.encodeParameters([{ type: "int8" }], [-1n] as any);
		expect(encoded.length).toBe(32);
		// Two's complement: -1 = 0xFFFFFFFF...
		expect(encoded.every((b) => b === 0xff)).toBe(true);
	});

	it("encodes int8 negative (-128)", () => {
		const encoded = Abi.encodeParameters([{ type: "int8" }], [-128n] as any);
		expect(encoded.length).toBe(32);
		// Two's complement of -128
		expect(encoded.slice(0, 31).every((b) => b === 0xff)).toBe(true);
		expect(encoded[31]).toBe(0x80);
	});

	it("encodes int16 positive", () => {
		const encoded = Abi.encodeParameters([{ type: "int16" }], [1000n] as any);
		expect(encoded.length).toBe(32);
		expect(encoded[30]).toBe(0x03);
		expect(encoded[31]).toBe(0xe8);
	});

	it("encodes int16 negative", () => {
		const encoded = Abi.encodeParameters([{ type: "int16" }], [-1000n] as any);
		expect(encoded.length).toBe(32);
		// Two's complement
		expect(encoded.slice(0, 30).every((b) => b === 0xff)).toBe(true);
	});

	it("encodes int32 positive", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "int32" }],
			[123456789n] as any,
		);
		expect(encoded.length).toBe(32);
		expect(encoded[28]).toBe(0x07);
		expect(encoded[31]).toBe(0x15);
	});

	it("encodes int32 negative", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "int32" }],
			[-123456789n] as any,
		);
		expect(encoded.length).toBe(32);
		expect(encoded.slice(0, 28).every((b) => b === 0xff)).toBe(true);
	});

	it("encodes int64 positive", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "int64" }],
			[9223372036854775807n] as any, // max int64
		);
		expect(encoded.length).toBe(32);
		expect(encoded[24]).toBe(0x7f);
		expect(encoded[31]).toBe(0xff);
	});

	it("encodes int64 negative", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "int64" }],
			[-9223372036854775808n] as any, // min int64
		);
		expect(encoded.length).toBe(32);
		expect(encoded.slice(0, 24).every((b) => b === 0xff)).toBe(true);
		expect(encoded[24]).toBe(0x80);
	});

	it("encodes int256 zero", () => {
		const encoded = Abi.encodeParameters([{ type: "int256" }], [0n] as any);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("encodes int256 positive", () => {
		const encoded = Abi.encodeParameters([{ type: "int256" }], [12345n] as any);
		expect(encoded.length).toBe(32);
		expect(encoded[30]).toBe(0x30);
		expect(encoded[31]).toBe(0x39);
	});

	it("encodes int256 negative", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "int256" }],
			[-12345n] as any,
		);
		expect(encoded.length).toBe(32);
		// Two's complement
		expect(encoded.slice(0, 30).every((b) => b === 0xff)).toBe(true);
	});

	it("encodes multiple int values", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "int8" }, { type: "int32" }, { type: "int256" }],
			[-1n, 100n, -200n] as any,
		);
		expect(encoded.length).toBe(96);
	});
});

describe("Abi.encodeParameters - address type", () => {
	it("encodes zero address", () => {
		const zeroAddr = "0x0000000000000000000000000000000000000000" as Address;
		const encoded = Abi.encodeParameters([{ type: "address" }], [zeroAddr]);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("encodes specific address", () => {
		const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const encoded = Abi.encodeParameters([{ type: "address" }], [addr]);
		expect(encoded.length).toBe(32);
		// First 12 bytes should be 0 (left-padded)
		expect(encoded.slice(0, 12).every((b) => b === 0)).toBe(true);
		// Last 20 bytes should be the address
		expect(encoded[12]).toBe(0x74);
		expect(encoded[31]).toBe(0xe3);
	});

	it("encodes max address", () => {
		const maxAddr = "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF" as Address;
		const encoded = Abi.encodeParameters([{ type: "address" }], [maxAddr]);
		expect(encoded.length).toBe(32);
		expect(encoded.slice(0, 12).every((b) => b === 0)).toBe(true);
		expect(encoded.slice(12).every((b) => b === 0xff)).toBe(true);
	});

	it("encodes multiple addresses", () => {
		const addr1 = "0x0000000000000000000000000000000000000001" as Address;
		const addr2 = "0x0000000000000000000000000000000000000002" as Address;
		const encoded = Abi.encodeParameters(
			[{ type: "address" }, { type: "address" }],
			[addr1, addr2],
		);
		expect(encoded.length).toBe(64);
		expect(encoded[31]).toBe(1);
		expect(encoded[63]).toBe(2);
	});

	it("encodes address with checksum", () => {
		const addr = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed" as Address;
		const encoded = Abi.encodeParameters([{ type: "address" }], [addr]);
		expect(encoded.length).toBe(32);
		// Encoding should be case-insensitive
		const expected = Abi.encodeParameters(
			[{ type: "address" }],
			[addr.toLowerCase() as Address],
		);
		expect(encoded).toEqual(expected);
	});
});

describe("Abi.encodeParameters - bool type", () => {
	it("encodes true", () => {
		const encoded = Abi.encodeParameters([{ type: "bool" }], [true]);
		expect(encoded.length).toBe(32);
		expect(encoded[31]).toBe(1);
		expect(encoded.slice(0, 31).every((b) => b === 0)).toBe(true);
	});

	it("encodes false", () => {
		const encoded = Abi.encodeParameters([{ type: "bool" }], [false]);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("encodes multiple bools", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "bool" }, { type: "bool" }, { type: "bool" }],
			[true, false, true],
		);
		expect(encoded.length).toBe(96);
		expect(encoded[31]).toBe(1);
		expect(encoded[63]).toBe(0);
		expect(encoded[95]).toBe(1);
	});
});

describe("Abi.encodeParameters - fixed bytes types", () => {
	it("encodes bytes1", () => {
		const encoded = Abi.encodeParameters([{ type: "bytes1" }], ["0x42"]);
		expect(encoded.length).toBe(32);
		expect(encoded[0]).toBe(0x42);
		// Right-padded with zeros
		expect(encoded.slice(1).every((b) => b === 0)).toBe(true);
	});

	it("encodes bytes4", () => {
		const encoded = Abi.encodeParameters([{ type: "bytes4" }], ["0x12345678"]);
		expect(encoded.length).toBe(32);
		expect(encoded[0]).toBe(0x12);
		expect(encoded[1]).toBe(0x34);
		expect(encoded[2]).toBe(0x56);
		expect(encoded[3]).toBe(0x78);
		expect(encoded.slice(4).every((b) => b === 0)).toBe(true);
	});

	it("encodes bytes8", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "bytes8" }],
			["0x123456789abcdef0"],
		);
		expect(encoded.length).toBe(32);
		expect(encoded[0]).toBe(0x12);
		expect(encoded[7]).toBe(0xf0);
		expect(encoded.slice(8).every((b) => b === 0)).toBe(true);
	});

	it("encodes bytes16", () => {
		const value = "0x" + "12".repeat(16);
		const encoded = Abi.encodeParameters([{ type: "bytes16" }], [value]);
		expect(encoded.length).toBe(32);
		expect(encoded.slice(0, 16).every((b) => b === 0x12)).toBe(true);
		expect(encoded.slice(16).every((b) => b === 0)).toBe(true);
	});

	it("encodes bytes32", () => {
		const value = "0x" + "ff".repeat(32);
		const encoded = Abi.encodeParameters([{ type: "bytes32" }], [value]);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0xff)).toBe(true);
	});

	it("encodes bytes32 with zeros", () => {
		const value = "0x" + "00".repeat(32);
		const encoded = Abi.encodeParameters([{ type: "bytes32" }], [value]);
		expect(encoded.length).toBe(32);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("encodes multiple fixed bytes", () => {
		const encoded = Abi.encodeParameters(
			[{ type: "bytes1" }, { type: "bytes2" }, { type: "bytes4" }],
			["0x12", "0x3456", "0x789abcde"],
		);
		expect(encoded.length).toBe(96);
		expect(encoded[0]).toBe(0x12);
		expect(encoded[32]).toBe(0x34);
		expect(encoded[33]).toBe(0x56);
		expect(encoded[64]).toBe(0x78);
	});
});

describe("Abi.encodeParameters - mixed static types", () => {
	it("encodes address, uint256, bool", () => {
		const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const encoded = Abi.encodeParameters(
			[{ type: "address" }, { type: "uint256" }, { type: "bool" }],
			[addr, 1000n, true],
		);
		expect(encoded.length).toBe(96);
	});

	it("encodes uint8, int8, bytes4, address", () => {
		const encoded = Abi.encodeParameters(
			[
				{ type: "uint8" },
				{ type: "int8" },
				{ type: "bytes4" },
				{ type: "address" },
			],
			[255n, -1n, "0x12345678", "0x0000000000000000000000000000000000000001"],
		);
		expect(encoded.length).toBe(128);
		expect(encoded[31]).toBe(255);
		expect(encoded[63]).toBe(0xff); // -1
		expect(encoded[64]).toBe(0x12); // bytes4
	});

	it("encodes all uint sizes together", () => {
		const encoded = Abi.encodeParameters(
			[
				{ type: "uint8" },
				{ type: "uint16" },
				{ type: "uint32" },
				{ type: "uint64" },
				{ type: "uint128" },
				{ type: "uint256" },
			],
			[1n, 2n, 3n, 4n, 5n, 6n] as any,
		);
		expect(encoded.length).toBe(192); // 6 * 32
		expect(encoded[31]).toBe(1);
		expect(encoded[63]).toBe(2);
		expect(encoded[95]).toBe(3);
		expect(encoded[127]).toBe(4);
		expect(encoded[159]).toBe(5);
		expect(encoded[191]).toBe(6);
	});

	it("encodes all int sizes together", () => {
		const encoded = Abi.encodeParameters(
			[
				{ type: "int8" },
				{ type: "int16" },
				{ type: "int32" },
				{ type: "int64" },
				{ type: "int128" },
				{ type: "int256" },
			],
			[-1n, -2n, -3n, -4n, -5n, -6n] as any,
		);
		expect(encoded.length).toBe(192);
	});

	it("encodes ERC20 transfer function params", () => {
		const to = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const amount = 1000000000000000000n; // 1 ETH in wei
		const encoded = Abi.encodeParameters(
			[{ type: "address" }, { type: "uint256" }],
			[to, amount],
		);
		expect(encoded.length).toBe(64);
	});

	it("encodes approve function params", () => {
		const spender = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const amount =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const encoded = Abi.encodeParameters(
			[{ type: "address" }, { type: "uint256" }],
			[spender, amount],
		);
		expect(encoded.length).toBe(64);
		expect(encoded.slice(32).every((b) => b === 0xff)).toBe(true);
	});
});

// ============================================================================
// Edge Cases and Boundary Conditions
// ============================================================================

describe("Abi.encodeParameters - edge cases", () => {
	it("encodes empty parameter list", () => {
		const encoded = Abi.encodeParameters([], []);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(0);
	});

	it("handles zero values for all uint types", () => {
		const types = [
			{ type: "uint8" },
			{ type: "uint16" },
			{ type: "uint32" },
			{ type: "uint64" },
			{ type: "uint128" },
			{ type: "uint256" },
		];
		const values = [0n, 0n, 0n, 0n, 0n, 0n];
		const encoded = Abi.encodeParameters(types, values as any);
		expect(encoded.length).toBe(192);
		expect(encoded.every((b) => b === 0)).toBe(true);
	});

	it("handles max values for all uint types", () => {
		const encoded = Abi.encodeParameters(
			[
				{ type: "uint8" },
				{ type: "uint16" },
				{ type: "uint32" },
				{ type: "uint64" },
				{ type: "uint128" },
				{ type: "uint256" },
			],
			[
				255n,
				65535n,
				4294967295n,
				18446744073709551615n,
				340282366920938463463374607431768211455n,
				115792089237316195423570985008687907853269984665640564039457584007913129639935n,
			] as any,
		);
		expect(encoded.length).toBe(192);
	});

	it("handles min/max for signed integers", () => {
		const encoded = Abi.encodeParameters(
			[
				{ type: "int8" },
				{ type: "int8" },
				{ type: "int256" },
				{ type: "int256" },
			],
			[
				-128n,
				127n,
				-57896044618658097711785492504343953926634992332820282019728792003956564819968n, // min int256
				57896044618658097711785492504343953926634992332820282019728792003956564819967n, // max int256
			] as any,
		);
		expect(encoded.length).toBe(128);
	});
});
