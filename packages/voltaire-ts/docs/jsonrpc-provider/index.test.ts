/**
 * Tests for docs/jsonrpc-provider/index.mdx
 *
 * Tests the code examples shown in the JSONRPCProvider main documentation page.
 * Focuses on the Rpc namespace API and request builder patterns.
 */
import { describe, expect, it } from "vitest";

describe("JSONRPCProvider Index Documentation", () => {
	describe("Provider Interface", () => {
		// The docs show the Provider interface structure
		// This tests that our types align with EIP-1193
		it("demonstrates EIP-1193 provider interface structure", async () => {
			// Mock provider following EIP-1193
			const mockProvider = {
				request: async (args: { method: string; params?: unknown[] }) => {
					if (args.method === "eth_blockNumber") {
						return "0x112a880";
					}
					throw new Error("Unknown method");
				},
				on: (_event: string, _listener: (...args: unknown[]) => void) => {},
				removeListener: (
					_event: string,
					_listener: (...args: unknown[]) => void,
				) => {},
			};

			expect(mockProvider).toHaveProperty("request");
			expect(mockProvider).toHaveProperty("on");
			expect(mockProvider).toHaveProperty("removeListener");
		});
	});

	describe("Request Builders", () => {
		it("creates BlockNumberRequest with correct structure", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const request = Rpc.Eth.BlockNumberRequest();

			expect(request).toEqual({
				method: "eth_blockNumber",
			});
		});

		it("creates GetBalanceRequest with address and block tag", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const request = Rpc.Eth.GetBalanceRequest(address, "latest");

			expect(request).toEqual({
				method: "eth_getBalance",
				params: [address, "latest"],
			});
		});

		it("creates GetTransactionCountRequest for nonce queries", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const request = Rpc.Eth.GetTransactionCountRequest(address, "latest");

			expect(request).toEqual({
				method: "eth_getTransactionCount",
				params: [address, "latest"],
			});
		});

		it("creates CallRequest for contract calls", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const request = Rpc.Eth.CallRequest(
				{
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data: "0x18160ddd", // totalSupply()
				},
				"latest",
			);

			expect(request.method).toBe("eth_call");
			expect(request.params).toBeDefined();
			expect(request.params?.[1]).toBe("latest");
		});

		it("creates GetCodeRequest for contract bytecode", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const request = Rpc.Eth.GetCodeRequest(address, "latest");

			expect(request).toEqual({
				method: "eth_getCode",
				params: [address, "latest"],
			});
		});
	});

	describe("Usage Patterns from Docs", () => {
		it("demonstrates parallel requests pattern", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

			// Create requests as shown in docs
			const balanceReq = Rpc.Eth.GetBalanceRequest(address, "latest");
			const nonceReq = Rpc.Eth.GetTransactionCountRequest(address, "latest");

			// Verify both requests are properly formed
			expect(balanceReq.method).toBe("eth_getBalance");
			expect(nonceReq.method).toBe("eth_getTransactionCount");

			// Both should have the same address as first param
			expect(balanceReq.params?.[0]).toBe(address);
			expect(nonceReq.params?.[0]).toBe(address);
		});

		it("demonstrates query contract state pattern", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const contractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

			// Check if contract exists first
			const codeReq = Rpc.Eth.GetCodeRequest(contractAddress, "latest");
			expect(codeReq.method).toBe("eth_getCode");

			// Then call contract method
			const callReq = Rpc.Eth.CallRequest(
				{
					to: contractAddress,
					data: "0x18160ddd", // totalSupply()
				},
				"latest",
			);
			expect(callReq.method).toBe("eth_call");
		});

		it("demonstrates transaction receipt request", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const txHash =
				"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b";
			const request = Rpc.Eth.GetTransactionReceiptRequest(txHash);

			expect(request).toEqual({
				method: "eth_getTransactionReceipt",
				params: [txHash],
			});
		});
	});

	describe("Error Handling Pattern", () => {
		it("demonstrates try/catch pattern with provider", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const mockProvider = {
				request: async (args: { method: string; params?: unknown[] }) => {
					if (args.method === "eth_blockNumber") {
						return "0x112a880";
					}
					const error = new Error("Method not found") as Error & {
						code: number;
					};
					error.code = -32601;
					throw error;
				},
			};

			// Success case
			const blockReq = Rpc.Eth.BlockNumberRequest();
			const result = await mockProvider.request(blockReq);
			expect(result).toBe("0x112a880");

			// Error case
			try {
				await mockProvider.request({ method: "unknown_method" });
				expect.fail("Should have thrown");
			} catch (error) {
				expect((error as Error & { code: number }).code).toBe(-32601);
			}
		});
	});

	describe("GetLogsRequest", () => {
		it("creates log filter request with address and topics", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const contractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const transferSignature =
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

			const request = Rpc.Eth.GetLogsRequest({
				fromBlock: "earliest",
				toBlock: "latest",
				address: contractAddress,
				topics: [transferSignature],
			});

			expect(request.method).toBe("eth_getLogs");
			expect(request.params).toBeDefined();
		});
	});
});
