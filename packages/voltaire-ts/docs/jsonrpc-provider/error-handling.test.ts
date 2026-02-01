/**
 * Tests for docs/jsonrpc-provider/error-handling.mdx
 *
 * Tests the Error Handling documentation examples including
 * JSON-RPC 2.0 error codes and EIP-1474 Ethereum-specific codes.
 */
import { describe, expect, it } from "vitest";

describe("Error Handling Documentation", () => {
	describe("Error Structure", () => {
		it("exports JsonRpcError type and constants", async () => {
			const {
				JsonRpcError,
				PARSE_ERROR,
				INVALID_REQUEST,
				METHOD_NOT_FOUND,
				INVALID_PARAMS,
				INTERNAL_ERROR,
			} = await import("../../src/jsonrpc/JsonRpcError/index.js");

			// Standard JSON-RPC 2.0 error codes
			expect(PARSE_ERROR).toBe(-32700);
			expect(INVALID_REQUEST).toBe(-32600);
			expect(METHOD_NOT_FOUND).toBe(-32601);
			expect(INVALID_PARAMS).toBe(-32602);
			expect(INTERNAL_ERROR).toBe(-32603);

			// JsonRpcError namespace should have same values
			expect(JsonRpcError.PARSE_ERROR).toBe(-32700);
			expect(JsonRpcError.INVALID_REQUEST).toBe(-32600);
			expect(JsonRpcError.METHOD_NOT_FOUND).toBe(-32601);
			expect(JsonRpcError.INVALID_PARAMS).toBe(-32602);
			expect(JsonRpcError.INTERNAL_ERROR).toBe(-32603);
		});

		it("exports Ethereum-specific error codes (EIP-1474)", async () => {
			const {
				INVALID_INPUT,
				RESOURCE_NOT_FOUND,
				RESOURCE_UNAVAILABLE,
				TRANSACTION_REJECTED,
				METHOD_NOT_SUPPORTED,
				LIMIT_EXCEEDED,
				JSON_RPC_VERSION_NOT_SUPPORTED,
			} = await import("../../src/jsonrpc/JsonRpcError/index.js");

			// EIP-1474 codes in -32000 to -32099 range
			expect(INVALID_INPUT).toBe(-32000);
			expect(RESOURCE_NOT_FOUND).toBe(-32001);
			expect(RESOURCE_UNAVAILABLE).toBe(-32002);
			expect(TRANSACTION_REJECTED).toBe(-32003);
			expect(METHOD_NOT_SUPPORTED).toBe(-32004);
			expect(LIMIT_EXCEEDED).toBe(-32005);
			expect(JSON_RPC_VERSION_NOT_SUPPORTED).toBe(-32006);
		});
	});

	describe("Error Code Descriptions", () => {
		it("provides error message constants", async () => {
			const { ERROR_MESSAGES } = await import(
				"../../src/jsonrpc/JsonRpcError/index.js"
			);

			// Verify ERROR_MESSAGES lookup exists
			expect(ERROR_MESSAGES).toBeDefined();
		});
	});

	describe("Error Handling Patterns from Docs", () => {
		it("demonstrates checking for specific error codes", async () => {
			const {
				INVALID_INPUT,
				METHOD_NOT_FOUND,
				RESOURCE_NOT_FOUND,
			} = await import("../../src/jsonrpc/JsonRpcError/index.js");

			// Simulate error handling pattern from docs
			const handleError = (code: number) => {
				switch (code) {
					case INVALID_INPUT:
						return "Invalid block hash format";
					case RESOURCE_NOT_FOUND:
						return "Block not found";
					case METHOD_NOT_FOUND:
						return "Method not supported by this provider";
					default:
						return "Unexpected error";
				}
			};

			expect(handleError(INVALID_INPUT)).toBe("Invalid block hash format");
			expect(handleError(RESOURCE_NOT_FOUND)).toBe("Block not found");
			expect(handleError(METHOD_NOT_FOUND)).toBe(
				"Method not supported by this provider",
			);
			expect(handleError(-99999)).toBe("Unexpected error");
		});

		it("demonstrates retry strategy with error code filtering", async () => {
			const { METHOD_NOT_FOUND, INVALID_PARAMS } = await import(
				"../../src/jsonrpc/JsonRpcError/index.js"
			);

			// Pattern from docs: non-retryable errors
			const NON_RETRYABLE_ERRORS = new Set([METHOD_NOT_FOUND, INVALID_PARAMS]);

			expect(NON_RETRYABLE_ERRORS.has(METHOD_NOT_FOUND)).toBe(true);
			expect(NON_RETRYABLE_ERRORS.has(INVALID_PARAMS)).toBe(true);
			expect(NON_RETRYABLE_ERRORS.has(-32000)).toBe(false); // INVALID_INPUT is retryable
		});

		it("demonstrates rate limit handling pattern", async () => {
			const { LIMIT_EXCEEDED } = await import(
				"../../src/jsonrpc/JsonRpcError/index.js"
			);

			// Pattern from docs: check for rate limit
			const isRateLimited = (errorCode: number) => errorCode === LIMIT_EXCEEDED;

			expect(isRateLimited(LIMIT_EXCEEDED)).toBe(true);
			expect(isRateLimited(-32000)).toBe(false);
		});
	});

	describe("JsonRpcError Utilities", () => {
		it("provides from() constructor", async () => {
			const { from } = await import("../../src/jsonrpc/JsonRpcError/index.js");

			expect(from).toBeDefined();
			expect(typeof from).toBe("function");
		});

		it("provides toString() utility", async () => {
			const { toString } = await import(
				"../../src/jsonrpc/JsonRpcError/index.js"
			);

			expect(toString).toBeDefined();
			expect(typeof toString).toBe("function");
		});
	});

	describe("Execution Reverted Pattern", () => {
		it("INVALID_INPUT (-32000) is used for execution reverted", async () => {
			const { INVALID_INPUT } = await import(
				"../../src/jsonrpc/JsonRpcError/index.js"
			);

			// As documented: -32000 is most commonly used for contract execution failures
			expect(INVALID_INPUT).toBe(-32000);

			// Pattern from docs
			const isExecutionReverted = (code: number) => code === INVALID_INPUT;
			expect(isExecutionReverted(-32000)).toBe(true);
		});
	});
});
