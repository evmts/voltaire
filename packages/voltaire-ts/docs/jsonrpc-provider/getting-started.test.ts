/**
 * Tests for docs/jsonrpc-provider/getting-started.mdx
 *
 * Tests the code examples shown in the Getting Started documentation.
 * Focuses on basic request patterns and error handling.
 */
import { describe, expect, it } from "vitest";

describe("Getting Started Documentation", () => {
	describe("Your First Request", () => {
		it("creates BlockNumberRequest with no parameters", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const request = Rpc.Eth.BlockNumberRequest();

			expect(request).toEqual({
				method: "eth_blockNumber",
			});
		});

		it("creates GetBalanceRequest with Address parameter", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const request = Rpc.Eth.GetBalanceRequest(address, "latest");

			expect(request).toEqual({
				method: "eth_getBalance",
				params: [address, "latest"],
			});
		});

		it("creates CallRequest for contract method", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const contractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
			const methodSignature = "0x18160ddd"; // totalSupply()

			const request = Rpc.Eth.CallRequest(
				{
					to: contractAddress,
					data: methodSignature,
				},
				"latest",
			);

			expect(request.method).toBe("eth_call");
			expect(request.params?.[0]).toHaveProperty("to", contractAddress);
			expect(request.params?.[0]).toHaveProperty("data", methodSignature);
			expect(request.params?.[1]).toBe("latest");
		});
	});

	describe("Common Patterns", () => {
		it("demonstrates check account state pattern with parallel requests", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

			// Create all three requests as shown in docs
			const balanceReq = Rpc.Eth.GetBalanceRequest(address, "latest");
			const nonceReq = Rpc.Eth.GetTransactionCountRequest(address, "latest");
			const codeReq = Rpc.Eth.GetCodeRequest(address, "latest");

			// Verify all requests are properly formed
			expect(balanceReq.method).toBe("eth_getBalance");
			expect(nonceReq.method).toBe("eth_getTransactionCount");
			expect(codeReq.method).toBe("eth_getCode");

			// All should use same address
			expect(balanceReq.params?.[0]).toBe(address);
			expect(nonceReq.params?.[0]).toBe(address);
			expect(codeReq.params?.[0]).toBe(address);
		});

		it("demonstrates EstimateGasRequest", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const request = Rpc.Eth.EstimateGasRequest({
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				value: "0x0",
				data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
			});

			expect(request.method).toBe("eth_estimateGas");
			expect(request.params).toBeDefined();
		});

		it("demonstrates historical state query with block number", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const blockNumber = "0xF4240"; // Block 1,000,000

			const request = Rpc.Eth.GetBalanceRequest(address, blockNumber);

			expect(request).toEqual({
				method: "eth_getBalance",
				params: [address, blockNumber],
			});
		});
	});

	describe("Block Tags", () => {
		it("supports all standard block tags", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

			const blockTags = [
				"latest",
				"earliest",
				"pending",
				"safe",
				"finalized",
			] as const;

			for (const tag of blockTags) {
				const request = Rpc.Eth.GetBalanceRequest(address, tag);
				expect(request.params?.[1]).toBe(tag);
			}
		});
	});

	describe("Request vs Result Pattern", () => {
		// The docs emphasize that request builders return RequestArguments, not results
		it("request builders return method and params, not results", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const request = Rpc.Eth.BlockNumberRequest();

			// Request is just a plain object with method (and optionally params)
			expect(request).toHaveProperty("method");
			expect(typeof request.method).toBe("string");

			// It doesn't have result-like properties
			expect(request).not.toHaveProperty("result");
			expect(request).not.toHaveProperty("error");
		});
	});

	describe("Troubleshooting Patterns", () => {
		// Docs show common mistakes
		it("request builders need provider.request() to execute", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// This just creates the request object
			const request = Rpc.Eth.BlockNumberRequest();

			// The request itself is just { method: 'eth_blockNumber' }
			expect(request.method).toBe("eth_blockNumber");

			// To get actual result, must send through provider.request()
			// This is the pattern shown in the troubleshooting section
		});
	});
});
