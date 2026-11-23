/**
 * Issue #300: Abi.decodeAbiParameters returns the same values as viem's
 * decodeAbiParameters. Every case is checked against viem itself.
 */

import {
	decodeAbiParameters as viemDecode,
	encodeAbiParameters as viemEncode,
} from "viem";
import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import * as Hex from "../Hex/index.js";
import { Abi as AbiConstructor } from "./Abi.js";
import * as Abi from "./index.js";

const VITALIK = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

interface Case {
	name: string;
	// biome-ignore lint/suspicious/noExplicitAny: cases cover heterogeneous ABI shapes
	params: readonly any[];
	// biome-ignore lint/suspicious/noExplicitAny: cases cover heterogeneous ABI shapes
	values: readonly any[];
}

const point = [
	{ name: "x", type: "uint8" },
	{ name: "y", type: "int256" },
] as const;

const cases: Case[] = [
	{ name: "empty parameter list", params: [], values: [] },
	{ name: "single uint256", params: [{ type: "uint256" }], values: [69420n] },
	{ name: "uint8 as number", params: [{ type: "uint8" }], values: [255] },
	{
		name: "uint48 as number (widest number)",
		params: [{ type: "uint48" }],
		values: [2 ** 48 - 1],
	},
	{
		name: "uint56 as bigint (narrowest bigint)",
		params: [{ type: "uint56" }],
		values: [2n ** 56n - 1n],
	},
	{ name: "negative int8", params: [{ type: "int8" }], values: [-128] },
	{ name: "negative int48", params: [{ type: "int48" }], values: [-(2 ** 47)] },
	{ name: "negative int256", params: [{ type: "int256" }], values: [-1n] },
	{
		name: "bare uint and int aliases",
		params: [{ type: "uint" }, { type: "int" }],
		values: [1n, -1n],
	},
	{
		name: "checksummed address",
		params: [{ type: "address" }],
		values: [VITALIK],
	},
	{ name: "bool", params: [{ type: "bool" }], values: [true] },
	{ name: "string", params: [{ type: "string" }], values: ["wagmi"] },
	{ name: "empty string", params: [{ type: "string" }], values: [""] },
	{ name: "bytes4", params: [{ type: "bytes4" }], values: ["0xdeadbeef"] },
	{
		name: "bytes32",
		params: [{ type: "bytes32" }],
		values: [`0x${"ab".repeat(32)}`],
	},
	{ name: "bytes", params: [{ type: "bytes" }], values: ["0x0102030405"] },
	{ name: "empty bytes", params: [{ type: "bytes" }], values: ["0x"] },
	{
		name: "several named parameters stay positional",
		params: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
			{ name: "nonce", type: "uint32" },
		],
		values: [USDC, 10n ** 18n, 7],
	},
	{
		name: "dynamic array of small uints",
		params: [{ type: "uint16[]" }],
		values: [[1, 2, 65535]],
	},
	{
		name: "fixed array of addresses",
		params: [{ type: "address[2]" }],
		values: [[VITALIK, USDC]],
	},
	{
		name: "nested arrays",
		params: [{ type: "uint8[2][]" }],
		values: [
			[
				[1, 2],
				[3, 4],
			],
		],
	},
	{
		name: "array of bytes",
		params: [{ type: "bytes[]" }],
		values: [["0x01", "0x", "0xffff"]],
	},
	{
		name: "named tuple as object",
		params: [{ type: "tuple", components: point }],
		values: [{ x: 1, y: -2n }],
	},
	{
		name: "unnamed tuple as array",
		params: [
			{
				type: "tuple",
				components: [{ type: "uint8" }, { type: "address" }],
			},
		],
		values: [[1, VITALIK]],
	},
	{
		name: "partially named tuple as array",
		params: [
			{
				type: "tuple",
				components: [{ name: "x", type: "uint8" }, { type: "bool" }],
			},
		],
		values: [[1, true]],
	},
	{
		name: "dynamic named tuple with nested named tuple",
		params: [
			{
				type: "tuple",
				components: [
					{ name: "owner", type: "address" },
					{ name: "data", type: "bytes" },
					{ name: "origin", type: "tuple", components: point },
				],
			},
		],
		values: [{ owner: USDC, data: "0xc0ffee", origin: { x: 9, y: 10n } }],
	},
	{
		name: "array of named tuples",
		params: [{ type: "tuple[]", components: point }],
		values: [
			[
				{ x: 1, y: 2n },
				{ x: 3, y: -4n },
			],
		],
	},
	{
		name: "fixed array of named tuples",
		params: [{ type: "tuple[2]", components: point }],
		values: [
			[
				{ x: 1, y: 2n },
				{ x: 3, y: -4n },
			],
		],
	},
	{
		name: "mixed static and dynamic parameters",
		params: [
			{ type: "uint8" },
			{ type: "string" },
			{ type: "tuple", components: point },
			{ type: "bytes2[]" },
			{ type: "bool" },
		],
		values: [1, "hello", { x: 2, y: 3n }, ["0x0102", "0xffee"], false],
	},
];

