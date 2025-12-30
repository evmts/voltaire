/**
 * Tests for docs/jsonrpc-provider/eth-methods/index.mdx
 *
 * Tests the eth Methods index documentation with all 40+ methods.
 * Note: The docs indicate this page is a placeholder with AI-generated examples.
 */
import { describe, expect, it } from "vitest";

describe("eth Methods Index Documentation", () => {
	describe("Block Methods", () => {
		it("creates eth_blockNumber request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.BlockNumberRequest();
			expect(request.method).toBe("eth_blockNumber");
		});

		it("creates eth_getBlockByNumber request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetBlockByNumberRequest("latest", true);
			expect(request.method).toBe("eth_getBlockByNumber");
			expect(request.params?.[0]).toBe("latest");
			expect(request.params?.[1]).toBe(true);
		});

		it("creates eth_getBlockByHash request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const request = Rpc.Eth.GetBlockByHashRequest(blockHash, false);

			expect(request.method).toBe("eth_getBlockByHash");
			expect(request.params?.[0]).toBe(blockHash);
		});

		it("creates eth_getBlockReceipts request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetBlockReceiptsRequest("latest");
			expect(request.method).toBe("eth_getBlockReceipts");
		});

		it("creates eth_getBlockTransactionCountByHash request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const request = Rpc.Eth.GetBlockTransactionCountByHashRequest(blockHash);

			expect(request.method).toBe("eth_getBlockTransactionCountByHash");
		});

		it("creates eth_getBlockTransactionCountByNumber request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetBlockTransactionCountByNumberRequest("latest");
			expect(request.method).toBe("eth_getBlockTransactionCountByNumber");
		});

		it("creates eth_getUncleCountByBlockHash request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const request = Rpc.Eth.GetUncleCountByBlockHashRequest(blockHash);

			expect(request.method).toBe("eth_getUncleCountByBlockHash");
		});

		it("creates eth_getUncleCountByBlockNumber request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetUncleCountByBlockNumberRequest("latest");
			expect(request.method).toBe("eth_getUncleCountByBlockNumber");
		});
	});

	describe("Transaction Methods", () => {
		it("creates eth_sendRawTransaction request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const signedTx = "0xf86c808504a817c800825208943535353535353535353535353535353535353535";
			const request = Rpc.Eth.SendRawTransactionRequest(signedTx);

			expect(request.method).toBe("eth_sendRawTransaction");
			expect(request.params?.[0]).toBe(signedTx);
		});

		it("creates eth_getTransactionByHash request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const txHash =
				"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b";
			const request = Rpc.Eth.GetTransactionByHashRequest(txHash);

			expect(request.method).toBe("eth_getTransactionByHash");
			expect(request.params?.[0]).toBe(txHash);
		});

		it("creates eth_getTransactionByBlockHashAndIndex request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const request = Rpc.Eth.GetTransactionByBlockHashAndIndexRequest(
				blockHash,
				"0x0",
			);

			expect(request.method).toBe("eth_getTransactionByBlockHashAndIndex");
		});

		it("creates eth_getTransactionByBlockNumberAndIndex request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetTransactionByBlockNumberAndIndexRequest(
				"latest",
				"0x0",
			);

			expect(request.method).toBe("eth_getTransactionByBlockNumberAndIndex");
		});

		it("creates eth_getTransactionReceipt request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const txHash =
				"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b";
			const request = Rpc.Eth.GetTransactionReceiptRequest(txHash);

			expect(request.method).toBe("eth_getTransactionReceipt");
		});

		it("creates eth_getTransactionCount request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const request = Rpc.Eth.GetTransactionCountRequest(address, "latest");

			expect(request.method).toBe("eth_getTransactionCount");
		});
	});

	describe("State Methods", () => {
		it("creates eth_getBalance request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const request = Rpc.Eth.GetBalanceRequest(address, "latest");

			expect(request.method).toBe("eth_getBalance");
		});

		it("creates eth_getCode request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const request = Rpc.Eth.GetCodeRequest(address, "latest");

			expect(request.method).toBe("eth_getCode");
		});

		it("creates eth_getStorageAt request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const request = Rpc.Eth.GetStorageAtRequest(address, "0x0", "latest");

			expect(request.method).toBe("eth_getStorageAt");
		});

		it("creates eth_getProof request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const request = Rpc.Eth.GetProofRequest(address, ["0x0", "0x1"], "latest");

			expect(request.method).toBe("eth_getProof");
		});
	});

	describe("Call Methods", () => {
		it("creates eth_call request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.CallRequest(
				{
					from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data: "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
				},
				"latest",
			);

			expect(request.method).toBe("eth_call");
		});

		it("creates eth_estimateGas request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.EstimateGasRequest({
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				value: "0xDE0B6B3A7640000",
				data: "0x",
			});

			expect(request.method).toBe("eth_estimateGas");
		});

		it("creates eth_createAccessList request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.CreateAccessListRequest(
				{
					from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data: "0x",
				},
				"latest",
			);

			expect(request.method).toBe("eth_createAccessList");
		});
	});

	describe("Log & Filter Methods", () => {
		it("creates eth_getLogs request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetLogsRequest({
				fromBlock: "earliest",
				toBlock: "latest",
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				],
			});

			expect(request.method).toBe("eth_getLogs");
		});

		it("creates eth_newFilter request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.NewFilterRequest({
				fromBlock: "latest",
				toBlock: "latest",
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				topics: [],
			});

			expect(request.method).toBe("eth_newFilter");
		});

		it("creates eth_newBlockFilter request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.NewBlockFilterRequest();
			expect(request.method).toBe("eth_newBlockFilter");
		});

		it("creates eth_newPendingTransactionFilter request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.NewPendingTransactionFilterRequest();
			expect(request.method).toBe("eth_newPendingTransactionFilter");
		});

		it("creates eth_getFilterChanges request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const filterId = "0x1";
			const request = Rpc.Eth.GetFilterChangesRequest(filterId);

			expect(request.method).toBe("eth_getFilterChanges");
		});

		it("creates eth_getFilterLogs request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const filterId = "0x1";
			const request = Rpc.Eth.GetFilterLogsRequest(filterId);

			expect(request.method).toBe("eth_getFilterLogs");
		});

		it("creates eth_uninstallFilter request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const filterId = "0x1";
			const request = Rpc.Eth.UninstallFilterRequest(filterId);

			expect(request.method).toBe("eth_uninstallFilter");
		});
	});

	describe("Fee Methods", () => {
		it("creates eth_gasPrice request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GasPriceRequest();
			expect(request.method).toBe("eth_gasPrice");
		});

		it("creates eth_maxPriorityFeePerGas request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.MaxPriorityFeePerGasRequest();
			expect(request.method).toBe("eth_maxPriorityFeePerGas");
		});

		it("creates eth_feeHistory request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.FeeHistoryRequest("0xa", "latest", [25, 50, 75]);
			expect(request.method).toBe("eth_feeHistory");
		});

		it("creates eth_blobBaseFee request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.BlobBaseFeeRequest();
			expect(request.method).toBe("eth_blobBaseFee");
		});
	});

	describe("Network Methods", () => {
		it("creates eth_chainId request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.ChainIdRequest();
			expect(request.method).toBe("eth_chainId");
		});

		it("creates eth_syncing request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.SyncingRequest();
			expect(request.method).toBe("eth_syncing");
		});

		it("creates eth_coinbase request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.CoinbaseRequest();
			expect(request.method).toBe("eth_coinbase");
		});
	});

	describe("Account Methods", () => {
		it("creates eth_accounts request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.AccountsRequest();
			expect(request.method).toBe("eth_accounts");
		});

		it("creates eth_sign request", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const data = "0xdeadbeef";
			const request = Rpc.Eth.SignRequest(address, data);

			expect(request.method).toBe("eth_sign");
		});
	});
});
