/**
 * Issue #300: pin the Voltaire-native output shape of Abi.decodeParameters.
 *
 * These are the semantics that differ from viem's decodeAbiParameters. The
 * viem-compatible shape is covered in decodeAbiParameters.test.ts.
 */

import { encodeAbiParameters } from "viem";
import { describe, expect, it } from "vitest";
import * as Hex from "../Hex/index.js";
import * as Abi from "./index.js";

const ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

describe("Abi.decodeParameters - native output shape", () => {
	it("returns an empty array for an empty parameter list", () => {
		expect(Abi.decodeParameters([], new Uint8Array(0))).toEqual([]);
	});

	it("ignores trailing data for an empty parameter list", () => {
		expect(Abi.decodeParameters([], new Uint8Array(64))).toEqual([]);
	});

	it("wraps a single output in a one-element array", () => {
		const data = Hex.toBytes(encodeAbiParameters([{ type: "uint256" }], [7n]));
		const decoded = Abi.decodeParameters([{ type: "uint256" }], data);
		expect(Array.isArray(decoded)).toBe(true);
		expect(decoded).toEqual([7n]);
	});

	it("returns one entry per parameter and ignores parameter names", () => {
		const params = [
			{ type: "uint256", name: "amount" },
			{ type: "bool", name: "ok" },
		] as const;
		const data = Hex.toBytes(encodeAbiParameters(params, [5n, true]));
		const decoded = Abi.decodeParameters(params, data);
		expect(decoded).toEqual([5n, true]);
		expect(Object.keys(decoded)).toEqual(["0", "1"]);
	});

	it("returns bigint for every integer width", () => {
		const params = [
			{ type: "uint8" },
			{ type: "uint48" },
			{ type: "int32" },
			{ type: "uint256" },
		] as const;
		const data = Hex.toBytes(encodeAbiParameters(params, [1, 2, -3, 4n]));
		expect(Abi.decodeParameters(params, data)).toEqual([1n, 2n, -3n, 4n]);
	});

	it("returns a lowercase hex string for address", () => {
		const data = Hex.toBytes(
			encodeAbiParameters([{ type: "address" }], [ADDRESS]),
		);
		expect(Abi.decodeParameters([{ type: "address" }], data)).toEqual([
			ADDRESS.toLowerCase(),
		]);
	});

	it("returns Uint8Array for bytes and bytesN", () => {
		const params = [{ type: "bytes4" }, { type: "bytes" }] as const;
		const data = Hex.toBytes(
			encodeAbiParameters(params, ["0xdeadbeef", "0x0102"]),
		);
		const decoded = Abi.decodeParameters(params, data);
		expect(decoded[0]).toBeInstanceOf(Uint8Array);
		expect(decoded[1]).toBeInstanceOf(Uint8Array);
		expect(Array.from(decoded[0])).toEqual([0xde, 0xad, 0xbe, 0xef]);
		expect(Array.from(decoded[1])).toEqual([1, 2]);
	});

	it("returns an array for a tuple with named components", () => {
		const params = [
			{
				type: "tuple",
				components: [
					{ name: "x", type: "uint256" },
					{ name: "label", type: "string" },
				],
			},
		] as const;
		const data = Hex.toBytes(
			encodeAbiParameters(params, [{ x: 1n, label: "a" }]),
		);
		const decoded = Abi.decodeParameters(params, data) as unknown[];
		expect(decoded).toEqual([[1n, "a"]]);
		expect(Array.isArray(decoded[0])).toBe(true);
	});

	it("returns nested arrays for arrays of named tuples", () => {
		const params = [
			{
				type: "tuple[]",
				components: [
					{ name: "x", type: "uint8" },
					{ name: "y", type: "uint8" },
				],
			},
		] as const;
		const data = Hex.toBytes(
			encodeAbiParameters(params, [
				[
					{ x: 1, y: 2 },
					{ x: 3, y: 4 },
				],
			]),
		);
		expect(Abi.decodeParameters(params, data) as unknown[]).toEqual([
			[
				[1n, 2n],
				[3n, 4n],
			],
		]);
	});

	it("throws AbiDecodingError on empty data for a non-empty parameter list", () => {
		expect(() =>
			Abi.decodeParameters([{ type: "uint256" }], new Uint8Array(0)),
		).toThrow(Abi.AbiDecodingError);
	});
});
