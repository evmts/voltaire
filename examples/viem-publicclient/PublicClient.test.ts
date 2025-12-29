/**
 * PublicClient Tests
 *
 * Tests for the viem-style PublicClient implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	createPublicClient,
	createClient,
	http,
	mainnet,
	sepolia,
	publicActions,
	getBlockNumber,
	getBalance,
	getChainId,
	call,
	getBlock,
	getTransaction,
	getLogs,
	getCode,
	getStorageAt,
	getTransactionCount,
	getGasPrice,
	estimateGas,
	UrlRequiredError,
	TransactionNotFoundError,
	BlockNotFoundError,
	RpcRequestError,
} from "./index.js";
import type { Client, PublicClient } from "./index.js";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PublicClient", () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("createPublicClient", () => {
		it("should create a public client with http transport", () => {
			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			expect(client).toBeDefined();
			expect(client.type).toBe("publicClient");
			expect(client.key).toBe("public");
			expect(client.name).toBe("Public Client");
			expect(client.chain).toBe(mainnet);
			expect(client.transport.type).toBe("http");
		});

		it("should use chain default RPC if no URL provided", () => {
			const client = createPublicClient({
				chain: mainnet,
				transport: http(),
			});

			expect(client.transport.url).toBe(mainnet.rpcUrls.default.http[0]);
		});

		it("should throw UrlRequiredError when no URL and no chain", () => {
			expect(() => {
				createPublicClient({
					transport: http(),
				});
			}).toThrow(UrlRequiredError);
		});

		it("should have a unique uid", () => {
			const client1 = createPublicClient({
				chain: mainnet,
				transport: http(),
			});
			const client2 = createPublicClient({
				chain: mainnet,
				transport: http(),
			});

			expect(client1.uid).toBeDefined();
			expect(client2.uid).toBeDefined();
			expect(client1.uid).not.toBe(client2.uid);
		});

		it("should calculate polling interval from chain block time", () => {
			const mainnetClient = createPublicClient({
				chain: mainnet, // 12s block time
				transport: http(),
			});

			// Default is half block time, clamped to 500-4000ms
			expect(mainnetClient.pollingInterval).toBe(4000); // 12000/2 = 6000, clamped to 4000

			const arbitrumClient = createPublicClient({
				chain: { ...mainnet, blockTime: 250 }, // 250ms block time
				transport: http(),
			});

			expect(arbitrumClient.pollingInterval).toBe(500); // 250/2 = 125, clamped to 500
		});
	});

	describe("extend", () => {
		it("should extend client with custom actions", () => {
			const client = createPublicClient({
				chain: mainnet,
				transport: http(),
			});

			const extendedClient = client.extend((base) => ({
				customAction: () => "custom result",
				getDoubleBlockNumber: async () => {
					const blockNumber = await base.getBlockNumber();
					return blockNumber * 2n;
				},
			}));

			expect(extendedClient.customAction()).toBe("custom result");
			expect(typeof extendedClient.getDoubleBlockNumber).toBe("function");
			// Original actions still available
			expect(typeof extendedClient.getBlockNumber).toBe("function");
		});

		it("should chain multiple extends", () => {
			const client = createPublicClient({
				chain: mainnet,
				transport: http(),
			});

			const extended1 = client.extend(() => ({
				action1: () => 1,
			}));

			const extended2 = extended1.extend(() => ({
				action2: () => 2,
			}));

			expect(extended2.action1()).toBe(1);
			expect(extended2.action2()).toBe(2);
			expect(typeof extended2.getBlockNumber).toBe("function");
		});
	});

	describe("getBlockNumber", () => {
		it("should return the current block number", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x123456",
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const blockNumber = await client.getBlockNumber();

			expect(blockNumber).toBe(0x123456n);
			expect(mockFetch).toHaveBeenCalledWith(
				"https://eth.example.com",
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining("eth_blockNumber"),
				}),
			);
		});

		it("should cache block number", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x123456",
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
				cacheTime: 5000,
			});

			await client.getBlockNumber();
			await client.getBlockNumber();

			// Should only call fetch once due to caching
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});
	});

	describe("getBalance", () => {
		it("should return balance for address", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0xde0b6b3a7640000", // 1 ETH
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const balance = await client.getBalance({
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
			});

			expect(balance).toBe(1000000000000000000n);
		});

		it("should accept block number", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x0",
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			await client.getBalance({
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
				blockNumber: 19000000n,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				"https://eth.example.com",
				expect.objectContaining({
					body: expect.stringContaining("0x121eac0"), // 19000000 in hex
				}),
			);
		});
	});

	describe("getChainId", () => {
		it("should return chain ID", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x1",
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const chainId = await client.getChainId();

			expect(chainId).toBe(1);
		});
	});

	describe("call", () => {
		it("should execute eth_call", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const result = await client.call({
				to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				data: "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0",
			});

			expect(result.data).toBe(
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
			);
		});

		it("should return undefined data for empty response", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x",
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const result = await client.call({
				to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				data: "0x",
			});

			expect(result.data).toBeUndefined();
		});
	});

	describe("getBlock", () => {
		it("should get block by number", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: {
						number: "0x123456",
						hash: "0xabc123",
						parentHash: "0xdef456",
						timestamp: "0x60d1e2c5",
						gasLimit: "0x1c9c380",
						gasUsed: "0x1000000",
						size: "0x1234",
						extraData: "0x",
						logsBloom: "0x00",
						miner: "0x0000000000000000000000000000000000000000",
						receiptsRoot: "0x",
						stateRoot: "0x",
						transactionsRoot: "0x",
						sha3Uncles: "0x",
						transactions: [],
						uncles: [],
					},
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const block = await client.getBlock({ blockNumber: 0x123456n });

			expect(block.number).toBe(0x123456n);
			expect(block.hash).toBe("0xabc123");
		});

		it("should throw BlockNotFoundError for missing block", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: null,
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			await expect(
				client.getBlock({ blockNumber: 999999999n }),
			).rejects.toThrow(BlockNotFoundError);
		});
	});

	describe("getTransaction", () => {
		it("should get transaction by hash", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: {
						hash: "0xabc123",
						from: "0x1234567890123456789012345678901234567890",
						to: "0x0987654321098765432109876543210987654321",
						value: "0xde0b6b3a7640000",
						gas: "0x5208",
						gasPrice: "0x4a817c800",
						nonce: "0x1",
						input: "0x",
						blockHash: "0xdef456",
						blockNumber: "0x123456",
						transactionIndex: "0x0",
						v: "0x1b",
						r: "0x1234",
						s: "0x5678",
						type: "0x0",
					},
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const tx = await client.getTransaction({
				hash: "0xabc123",
			});

			expect(tx.hash).toBe("0xabc123");
			expect(tx.value).toBe(1000000000000000000n);
		});

		it("should throw TransactionNotFoundError for missing tx", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: null,
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			await expect(
				client.getTransaction({ hash: "0xnonexistent" }),
			).rejects.toThrow(TransactionNotFoundError);
		});
	});

	describe("getLogs", () => {
		it("should get logs with filter", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: [
						{
							address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
							topics: [
								"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
							],
							data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
							blockNumber: "0x123456",
							blockHash: "0xabc123",
							transactionHash: "0xdef456",
							transactionIndex: "0x0",
							logIndex: "0x0",
							removed: false,
						},
					],
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const logs = await client.getLogs({
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				fromBlock: 19000000n,
				toBlock: 19000100n,
			});

			expect(logs).toHaveLength(1);
			expect(logs[0].address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
		});
	});

	describe("RPC error handling", () => {
		it("should throw RpcRequestError on RPC error", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					error: {
						code: -32000,
						message: "execution reverted",
					},
				}),
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			await expect(client.getBlockNumber()).rejects.toThrow(RpcRequestError);
		});

		it("should throw RpcRequestError on HTTP error", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			const client = createPublicClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			await expect(client.getBlockNumber()).rejects.toThrow(RpcRequestError);
		});
	});

	describe("standalone actions", () => {
		it("should work with standalone getBlockNumber", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x123456",
				}),
			});

			const client = createClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const blockNumber = await getBlockNumber(client);

			expect(blockNumber).toBe(0x123456n);
		});

		it("should work with publicActions decorator", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					result: "0x1",
				}),
			});

			const client = createClient({
				chain: mainnet,
				transport: http("https://eth.example.com"),
			});

			const clientWithActions = client.extend(publicActions);

			const chainId = await clientWithActions.getChainId();

			expect(chainId).toBe(1);
		});
	});
});
