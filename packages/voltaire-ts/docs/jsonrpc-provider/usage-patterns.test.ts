/**
 * Tests for docs/jsonrpc-provider/usage-patterns.mdx
 *
 * Tests the Usage Patterns documentation showing common recipes
 * and best practices for JSON-RPC interactions.
 */
import { describe, expect, it } from "vitest";

describe("Usage Patterns Documentation", () => {
	describe("Account State Pattern", () => {
		it("demonstrates fetching complete account state", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

			// Pattern: parallel requests for account state
			const requests = {
				balance: Rpc.Eth.GetBalanceRequest(address, "latest"),
				nonce: Rpc.Eth.GetTransactionCountRequest(address, "latest"),
				code: Rpc.Eth.GetCodeRequest(address, "latest"),
			};

			expect(requests.balance.method).toBe("eth_getBalance");
			expect(requests.nonce.method).toBe("eth_getTransactionCount");
			expect(requests.code.method).toBe("eth_getCode");
		});
	});

	describe("Contract Interaction Pattern", () => {
		it("demonstrates read contract value", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const contractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const totalSupplySelector = "0x18160ddd";

			// Pattern: eth_call for read operations
			const request = Rpc.Eth.CallRequest(
				{
					to: contractAddress,
					data: totalSupplySelector,
				},
				"latest",
			);

			expect(request.method).toBe("eth_call");
		});

		it("demonstrates estimate then send pattern", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const txParams = {
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
			};

			// Step 1: Estimate gas
			const estimateReq = Rpc.Eth.EstimateGasRequest(txParams);
			expect(estimateReq.method).toBe("eth_estimateGas");

			// Step 2: Create access list (optional optimization)
			const accessListReq = Rpc.Eth.CreateAccessListRequest(txParams, "latest");
			expect(accessListReq.method).toBe("eth_createAccessList");

			// Step 3: After signing, send raw transaction
			const sendReq = Rpc.Eth.SendRawTransactionRequest("0xf86c...");
			expect(sendReq.method).toBe("eth_sendRawTransaction");
		});
	});

	describe("Transaction Monitoring Pattern", () => {
		it("demonstrates poll for receipt pattern", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const txHash =
				"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b";

			// Pattern: poll eth_getTransactionReceipt until non-null
			const receiptReq = Rpc.Eth.GetTransactionReceiptRequest(txHash);
			expect(receiptReq.method).toBe("eth_getTransactionReceipt");

			// Can also get transaction details while waiting
			const txReq = Rpc.Eth.GetTransactionByHashRequest(txHash);
			expect(txReq.method).toBe("eth_getTransactionByHash");
		});

		it("demonstrates check transaction confirmation pattern", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Pattern: compare transaction block with latest/finalized block
			const latestBlockReq = Rpc.Eth.BlockNumberRequest();
			const finalizedBlockReq = Rpc.Eth.GetBlockByNumberRequest(
				"finalized",
				false,
			);

			expect(latestBlockReq.method).toBe("eth_blockNumber");
			expect(finalizedBlockReq.params?.[0]).toBe("finalized");
		});
	});

	describe("Event Monitoring Pattern", () => {
		it("demonstrates filter-based event monitoring", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const contractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const transferTopic =
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

			// Create filter
			const filterReq = Rpc.Eth.NewFilterRequest({
				fromBlock: "latest",
				address: contractAddress,
				topics: [transferTopic],
			});
			expect(filterReq.method).toBe("eth_newFilter");

			// Poll for changes
			const pollReq = Rpc.Eth.GetFilterChangesRequest("0x1");
			expect(pollReq.method).toBe("eth_getFilterChanges");

			// Cleanup
			const uninstallReq = Rpc.Eth.UninstallFilterRequest("0x1");
			expect(uninstallReq.method).toBe("eth_uninstallFilter");
		});

		it("demonstrates historical log query", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Pattern: query logs for specific block range
			const logsReq = Rpc.Eth.GetLogsRequest({
				fromBlock: "0x112A000",
				toBlock: "0x112A100",
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				],
			});

			expect(logsReq.method).toBe("eth_getLogs");
		});
	});

	describe("Gas Estimation Pattern", () => {
		it("demonstrates EIP-1559 fee estimation", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Get latest block for base fee
			const blockReq = Rpc.Eth.GetBlockByNumberRequest("latest", false);

			// Get priority fee suggestion
			const priorityFeeReq = Rpc.Eth.MaxPriorityFeePerGasRequest();

			// Get fee history for analysis
			const historyReq = Rpc.Eth.FeeHistoryRequest("0x14", "latest", [
				25, 50, 75,
			]);

			expect(blockReq.method).toBe("eth_getBlockByNumber");
			expect(priorityFeeReq.method).toBe("eth_maxPriorityFeePerGas");
			expect(historyReq.method).toBe("eth_feeHistory");
		});

		it("demonstrates legacy gas price pattern", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const gasPriceReq = Rpc.Eth.GasPriceRequest();
			expect(gasPriceReq.method).toBe("eth_gasPrice");
		});
	});

	describe("Batching Pattern", () => {
		it("demonstrates preparing batch of requests", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

			// Pattern: create multiple requests for batching
			const batch = [
				Rpc.Eth.BlockNumberRequest(),
				Rpc.Eth.GetBalanceRequest(address, "latest"),
				Rpc.Eth.GetTransactionCountRequest(address, "latest"),
				Rpc.Eth.GasPriceRequest(),
			];

			// All requests can be sent in parallel
			expect(batch).toHaveLength(4);
			expect(batch.every((r) => r.method.startsWith("eth_"))).toBe(true);
		});
	});

	describe("Network Detection Pattern", () => {
		it("demonstrates verifying connected network", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Quick check: chainId
			const chainIdReq = Rpc.Eth.ChainIdRequest();
			expect(chainIdReq.method).toBe("eth_chainId");

			// Full status check
			const syncReq = Rpc.Eth.SyncingRequest();
			expect(syncReq.method).toBe("eth_syncing");
		});
	});

	describe("Error Recovery Pattern", () => {
		it("documents retry logic based on error codes", async () => {
			const { METHOD_NOT_FOUND, INVALID_PARAMS, LIMIT_EXCEEDED } = await import(
				"../../src/jsonrpc/JsonRpcError/index.js"
			);

			// Pattern: categorize errors for retry decision
			const nonRetryable = new Set([METHOD_NOT_FOUND, INVALID_PARAMS]);
			const rateLimitError = LIMIT_EXCEEDED;

			expect(nonRetryable.has(METHOD_NOT_FOUND)).toBe(true);
			expect(rateLimitError).toBe(-32005);
		});
	});
});
