/**
 * Unit tests for BrandedError (barrel export)
 */

import { describe, expect, it } from "vitest";
import type { ErrorType } from "./BrandedError.js";

describe("BrandedError", () => {
	it("can use ErrorType for type annotations", () => {
		const error: ErrorType<"TestError", readonly []> = {
			type: "error",
			name: "TestError",
			inputs: [],
		};

		expect(error.type).toBe("error");
		expect(error.name).toBe("TestError");
		expect(error.inputs).toEqual([]);
	});

	it("ErrorType accepts error with parameters", () => {
		const error: ErrorType<
			"InsufficientBalance",
			readonly [{ type: "uint256"; name: "balance" }]
		> = {
			type: "error",
			name: "InsufficientBalance",
			inputs: [{ type: "uint256", name: "balance" }],
		};

		expect(error.name).toBe("InsufficientBalance");
		expect(error.inputs).toHaveLength(1);
	});

	it("ErrorType accepts error with multiple parameters", () => {
		const error: ErrorType<
			"TransferFailed",
			readonly [
				{ type: "address"; name: "from" },
				{ type: "address"; name: "to" },
				{ type: "uint256"; name: "amount" },
			]
		> = {
			type: "error",
			name: "TransferFailed",
			inputs: [
				{ type: "address", name: "from" },
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
		};

		expect(error.inputs).toHaveLength(3);
	});

	it("ErrorType preserves literal types", () => {
		const error = {
			type: "error",
			name: "Unauthorized",
			inputs: [],
		} as const;

		type Test = typeof error extends ErrorType<infer N, infer I>
			? N extends "Unauthorized"
				? true
				: false
			: false;
		const test: Test = true;
		expect(test).toBe(true);
	});

	it("ErrorType with address parameter", () => {
		const error: ErrorType<
			"InvalidAddress",
			readonly [{ type: "address"; name: "addr" }]
		> = {
			type: "error",
			name: "InvalidAddress",
			inputs: [{ type: "address", name: "addr" }],
		};

		expect(error.inputs[0].type).toBe("address");
	});

	it("ErrorType with bool parameter", () => {
		const error: ErrorType<
			"InvalidState",
			readonly [{ type: "bool"; name: "expected" }]
		> = {
			type: "error",
			name: "InvalidState",
			inputs: [{ type: "bool", name: "expected" }],
		};

		expect(error.inputs[0].type).toBe("bool");
	});

	it("ErrorType with string parameter", () => {
		const error: ErrorType<
			"InvalidInput",
			readonly [{ type: "string"; name: "reason" }]
		> = {
			type: "error",
			name: "InvalidInput",
			inputs: [{ type: "string", name: "reason" }],
		};

		expect(error.inputs[0].type).toBe("string");
	});

	it("ErrorType with bytes parameter", () => {
		const error: ErrorType<
			"InvalidData",
			readonly [{ type: "bytes"; name: "data" }]
		> = {
			type: "error",
			name: "InvalidData",
			inputs: [{ type: "bytes", name: "data" }],
		};

		expect(error.inputs[0].type).toBe("bytes");
	});

	it("ErrorType with bytes32 parameter", () => {
		const error: ErrorType<
			"InvalidHash",
			readonly [{ type: "bytes32"; name: "hash" }]
		> = {
			type: "error",
			name: "InvalidHash",
			inputs: [{ type: "bytes32", name: "hash" }],
		};

		expect(error.inputs[0].type).toBe("bytes32");
	});

	it("ErrorType with array parameter", () => {
		const error: ErrorType<
			"InvalidArray",
			readonly [{ type: "uint256[]"; name: "values" }]
		> = {
			type: "error",
			name: "InvalidArray",
			inputs: [{ type: "uint256[]", name: "values" }],
		};

		expect(error.inputs[0].type).toBe("uint256[]");
	});

	it("ErrorType with tuple parameter", () => {
		const error: ErrorType<
			"InvalidTuple",
			readonly [
				{
					type: "tuple";
					name: "config";
					components: readonly [
						{ type: "address"; name: "owner" },
						{ type: "uint256"; name: "fee" },
					];
				},
			]
		> = {
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
		};

		expect(error.inputs[0].type).toBe("tuple");
	});

	it("ErrorType for ERC20InsufficientBalance", () => {
		const error: ErrorType<
			"ERC20InsufficientBalance",
			readonly [
				{ type: "address"; name: "sender" },
				{ type: "uint256"; name: "balance" },
				{ type: "uint256"; name: "needed" },
			]
		> = {
			type: "error",
			name: "ERC20InsufficientBalance",
			inputs: [
				{ type: "address", name: "sender" },
				{ type: "uint256", name: "balance" },
				{ type: "uint256", name: "needed" },
			],
		};

		expect(error.name).toBe("ERC20InsufficientBalance");
		expect(error.inputs).toHaveLength(3);
	});

	it("ErrorType for Panic error", () => {
		const error: ErrorType<
			"Panic",
			readonly [{ type: "uint256"; name: "code" }]
		> = {
			type: "error",
			name: "Panic",
			inputs: [{ type: "uint256", name: "code" }],
		};

		expect(error.name).toBe("Panic");
		expect(error.inputs[0].name).toBe("code");
	});

	it("ErrorType for Error(string)", () => {
		const error: ErrorType<
			"Error",
			readonly [{ type: "string"; name: "message" }]
		> = {
			type: "error",
			name: "Error",
			inputs: [{ type: "string", name: "message" }],
		};

		expect(error.name).toBe("Error");
		expect(error.inputs[0].type).toBe("string");
	});

	it("ErrorType with uint8 parameter", () => {
		const error: ErrorType<
			"Uint8Error",
			readonly [{ type: "uint8"; name: "value" }]
		> = {
			type: "error",
			name: "Uint8Error",
			inputs: [{ type: "uint8", name: "value" }],
		};

		expect(error.inputs[0].type).toBe("uint8");
	});

	it("ErrorType with int256 parameter", () => {
		const error: ErrorType<
			"IntError",
			readonly [{ type: "int256"; name: "value" }]
		> = {
			type: "error",
			name: "IntError",
			inputs: [{ type: "int256", name: "value" }],
		};

		expect(error.inputs[0].type).toBe("int256");
	});

	it("ErrorType with nested tuple parameter", () => {
		const error: ErrorType<
			"NestedTuple",
			readonly [
				{
					type: "tuple";
					name: "outer";
					components: readonly [
						{ type: "uint256"; name: "x" },
						{
							type: "tuple";
							name: "inner";
							components: readonly [
								{ type: "uint256"; name: "y" },
								{ type: "uint256"; name: "z" },
							];
						},
					];
				},
			]
		> = {
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
		};

		expect(error.inputs[0].type).toBe("tuple");
	});

	it("ErrorType with fixed array parameter", () => {
		const error: ErrorType<
			"FixedArray",
			readonly [{ type: "uint256[3]"; name: "values" }]
		> = {
			type: "error",
			name: "FixedArray",
			inputs: [{ type: "uint256[3]", name: "values" }],
		};

		expect(error.inputs[0].type).toBe("uint256[3]");
	});

	it("ErrorType with tuple array parameter", () => {
		const error: ErrorType<
			"TupleArray",
			readonly [
				{
					type: "tuple[]";
					name: "items";
					components: readonly [
						{ type: "uint256"; name: "id" },
						{ type: "address"; name: "owner" },
					];
				},
			]
		> = {
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
		};

		expect(error.inputs[0].type).toBe("tuple[]");
	});

	it("ErrorType with mixed parameter types", () => {
		const error: ErrorType<
			"MixedParams",
			readonly [
				{ type: "address"; name: "addr" },
				{ type: "uint256"; name: "amount" },
				{ type: "bool"; name: "flag" },
				{ type: "string"; name: "message" },
			]
		> = {
			type: "error",
			name: "MixedParams",
			inputs: [
				{ type: "address", name: "addr" },
				{ type: "uint256", name: "amount" },
				{ type: "bool", name: "flag" },
				{ type: "string", name: "message" },
			],
		};

		expect(error.inputs).toHaveLength(4);
	});
});