describe("Abi.decodeAbiParameters - viem parity", () => {
	it.each(cases)("$name", ({ params, values }) => {
		const hex = viemEncode(params, values);
		const expected = viemDecode(params, hex);
		expect(Abi.decodeAbiParameters(params, Hex.toBytes(hex))).toEqual(expected);
	});

	it.each(cases)("$name (hex input)", ({ params, values }) => {
		const hex = viemEncode(params, values);
		expect(Abi.decodeAbiParameters(params, hex)).toEqual(
			viemDecode(params, hex),
		);
	});
});

describe("Abi.decodeAbiParameters - output shape", () => {
	it("wraps a single output in a one-element array", () => {
		const hex = viemEncode([{ type: "uint256" }], [1n]);
		expect(Abi.decodeAbiParameters([{ type: "uint256" }], hex)).toEqual([1n]);
	});

	it("returns an empty array for an empty parameter list", () => {
		expect(Abi.decodeAbiParameters([], new Uint8Array(0))).toEqual([]);
		expect(Abi.decodeAbiParameters([], "0x")).toEqual([]);
	});

	it("returns number up to 48 bits and bigint above", () => {
		const params = [{ type: "uint48" }, { type: "uint56" }] as const;
		const [small, large] = Abi.decodeAbiParameters(
			params,
			viemEncode(params, [1, 1n]),
		);
		expect(typeof small).toBe("number");
		expect(typeof large).toBe("bigint");
	});

	it("returns hex strings for bytes, not Uint8Array", () => {
		const params = [{ type: "bytes4" }, { type: "bytes" }] as const;
		const decoded = Abi.decodeAbiParameters(
			params,
			viemEncode(params, ["0xdeadbeef", "0x01"]),
		);
		expect(decoded).toEqual(["0xdeadbeef", "0x01"]);
	});

	it("returns an EIP-55 checksummed address", () => {
		const hex = viemEncode([{ type: "address" }], [VITALIK]);
		expect(Abi.decodeAbiParameters([{ type: "address" }], hex)).toEqual([
			VITALIK,
		]);
	});

	it("differs from native decodeParameters only in representation", () => {
		const params = [{ type: "tuple", components: point }] as const;
		const hex = viemEncode(params, [{ x: 1, y: 2n }]);
		expect(Abi.decodeAbiParameters(params, hex)).toEqual([{ x: 1, y: 2n }]);
		expect(Abi.decodeParameters(params, Hex.toBytes(hex)) as unknown[]).toEqual(
			[[1n, 2n]],
		);
	});

	it("throws AbiDecodingError on empty data for a non-empty parameter list", () => {
		expect(() => Abi.decodeAbiParameters([{ type: "uint256" }], "0x")).toThrow(
			Abi.AbiDecodingError,
		);
	});

	it("throws AbiDecodingError on truncated data", () => {
		const hex = viemEncode([{ type: "string" }], ["hello"]);
		const truncated = Hex.toBytes(hex).slice(0, 66);
		expect(() =>
			Abi.decodeAbiParameters([{ type: "string" }], truncated),
		).toThrow(Abi.AbiDecodingError);
	});
});

describe("Abi.decodeAbiParameters - wiring", () => {
	it("is exposed on the Abi constructor", () => {
		expect(AbiConstructor.decodeAbiParameters).toBe(Abi.decodeAbiParameters);
	});

	it("factory accepts an injected keccak256", () => {
		const decode = Abi.DecodeAbiParameters({ keccak256 });
		const hex = viemEncode([{ type: "address" }], [USDC]);
		expect(decode([{ type: "address" }], hex)).toEqual([USDC]);
	});
});

describe("decodeAbiParameters tuple edge cases", () => {
	it("empty tuple decodes to [] like viem", () => {
		// An empty tuple encodes to zero bytes; viem refuses "0x" input, so
		// assert viem's tuple-shape rule directly: no named fields -> array.
		const params = [{ type: "tuple", components: [] }] as const;
		expect(viemEncode(params, [[]] as never)).toBe("0x");
		const [out] = Abi.decodeAbiParameters(params, "0x") as unknown as [unknown];
		expect(Array.isArray(out)).toBe(true);
		expect(out).toEqual([]);
	});

	it("a component named __proto__ is an own property, not a prototype", () => {
		const params = [
			{
				type: "tuple",
				components: [
					{ name: "__proto__", type: "uint256" },
					{ name: "x", type: "uint8" },
				],
			},
		] as const;
		const data = Hex.toBytes(viemEncode(params, [[5n, 7]] as never));
		const [out] = Abi.decodeAbiParameters(params, data) as unknown as [
			Record<string, unknown>,
		];
		expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
		expect(Object.hasOwn(out, "__proto__")).toBe(true);
		expect(Object.getOwnPropertyDescriptor(out, "__proto__")?.value).toBe(5n);
		expect(Object.keys(out)).toEqual(["__proto__", "x"]);
		expect(out.x).toBe(7);
		expect(({} as Record<string, unknown>).x).toBeUndefined();
	});
});
