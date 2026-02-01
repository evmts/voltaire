/**
 * Tests for docs/jsonrpc-provider/eth-methods/calls.mdx
 *
 * Tests the Contract Call Methods documentation for eth_call, eth_estimateGas,
 * eth_createAccessList, and eth_simulateV1.
 * Note: The docs indicate this page is a placeholder with AI-generated examples.
 */
import { describe, expect, it } from "vitest";

describe("Contract Call Methods Documentation", () => {
	describe("eth_call", () => {
		it("creates request with call parameters and block tag", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.CallRequest(
				{
					from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data: "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
				},
				"latest",
			);

			expect(request.method).toBe("eth_call");
			expect(request.params?.[0]).toHaveProperty("from");
			expect(request.params?.[0]).toHaveProperty("to");
			expect(request.params?.[0]).toHaveProperty("data");
			expect(request.params?.[1]).toBe("latest");
		});

		it("creates request with minimal parameters", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			// Minimal call - just to and data
			const request = Rpc.Eth.CallRequest(
				{
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data: "0x18160ddd", // totalSupply()
				},
				"latest",
			);

			expect(request.method).toBe("eth_call");
		});

		it("creates request with gas and value parameters", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.CallRequest(
				{
					from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					gas: "0x5208",
					gasPrice: "0x3B9ACA00",
					value: "0x0",
					data: "0x70a08231",
				},
				"latest",
			);

			expect(request.params?.[0]).toHaveProperty("gas");
			expect(request.params?.[0]).toHaveProperty("gasPrice");
			expect(request.params?.[0]).toHaveProperty("value");
		});
	});

	describe("eth_estimateGas", () => {
		it("creates request with transaction parameters", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.EstimateGasRequest({
				from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
				to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				value: "0xDE0B6B3A7640000", // 1 ETH
				data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
			});

			expect(request.method).toBe("eth_estimateGas");
			expect(request.params?.[0]).toHaveProperty("from");
			expect(request.params?.[0]).toHaveProperty("to");
		});

		it("creates request for simple ETH transfer", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.EstimateGasRequest({
				from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
				to: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
				value: "0xDE0B6B3A7640000",
			});

			expect(request.method).toBe("eth_estimateGas");
		});
	});

	describe("eth_createAccessList", () => {
		it("creates request with call parameters and block tag", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.CreateAccessListRequest(
				{
					from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
				},
				"latest",
			);

			expect(request.method).toBe("eth_createAccessList");
			expect(request.params?.[0]).toHaveProperty("from");
			expect(request.params?.[0]).toHaveProperty("to");
			expect(request.params?.[1]).toBe("latest");
		});
	});

	describe("eth_simulateV1", () => {
		it("creates request with simulation parameters", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.SimulateV1Request({
				blockStateCalls: [
					{
						calls: [
							{
								from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
								to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
								data: "0x70a08231",
							},
						],
					},
				],
				validation: true,
			});

			expect(request.method).toBe("eth_simulateV1");
		});
	});

	describe("Usage Patterns from Docs", () => {
		it("demonstrates estimating gas with buffer pattern", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			// Create estimate request
			const request = Rpc.Eth.EstimateGasRequest({
				from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
				to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				data: "0xa9059cbb",
			});

			expect(request.method).toBe("eth_estimateGas");

			// Pattern: Add 20% buffer
			// const withBuffer = estimate * 120n / 100n;
		});

		it("demonstrates read-only contract call pattern", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			// Common use cases from docs:
			// - Call contract view functions
			// - Query contract state
			// - Validate transaction execution before sending

			const balanceOfReq = Rpc.Eth.CallRequest(
				{
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data: "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
				},
				"latest",
			);

			expect(balanceOfReq.method).toBe("eth_call");
		});

		it("demonstrates access list optimization pattern", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			// Create access list for complex transaction
			const accessListReq = Rpc.Eth.CreateAccessListRequest(
				{
					from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data: "0xa9059cbb",
				},
				"latest",
			);

			expect(accessListReq.method).toBe("eth_createAccessList");

			// Benefits from docs:
			// - Reduces gas costs for complex transactions
			// - Makes gas costs more predictable
		});
	});
});
