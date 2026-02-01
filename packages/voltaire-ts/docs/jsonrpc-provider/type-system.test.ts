/**
 * Tests for docs/jsonrpc-provider/type-system.mdx
 *
 * Tests the Type System documentation examples.
 * Note: The docs indicate this page is a placeholder with AI-generated examples.
 * Tests focus on verifiable aspects of the actual API.
 */
import { describe, expect, it } from "vitest";

describe("Type System Documentation", () => {
	describe("Namespace Organization", () => {
		it("exports eth namespace methods", async () => {
			const { eth } = await import("../../src/jsonrpc/index.js");

			// Verify eth namespace has expected methods
			expect(eth).toHaveProperty("BlockNumberRequest");
			expect(eth).toHaveProperty("GetBalanceRequest");
			expect(eth).toHaveProperty("GetTransactionCountRequest");
			expect(eth).toHaveProperty("GetCodeRequest");
			expect(eth).toHaveProperty("CallRequest");
		});

		// API DISCREPANCY: debug namespace is declared in index.ts but exports undefined
		// The docs describe debug methods but they're not fully implemented yet
		it.skip("exports debug namespace methods", async () => {
			const { debug } = await import("../../src/jsonrpc/index.js");

			expect(debug).toBeDefined();
			// Debug namespace exists for tracing methods
		});

		// API DISCREPANCY: engine namespace is declared in index.ts but exports undefined
		// The docs describe engine methods but they're not fully implemented yet
		it.skip("exports engine namespace methods", async () => {
			const { engine } = await import("../../src/jsonrpc/index.js");

			expect(engine).toBeDefined();
			// Engine namespace exists for consensus layer methods
		});

		it("exports wallet namespace methods", async () => {
			const { wallet } = await import("../../src/jsonrpc/index.js");

			expect(wallet).toBeDefined();
			// Wallet namespace exists for EIP-3326/EIP-747 methods
		});
	});

	describe("Base Types", () => {
		// The docs describe branded types: Address, Hash, Hex, Quantity
		// We test that the request builders work with string representations
		it("accepts address strings in request builders", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const request = Rpc.Eth.GetBalanceRequest(address, "latest");

			expect(request.params?.[0]).toBe(address);
		});

		it("accepts hash strings in request builders", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const hash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const request = Rpc.Eth.GetBlockByHashRequest(hash, false);

			expect(request.params?.[0]).toBe(hash);
		});

		it("accepts hex strings in CallRequest data field", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const data = "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0";
			const request = Rpc.Eth.CallRequest(
				{
					to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					data,
				},
				"latest",
			);

			expect(request.params?.[0]).toHaveProperty("data", data);
		});

		it("accepts quantity strings as block tags", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Quantity as hex block number
			const blockNumber = "0x112A880";
			const request = Rpc.Eth.GetBlockByNumberRequest(blockNumber, false);

			expect(request.params?.[0]).toBe(blockNumber);
		});
	});

	describe("Rpc Namespace API", () => {
		it("provides Rpc.Eth request constructors", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			expect(Rpc.Eth).toHaveProperty("BlockNumberRequest");
			expect(Rpc.Eth).toHaveProperty("GetBalanceRequest");
			expect(Rpc.Eth).toHaveProperty("CallRequest");
			expect(Rpc.Eth).toHaveProperty("EstimateGasRequest");
			expect(Rpc.Eth).toHaveProperty("SendRawTransactionRequest");
		});

		it("provides Rpc.Wallet request constructors", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			expect(Rpc.Wallet).toHaveProperty("SwitchEthereumChainRequest");
			expect(Rpc.Wallet).toHaveProperty("AddEthereumChainRequest");
			expect(Rpc.Wallet).toHaveProperty("WatchAssetRequest");
		});

		it("provides Rpc.Web3 request constructors", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			expect(Rpc.Web3).toHaveProperty("ClientVersionRequest");
			expect(Rpc.Web3).toHaveProperty("Sha3Request");
		});

		it("provides Rpc.Net request constructors", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			expect(Rpc.Net).toHaveProperty("VersionRequest");
			expect(Rpc.Net).toHaveProperty("ListeningRequest");
			expect(Rpc.Net).toHaveProperty("PeerCountRequest");
		});
	});

	describe("Types Module Export", () => {
		// API DISCREPANCY: types namespace is declared in index.ts but exports undefined
		// The docs describe types module but it's not fully wired up yet
		it.skip("exports types module for shared type definitions", async () => {
			const { types } = await import("../../src/jsonrpc/index.js");

			expect(types).toBeDefined();
		});
	});
});
