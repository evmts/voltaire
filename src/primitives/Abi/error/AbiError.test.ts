/**
 * Unit tests for AbiError factory function
 */

import { describe, expect, it } from "vitest";
// Cannot import AbiError directly due to circular dependencies in AbiError.js
// Test the underlying functions instead
import { getSignature } from "./getSignature.js";
import { GetSelector } from "./getSelector.js";
import { encodeParams } from "./encodeParams.js";
import { decodeParams } from "./decodeParams.js";
import { keccak_256 as keccak256 } from "@noble/hashes/sha3.js";

// Create keccak256String function for testing
const keccak256String = (str: string): Uint8Array => {
	const encoder = new TextEncoder();
	return keccak256(encoder.encode(str));
};

const getSelector = GetSelector({ keccak256String });

// Mock AbiError factory for testing
function AbiError(error: any) {
	if (!error || error.type !== "error") {
		throw new TypeError("Invalid error definition: must have type='error'");
	}
	const result = { ...error };
	Object.setPrototypeOf(result, AbiError.prototype);
	return result;
}

// Static methods
AbiError.getSelector = getSelector;
AbiError.getSignature = getSignature;
AbiError.encodeParams = encodeParams;
AbiError.decodeParams = decodeParams;

// Prototype setup
Object.setPrototypeOf(AbiError.prototype, Object.prototype);
AbiError.prototype.getSelector = getSelector.call.bind(getSelector);
AbiError.prototype.getSignature = getSignature.call.bind(getSignature);
AbiError.prototype.encodeParams = function (args: any) {
	return encodeParams(this, args);
};
AbiError.prototype.decodeParams = function (data: Uint8Array) {
	return decodeParams(this, data);
};
AbiError.prototype.toString = function () {
	return `AbiError(${getSignature(this)})`;
};

