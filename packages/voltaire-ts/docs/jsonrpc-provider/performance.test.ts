/**
 * Tests for docs/jsonrpc-provider/performance.mdx
 *
 * Tests the Performance documentation showing optimization strategies
 * and best practices for JSON-RPC interactions.
 */
import { describe, expect, it } from "vitest";

describe("Performance Documentation", () => {
	describe("Request Batching", () => {
		it("demonstrates creating multiple requests for batching", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Pattern: batch independent requests
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

			const requests = [
				Rpc.Eth.GetBalanceRequest(address, "latest"),
				Rpc.Eth.GetTransactionCountRequest(address, "latest"),
				Rpc.Eth.GetCodeRequest(address, "latest"),
			];

			// All are independent and can be batched
			expect(requests).toHaveLength(3);
			expect(requests[0].method).toBe("eth_getBalance");
			expect(requests[1].method).toBe("eth_getTransactionCount");
			expect(requests[2].method).toBe("eth_getCode");
		});

		it("shows that requests are plain objects for easy batching", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const request = Rpc.Eth.BlockNumberRequest();

			// Requests are plain objects, easy to JSON encode for batch requests
			const json = JSON.stringify([
				{ jsonrpc: "2.0", id: 1, ...request },
				{ jsonrpc: "2.0", id: 2, method: "eth_chainId" },
			]);

			const parsed = JSON.parse(json);
			expect(parsed).toHaveLength(2);
			expect(parsed[0].method).toBe("eth_blockNumber");
		});
	});

	describe("Parallel Requests with Promise.all", () => {
		it("demonstrates parallel request pattern", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Create requests that can run in parallel
			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

			const createParallelRequests = () => [
				Rpc.Eth.GetBalanceRequest(address, "latest"),
				Rpc.Eth.GasPriceRequest(),
				Rpc.Eth.BlockNumberRequest(),
			];

			const requests = createParallelRequests();

			// These can all be sent via Promise.all
			expect(requests[0].method).toBe("eth_getBalance");
			expect(requests[1].method).toBe("eth_gasPrice");
			expect(requests[2].method).toBe("eth_blockNumber");
		});
	});

	describe("Caching Strategies", () => {
		it("identifies cacheable vs non-cacheable methods", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Methods safe to cache (immutable data)
			const cacheableByBlock = [
				Rpc.Eth.GetBalanceRequest(
					"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					"0x112A880", // specific block
				),
				Rpc.Eth.GetCodeRequest(
					"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					"0x112A880",
				),
			];

			// Methods that should NOT be cached long-term
			const notCacheable = [
				Rpc.Eth.BlockNumberRequest(), // changes every block
				Rpc.Eth.GasPriceRequest(), // changes frequently
				Rpc.Eth.GetBalanceRequest(
					"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					"latest", // "latest" means it changes
				),
			];

			// Historical queries at specific blocks are cacheable
			expect(cacheableByBlock[0].params?.[1]).toBe("0x112A880");
			expect(notCacheable[2].params?.[1]).toBe("latest");
		});
	});

	describe("Minimal Request Payloads", () => {
		it("demonstrates that requests are minimal", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Requests only include what's needed
			const blockNumReq = Rpc.Eth.BlockNumberRequest();
			expect(blockNumReq).toEqual({ method: "eth_blockNumber" });

			// No params when not needed
			expect(blockNumReq.params).toBeUndefined();

			// Params included only when necessary
			const balanceReq = Rpc.Eth.GetBalanceRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				"latest",
			);
			expect(balanceReq.params).toHaveLength(2);
		});
	});

	describe("Tree-shaking for Bundle Size", () => {
		it("allows importing only needed methods", async () => {
			// Direct method imports for minimal bundle
			const { BlockNumberRequest, GetBalanceRequest } = await import(
				"../../src/jsonrpc/eth/methods.js"
			);

			expect(BlockNumberRequest).toBeDefined();
			expect(GetBalanceRequest).toBeDefined();

			// vs importing entire Rpc object
		});
	});

	describe("Efficient Log Queries", () => {
		it("demonstrates block range limiting for large queries", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Bad: query entire chain history
			// const badReq = Rpc.Eth.GetLogsRequest({ fromBlock: 'earliest', toBlock: 'latest' });

			// Good: query limited range
			const goodReq = Rpc.Eth.GetLogsRequest({
				fromBlock: "0x112A000",
				toBlock: "0x112A100", // 256 blocks max
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			});

			expect(goodReq.params?.[0].fromBlock).toBe("0x112A000");
			expect(goodReq.params?.[0].toBlock).toBe("0x112A100");
		});

		it("demonstrates topic filtering for efficiency", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// More specific = faster query
			const request = Rpc.Eth.GetLogsRequest({
				fromBlock: "0x112A000",
				toBlock: "latest",
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer event
					null, // Any sender
					"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0", // Specific recipient
				],
			});

			expect(request.params?.[0].topics).toHaveLength(3);
		});
	});

	describe("Filter Lifecycle Management", () => {
		it("demonstrates proper filter cleanup", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// 1. Create filter
			const createReq = Rpc.Eth.NewFilterRequest({
				fromBlock: "latest",
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			});

			// 2. Poll periodically
			const pollReq = Rpc.Eth.GetFilterChangesRequest("0x1");

			// 3. Always cleanup - filters consume server resources
			const cleanupReq = Rpc.Eth.UninstallFilterRequest("0x1");

			expect(createReq.method).toBe("eth_newFilter");
			expect(pollReq.method).toBe("eth_getFilterChanges");
			expect(cleanupReq.method).toBe("eth_uninstallFilter");
		});
	});

	describe("Gas Optimization", () => {
		it("demonstrates access list creation for gas savings", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Create access list to optimize gas
			const accessListReq = Rpc.Eth.CreateAccessListRequest(
				{
					from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
				},
				"latest",
			);

			expect(accessListReq.method).toBe("eth_createAccessList");
		});

		it("demonstrates fee history for optimal pricing", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Use fee history to avoid overpaying
			const feeHistoryReq = Rpc.Eth.FeeHistoryRequest("0x14", "latest", [
				10, 25, 50, 75, 90,
			]);

			expect(feeHistoryReq.method).toBe("eth_feeHistory");
			expect(feeHistoryReq.params?.[2]).toEqual([10, 25, 50, 75, 90]);
		});
	});
});
