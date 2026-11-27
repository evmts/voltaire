/**
 * Issue #300: Comprehensive viem-compatible ABI parameter decoding tests.
 *
 * Verifies BOTH `Abi.decodeAbiParameters(params, data)` AND
 * `Abi.decodeParameters(params, data, { format: 'viem' })` across all viem
 * output contract edge cases, cross-checked directly against `viem`, while
 * ensuring default `Abi.decodeParameters(params, data)` stays 100% backwards-compatible.
 */

import {
	decodeAbiParameters as viemDecode,
	encodeAbiParameters as viemEncode,
} from "viem";
import { describe, expect, it } from "vitest";
import * as Hex from "../Hex/index.js";
import * as Abi from "./index.js";

const VITALIK = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
const DEAD_ADDR = "0x000000000000000000000000000000000000dEaD";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

describe("Issue #300: viem-compatible Abi.decodeParameters & Abi.decodeAbiParameters", () => {
	describe("addresses (EIP-55 checksummed)", () => {
		it.each([VITALIK, ZERO_ADDR, DEAD_ADDR, USDC])(
			"checksums address %s identically to viem",
			(addr) => {
				const params = [{ type: "address" }] as const;
				const hex = viemEncode(params, [addr]);
				const bytes = Hex.toBytes(hex);
				const expected = viemDecode(params, hex);

				expect(Abi.decodeAbiParameters(params, bytes)).toEqual(expected);
				expect(Abi.decodeAbiParameters(params, hex)).toEqual(expected);
				expect(Abi.decodeParameters(params, bytes, { format: "viem" })).toEqual(
					expected,
				);
				expect(Abi.decodeParameters(params, hex, { format: "viem" })).toEqual(
					expected,
				);
				// Default Voltaire mode stays lowercase
				expect(Abi.decodeParameters(params, bytes)).toEqual([
					addr.toLowerCase(),
				]);
				expect(
					Abi.decodeParameters(params, bytes, { format: "voltaire" }),
				).toEqual([addr.toLowerCase()]);
			},
		);
	});

	describe("unsigned integers (number for <=48 bits, bigint for >=56 bits)", () => {
		const smallUintWidths = [8, 16, 24, 32, 40, 48] as const;
		const largeUintWidths = [56, 64, 96, 128, 160, 256] as const;

		it.each(smallUintWidths)(
			"uint%d decodes as JS number at 0 and MAX",
			(bits) => {
				const type = `uint${bits}` as const;
				const max = 2 ** bits - 1;
				const params = [{ type }, { type }] as const;
				const hex = viemEncode(params, [0, max]);
				const bytes = Hex.toBytes(hex);
				const expected = viemDecode(params, hex);

				const viaHelper = Abi.decodeAbiParameters(params, bytes);
				const viaOption = Abi.decodeParameters(params, bytes, {
					format: "viem",
				});
				expect(viaHelper).toEqual(expected);
				expect(viaOption).toEqual(expected);
				expect(typeof viaHelper[0]).toBe("number");
				expect(typeof viaHelper[1]).toBe("number");
				expect(viaOption[1]).toBe(max);
			},
		);

		it.each(largeUintWidths)(
			"uint%d decodes as bigint at 0n and MAX",
			(bits) => {
				const type = `uint${bits}` as const;
				const max = (1n << BigInt(bits)) - 1n;
				const params = [{ type }, { type }] as const;
				const hex = viemEncode(params, [0n, max]);
				const bytes = Hex.toBytes(hex);
				const expected = viemDecode(params, hex);

				const viaHelper = Abi.decodeAbiParameters(params, bytes);
				const viaOption = Abi.decodeParameters(params, bytes, {
					format: "viem",
				});
				expect(viaHelper).toEqual(expected);
				expect(viaOption).toEqual(expected);
				expect(typeof viaHelper[0]).toBe("bigint");
				expect(typeof viaHelper[1]).toBe("bigint");
				expect(viaOption[1]).toBe(max);
			},
		);

		it("bare uint alias decodes as bigint", () => {
			const params = [{ type: "uint" }] as const;
			const hex = viemEncode(params, [123456789n]);
			const bytes = Hex.toBytes(hex);
			expect(Abi.decodeParameters(params, bytes, { format: "viem" })).toEqual([
				123456789n,
			]);
		});
	});

	describe("signed integers (number for <=48 bits, bigint for >=56 bits)", () => {
		const smallIntWidths = [8, 16, 24, 32, 40, 48] as const;
		const largeIntWidths = [56, 64, 128, 256] as const;

		it.each(smallIntWidths)(
			"int%d decodes as JS number at MIN, 0, MAX",
			(bits) => {
				const type = `int${bits}` as const;
				const min = -(2 ** (bits - 1));
				const max = 2 ** (bits - 1) - 1;
				const params = [{ type }, { type }, { type }] as const;
				const hex = viemEncode(params, [min, 0, max]);
				const bytes = Hex.toBytes(hex);
				const expected = viemDecode(params, hex);

				const viaHelper = Abi.decodeAbiParameters(params, bytes);
				const viaOption = Abi.decodeParameters(params, bytes, {
					format: "viem",
				});
				expect(viaHelper).toEqual(expected);
				expect(viaOption).toEqual(expected);
				expect(typeof viaOption[0]).toBe("number");
				expect(typeof viaOption[2]).toBe("number");
			},
		);

		it.each(largeIntWidths)(
			"int%d decodes as bigint at MIN, 0n, MAX",
			(bits) => {
				const type = `int${bits}` as const;
				const min = -(1n << BigInt(bits - 1));
				const max = (1n << BigInt(bits - 1)) - 1n;
				const params = [{ type }, { type }, { type }] as const;
				const hex = viemEncode(params, [min, 0n, max]);
				const bytes = Hex.toBytes(hex);
				const expected = viemDecode(params, hex);

				const viaHelper = Abi.decodeAbiParameters(params, bytes);
				const viaOption = Abi.decodeParameters(params, bytes, {
					format: "viem",
				});
				expect(viaHelper).toEqual(expected);
				expect(viaOption).toEqual(expected);
				expect(typeof viaOption[0]).toBe("bigint");
				expect(typeof viaOption[2]).toBe("bigint");
			},
		);
	});

	describe("bytes, bytesN, bool, string", () => {
		it("decodes bytes and fixed bytesN as 0x lowercase hex strings", () => {
			const params = [
				{ type: "bytes" },
				{ type: "bytes" },
				{ type: "bytes1" },
				{ type: "bytes4" },
				{ type: "bytes20" },
				{ type: "bytes32" },
			] as const;
			const values = [
				"0x",
				"0x00ffab1234567890",
				"0xab",
				"0xdeadbeef",
				"0x11223344556677889900aabbccddeeff00112233",
				`0x${"cd".repeat(32)}`,
			] as const;
			const hex = viemEncode(params, values);
			const bytes = Hex.toBytes(hex);
			const expected = viemDecode(params, hex);

			expect(Abi.decodeAbiParameters(params, bytes)).toEqual(expected);
			expect(Abi.decodeParameters(params, bytes, { format: "viem" })).toEqual(
				expected,
			);
			// Backwards-compatible default returns Uint8Array
			const native = Abi.decodeParameters(params, bytes);
			expect(native[0]).toBeInstanceOf(Uint8Array);
			expect(native[5]).toBeInstanceOf(Uint8Array);
		});

		it("decodes bools and UTF-8 / empty strings identically to viem", () => {
			const params = [
				{ type: "bool" },
				{ type: "bool" },
				{ type: "string" },
				{ type: "string" },
				{ type: "string" },
			] as const;
			const values = [
				true,
				false,
				"",
				"hello world",
				"⚡ Voltaire 🚀",
			] as const;
			const hex = viemEncode(params, values);
			const bytes = Hex.toBytes(hex);
			const expected = viemDecode(params, hex);

			expect(Abi.decodeAbiParameters(params, bytes)).toEqual(expected);
			expect(Abi.decodeParameters(params, bytes, { format: "viem" })).toEqual(
				expected,
			);
		});
	});

	describe("tuples and nested structures", () => {
		it("decodes deeply nested named tuples as objects", () => {
			const params = [
				{
					type: "tuple",
					components: [
						{ name: "maker", type: "address" },
						{ name: "nonce", type: "uint48" },
						{ name: "salt", type: "bytes32" },
						{
							name: "order",
							type: "tuple",
							components: [
								{ name: "token", type: "address" },
								{ name: "amount", type: "uint256" },
								{ name: "active", type: "bool" },
								{ name: "meta", type: "bytes" },
							],
						},
					],
				},
			] as const;
			const value = {
				maker: VITALIK,
				nonce: 42,
				salt: `0x${"12".repeat(32)}` as `0x${string}`,
				order: {
					token: USDC,
					amount: 1_000_000n,
					active: true,
					meta: "0xc0ffee" as `0x${string}`,
				},
			};
			const hex = viemEncode(params, [value]);
			const bytes = Hex.toBytes(hex);
			const expected = viemDecode(params, hex);

			expect(Abi.decodeAbiParameters(params, bytes)).toEqual(expected);
			expect(Abi.decodeParameters(params, bytes, { format: "viem" })).toEqual(
				expected,
			);
		});

		it("decodes unnamed and partially named tuples as positional arrays", () => {
			const unnamed = [
				{
					type: "tuple",
					components: [
						{ type: "address" },
						{ type: "uint16" },
						{ type: "bytes2" },
					],
				},
			] as const;
			const partial = [
				{
					type: "tuple",
					components: [{ name: "addr", type: "address" }, { type: "uint16" }],
				},
			] as const;

			const hex1 = viemEncode(unnamed, [[VITALIK, 99, "0xabcd"]]);
			expect(
				Abi.decodeParameters(unnamed, Hex.toBytes(hex1), { format: "viem" }),
			).toEqual(viemDecode(unnamed, hex1));

			const hex2 = viemEncode(partial, [[USDC, 7]]);
			expect(
				Abi.decodeParameters(partial, Hex.toBytes(hex2), { format: "viem" }),
			).toEqual(viemDecode(partial, hex2));
		});
	});

	describe("fixed, dynamic, and multi-dimensional arrays", () => {
		it("decodes fixed arrays, dynamic arrays, and arrays of tuples identically to viem", () => {
			const tupleComponents = [
				{ name: "owner", type: "address" },
				{ name: "score", type: "int16" },
			] as const;
			const params = [
				{ type: "uint8[3]" },
				{ type: "address[]" },
				{ type: "uint16[2][]" },
				{ type: "tuple[]", components: tupleComponents },
				{ type: "tuple[2]", components: tupleComponents },
				{ type: "bytes[]" },
			] as const;
			const values = [
				[1, 2, 3],
				[VITALIK, ZERO_ADDR, USDC],
				[
					[10, 20],
					[30, 40],
				],
				[
					{ owner: VITALIK, score: -5 },
					{ owner: USDC, score: 32767 },
				],
				[
					{ owner: DEAD_ADDR, score: 0 },
					{ owner: ZERO_ADDR, score: -32768 },
				],
				["0x", "0x01", "0xdeadbeef"],
			] as const;
			const hex = viemEncode(params, values);
			const bytes = Hex.toBytes(hex);
			const expected = viemDecode(params, hex);

			expect(Abi.decodeAbiParameters(params, bytes)).toEqual(expected);
			expect(Abi.decodeParameters(params, bytes, { format: "viem" })).toEqual(
				expected,
			);
		});

		it("decodes empty dynamic arrays and empty parameter list", () => {
			const params = [{ type: "uint256[]" }, { type: "address[]" }] as const;
			const hex = viemEncode(params, [[], []]);
			const bytes = Hex.toBytes(hex);
			expect(Abi.decodeParameters(params, bytes, { format: "viem" })).toEqual([
				[],
				[],
			]);
			expect(
				Abi.decodeParameters([], new Uint8Array(0), { format: "viem" }),
			).toEqual([]);
		});
	});

	describe("error handling", () => {
		it("throws AbiDecodingError on truncated or malformed payloads", () => {
			expect(() =>
				Abi.decodeParameters([{ type: "uint256" }], new Uint8Array(16), {
					format: "viem",
				}),
			).toThrow(Abi.AbiDecodingError);
			expect(() =>
				Abi.decodeParameters([{ type: "address" }], "0x", { format: "viem" }),
			).toThrow(Abi.AbiDecodingError);
		});
	});
});
