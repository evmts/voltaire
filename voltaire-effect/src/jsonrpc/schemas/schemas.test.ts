/**
 * @fileoverview Tests for JSON-RPC Effect Schemas.
 * @module jsonrpc/schemas.test
 */

import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import {
	AddressHexSchema,
	BlockRpcSchema,
	BlockTagSchema,
	Bytes32HexSchema,
	GenericJsonRpcRequest,
	GenericJsonRpcResponse,
	HexSchema,
	JsonRpcBatchRequest,
	JsonRpcErrorResponseSchema,
	JsonRpcIdSchema,
	LogFilterSchema,
	LogRpcSchema,
	QuantityHexSchema,
	ReceiptRpcSchema,
	StateOverrideSetSchema,
	TransactionRequestSchema,
	TransactionRpcSchema,
	decodeRequest,
	decodeResponse,
	isErrorResponse,
	isSuccessResponse,
	isValidRequest,
	isValidResponse,
} from "./index.js";
import {
	BlockNumberRequest,
	CallRequest,
	ChainIdRequest,
	EstimateGasRequest,
	EthMethodRequest,
	GasPriceRequest,
	GetBalanceRequest,
	GetBlockByHashRequest,
	GetBlockByNumberRequest,
	GetCodeRequest,
	GetLogsRequest,
	GetTransactionByHashRequest,
	GetTransactionCountRequest,
	GetTransactionReceiptRequest,
	SendRawTransactionRequest,
} from "./eth/index.js";

