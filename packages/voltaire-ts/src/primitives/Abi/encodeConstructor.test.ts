/**
 * Unit tests for encodeConstructor
 */

import { describe, expect, it } from "vitest";
import * as Hex from "../Hex/index.js";
import type { Abi } from "./Abi.js";
import { AbiItemNotFoundError } from "./Errors.js";
import { encodeConstructor } from "./encodeConstructor.js";

describe("encodeConstructor", () => {
	it("encodes constructor with simple parameters", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "uint256", name: "initialSupply" },
					{ type: "string", name: "name" },
				],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, [1000n, "MyToken"]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
		// Should be valid hex string
		expect(() => Hex.validate(encoded)).not.toThrow();
	});

	it("encodes constructor with no parameters", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, []);

		expect(typeof encoded).toBe("string");
		expect(encoded).toBe("0x");
	});

	it("encodes constructor with address parameter", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "address", name: "owner" }],
			},
		] as const satisfies Abi;

		const owner = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
		const encoded = encodeConstructor(abi, [owner]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
		expect(encoded.length).toBe(66); // 0x + 64 hex chars (32 bytes)
	});

	it("encodes constructor with multiple uint parameters", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "uint256", name: "cap" },
					{ type: "uint256", name: "rate" },
					{ type: "uint256", name: "decimals" },
				],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, [1000000n, 100n, 18n]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
		expect(encoded.length).toBe(194); // 0x + 192 hex chars (96 bytes = 3 * 32)
	});

	it("encodes constructor with string and address", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "string", name: "name" },
					{ type: "string", name: "symbol" },
					{ type: "address", name: "owner" },
				],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, [
			"MyToken",
			"MTK",
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
	});

	it("encodes constructor with array parameter", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256[]", name: "values" }],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, [[1n, 2n, 3n, 4n, 5n]]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
	});

	it("encodes constructor with tuple parameter", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{
						type: "tuple",
						name: "config",
						components: [
							{ type: "uint256", name: "supply" },
							{ type: "address", name: "owner" },
						],
					},
				],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, [
			[1000n, "0x742d35cc6634c0532925a3b844bc9e7595f251e3"],
		]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
	});

	it("throws when constructor not found in ABI", () => {
		const abi = [
			{
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			},
		] as const satisfies Abi;

		expect(() => encodeConstructor(abi, [])).toThrow(AbiItemNotFoundError);
		expect(() => encodeConstructor(abi, [])).toThrow(
			/Constructor not found in ABI/,
		);
	});

	it("throws on empty ABI", () => {
		const emptyAbi: Abi = [];

		expect(() => encodeConstructor(emptyAbi, [])).toThrow(AbiItemNotFoundError);
	});

	it("handles ABI with multiple items (finds constructor)", () => {
		const abi = [
			{
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			},
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "supply" }],
			},
			{
				type: "event",
				name: "Transfer",
				inputs: [],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, [1000n]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
	});

	it("encodes constructor with bool parameter", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "bool", name: "enabled" }],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, [true]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
		expect(encoded.length).toBe(66); // 0x + 64 hex chars
	});

	it("encodes constructor with bytes parameter", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "bytes", name: "data" }],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, ["0x1234567890abcdef"]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
	});

	it("encodes constructor with fixed bytes parameter", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "bytes32", name: "hash" }],
			},
		] as const satisfies Abi;

		const hash = `0x${"ab".repeat(32)}`;
		const encoded = encodeConstructor(abi, [hash]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
		expect(encoded.length).toBe(66); // 0x + 64 hex chars
	});

	it("encodes constructor with complex nested structure", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{
						type: "tuple",
						name: "config",
						components: [
							{ type: "string", name: "name" },
							{ type: "uint256[]", name: "values" },
							{
								type: "tuple",
								name: "owner",
								components: [
									{ type: "address", name: "addr" },
									{ type: "uint256", name: "share" },
								],
							},
						],
					},
				],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, [
			[
				"MyToken",
				[1n, 2n, 3n],
				["0x742d35cc6634c0532925a3b844bc9e7595f251e3", 100n],
			],
		]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
	});

	it("returns consistent encoding for same inputs", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "uint256", name: "supply" },
					{ type: "string", name: "name" },
				],
			},
		] as const satisfies Abi;

		const encoded1 = encodeConstructor(abi, [1000n, "MyToken"]);
		const encoded2 = encodeConstructor(abi, [1000n, "MyToken"]);

		expect(encoded1).toBe(encoded2);
	});

	it("handles max uint256 value", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "max" }],
			},
		] as const satisfies Abi;

		const maxUint256 =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const encoded = encodeConstructor(abi, [maxUint256]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
		// Should be all f's for the value part
		expect(encoded.toLowerCase()).toContain("f".repeat(64));
	});

	it("handles zero values", () => {
		const abi = [
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "uint256", name: "value" },
					{ type: "address", name: "addr" },
				],
			},
		] as const satisfies Abi;

		const encoded = encodeConstructor(abi, [
			0n,
			"0x0000000000000000000000000000000000000000",
		]);

		expect(typeof encoded).toBe("string");
		expect(encoded.startsWith("0x")).toBe(true);
		// Should be all zeros
		expect(encoded.toLowerCase()).toBe(`0x${"0".repeat(128)}`);
	});
});
