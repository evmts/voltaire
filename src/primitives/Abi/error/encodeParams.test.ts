/**
 * Unit tests for encodeParams function
 */

import { describe, expect, it } from "vitest";
import { encodeParams } from "./encodeParams.js";
import { GetSelector } from "./getSelector.js";
import { keccak256String } from "../../Hash/BrandedHashIndex.js";

const getSelector = GetSelector({ keccak256String });

describe("encodeParams", () => {
	it("encodes error with no parameters", () => {
		const error = {
			type: "error",
			name: "Unauthorized",
			inputs: [],
		} as const;

		const encoded = encodeParams(error, []);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(4); // Just selector
	});

	it("encodes error with single uint256 parameter", () => {
		const error = {
			type: "error",
			name: "InsufficientBalance",
			inputs: [{ type: "uint256", name: "balance" }],
		} as const;

		const encoded = encodeParams(error, [1000n]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(36); // 4 (selector) + 32 (uint256)
		expect(encoded[35]).toBe(232); // Low byte of 1000
	});

	it("encoded data starts with selector", () => {
		const error = {
			type: "error",
			name: "TestError",
			inputs: [{ type: "uint256", name: "value" }],
		} as const;

		const encoded = encodeParams(error, [42n]);
		const selector = getSelector(error);

		expect(encoded.slice(0, 4)).toEqual(selector);
	});

	it("encodes error with multiple parameters", () => {
		const error = {
			type: "error",
			name: "TransferFailed",
			inputs: [
				{ type: "address", name: "from" },
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
		} as const;

		const encoded = encodeParams(error, [
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			"0x1234567890123456789012345678901234567890",
			1000n,
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(4);
	});

	it("encodes error with address parameter", () => {
		const error = {
			type: "error",
			name: "InvalidAddress",
			inputs: [{ type: "address", name: "addr" }],
		} as const;

		const encoded = encodeParams(error, [
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(36); // 4 + 32
	});

	it("encodes error with bool parameter", () => {
		const error = {
			type: "error",
			name: "InvalidState",
			inputs: [{ type: "bool", name: "expected" }],
		} as const;

		const encoded = encodeParams(error, [true]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(36);
		expect(encoded[35]).toBe(1);
	});

	it("encodes error with false bool parameter", () => {
		const error = {
			type: "error",
			name: "InvalidState",
			inputs: [{ type: "bool", name: "expected" }],
		} as const;

		const encoded = encodeParams(error, [false]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded[35]).toBe(0);
	});

	it("encodes error with string parameter", () => {
		const error = {
			type: "error",
			name: "InvalidInput",
			inputs: [{ type: "string", name: "reason" }],
		} as const;

		const encoded = encodeParams(error, ["Invalid value"]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(36);
	});

	it("encodes error with empty string parameter", () => {
		const error = {
			type: "error",
			name: "EmptyString",
			inputs: [{ type: "string", name: "value" }],
		} as const;

		const encoded = encodeParams(error, [""]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(4);
	});

	it("encodes error with bytes parameter", () => {
		const error = {
			type: "error",
			name: "InvalidData",
			inputs: [{ type: "bytes", name: "data" }],
		} as const;

		const encoded = encodeParams(error, ["0x123456"]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(4);
	});

	it("encodes error with empty bytes parameter", () => {
		const error = {
			type: "error",
			name: "EmptyBytes",
			inputs: [{ type: "bytes", name: "data" }],
		} as const;

		const encoded = encodeParams(error, ["0x"]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes error with fixed bytes parameter", () => {
		const error = {
			type: "error",
			name: "InvalidHash",
			inputs: [{ type: "bytes32", name: "hash" }],
		} as const;

		const encoded = encodeParams(error, [
			"0x0000000000000000000000000000000000000000000000000000000000000001",
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(36); // 4 + 32
	});

	it("encodes error with array parameter", () => {
		const error = {
			type: "error",
			name: "InvalidArray",
			inputs: [{ type: "uint256[]", name: "values" }],
		} as const;

		const encoded = encodeParams(error, [[1n, 2n, 3n]]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(4);
	});

	it("encodes error with empty array parameter", () => {
		const error = {
			type: "error",
			name: "EmptyArray",
			inputs: [{ type: "uint256[]", name: "values" }],
		} as const;

		const encoded = encodeParams(error, [[]]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes error with fixed array parameter", () => {
		const error = {
			type: "error",
			name: "FixedArray",
			inputs: [{ type: "uint256[3]", name: "values" }],
		} as const;

		const encoded = encodeParams(error, [[1n, 2n, 3n]]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes error with tuple parameter", () => {
		const error = {
			type: "error",
			name: "InvalidTuple",
			inputs: [
				{
					type: "tuple",
					name: "config",
					components: [
						{ type: "address", name: "owner" },
						{ type: "uint256", name: "fee" },
					],
				},
			],
		} as const;

		const encoded = encodeParams(error, [
			["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 100n],
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(4);
	});

	it("encodes ERC20InsufficientBalance error", () => {
		const error = {
			type: "error",
			name: "ERC20InsufficientBalance",
			inputs: [
				{ type: "address", name: "sender" },
				{ type: "uint256", name: "balance" },
				{ type: "uint256", name: "needed" },
			],
		} as const;

		const encoded = encodeParams(error, [
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			1000n,
			2000n,
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(100); // 4 + 32 + 32 + 32
	});

	it("encodes Panic error", () => {
		const error = {
			type: "error",
			name: "Panic",
			inputs: [{ type: "uint256", name: "code" }],
		} as const;

		const encoded = encodeParams(error, [0x11n]); // Panic code 0x11 = arithmetic overflow
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(36);
	});

	it("encodes Error(string) error", () => {
		const error = {
			type: "error",
			name: "Error",
			inputs: [{ type: "string", name: "message" }],
		} as const;

		const encoded = encodeParams(error, ["Something went wrong"]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(36);
	});

	it("encodes error with different uint sizes", () => {
		const error = {
			type: "error",
			name: "UintSizes",
			inputs: [
				{ type: "uint8", name: "a" },
				{ type: "uint16", name: "b" },
				{ type: "uint256", name: "c" },
			],
		} as const;

		const encoded = encodeParams(error, [1n, 2n, 3n] as any);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(100); // 4 + 32 + 32 + 32
	});

	it("encodes error with different int sizes", () => {
		const error = {
			type: "error",
			name: "IntSizes",
			inputs: [
				{ type: "int8", name: "a" },
				{ type: "int256", name: "b" },
			],
		} as const;

		const encoded = encodeParams(error, [-1n, -100n] as any);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes error with nested tuple parameter", () => {
		const error = {
			type: "error",
			name: "NestedTuple",
			inputs: [
				{
					type: "tuple",
					name: "outer",
					components: [
						{ type: "uint256", name: "x" },
						{
							type: "tuple",
							name: "inner",
							components: [
								{ type: "uint256", name: "y" },
								{ type: "uint256", name: "z" },
							],
						},
					],
				},
			],
		} as const;

		const encoded = encodeParams(error, [[1n, [2n, 3n]]]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes error with tuple array parameter", () => {
		const error = {
			type: "error",
			name: "TupleArray",
			inputs: [
				{
					type: "tuple[]",
					name: "items",
					components: [
						{ type: "uint256", name: "id" },
						{ type: "address", name: "owner" },
					],
				},
			],
		} as const;

		const encoded = encodeParams(error, [
			[
				[1n, "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"],
				[2n, "0x1234567890123456789012345678901234567890"],
			],
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});
});