describe("JSON-RPC Schemas", () => {
	describe("Common Schemas", () => {
		describe("JsonRpcIdSchema", () => {
			it("accepts number", () => {
				expect(S.decodeUnknownSync(JsonRpcIdSchema)(1)).toBe(1);
			});

			it("accepts string", () => {
				expect(S.decodeUnknownSync(JsonRpcIdSchema)("abc")).toBe("abc");
			});

			it("accepts null", () => {
				expect(S.decodeUnknownSync(JsonRpcIdSchema)(null)).toBe(null);
			});

			it("rejects undefined", () => {
				expect(() => S.decodeUnknownSync(JsonRpcIdSchema)(undefined)).toThrow();
			});
		});

		describe("HexSchema", () => {
			it("accepts valid hex", () => {
				expect(S.decodeUnknownSync(HexSchema)("0x")).toBe("0x");
				expect(S.decodeUnknownSync(HexSchema)("0x1234")).toBe("0x1234");
				expect(S.decodeUnknownSync(HexSchema)("0xabcdef")).toBe("0xabcdef");
				expect(S.decodeUnknownSync(HexSchema)("0xABCDEF")).toBe("0xABCDEF");
			});

			it("rejects invalid hex", () => {
				expect(() => S.decodeUnknownSync(HexSchema)("1234")).toThrow();
				expect(() => S.decodeUnknownSync(HexSchema)("0xgg")).toThrow();
			});
		});

		describe("AddressHexSchema", () => {
			const validAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

			it("accepts valid address", () => {
				expect(S.decodeUnknownSync(AddressHexSchema)(validAddress)).toBe(
					validAddress,
				);
			});

			it("rejects short address", () => {
				expect(() =>
					S.decodeUnknownSync(AddressHexSchema)("0x742d35Cc"),
				).toThrow();
			});

			it("rejects long address", () => {
				expect(() =>
					S.decodeUnknownSync(AddressHexSchema)(`${validAddress}00`),
				).toThrow();
			});
		});

		describe("Bytes32HexSchema", () => {
			const validHash =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

			it("accepts valid hash", () => {
				expect(S.decodeUnknownSync(Bytes32HexSchema)(validHash)).toBe(validHash);
			});

			it("rejects short hash", () => {
				expect(() =>
					S.decodeUnknownSync(Bytes32HexSchema)("0x1234567890abcdef"),
				).toThrow();
			});
		});

		describe("BlockTagSchema", () => {
			it("accepts named tags", () => {
				expect(S.decodeUnknownSync(BlockTagSchema)("latest")).toBe("latest");
				expect(S.decodeUnknownSync(BlockTagSchema)("earliest")).toBe("earliest");
				expect(S.decodeUnknownSync(BlockTagSchema)("pending")).toBe("pending");
				expect(S.decodeUnknownSync(BlockTagSchema)("safe")).toBe("safe");
				expect(S.decodeUnknownSync(BlockTagSchema)("finalized")).toBe(
					"finalized",
				);
			});

			it("accepts hex block number", () => {
				expect(S.decodeUnknownSync(BlockTagSchema)("0x10")).toBe("0x10");
			});
		});

		describe("TransactionRequestSchema", () => {
			it("accepts minimal transaction", () => {
				const tx = { to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" };
				const decoded = S.decodeUnknownSync(TransactionRequestSchema)(tx);
				expect(decoded.to).toBe(tx.to);
			});

			it("accepts full EIP-1559 transaction", () => {
				const tx = {
					from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					gas: "0x5208",
					value: "0x0",
					data: "0x",
					maxFeePerGas: "0x2540be400",
					maxPriorityFeePerGas: "0x3b9aca00",
					nonce: "0x0",
				};
				const decoded = S.decodeUnknownSync(TransactionRequestSchema)(tx);
				expect(decoded.from).toBe(tx.from);
				expect(decoded.maxFeePerGas).toBe(tx.maxFeePerGas);
			});
		});

		describe("LogFilterSchema", () => {
			it("accepts filter with address", () => {
				const filter = {
					address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					fromBlock: "latest",
				};
				const decoded = S.decodeUnknownSync(LogFilterSchema)(filter);
				expect(decoded.address).toBe(filter.address);
			});

			it("accepts filter with topics", () => {
				const filter = {
					topics: [
						"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
						null,
					],
				};
				const decoded = S.decodeUnknownSync(LogFilterSchema)(filter);
				expect(decoded.topics).toHaveLength(2);
			});
		});
	});

	describe("Eth Method Schemas", () => {
		describe("eth_blockNumber", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_blockNumber" as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(BlockNumberRequest)(req);
				expect(decoded.method).toBe("eth_blockNumber");
			});
		});

		describe("eth_chainId", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_chainId" as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(ChainIdRequest)(req);
				expect(decoded.method).toBe("eth_chainId");
			});
		});

		describe("eth_gasPrice", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_gasPrice" as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GasPriceRequest)(req);
				expect(decoded.method).toBe("eth_gasPrice");
			});
		});

		describe("eth_getBalance", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_getBalance" as const,
					params: [
						"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
						"latest",
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GetBalanceRequest)(req);
				expect(decoded.method).toBe("eth_getBalance");
				expect(decoded.params[0]).toBe(req.params[0]);
			});
		});

		describe("eth_getCode", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_getCode" as const,
					params: [
						"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
						"latest",
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GetCodeRequest)(req);
				expect(decoded.method).toBe("eth_getCode");
			});
		});

		describe("eth_getTransactionCount", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_getTransactionCount" as const,
					params: [
						"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
						"latest",
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GetTransactionCountRequest)(req);
				expect(decoded.method).toBe("eth_getTransactionCount");
			});
		});

		describe("eth_call", () => {
			it("accepts minimal request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_call" as const,
					params: [
						{ to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
						"latest",
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(CallRequest)(req);
				expect(decoded.method).toBe("eth_call");
			});

			it("accepts request with state override", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_call" as const,
					params: [
						{ to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
						"latest",
						{
							"0x742d35Cc6634C0532925a3b844Bc454e4438f44e": {
								balance: "0x1000",
							},
						},
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(CallRequest)(req);
				expect(decoded.method).toBe("eth_call");
			});
		});

		describe("eth_estimateGas", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_estimateGas" as const,
					params: [
						{ to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(EstimateGasRequest)(req);
				expect(decoded.method).toBe("eth_estimateGas");
			});
		});

		describe("eth_getLogs", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_getLogs" as const,
					params: [
						{
							address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
							fromBlock: "0x1",
							toBlock: "latest",
						},
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GetLogsRequest)(req);
				expect(decoded.method).toBe("eth_getLogs");
			});
		});

		describe("eth_sendRawTransaction", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_sendRawTransaction" as const,
					params: ["0xf86c"] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(SendRawTransactionRequest)(req);
				expect(decoded.method).toBe("eth_sendRawTransaction");
			});
		});

		describe("eth_getBlockByNumber", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_getBlockByNumber" as const,
					params: ["latest", false] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GetBlockByNumberRequest)(req);
				expect(decoded.method).toBe("eth_getBlockByNumber");
			});
		});

		describe("eth_getBlockByHash", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_getBlockByHash" as const,
					params: [
						"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
						true,
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GetBlockByHashRequest)(req);
				expect(decoded.method).toBe("eth_getBlockByHash");
			});
		});

		describe("eth_getTransactionByHash", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_getTransactionByHash" as const,
					params: [
						"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GetTransactionByHashRequest)(req);
				expect(decoded.method).toBe("eth_getTransactionByHash");
			});
		});

		describe("eth_getTransactionReceipt", () => {
			it("accepts valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "eth_getTransactionReceipt" as const,
					params: [
						"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					] as const,
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GetTransactionReceiptRequest)(req);
				expect(decoded.method).toBe("eth_getTransactionReceipt");
			});
		});
	});

	describe("Union Schema", () => {
		it("discriminates eth_blockNumber", () => {
			const req = {
				jsonrpc: "2.0" as const,
				method: "eth_blockNumber" as const,
				id: 1,
			};
			const decoded = S.decodeUnknownSync(EthMethodRequest)(req);
			expect(decoded.method).toBe("eth_blockNumber");
		});

		it("discriminates eth_getBalance", () => {
			const req = {
				jsonrpc: "2.0" as const,
				method: "eth_getBalance" as const,
				params: [
					"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					"latest",
				] as const,
				id: 1,
			};
			const decoded = S.decodeUnknownSync(EthMethodRequest)(req);
			expect(decoded.method).toBe("eth_getBalance");
		});
	});

	describe("Generic Schemas", () => {
		describe("GenericJsonRpcRequest", () => {
			it("accepts any valid request", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "custom_method",
					params: [1, 2, 3],
					id: 1,
				};
				const decoded = S.decodeUnknownSync(GenericJsonRpcRequest)(req);
				expect(decoded.method).toBe("custom_method");
			});

			it("accepts notification (no id)", () => {
				const req = {
					jsonrpc: "2.0" as const,
					method: "notify",
				};
				const decoded = S.decodeUnknownSync(GenericJsonRpcRequest)(req);
				expect(decoded.id).toBeUndefined();
			});
		});

		describe("GenericJsonRpcResponse", () => {
			it("accepts success response", () => {
				const res = {
					jsonrpc: "2.0" as const,
					id: 1,
					result: "0x1234",
				};
				const decoded = S.decodeUnknownSync(GenericJsonRpcResponse)(res);
				expect(isSuccessResponse(decoded)).toBe(true);
			});

			it("accepts error response", () => {
				const res = {
					jsonrpc: "2.0" as const,
					id: 1,
					error: {
						code: -32600,
						message: "Invalid Request",
					},
				};
				const decoded = S.decodeUnknownSync(GenericJsonRpcResponse)(res);
				expect(isErrorResponse(decoded)).toBe(true);
			});
		});

		describe("JsonRpcBatchRequest", () => {
			it("accepts array of requests", () => {
				const batch = [
					{ jsonrpc: "2.0" as const, method: "eth_blockNumber", id: 1 },
					{ jsonrpc: "2.0" as const, method: "eth_chainId", id: 2 },
				];
				const decoded = S.decodeUnknownSync(JsonRpcBatchRequest)(batch);
				expect(decoded).toHaveLength(2);
			});
		});
	});

	describe("Validation Utilities", () => {
		it("isValidRequest returns true for valid request", () => {
			const req = {
				jsonrpc: "2.0",
				method: "eth_blockNumber",
				id: 1,
			};
			expect(isValidRequest(req)).toBe(true);
		});

		it("isValidRequest returns false for invalid request", () => {
			expect(isValidRequest({ method: "test" })).toBe(false);
			expect(isValidRequest(null)).toBe(false);
		});

		it("isValidResponse returns true for valid response", () => {
			const res = { jsonrpc: "2.0", id: 1, result: "0x1" };
			expect(isValidResponse(res)).toBe(true);
		});
	});

	describe("RPC Result Type Schemas", () => {
		describe("LogRpcSchema", () => {
			it("accepts valid log", () => {
				const log = {
					address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					topics: [
						"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					],
					data: "0x",
					blockNumber: "0x1",
					transactionHash:
						"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					transactionIndex: "0x0",
					blockHash:
						"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					logIndex: "0x0",
					removed: false,
				};
				const decoded = S.decodeUnknownSync(LogRpcSchema)(log);
				expect(decoded.address).toBe(log.address);
			});
		});

		describe("TransactionRpcSchema", () => {
			it("accepts valid transaction", () => {
				const tx = {
					hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					nonce: "0x0",
					blockHash:
						"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					blockNumber: "0x1",
					transactionIndex: "0x0",
					from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					value: "0x0",
					gas: "0x5208",
					input: "0x",
					v: "0x1c",
					r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					s: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				};
				const decoded = S.decodeUnknownSync(TransactionRpcSchema)(tx);
				expect(decoded.hash).toBe(tx.hash);
			});
		});
	});
});
