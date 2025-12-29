/**
 * Ethers v6 Style Provider Tests
 *
 * Tests for the ethers v6-compatible JsonRpcProvider implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EthersProvider, NetworkImpl } from "../../examples/ethers-provider/EthersProvider.js";

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

/**
 * Setup mock to return specific result
 * Parses the request body to get the ID and returns matching response
 */
function setupMockResponse(result: unknown) {
	mockFetch.mockImplementationOnce(async (_, init) => {
		const body = JSON.parse(init?.body as string);
		return {
			ok: true,
			json: async () => (Array.isArray(body)
				? body.map((req: any) => ({ jsonrpc: "2.0", id: req.id, result }))
				: { jsonrpc: "2.0", id: body.id, result }
			),
		};
	});
}

/**
 * Setup mock to return error
 */
function setupMockError(code: number, message: string) {
	mockFetch.mockImplementationOnce(async (_, init) => {
		const body = JSON.parse(init?.body as string);
		return {
			ok: true,
			json: async () => (Array.isArray(body)
				? body.map((req: any) => ({ jsonrpc: "2.0", id: req.id, error: { code, message } }))
				: { jsonrpc: "2.0", id: body.id, error: { code, message } }
			),
		};
	});
}

describe("NetworkImpl", () => {
	it("should create from chain ID", () => {
		const network = NetworkImpl.from(1);
		expect(network.chainId).toBe(1n);
	});

	it("should create from bigint chain ID", () => {
		const network = NetworkImpl.from(137n);
		expect(network.chainId).toBe(137n);
	});

	it("should create from known network name", () => {
		const network = NetworkImpl.from("mainnet");
		expect(network.name).toBe("mainnet");
		expect(network.chainId).toBe(1n);
	});

	it("should create from network object", () => {
		const network = NetworkImpl.from({ name: "custom", chainId: 12345 });
		expect(network.name).toBe("custom");
		expect(network.chainId).toBe(12345n);
	});

	it("should clone network", () => {
		const network = NetworkImpl.from("mainnet");
		const cloned = network.clone();
		expect(cloned.name).toBe(network.name);
		expect(cloned.chainId).toBe(network.chainId);
		expect(cloned).not.toBe(network);
	});

	it("should match network by chain ID", () => {
		const network = NetworkImpl.from(1);
		expect(network.matches(1)).toBe(true);
		expect(network.matches(1n)).toBe(true);
		expect(network.matches({ chainId: 1 })).toBe(true);
		expect(network.matches(2)).toBe(false);
	});

	it("should compute intrinsic gas", () => {
		const network = NetworkImpl.from(1);

		// Simple transfer
		expect(network.computeIntrinsicGas({ to: "0x123" })).toBe(21000n);

		// Contract creation
		expect(network.computeIntrinsicGas({ to: null })).toBe(53000n);

		// With data
		expect(network.computeIntrinsicGas({ to: "0x123", data: "0x00ff" })).toBe(21000n + 4n + 16n);
	});
});

