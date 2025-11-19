/**
 * Unit tests for function error classes
 */

import { describe, expect, it } from "vitest";
import {
	FunctionDecodingError,
	FunctionEncodingError,
	FunctionInvalidSelectorError,
} from "./errors.js";
import {
	AbiDecodingError,
	AbiEncodingError,
	AbiInvalidSelectorError,
} from "../Errors.js";

describe("FunctionEncodingError", () => {
	describe("basic properties", () => {
		it("creates error with message", () => {
			const error = new FunctionEncodingError("Test error");
			expect(error.message).toContain("Test error");
		});

		it("has correct name", () => {
			const error = new FunctionEncodingError("Test error");
			expect(error.name).toBe("FunctionEncodingError");
		});

		it("is instance of FunctionEncodingError", () => {
			const error = new FunctionEncodingError("Test error");
			expect(error).toBeInstanceOf(FunctionEncodingError);
		});

		it("is instance of AbiEncodingError", () => {
			const error = new FunctionEncodingError("Test error");
			expect(error).toBeInstanceOf(AbiEncodingError);
		});

		it("is instance of Error", () => {
			const error = new FunctionEncodingError("Test error");
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("error options", () => {
		it("sets custom error code", () => {
			const error = new FunctionEncodingError("Test error", {
				code: "CUSTOM_CODE",
			});
			expect(error.code).toBe("CUSTOM_CODE");
		});

		it("uses default error code when not provided", () => {
			const error = new FunctionEncodingError("Test error");
			expect(error.code).toBe("FUNCTION_ENCODING_ERROR");
		});

		it("includes context", () => {
			const error = new FunctionEncodingError("Test error", {
				context: { functionName: "transfer", paramIndex: 1 },
			});
			expect(error.context).toEqual({
				functionName: "transfer",
				paramIndex: 1,
			});
		});

		it("sets custom docs path", () => {
			const error = new FunctionEncodingError("Test error", {
				docsPath: "/custom/path",
			});
			expect(error.docsPath).toBe("/custom/path");
		});

		it("uses default docs path when not provided", () => {
			const error = new FunctionEncodingError("Test error");
			expect(error.docsPath).toBe("/primitives/abi/function");
		});

		it("includes cause error", () => {
			const cause = new Error("Original error");
			const error = new FunctionEncodingError("Test error", { cause });
			expect(error.cause).toBe(cause);
		});
	});

	describe("throwable", () => {
		it("can be thrown and caught", () => {
			expect(() => {
				throw new FunctionEncodingError("Test error");
			}).toThrow(FunctionEncodingError);
		});

		it("can be caught as AbiEncodingError", () => {
			expect(() => {
				throw new FunctionEncodingError("Test error");
			}).toThrow(AbiEncodingError);
		});
	});
});

describe("FunctionDecodingError", () => {
	describe("basic properties", () => {
		it("creates error with message", () => {
			const error = new FunctionDecodingError("Test error");
			expect(error.message).toContain("Test error");
		});

		it("has correct name", () => {
			const error = new FunctionDecodingError("Test error");
			expect(error.name).toBe("FunctionDecodingError");
		});

		it("is instance of FunctionDecodingError", () => {
			const error = new FunctionDecodingError("Test error");
			expect(error).toBeInstanceOf(FunctionDecodingError);
		});

		it("is instance of AbiDecodingError", () => {
			const error = new FunctionDecodingError("Test error");
			expect(error).toBeInstanceOf(AbiDecodingError);
		});

		it("is instance of Error", () => {
			const error = new FunctionDecodingError("Test error");
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("error options", () => {
		it("sets custom error code", () => {
			const error = new FunctionDecodingError("Test error", {
				code: "CUSTOM_CODE",
			});
			expect(error.code).toBe("CUSTOM_CODE");
		});

		it("uses default error code when not provided", () => {
			const error = new FunctionDecodingError("Test error");
			expect(error.code).toBe("FUNCTION_DECODING_ERROR");
		});

		it("includes context", () => {
			const error = new FunctionDecodingError("Test error", {
				context: { functionName: "transfer", dataLength: 32 },
			});
			expect(error.context).toEqual({
				functionName: "transfer",
				dataLength: 32,
			});
		});

		it("sets custom docs path", () => {
			const error = new FunctionDecodingError("Test error", {
				docsPath: "/custom/path",
			});
			expect(error.docsPath).toBe("/custom/path");
		});

		it("uses default docs path when not provided", () => {
			const error = new FunctionDecodingError("Test error");
			expect(error.docsPath).toBe("/primitives/abi/function");
		});

		it("includes cause error", () => {
			const cause = new Error("Original error");
			const error = new FunctionDecodingError("Test error", { cause });
			expect(error.cause).toBe(cause);
		});
	});

	describe("real-world scenarios", () => {
		it("creates error for data too short", () => {
			const error = new FunctionDecodingError(
				"Data too short for function selector",
				{
					context: { dataLength: 2, functionName: "transfer" },
				},
			);
			expect(error.message).toContain("Data too short");
			expect(error.context?.dataLength).toBe(2);
		});

		it("creates error with parsing context", () => {
			const error = new FunctionDecodingError("Failed to decode parameter", {
				context: { paramIndex: 1, paramType: "address" },
			});
			expect(error.context?.paramIndex).toBe(1);
			expect(error.context?.paramType).toBe("address");
		});
	});

	describe("throwable", () => {
		it("can be thrown and caught", () => {
			expect(() => {
				throw new FunctionDecodingError("Test error");
			}).toThrow(FunctionDecodingError);
		});

		it("can be caught as AbiDecodingError", () => {
			expect(() => {
				throw new FunctionDecodingError("Test error");
			}).toThrow(AbiDecodingError);
		});
	});
});

describe("FunctionInvalidSelectorError", () => {
	describe("basic properties", () => {
		it("creates error with message", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
			});
			expect(error.message).toContain("Test error");
		});

		it("has correct name", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
			});
			expect(error.name).toBe("FunctionInvalidSelectorError");
		});

		it("is instance of FunctionInvalidSelectorError", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
			});
			expect(error).toBeInstanceOf(FunctionInvalidSelectorError);
		});

		it("is instance of AbiInvalidSelectorError", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
			});
			expect(error).toBeInstanceOf(AbiInvalidSelectorError);
		});

		it("is instance of Error", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
			});
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("required fields", () => {
		it("stores value field", () => {
			const value = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
			const error = new FunctionInvalidSelectorError("Test error", {
				value,
				expected: "0xabcdef01",
			});
			expect(error.value).toBe(value);
		});

		it("stores expected field", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
			});
			expect(error.expected).toBe("0xabcdef01");
		});
	});

	describe("error options", () => {
		it("sets custom error code", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
				code: "CUSTOM_CODE",
			});
			expect(error.code).toBe("CUSTOM_CODE");
		});

		it("uses default error code when not provided", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
			});
			expect(error.code).toBe("FUNCTION_INVALID_SELECTOR");
		});

		it("includes context", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
				context: {
					selector: "0x12345678",
					expectedSelector: "0xabcdef01",
					functionName: "transfer",
				},
			});
			expect(error.context?.functionName).toBe("transfer");
			expect(error.context?.selector).toBe("0x12345678");
		});

		it("sets custom docs path", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
				docsPath: "/custom/path",
			});
			expect(error.docsPath).toBe("/custom/path");
		});

		it("uses default docs path when not provided", () => {
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
			});
			expect(error.docsPath).toBe("/primitives/abi/function");
		});

		it("includes cause error", () => {
			const cause = new Error("Original error");
			const error = new FunctionInvalidSelectorError("Test error", {
				value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
				expected: "0xabcdef01",
				cause,
			});
			expect(error.cause).toBe(cause);
		});
	});

	describe("real-world scenarios", () => {
		it("creates error for selector mismatch", () => {
			const actualSelector = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
			const error = new FunctionInvalidSelectorError(
				"Function selector mismatch",
				{
					value: actualSelector,
					expected: "0x095ea7b3",
					context: {
						selector: "0xa9059cbb",
						expectedSelector: "0x095ea7b3",
						functionName: "approve",
					},
				},
			);

			expect(error.message).toContain("mismatch");
			expect(error.expected).toBe("0x095ea7b3");
			expect(error.context?.functionName).toBe("approve");
		});

		it("creates error with hex-formatted selectors", () => {
			const error = new FunctionInvalidSelectorError(
				"Function selector mismatch",
				{
					value: new Uint8Array([0xff, 0xff, 0xff, 0xff]),
					expected: "0xa9059cbb",
					context: {
						selector: "0xffffffff",
						expectedSelector: "0xa9059cbb",
						functionName: "transfer",
					},
				},
			);

			expect(error.context?.selector).toBe("0xffffffff");
			expect(error.context?.expectedSelector).toBe("0xa9059cbb");
		});
	});

	describe("throwable", () => {
		it("can be thrown and caught", () => {
			expect(() => {
				throw new FunctionInvalidSelectorError("Test error", {
					value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
					expected: "0xabcdef01",
				});
			}).toThrow(FunctionInvalidSelectorError);
		});

		it("can be caught as AbiInvalidSelectorError", () => {
			expect(() => {
				throw new FunctionInvalidSelectorError("Test error", {
					value: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
					expected: "0xabcdef01",
				});
			}).toThrow(AbiInvalidSelectorError);
		});
	});
});

