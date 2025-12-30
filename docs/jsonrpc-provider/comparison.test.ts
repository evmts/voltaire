/**
 * Tests for docs/jsonrpc-provider/comparison.mdx
 *
 * Tests the Comparison documentation that compares Voltaire's
 * JSON-RPC implementation with ethers.js and viem.
 */
import { describe, expect, it } from "vitest";

describe("Comparison Documentation", () => {
	describe("API Style Comparison", () => {
		it("demonstrates Voltaire request builder pattern", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Voltaire style: create request objects
			const blockNumReq = Rpc.Eth.BlockNumberRequest();
			const balanceReq = Rpc.Eth.GetBalanceRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				"latest",
			);

			// Request objects are plain data
			expect(blockNumReq.method).toBe("eth_blockNumber");
			expect(balanceReq.method).toBe("eth_getBalance");

			// Can be passed to any EIP-1193 provider
		});

		it("documents that Voltaire uses EIP-1193 directly", () => {
			// Key differentiator: Voltaire generates request objects for EIP-1193 providers
			// vs ethers/viem which provide provider abstractions

			const eip1193Interface = {
				request: async (_args: { method: string; params?: unknown[] }) => {},
				on: (_event: string, _listener: (...args: unknown[]) => void) => {},
				removeListener: (
					_event: string,
					_listener: (...args: unknown[]) => void,
				) => {},
			};

			expect(eip1193Interface).toHaveProperty("request");
		});
	});

	describe("Tree-shaking Benefits", () => {
		it("allows importing only needed methods", async () => {
			// Tree-shakeable imports
			const { eth } = await import("../../src/jsonrpc/index.js");

			// Only import specific methods
			const { BlockNumberRequest, GetBalanceRequest } = eth;

			expect(BlockNumberRequest).toBeDefined();
			expect(GetBalanceRequest).toBeDefined();
		});

		it("allows importing entire namespace", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Full namespace import when needed
			expect(Rpc.Eth).toBeDefined();
			expect(Rpc.Wallet).toBeDefined();
			expect(Rpc.Net).toBeDefined();
			expect(Rpc.Web3).toBeDefined();
		});
	});

	describe("Type Safety Comparison", () => {
		it("demonstrates branded type pattern", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Voltaire uses string parameters that map to branded types
			// The request builders accept standard string inputs
			const request = Rpc.Eth.GetBalanceRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", // Address string
				"latest", // BlockTag string
			);

			expect(request.params?.[0]).toMatch(/^0x[a-fA-F0-9]{40}$/);
			expect(request.params?.[1]).toBe("latest");
		});
	});

	describe("Method Coverage", () => {
		it("covers eth namespace methods", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Verify coverage of common eth methods
			const ethMethods = [
				"BlockNumberRequest",
				"GetBalanceRequest",
				"GetBlockByNumberRequest",
				"GetBlockByHashRequest",
				"GetTransactionByHashRequest",
				"GetTransactionReceiptRequest",
				"CallRequest",
				"EstimateGasRequest",
				"GetLogsRequest",
				"SendRawTransactionRequest",
			];

			for (const method of ethMethods) {
				expect(Rpc.Eth).toHaveProperty(method);
			}
		});

		it("covers wallet namespace methods", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const walletMethods = [
				"SwitchEthereumChainRequest",
				"AddEthereumChainRequest",
				"WatchAssetRequest",
			];

			for (const method of walletMethods) {
				expect(Rpc.Wallet).toHaveProperty(method);
			}
		});

		it("covers testing namespaces (anvil, hardhat)", async () => {
			const { anvil, hardhat } = await import("../../src/jsonrpc/index.js");

			// Anvil methods
			expect(anvil.evm_snapshot).toBeDefined();
			expect(anvil.evm_revert).toBeDefined();
			expect(anvil.anvil_setBalance).toBeDefined();

			// Hardhat methods
			expect(hardhat.hardhat_reset).toBeDefined();
			expect(hardhat.hardhat_setBalance).toBeDefined();
			expect(hardhat.hardhat_mine).toBeDefined();
		});
	});

	describe("Interoperability", () => {
		it("works with any EIP-1193 provider", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Create request
			const request = Rpc.Eth.BlockNumberRequest();

			// Mock any EIP-1193 compliant provider
			const mockProvider = {
				request: async (args: { method: string }) => {
					if (args.method === "eth_blockNumber") {
						return "0x112a880";
					}
					throw new Error("Unknown method");
				},
			};

			// Request can be used with any provider
			const result = await mockProvider.request(request);
			expect(result).toBe("0x112a880");
		});

		it("request objects are serializable", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetBalanceRequest(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				"latest",
			);

			// Requests are plain objects, fully serializable
			const serialized = JSON.stringify(request);
			const deserialized = JSON.parse(serialized);

			expect(deserialized.method).toBe("eth_getBalance");
			expect(deserialized.params).toEqual([
				"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				"latest",
			]);
		});
	});

	describe("Bundle Size Benefits", () => {
		it("documents that request builders are lightweight", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Request builders are simple functions that return objects
			const request = Rpc.Eth.BlockNumberRequest();

			// Result is a plain object with no prototype chain overhead
			expect(Object.getPrototypeOf(request)).toBe(Object.prototype);
		});
	});
});