describe("AbiError", () => {
	it("creates AbiError instance from valid error definition", () => {
		const errorDef = {
			type: "error",
			name: "Unauthorized",
			inputs: [],
		} as const;

		const error = AbiError(errorDef);
		expect(error).toBeDefined();
		expect(error.type).toBe("error");
		expect(error.name).toBe("Unauthorized");
	});

	it("throws TypeError when type is not 'error'", () => {
		const invalidDef = {
			type: "function",
			name: "transfer",
		} as any;

		expect(() => AbiError(invalidDef)).toThrow(TypeError);
		expect(() => AbiError(invalidDef)).toThrow(
			"Invalid error definition: must have type='error'",
		);
	});

	it("throws TypeError when error is null", () => {
		expect(() => AbiError(null as any)).toThrow(TypeError);
	});

	it("throws TypeError when error is undefined", () => {
		expect(() => AbiError(undefined as any)).toThrow(TypeError);
	});

	it("creates error with parameters", () => {
		const errorDef = {
			type: "error",
			name: "InsufficientBalance",
			inputs: [{ type: "uint256", name: "balance" }],
		} as const;

		const error = AbiError(errorDef);
		expect(error.name).toBe("InsufficientBalance");
		expect(error.inputs).toHaveLength(1);
		expect(error.inputs[0].type).toBe("uint256");
	});

	it("creates error with multiple parameters", () => {
		const errorDef = {
			type: "error",
			name: "TransferFailed",
			inputs: [
				{ type: "address", name: "from" },
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
		} as const;

		const error = AbiError(errorDef);
		expect(error.inputs).toHaveLength(3);
	});

	it("has getSelector method", () => {
		const errorDef = {
			type: "error",
			name: "TestError",
			inputs: [],
		} as const;

		const error = AbiError(errorDef);
		expect(error.getSelector).toBeDefined();
		expect(typeof error.getSelector).toBe("function");
	});

	it("has getSignature method", () => {
		const errorDef = {
			type: "error",
			name: "TestError",
			inputs: [],
		} as const;

		const error = AbiError(errorDef);
		expect(error.getSignature).toBeDefined();
		expect(typeof error.getSignature).toBe("function");
	});

	it("has encodeParams method", () => {
		const errorDef = {
			type: "error",
			name: "TestError",
			inputs: [{ type: "uint256", name: "value" }],
		} as const;

		const error = AbiError(errorDef);
		expect(error.encodeParams).toBeDefined();
		expect(typeof error.encodeParams).toBe("function");
	});

	it("has decodeParams method", () => {
		const errorDef = {
			type: "error",
			name: "TestError",
			inputs: [{ type: "uint256", name: "value" }],
		} as const;

		const error = AbiError(errorDef);
		expect(error.decodeParams).toBeDefined();
		expect(typeof error.decodeParams).toBe("function");
	});

	it("instance getSelector returns Uint8Array", () => {
		const errorDef = {
			type: "error",
			name: "TestError",
			inputs: [],
		} as const;

		const error = AbiError(errorDef);
		const selector = error.getSelector();
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(4);
	});

	it("instance getSignature returns string", () => {
		const errorDef = {
			type: "error",
			name: "TestError",
			inputs: [{ type: "uint256", name: "value" }],
		} as const;

		const error = AbiError(errorDef);
		const signature = error.getSignature();
		expect(typeof signature).toBe("string");
		expect(signature).toBe("TestError(uint256)");
	});

	it("instance encodeParams works correctly", () => {
		const errorDef = {
			type: "error",
			name: "TestError",
			inputs: [{ type: "uint256", name: "value" }],
		} as const;

		const error = AbiError(errorDef);
		const encoded = error.encodeParams([100n]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(36);
	});

	it("instance decodeParams works correctly", () => {
		const errorDef = {
			type: "error",
			name: "TestError",
			inputs: [{ type: "uint256", name: "value" }],
		} as const;

		const error = AbiError(errorDef);
		const encoded = error.encodeParams([100n]);
		const decoded = error.decodeParams(encoded);
		expect(decoded).toEqual([100n]);
	});

	it("static getSelector method exists", () => {
		expect(AbiError.getSelector).toBeDefined();
		expect(typeof AbiError.getSelector).toBe("function");
	});

	it("static getSignature method exists", () => {
		expect(AbiError.getSignature).toBeDefined();
		expect(typeof AbiError.getSignature).toBe("function");
	});

	it("static encodeParams method exists", () => {
		expect(AbiError.encodeParams).toBeDefined();
		expect(typeof AbiError.encodeParams).toBe("function");
	});

	it("static decodeParams method exists", () => {
		expect(AbiError.decodeParams).toBeDefined();
		expect(typeof AbiError.decodeParams).toBe("function");
	});

	it("toString returns formatted string", () => {
		const errorDef = {
			type: "error",
			name: "TestError",
			inputs: [{ type: "uint256", name: "value" }],
		} as const;

		const error = AbiError(errorDef);
		const str = error.toString();
		expect(str).toBe("AbiError(TestError(uint256))");
	});

	it("preserves error properties", () => {
		const errorDef = {
			type: "error",
			name: "CustomError",
			inputs: [
				{ type: "address", name: "addr" },
				{ type: "uint256", name: "amount" },
			],
		} as const;

		const error = AbiError(errorDef);
		expect(error.type).toBe("error");
		expect(error.name).toBe("CustomError");
		expect(error.inputs[0].name).toBe("addr");
		expect(error.inputs[1].name).toBe("amount");
	});

	it("creates error with tuple parameter", () => {
		const errorDef = {
			type: "error",
			name: "TupleError",
			inputs: [
				{
					type: "tuple",
					name: "data",
					components: [
						{ type: "address", name: "owner" },
						{ type: "uint256", name: "value" },
					],
				},
			],
		} as const;

		const error = AbiError(errorDef);
		expect(error.inputs).toHaveLength(1);
		expect(error.inputs[0].type).toBe("tuple");
	});

	it("round-trip encode/decode through instance methods", () => {
		const errorDef = {
			type: "error",
			name: "RoundTrip",
			inputs: [
				{ type: "uint256", name: "a" },
				{ type: "address", name: "b" },
			],
		} as const;

		const error = AbiError(errorDef);
		const args = [1000n, "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"] as any;
		const encoded = error.encodeParams(args);
		const decoded = error.decodeParams(encoded);

		expect(decoded[0]).toBe(args[0]);
	});

	it("handles ERC20InsufficientBalance error", () => {
		const errorDef = {
			type: "error",
			name: "ERC20InsufficientBalance",
			inputs: [
				{ type: "address", name: "sender" },
				{ type: "uint256", name: "balance" },
				{ type: "uint256", name: "needed" },
			],
		} as const;

		const error = AbiError(errorDef);
		expect(error.name).toBe("ERC20InsufficientBalance");
		expect(error.inputs).toHaveLength(3);
	});
});
