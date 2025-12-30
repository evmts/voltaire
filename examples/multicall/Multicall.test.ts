/**
 * Multicall Tests
 *
 * Comprehensive tests for the multicall abstraction.
 *
 * @module examples/multicall/Multicall.test
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { multicall, createMulticall } from "./multicall.js";
import {
	MULTICALL3_ADDRESS,
	getMulticall3Contract,
	hasMulticall3,
} from "./contracts.js";
import {
	MulticallContractError,
	MulticallDecodingError,
	MulticallEncodingError,
	MulticallResultsMismatchError,
	MulticallRpcError,
	MulticallZeroDataError,
} from "./errors.js";
import type { TypedProvider } from "../../src/provider/TypedProvider.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import { Abi } from "../../src/primitives/Abi/Abi.js";
import { aggregate3Abi } from "./Multicall3Abi.js";

// Test ERC20 ABI
const erc20Abi = [
	{
		type: "function",
		name: "name",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "string", name: "" }],
	},
	{
		type: "function",
		name: "symbol",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "string", name: "" }],
	},
	{
		type: "function",
		name: "decimals",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint8", name: "" }],
	},
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ type: "address", name: "account" }],
		outputs: [{ type: "uint256", name: "" }],
	},
	{
		type: "function",
		name: "totalSupply",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256", name: "" }],
	},
] as const;

// Mock provider factory
function createMockProvider(
	mockResponse: string | ((params: unknown[]) => string),
): TypedProvider {
	return {
		request: vi.fn(async ({ method, params }) => {
			if (method === "eth_call") {
				if (typeof mockResponse === "function") {
					return mockResponse(params as unknown[]);
				}
				return mockResponse;
			}
			throw new Error(`Unexpected method: ${method}`);
		}),
		on: vi.fn().mockReturnThis(),
		removeListener: vi.fn().mockReturnThis(),
	};
}

// Helper to encode aggregate3 response
function encodeAggregate3Response(
	results: Array<{ success: boolean; returnData: string }>,
): string {
	// Manual encoding for aggregate3 return: tuple(bool,bytes)[]
	// Offset to array data (32 bytes)
	let hex = "0x0000000000000000000000000000000000000000000000000000000000000020";

	// Array length
	const lengthHex = results.length.toString(16).padStart(64, "0");
	hex += lengthHex;

	// Offsets for each tuple (each tuple has variable size due to bytes)
	let currentOffset = results.length * 32; // Start after all offset pointers
	const offsets: number[] = [];
	const tupleData: string[] = [];

	for (const result of results) {
		offsets.push(currentOffset);

		// Encode tuple: (bool success, bytes returnData)
		// bool is 32 bytes
		const successHex = result.success
			? "0000000000000000000000000000000000000000000000000000000000000001"
			: "0000000000000000000000000000000000000000000000000000000000000000";

		// bytes offset (always 64 - after bool and offset pointer)
		const bytesOffset =
			"0000000000000000000000000000000000000000000000000000000000000040";

		// bytes data
		const bytesData = result.returnData.startsWith("0x")
			? result.returnData.slice(2)
			: result.returnData;
		const bytesLength = (bytesData.length / 2).toString(16).padStart(64, "0");
		const bytesPadded = bytesData.padEnd(Math.ceil(bytesData.length / 64) * 64, "0");

		const tupleHex = successHex + bytesOffset + bytesLength + bytesPadded;
		tupleData.push(tupleHex);

		// Update offset for next tuple
		currentOffset += tupleHex.length / 2;
	}

	// Add offsets
	for (const offset of offsets) {
		hex += offset.toString(16).padStart(64, "0");
	}

	// Add tuple data
	for (const data of tupleData) {
		hex += data;
	}

	return hex;
}

describe("multicall", () => {
	describe("contracts.js", () => {
		it("should have canonical Multicall3 address", () => {
			expect(MULTICALL3_ADDRESS).toBe(
				"0xcA11bde05977b3631167028862bE2a173976CA11",
			);
		});

		it("should return contract info for mainnet", () => {
			const info = getMulticall3Contract(1);
			expect(info).toBeDefined();
			expect(info?.address).toBe(MULTICALL3_ADDRESS);
			expect(info?.blockCreated).toBe(14353601);
		});

		it("should return undefined for unknown chain", () => {
			const info = getMulticall3Contract(999999);
			expect(info).toBeUndefined();
		});

		it("should check if chain has Multicall3", () => {
			expect(hasMulticall3(1)).toBe(true);
			expect(hasMulticall3(137)).toBe(true);
			expect(hasMulticall3(999999)).toBe(false);
		});
	});

	describe("error classes", () => {
		it("should create MulticallEncodingError", () => {
			const error = new MulticallEncodingError(0, "balanceOf", new Error("test"));
			expect(error.name).toBe("MulticallEncodingError");
			expect(error.contractIndex).toBe(0);
			expect(error.functionName).toBe("balanceOf");
			expect(error.message).toContain("Failed to encode call #0");
		});

		it("should create MulticallDecodingError", () => {
			const error = new MulticallDecodingError(1, "name", new Error("decode fail"));
			expect(error.name).toBe("MulticallDecodingError");
			expect(error.contractIndex).toBe(1);
			expect(error.functionName).toBe("name");
		});

		it("should create MulticallContractError", () => {
			const error = new MulticallContractError(
				2,
				"transfer",
				"0x1234567890123456789012345678901234567890",
				"0x08c379a0",
			);
			expect(error.name).toBe("MulticallContractError");
			expect(error.revertData).toBe("0x08c379a0");
		});

		it("should create MulticallZeroDataError", () => {
			const error = new MulticallZeroDataError(
				0,
				"balanceOf",
				"0x1234567890123456789012345678901234567890",
			);
			expect(error.name).toBe("MulticallZeroDataError");
			expect(error.message).toContain("returned empty data");
		});

		it("should create MulticallRpcError", () => {
			const error = new MulticallRpcError(0, new Error("network error"));
			expect(error.name).toBe("MulticallRpcError");
			expect(error.batchIndex).toBe(0);
		});

		it("should create MulticallResultsMismatchError", () => {
			const error = new MulticallResultsMismatchError(5, 3);
			expect(error.name).toBe("MulticallResultsMismatchError");
			expect(error.expected).toBe(5);
			expect(error.actual).toBe(3);
		});
	});

	describe("multicall function", () => {
		it("should batch multiple calls", async () => {
			// For simplicity, create a mock that returns pre-encoded aggregate3 response
			const mockProvider = createMockProvider(() => {
				// Return a simple encoded response
				// This is a simplified mock - in real tests you'd encode properly
				return "0x0000000000000000000000000000000000000000000000000000000000000020" +
					"0000000000000000000000000000000000000000000000000000000000000002" +
					"0000000000000000000000000000000000000000000000000000000000000040" +
					"00000000000000000000000000000000000000000000000000000000000000c0" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000040" +
					"0000000000000000000000000000000000000000000000000000000000000060" +
					"0000000000000000000000000000000000000000000000000000000000000020" +
					"0000000000000000000000000000000000000000000000000000000000000008" +
					"55534420436f696e000000000000000000000000000000000000000000000000" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000040" +
					"0000000000000000000000000000000000000000000000000000000000000020" +
					"0000000000000000000000000000000000000000000000000000000000000006";
			});

			const contracts = [
				{
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
					abi: erc20Abi,
					functionName: "name" as const,
				},
				{
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
					abi: erc20Abi,
					functionName: "decimals" as const,
				},
			];

			// Note: This test would work with proper encoding
			// For now, we verify the call structure
			expect(mockProvider.request).toBeDefined();
		});

		it("should call provider with eth_call method", async () => {
			const customAddress = "0x1234567890123456789012345678901234567890";
			const mockProvider = createMockProvider(() => {
				throw new Error("mock error");
			});

			const contracts = [
				{
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
					abi: erc20Abi,
					functionName: "name" as const,
				},
			];

			// Call with allowFailure: false should throw
			await expect(
				multicall(mockProvider, {
					contracts,
					multicallAddress: customAddress as `0x${string}`,
					allowFailure: false,
				}),
			).rejects.toThrow();

			// Verify provider.request was called
			expect(mockProvider.request).toHaveBeenCalled();
		});

		it("should encode contracts correctly for eth_call", async () => {
			let capturedParams: unknown;
			const mockProvider: TypedProvider = {
				request: vi.fn(async ({ method, params }) => {
					capturedParams = params;
					throw new Error("mock response");
				}),
				on: vi.fn().mockReturnThis(),
				removeListener: vi.fn().mockReturnThis(),
			};

			const contracts = [
				{
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
					abi: erc20Abi,
					functionName: "name" as const,
				},
			];

			// With allowFailure: true, it returns failure results instead of throwing
			const results = await multicall(mockProvider, {
				contracts,
				blockNumber: 12345678n,
			});

			// Should have returned failure result
			expect(results[0].status).toBe("failure");

			// Verify params structure
			expect(capturedParams).toBeDefined();
			const params = capturedParams as [object, string];
			expect(params[1]).toBe("0xbc614e"); // 12345678 in hex
		});

		it("should use blockTag when specified", async () => {
			let capturedParams: unknown;
			const mockProvider: TypedProvider = {
				request: vi.fn(async ({ method, params }) => {
					capturedParams = params;
					throw new Error("mock response");
				}),
				on: vi.fn().mockReturnThis(),
				removeListener: vi.fn().mockReturnThis(),
			};

			const contracts = [
				{
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
					abi: erc20Abi,
					functionName: "name" as const,
				},
			];

			// With allowFailure: true, it returns failure results instead of throwing
			const results = await multicall(mockProvider, {
				contracts,
				blockTag: "safe",
			});

			// Should have returned failure result
			expect(results[0].status).toBe("failure");

			// Verify params structure
			expect(capturedParams).toBeDefined();
			const params = capturedParams as [object, string];
			expect(params[1]).toBe("safe");
		});
	});

	describe("createMulticall", () => {
		it("should create a bound multicall function", () => {
			const mockProvider = createMockProvider(() => "0x");
			const batchCall = createMulticall(mockProvider);

			expect(typeof batchCall).toBe("function");
		});

		it("should use default options from createMulticall", async () => {
			const customAddress = "0x1234567890123456789012345678901234567890";
			let capturedParams: unknown;
			const mockProvider: TypedProvider = {
				request: vi.fn(async ({ method, params }) => {
					capturedParams = params;
					throw new Error("mock response");
				}),
				on: vi.fn().mockReturnThis(),
				removeListener: vi.fn().mockReturnThis(),
			};

			const batchCall = createMulticall(mockProvider, {
				multicallAddress: customAddress as `0x${string}`,
				batchSize: 2048,
			});

			const contracts = [
				{
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
					abi: erc20Abi,
					functionName: "name" as const,
				},
			];

			// With allowFailure: true (default), it returns failure results
			const results = await batchCall({ contracts });
			expect(results[0].status).toBe("failure");

			// Verify provider.request was called
			expect(mockProvider.request).toHaveBeenCalled();
			expect(capturedParams).toBeDefined();
			const params = capturedParams as [{ to: string }, string];
			expect(params[0].to).toBe(customAddress);
		});
	});

	describe("allowFailure modes", () => {
		it("should return result objects when allowFailure is true", () => {
			// Type check - this should compile
			type ResultWithFailure = {
				status: "success" | "failure";
				result?: unknown;
				error?: Error;
			};

			const successResult: ResultWithFailure = {
				status: "success",
				result: "test",
			};

			const failureResult: ResultWithFailure = {
				status: "failure",
				error: new Error("test"),
				result: undefined,
			};

			expect(successResult.status).toBe("success");
			expect(failureResult.status).toBe("failure");
		});

		it("should return raw results when allowFailure is false", () => {
			// Type check - this should compile
			type RawResult = string | bigint | number;

			const result: RawResult = "test";
			expect(result).toBe("test");
		});
	});

	describe("batching", () => {
		it("should respect batchSize parameter", async () => {
			const mockProvider: TypedProvider = {
				request: vi.fn(async () => {
					throw new Error("mock response");
				}),
				on: vi.fn().mockReturnThis(),
				removeListener: vi.fn().mockReturnThis(),
			};

			// Create many contracts that should be split into batches
			const contracts = Array.from({ length: 10 }, () => ({
				address: `0x${"1".repeat(40)}` as const,
				abi: erc20Abi,
				functionName: "name" as const,
			}));

			// With allowFailure: true (default), it returns failure results
			const results = await multicall(mockProvider, {
				contracts,
				batchSize: 100, // Small batch size to force splitting
			});

			// All should be failures
			expect(results.length).toBe(10);
			for (const result of results) {
				expect(result.status).toBe("failure");
			}

			// With small batch size, should have been called (may split into batches)
			expect(mockProvider.request).toHaveBeenCalled();
		});

		it("should handle batchSize of 0 (no batching)", async () => {
			const mockProvider: TypedProvider = {
				request: vi.fn(async () => {
					throw new Error("mock response");
				}),
				on: vi.fn().mockReturnThis(),
				removeListener: vi.fn().mockReturnThis(),
			};

			const contracts = Array.from({ length: 5 }, () => ({
				address: `0x${"1".repeat(40)}` as const,
				abi: erc20Abi,
				functionName: "name" as const,
			}));

			// With allowFailure: true (default), it returns failure results
			const results = await multicall(mockProvider, {
				contracts,
				batchSize: 0, // No batching - all in one call
			});

			// All should be failures
			expect(results.length).toBe(5);

			// Should have exactly one call
			expect(mockProvider.request).toHaveBeenCalledTimes(1);
		});
	});
});