describe("EthersProvider", () => {
	let provider: EthersProvider;

	beforeEach(() => {
		vi.clearAllMocks();
		// Disable batching and caching for tests to avoid mock interference
		provider = new EthersProvider("http://localhost:8545", undefined, {
			batchStallTime: 0,
			batchMaxCount: 1,
			cacheTimeout: -1,
		});
	});

	afterEach(() => {
		provider.destroy();
	});

	describe("construction", () => {
		it("should create with URL only", () => {
			const p = new EthersProvider("http://localhost:8545");
			expect(p.destroyed).toBe(false);
			expect(p.paused).toBe(false);
			p.destroy();
		});

		it("should create with static network", () => {
			const p = new EthersProvider("http://localhost:8545", "mainnet", { staticNetwork: true });
			expect(p.destroyed).toBe(false);
			p.destroy();
		});

		it("should have default polling interval", () => {
			expect(provider.pollingInterval).toBe(4000);
		});
	});

	describe("send", () => {
		it("should send JSON-RPC request", async () => {
			setupMockResponse("0x1");

			const result = await provider.send("eth_chainId", []);
			expect(result).toBe("0x1");
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it("should handle RPC errors", async () => {
			setupMockError(-32600, "Invalid Request");

			await expect(provider.send("invalid_method", [])).rejects.toThrow();
		});

		it("should cache identical requests", async () => {
			// Create a new provider with caching enabled for this test
			const cachingProvider = new EthersProvider("http://localhost:8545", undefined, {
				batchStallTime: 0,
				batchMaxCount: 1,
				cacheTimeout: 250, // Enable caching
			});

			setupMockResponse("0x1");

			const [r1, r2] = await Promise.all([
				cachingProvider.send("eth_chainId", []),
				cachingProvider.send("eth_chainId", []),
			]);

			expect(r1).toBe("0x1");
			expect(r2).toBe("0x1");
			// Should only make one request due to caching
			expect(mockFetch).toHaveBeenCalledTimes(1);

			cachingProvider.destroy();
		});
	});

	describe("network methods", () => {
		it("should get network", async () => {
			setupMockResponse("0x1");

			const network = await provider.getNetwork();
			expect(network.chainId).toBe(1n);
		});

		it("should get block number", async () => {
			setupMockResponse("0xf4240");

			const blockNumber = await provider.getBlockNumber();
			expect(blockNumber).toBe(1000000);
		});

		it("should get fee data", async () => {
			setupMockResponse({
				number: "0xf4240",
				baseFeePerGas: "0x3b9aca00", // 1 gwei
				hash: "0x123",
				parentHash: "0x456",
				timestamp: "0x0",
				nonce: "0x0",
				difficulty: "0x0",
				gasLimit: "0x1c9c380",
				gasUsed: "0x0",
				miner: "0x0000000000000000000000000000000000000000",
				extraData: "0x",
				transactions: [],
			});
			setupMockResponse("0x3b9aca00"); // gasPrice
			setupMockResponse("0x3b9aca00"); // maxPriorityFeePerGas

			const feeData = await provider.getFeeData();
			expect(feeData.gasPrice).toBe(1000000000n);
			expect(feeData.maxPriorityFeePerGas).toBe(1000000000n);
		});
	});

	describe("account methods", () => {
		it("should get balance", async () => {
			setupMockResponse("0xde0b6b3a7640000"); // 1 ETH

			const balance = await provider.getBalance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
			expect(balance).toBe(1000000000000000000n);
		});

		it("should get transaction count", async () => {
			setupMockResponse("0x5");

			const count = await provider.getTransactionCount("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
			expect(count).toBe(5);
		});

		it("should get code", async () => {
			setupMockResponse("0x608060405234801561001057600080fd5b50");

			const code = await provider.getCode("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
			expect(code).toBe("0x608060405234801561001057600080fd5b50");
		});

		it("should get storage", async () => {
			setupMockResponse("0x0000000000000000000000000000000000000000000000000000000000000001");

			const storage = await provider.getStorage("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", 0n);
			expect(storage).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
		});
	});

	describe("execution methods", () => {
		it("should execute call", async () => {
			setupMockResponse("0x0000000000000000000000000000000000000000000000000000000000000001");

			const result = await provider.call({
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
				data: "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb1",
			});
			expect(result).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
		});

		it("should estimate gas", async () => {
			setupMockResponse("0x5208"); // 21000

			const gas = await provider.estimateGas({
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
				value: 1000000000000000000n,
			});
			expect(gas).toBe(21000n);
		});
	});

	describe("block methods", () => {
		it("should get block by number", async () => {
			setupMockResponse({
				hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				parentHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				number: "0xf4240",
				timestamp: "0x5f5e100",
				nonce: "0x0",
				difficulty: "0x0",
				gasLimit: "0x1c9c380",
				gasUsed: "0x0",
				miner: "0x0000000000000000000000000000000000000000",
				extraData: "0x",
				baseFeePerGas: "0x3b9aca00",
				transactions: [],
			});

			const block = await provider.getBlock(1000000);
			expect(block).not.toBeNull();
			expect(block!.number).toBe(1000000);
			expect(block!.baseFeePerGas).toBe(1000000000n);
		});

		it("should get block by hash", async () => {
			setupMockResponse({
				hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				parentHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				number: "0xf4240",
				timestamp: "0x5f5e100",
				nonce: "0x0",
				difficulty: "0x0",
				gasLimit: "0x1c9c380",
				gasUsed: "0x0",
				miner: "0x0000000000000000000000000000000000000000",
				extraData: "0x",
				transactions: [],
			});

			const block = await provider.getBlock(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(block).not.toBeNull();
			expect(block!.hash).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
		});

		it("should return null for non-existent block", async () => {
			setupMockResponse(null);

			const block = await provider.getBlock(999999999);
			expect(block).toBeNull();
		});
	});

	describe("transaction methods", () => {
		it("should get transaction by hash", async () => {
			setupMockResponse({
				hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				blockHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				blockNumber: "0xf4240",
				transactionIndex: "0x0",
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
				value: "0xde0b6b3a7640000",
				gas: "0x5208",
				gasPrice: "0x3b9aca00",
				input: "0x",
				nonce: "0x0",
				r: "0x1234",
				s: "0x5678",
				v: "0x1b",
			});

			const tx = await provider.getTransaction(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(tx).not.toBeNull();
			expect(tx!.hash).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
			expect(tx!.value).toBe(1000000000000000000n);
		});

		it("should get transaction receipt", async () => {
			setupMockResponse({
				transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				blockHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				blockNumber: "0xf4240",
				transactionIndex: "0x0",
				from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
				to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
				gasUsed: "0x5208",
				cumulativeGasUsed: "0x5208",
				effectiveGasPrice: "0x3b9aca00",
				status: "0x1",
				logsBloom: "0x00",
				logs: [],
			});

			const receipt = await provider.getTransactionReceipt(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(receipt).not.toBeNull();
			expect(receipt!.status).toBe(1);
			expect(receipt!.gasUsed).toBe(21000n);
		});

		it("should return null for non-existent transaction", async () => {
			setupMockResponse(null);

			const tx = await provider.getTransaction(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			expect(tx).toBeNull();
		});
	});

	describe("log methods", () => {
		it("should get logs", async () => {
			setupMockResponse([
				{
					address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
					topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
					data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
					blockNumber: "0xf4240",
					blockHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
					transactionIndex: "0x0",
					logIndex: "0x0",
					removed: false,
				},
			]);

			const logs = await provider.getLogs({
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
				fromBlock: 1000000,
				toBlock: "latest",
			});

			expect(logs).toHaveLength(1);
			expect(logs[0]!.address).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
			expect(logs[0]!.blockNumber).toBe(1000000);
		});
	});

	describe("event methods", () => {
		it("should register event listener", async () => {
			const listener = vi.fn();
			await provider.on("block", listener);

			const count = await provider.listenerCount("block");
			expect(count).toBe(1);
		});

		it("should remove event listener", async () => {
			const listener = vi.fn();
			await provider.on("block", listener);
			await provider.off("block", listener);

			const count = await provider.listenerCount("block");
			expect(count).toBe(0);
		});

		it("should remove all listeners", async () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();
			await provider.on("block", listener1);
			await provider.on("pending", listener2);

			await provider.removeAllListeners();

			const blockCount = await provider.listenerCount("block");
			const pendingCount = await provider.listenerCount("pending");
			expect(blockCount).toBe(0);
			expect(pendingCount).toBe(0);
		});

		it("should emit events", async () => {
			const listener = vi.fn();
			await provider.on("block", listener);

			await provider.emit("block", 12345);

			expect(listener).toHaveBeenCalledWith(12345);
		});

		it("should handle once listeners", async () => {
			const listener = vi.fn();
			await provider.once("block", listener);

			await provider.emit("block", 1);
			await provider.emit("block", 2);

			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith(1);
		});
	});

	describe("lifecycle methods", () => {
		it("should destroy provider", () => {
			provider.destroy();
			expect(provider.destroyed).toBe(true);
		});

		it("should throw when destroyed", async () => {
			provider.destroy();
			await expect(provider.send("eth_blockNumber", [])).rejects.toThrow();
		});

		it("should pause and resume", async () => {
			provider.pause();
			expect(provider.paused).toBe(true);

			provider.resume();
			expect(provider.paused).toBe(false);
		});
	});

	describe("error handling", () => {
		it("should handle INSUFFICIENT_FUNDS error", async () => {
			setupMockError(-32000, "insufficient funds for gas * price + value");

			await expect(
				provider.estimateGas({
					to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
					value: 1000000000000000000n,
				}),
			).rejects.toMatchObject({
				code: "INSUFFICIENT_FUNDS",
			});
		});

		it("should handle NONCE_EXPIRED error", async () => {
			setupMockError(-32000, "nonce too low");

			await expect(
				provider.estimateGas({
					to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
					nonce: 0,
				}),
			).rejects.toMatchObject({
				code: "NONCE_EXPIRED",
			});
		});

		it("should handle CALL_EXCEPTION error", async () => {
			setupMockError(-32000, "execution reverted");

			await expect(
				provider.call({
					to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
					data: "0x12345678",
				}),
			).rejects.toMatchObject({
				code: "CALL_EXCEPTION",
			});
		});
	});
});

describe("block tag formatting", () => {
	let provider: EthersProvider;

	beforeEach(() => {
		vi.clearAllMocks();
		provider = new EthersProvider("http://localhost:8545");
	});

	afterEach(() => {
		provider.destroy();
	});

	it("should format numeric block tags", async () => {
		setupMockResponse("0x1");

		await provider.getBalance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", 12345);

		const call = mockFetch.mock.calls[0];
		const body = JSON.parse(call![1]!.body as string);
		expect(body.params[1]).toBe("0x3039");
	});

	it("should format bigint block tags", async () => {
		setupMockResponse("0x1");

		await provider.getBalance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", 12345n);

		const call = mockFetch.mock.calls[0];
		const body = JSON.parse(call![1]!.body as string);
		expect(body.params[1]).toBe("0x3039");
	});

	it("should pass through string block tags", async () => {
		setupMockResponse("0x1");

		await provider.getBalance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", "latest");

		const call = mockFetch.mock.calls[0];
		const body = JSON.parse(call![1]!.body as string);
		expect(body.params[1]).toBe("latest");
	});

	it("should convert 'earliest' to 0x0", async () => {
		setupMockResponse("0x1");

		await provider.getBalance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", "earliest");

		const call = mockFetch.mock.calls[0];
		const body = JSON.parse(call![1]!.body as string);
		expect(body.params[1]).toBe("0x0");
	});
});