describe("error hierarchy", () => {
	it("FunctionEncodingError extends correct base", () => {
		const error = new FunctionEncodingError("Test");
		expect(error).toBeInstanceOf(AbiEncodingError);
		expect(error).toBeInstanceOf(Error);
	});

	it("FunctionDecodingError extends correct base", () => {
		const error = new FunctionDecodingError("Test");
		expect(error).toBeInstanceOf(AbiDecodingError);
		expect(error).toBeInstanceOf(Error);
	});

	it("FunctionInvalidSelectorError extends correct base", () => {
		const error = new FunctionInvalidSelectorError("Test", {
			value: new Uint8Array(4),
			expected: "0x12345678",
		});
		expect(error).toBeInstanceOf(AbiInvalidSelectorError);
		expect(error).toBeInstanceOf(Error);
	});

	it("all errors are distinguishable by name", () => {
		const err1 = new FunctionEncodingError("Test");
		const err2 = new FunctionDecodingError("Test");
		const err3 = new FunctionInvalidSelectorError("Test", {
			value: new Uint8Array(4),
			expected: "0x12345678",
		});

		expect(err1.name).toBe("FunctionEncodingError");
		expect(err2.name).toBe("FunctionDecodingError");
		expect(err3.name).toBe("FunctionInvalidSelectorError");
	});
});
