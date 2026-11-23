/**
 * Issue #72: decodeValue fixed-size array offsets.
 *
 * Every case is cross-checked against viem's encoder/decoder so the head
 * layout (static arrays inline, dynamic arrays behind one offset word) is
 * verified against an independent implementation.
 */

import {
	type AbiParameter,
	decodeAbiParameters,
	encodeAbiParameters,
} from "viem";
import { describe, expect, it } from "vitest";
import * as Hex from "../Hex/index.js";
import * as Abi from "./index.js";
import { isDynamicType } from "./isDynamicType.js";
import type { Parameter } from "./Parameter.js";

const toHex = (bytes: Uint8Array) => Hex.fromBytes(bytes).toLowerCase();

/**
 * Normalize decoded output: Uint8Array -> hex, address -> lowercase,
 * number -> bigint (viem returns numbers for uint<=48; Voltaire returns bigint).
 */
function normalize(value: unknown): unknown {
	if (typeof value === "number") return BigInt(value);
	if (value instanceof Uint8Array) return toHex(value);
	if (Array.isArray(value)) return value.map(normalize);
	if (typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value)) {
		return value.toLowerCase();
	}
	if (value && typeof value === "object") {
		return Object.values(value).map(normalize);
	}
	return value;
}

type Case = {
	name: string;
	params: readonly (Parameter & AbiParameter)[];
	values: readonly unknown[];
};

const ADDR_A = "0x00000000000000000000000000000000000000aa";
const ADDR_B = "0x00000000000000000000000000000000000000bb";

const cases: Case[] = [
	{
		name: "address[3]",
		params: [{ type: "address[3]" }, { type: "uint256" }],
		values: [[ADDR_A, ADDR_B, ADDR_A], 7n],
	},
	{
		name: "string[2] followed by uint256",
		params: [{ type: "string[2]" }, { type: "uint256" }],
		values: [["hello", "world!"], 42n],
	},
	{
		name: "bytes[2] between static params",
		params: [{ type: "uint8" }, { type: "bytes[2]" }, { type: "bool" }],
		values: [1n, ["0x1234", "0xdeadbeefcafe"], true],
	},
	{
		name: "uint256[2][3] followed by uint256",
		params: [{ type: "uint256[2][3]" }, { type: "uint256" }],
		values: [
			[
				[1n, 2n],
				[3n, 4n],
				[5n, 6n],
			],
			99n,
		],
	},
	{
		name: "static tuple[2] followed by uint256",
		params: [
			{
				type: "tuple[2]",
				components: [{ type: "uint256" }, { type: "address" }],
			},
			{ type: "uint256" },
		],
		values: [
			[
				[1n, ADDR_A],
				[2n, ADDR_B],
			],
			77n,
		],
	},
	{
		name: "(uint256,string)[2] followed by uint256",
		params: [
			{
				type: "tuple[2]",
				components: [{ type: "uint256" }, { type: "string" }],
			},
			{ type: "uint256" },
		],
		values: [
			[
				[1n, "one"],
				[2n, "two"],
			],
			5n,
		],
	},
	{
		name: "string[2][2] followed by uint256",
		params: [{ type: "string[2][2]" }, { type: "uint256" }],
		values: [
			[
				["a", "bb"],
				["ccc", "dddd"],
			],
			3n,
		],
	},
	{
		name: "uint256[][2] followed by uint256",
		params: [{ type: "uint256[][2]" }, { type: "uint256" }],
		values: [[[1n, 2n, 3n], [4n]], 8n],
	},
	{
		name: "tuple with uint256[2][2] then uint256",
		params: [
			{
				type: "tuple",
				components: [{ type: "uint256[2][2]" }, { type: "bool" }],
			},
			{ type: "uint256" },
		],
		values: [
			[
				[
					[1n, 2n],
					[3n, 4n],
				],
				true,
			],
			9n,
		],
	},
	{
		name: "tuple containing (uint256,string)[2] is dynamic",
		params: [
			{ type: "uint256" },
			{
				type: "tuple",
				components: [
					{
						type: "tuple[2]",
						components: [{ type: "uint256" }, { type: "string" }],
					},
				],
			},
			{ type: "uint256" },
		],
		values: [
			11n,
			[
				[
					[1n, "x"],
					[2n, "yz"],
				],
			],
			12n,
		],
	},
];

describe("Issue #72: fixed-size array offsets", () => {
	for (const c of cases) {
		it(`encodes ${c.name} byte-identical to viem`, () => {
			const ours = Abi.encodeParameters(c.params, c.values as never);
			const theirs = encodeAbiParameters(c.params, c.values);
			expect(toHex(ours)).toBe(theirs.toLowerCase());
		});

		it(`decodes viem's encoding of ${c.name}`, () => {
			const encoded = encodeAbiParameters(c.params, c.values);
			const decoded = Abi.decodeParameters(c.params, Hex.toBytes(encoded));
			const expected = decodeAbiParameters(c.params, encoded);
			expect(normalize(decoded)).toEqual(normalize(expected));
			expect(normalize(decoded)).toEqual(normalize(c.values));
		});
	}

	it("isDynamicType sees dynamic components inside tuple[N]", () => {
		expect(
			isDynamicType("tuple[2]", [{ type: "uint256" }, { type: "string" }]),
		).toBe(true);
		expect(
			isDynamicType("tuple[2]", [{ type: "uint256" }, { type: "address" }]),
		).toBe(false);
	});

	it("matches the Solidity spec vector for uint256[2][3]", () => {
		// Static nested array: 6 words inline, then the trailing uint256.
		const encoded = new Uint8Array(7 * 32);
		for (let i = 0; i < 7; i++) encoded[i * 32 + 31] = i + 1;
		const decoded = Abi.decodeParameters(
			[{ type: "uint256[2][3]" }, { type: "uint256" }] as const,
			encoded,
		);
		expect(decoded).toEqual([
			[
				[1n, 2n],
				[3n, 4n],
				[5n, 6n],
			],
			7n,
		]);
	});
});
