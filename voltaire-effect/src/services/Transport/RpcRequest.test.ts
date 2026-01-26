import { describe, expect, it } from "@effect/vitest";
import {
	GetBlockNumber,
	GetChainId,
	GetGasPrice,
	GetBalance,
	GetTransactionCount,
	GetCode,
	GetStorageAt,
	Call,
	EstimateGas,
	GetBlockByNumber,
	GetBlockByHash,
	GetTransactionByHash,
	GetTransactionReceipt,
	GetLogs,
	SendRawTransaction,
	GetFeeHistory,
	GenericRpcRequest,
	toJsonRpc,
} from "./RpcRequest.js";

describe("RpcRequest", () => {
	describe("toJsonRpc", () => {
		it("converts GetBlockNumber", () => {
			const request = new GetBlockNumber();
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_blockNumber");
			expect(params).toEqual([]);
		});

		it("converts GetChainId", () => {
			const request = new GetChainId();
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_chainId");
			expect(params).toEqual([]);
		});

		it("converts GetGasPrice", () => {
			const request = new GetGasPrice();
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_gasPrice");
			expect(params).toEqual([]);
		});

		it("converts GetBalance", () => {
			const request = new GetBalance({
				address: "0x1234567890123456789012345678901234567890",
				blockTag: "latest",
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_getBalance");
			expect(params).toEqual([
				"0x1234567890123456789012345678901234567890",
				"latest",
			]);
		});

		it("converts GetTransactionCount", () => {
			const request = new GetTransactionCount({
				address: "0x1234567890123456789012345678901234567890",
				blockTag: "pending",
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_getTransactionCount");
			expect(params).toEqual([
				"0x1234567890123456789012345678901234567890",
				"pending",
			]);
		});

		it("converts GetCode", () => {
			const request = new GetCode({
				address: "0x1234567890123456789012345678901234567890",
				blockTag: "0x100",
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_getCode");
			expect(params).toEqual([
				"0x1234567890123456789012345678901234567890",
				"0x100",
			]);
		});

		it("converts GetStorageAt", () => {
			const request = new GetStorageAt({
				address: "0x1234567890123456789012345678901234567890",
				slot: "0x0",
				blockTag: "latest",
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_getStorageAt");
			expect(params).toEqual([
				"0x1234567890123456789012345678901234567890",
				"0x0",
				"latest",
			]);
		});

		it("converts Call", () => {
			const request = new Call({
				params: {
					to: "0x1234567890123456789012345678901234567890",
					data: "0x12345678",
				},
				blockTag: "latest",
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_call");
			expect(params).toEqual([
				{ to: "0x1234567890123456789012345678901234567890", data: "0x12345678" },
				"latest",
			]);
		});

		it("converts EstimateGas with blockTag", () => {
			const request = new EstimateGas({
				params: {
					to: "0x1234567890123456789012345678901234567890",
					value: "0x1000",
				},
				blockTag: "latest",
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_estimateGas");
			expect(params).toEqual([
				{ to: "0x1234567890123456789012345678901234567890", value: "0x1000" },
				"latest",
			]);
		});

		it("converts EstimateGas without blockTag", () => {
			const request = new EstimateGas({
				params: {
					to: "0x1234567890123456789012345678901234567890",
				},
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_estimateGas");
			expect(params).toEqual([
				{ to: "0x1234567890123456789012345678901234567890" },
			]);
		});

		it("converts GetBlockByNumber", () => {
			const request = new GetBlockByNumber({
				blockTag: "0x100",
				includeTransactions: true,
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_getBlockByNumber");
			expect(params).toEqual(["0x100", true]);
		});

		it("converts GetBlockByHash", () => {
			const request = new GetBlockByHash({
				blockHash: "0xabc123",
				includeTransactions: false,
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_getBlockByHash");
			expect(params).toEqual(["0xabc123", false]);
		});

		it("converts GetTransactionByHash", () => {
			const request = new GetTransactionByHash({
				hash: "0xdef456",
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_getTransactionByHash");
			expect(params).toEqual(["0xdef456"]);
		});

		it("converts GetTransactionReceipt", () => {
			const request = new GetTransactionReceipt({
				hash: "0xghi789",
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_getTransactionReceipt");
			expect(params).toEqual(["0xghi789"]);
		});

		it("converts GetLogs", () => {
			const request = new GetLogs({
				filter: {
					address: "0x1234567890123456789012345678901234567890",
					topics: ["0xtopic1", null, ["0xtopic3a", "0xtopic3b"]],
					fromBlock: "0x100",
					toBlock: "latest",
				},
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_getLogs");
			expect(params).toEqual([
				{
					address: "0x1234567890123456789012345678901234567890",
					topics: ["0xtopic1", null, ["0xtopic3a", "0xtopic3b"]],
					fromBlock: "0x100",
					toBlock: "latest",
				},
			]);
		});

		it("converts SendRawTransaction", () => {
			const request = new SendRawTransaction({
				signedTransaction: "0xf86c...",
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_sendRawTransaction");
			expect(params).toEqual(["0xf86c..."]);
		});

		it("converts GetFeeHistory", () => {
			const request = new GetFeeHistory({
				blockCount: 10,
				newestBlock: "latest",
				rewardPercentiles: [25, 50, 75],
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("eth_feeHistory");
			expect(params).toEqual(["0xa", "latest", [25, 50, 75]]);
		});

		it("converts GenericRpcRequest", () => {
			const request = new GenericRpcRequest({
				method: "custom_method",
				params: ["arg1", 123, { key: "value" }],
			});
			const { method, params } = toJsonRpc(request);
			expect(method).toBe("custom_method");
			expect(params).toEqual(["arg1", 123, { key: "value" }]);
		});
	});

	describe("Request equality", () => {
		it("creates equal requests with same data", () => {
			const r1 = new GetBalance({
				address: "0x123",
				blockTag: "latest",
			});
			const r2 = new GetBalance({
				address: "0x123",
				blockTag: "latest",
			});

			// Effect.Request uses structural equality
			expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
		});

		it("creates different requests with different data", () => {
			const r1 = new GetBalance({
				address: "0x123",
				blockTag: "latest",
			});
			const r2 = new GetBalance({
				address: "0x456",
				blockTag: "latest",
			});

			expect(JSON.stringify(r1)).not.toBe(JSON.stringify(r2));
		});
	});
});
