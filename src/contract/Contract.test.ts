/**
 * Runtime tests for Contract module
 *
 * Tests Contract creation, read/write/estimateGas/events behavior.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { Contract } from "./Contract.js";
import {
	ContractFunctionNotFoundError,
	ContractEventNotFoundError,
	ContractReadError,
	ContractWriteError,
} from "./errors.js";
import { Address } from "../primitives/Address/index.js";
import * as Hex from "../primitives/Hex/index.js";
import type { TypedProvider } from "../provider/TypedProvider.js";

// ============================================================================
// Test Fixtures
// ============================================================================

const erc20Abi = [
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ type: "address", name: "account" }],
		outputs: [{ type: "uint256", name: "" }],
	},
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "to" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool", name: "" }],
	},
	{
		type: "function",
		name: "symbol",
		stateMutability: "pure",
		inputs: [],
		outputs: [{ type: "string", name: "" }],
	},
	{
		type: "function",
		name: "getReserves",
		stateMutability: "view",
		inputs: [],
		outputs: [
			{ type: "uint112", name: "reserve0" },
			{ type: "uint112", name: "reserve1" },
			{ type: "uint32", name: "blockTimestampLast" },
		],
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ type: "address", name: "from", indexed: true },
			{ type: "address", name: "to", indexed: true },
			{ type: "uint256", name: "value", indexed: false },
		],
	},
] as const;

const testAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const testAccount = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

/**
 * Create a mock provider with handler functions for each RPC method
 */
function createMockProvider(
	handlers: Record<string, (params: unknown[]) => unknown>,
): TypedProvider {
	return {
		request: vi.fn(async ({ method, params }) => {
			if (handlers[method]) {
				return handlers[method](params as unknown[]);
			}
			throw new Error(`Unhandled method: ${method}`);
		}),
		on: vi.fn().mockReturnThis(),
		removeListener: vi.fn().mockReturnThis(),
	} as unknown as TypedProvider;
}

// ============================================================================
// Contract Creation Tests
// ============================================================================

describe("Contract creation", () => {
	it("creates contract with address string", () => {
		const provider = createMockProvider({});
		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		expect(contract.address).toBeDefined();
		expect(Hex.fromBytes(contract.address)).toBe(testAddress.toLowerCase());
	});

	it("creates contract with AddressType", () => {
		const provider = createMockProvider({});
		const address = Address.from(testAddress);
		const contract = Contract({
			address,
			abi: erc20Abi,
			provider,
		});

		// Address.from creates new instance, so compare values
		expect(Hex.fromBytes(contract.address)).toBe(Hex.fromBytes(address));
	});

	it("has abi property with encode/decode methods", () => {
		const provider = createMockProvider({});
		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		expect(contract.abi).toBeDefined();
		expect(typeof contract.abi.encode).toBe("function");
		expect(typeof contract.abi.decode).toBe("function");
		expect(typeof contract.abi.getFunction).toBe("function");
		expect(typeof contract.abi.getEvent).toBe("function");
	});

	it("has read, write, estimateGas, and events properties", () => {
		const provider = createMockProvider({});
		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		expect(contract.read).toBeDefined();
		expect(contract.write).toBeDefined();
		expect(contract.estimateGas).toBeDefined();
		expect(contract.events).toBeDefined();
	});
});

// ============================================================================
// Read Method Tests
// ============================================================================

describe("Contract.read", () => {
	it("calls eth_call with correct params", async () => {
		const expectedReturn =
			"0x0000000000000000000000000000000000000000000000000000000000000064"; // 100n

		const provider = createMockProvider({
			eth_call: (params) => {
				const [callParams, block] = params as [
					{ to: string; data: string },
					string,
				];
				expect(callParams.to.toLowerCase()).toBe(testAddress.toLowerCase());
				expect(callParams.data).toMatch(/^0x70a08231/); // balanceOf selector
				expect(block).toBe("latest");
				return expectedReturn;
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const account = Address.from(testAccount);
		const balance = await contract.read.balanceOf(account);

		expect(provider.request).toHaveBeenCalledTimes(1);
		expect(balance).toBe(100n);
	});

	it("encodes args correctly via abi.encode", async () => {
		let capturedData = "";
		const provider = createMockProvider({
			eth_call: (params) => {
				const [callParams] = params as [{ to: string; data: string }];
				capturedData = callParams.data;
				// Return 100n
				return "0x0000000000000000000000000000000000000000000000000000000000000064";
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const account = Address.from(testAccount);
		await contract.read.balanceOf(account);

		// balanceOf(address) selector = 0x70a08231
		expect(capturedData.slice(0, 10).toLowerCase()).toBe("0x70a08231");
		// Account address should be padded to 32 bytes after selector
		expect(capturedData.length).toBe(74); // 0x + 8 selector + 64 address
	});

	it("decodes return value correctly", async () => {
		const provider = createMockProvider({
			eth_call: () =>
				// 1000000000000000000n (1e18)
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const account = Address.from(testAccount);
		const balance = await contract.read.balanceOf(account);

		expect(balance).toBe(1000000000000000000n);
	});

	it("unwraps single output value", async () => {
		const provider = createMockProvider({
			eth_call: () =>
				"0x0000000000000000000000000000000000000000000000000000000000000064",
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const account = Address.from(testAccount);
		const balance = await contract.read.balanceOf(account);

		// Should return bigint directly, not [bigint]
		expect(typeof balance).toBe("bigint");
		expect(balance).toBe(100n);
	});

	it("returns tuple for multiple outputs", async () => {
		const provider = createMockProvider({
			eth_call: () =>
				// reserve0 = 1000n, reserve1 = 2000n, timestamp = 1234567890
				"0x" +
				"00000000000000000000000000000000000000000000000000000000000003e8" + // 1000
				"00000000000000000000000000000000000000000000000000000000000007d0" + // 2000
				"00000000000000000000000000000000000000000000000000000000499602d2", // 1234567890
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const reserves = await contract.read.getReserves();

		expect(Array.isArray(reserves)).toBe(true);
		expect(reserves.length).toBe(3);
		expect(reserves[0]).toBe(1000n);
		expect(reserves[1]).toBe(2000n);
		expect(reserves[2]).toBe(1234567890n);
	});

	it("throws ContractReadError on provider error", async () => {
		const provider = createMockProvider({
			eth_call: () => {
				throw new Error("execution reverted");
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const account = Address.from(testAccount);
		await expect(contract.read.balanceOf(account)).rejects.toThrow(
			ContractReadError,
		);
	});

	it("throws ContractFunctionNotFoundError for nonexistent function", async () => {
		const provider = createMockProvider({});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		// @ts-expect-error - testing invalid function name
		await expect(contract.read.nonexistent()).rejects.toThrow(
			ContractFunctionNotFoundError,
		);
	});

	it("throws ContractFunctionNotFoundError for write functions on read", async () => {
		const provider = createMockProvider({});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const account = Address.from(testAccount);
		// transfer is nonpayable, shouldn't be callable via read
		// @ts-expect-error - testing type mismatch
		await expect(contract.read.transfer(account, 100n)).rejects.toThrow(
			ContractFunctionNotFoundError,
		);
	});
});

// ============================================================================
// Write Method Tests
// ============================================================================

describe("Contract.write", () => {
	it("calls eth_sendTransaction with correct params", async () => {
		const expectedTxHash =
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

		const provider = createMockProvider({
			eth_sendTransaction: (params) => {
				const [txParams] = params as [{ to: string; data: string }];
				expect(txParams.to.toLowerCase()).toBe(testAddress.toLowerCase());
				expect(txParams.data).toMatch(/^0xa9059cbb/); // transfer selector
				return expectedTxHash;
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const to = Address.from(testAccount);
		const txHash = await contract.write.transfer(to, 100n);

		expect(provider.request).toHaveBeenCalledTimes(1);
		expect(Hex.fromBytes(txHash)).toBe(expectedTxHash);
	});

	it("encodes args correctly", async () => {
		let capturedData = "";
		const provider = createMockProvider({
			eth_sendTransaction: (params) => {
				const [txParams] = params as [{ to: string; data: string }];
				capturedData = txParams.data;
				return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const to = Address.from(testAccount);
		await contract.write.transfer(to, 100n);

		// transfer(address,uint256) selector = 0xa9059cbb
		expect(capturedData.slice(0, 10).toLowerCase()).toBe("0xa9059cbb");
		// address (32 bytes) + uint256 (32 bytes) = 64 bytes = 128 hex chars
		expect(capturedData.length).toBe(138); // 0x + 8 selector + 128 params
	});

	it("returns transaction hash", async () => {
		const expectedTxHash =
			"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

		const provider = createMockProvider({
			eth_sendTransaction: () => expectedTxHash,
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const to = Address.from(testAccount);
		const txHash = await contract.write.transfer(to, 100n);

		expect(txHash).toBeInstanceOf(Uint8Array);
		expect(Hex.fromBytes(txHash)).toBe(expectedTxHash);
	});

	it("throws ContractWriteError on provider error", async () => {
		const provider = createMockProvider({
			eth_sendTransaction: () => {
				throw new Error("insufficient funds");
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const to = Address.from(testAccount);
		await expect(contract.write.transfer(to, 100n)).rejects.toThrow(
			ContractWriteError,
		);
	});

	it("throws ContractFunctionNotFoundError for view functions on write", async () => {
		const provider = createMockProvider({});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const account = Address.from(testAccount);
		// balanceOf is view, shouldn't be callable via write
		// @ts-expect-error - testing type mismatch
		await expect(contract.write.balanceOf(account)).rejects.toThrow(
			ContractFunctionNotFoundError,
		);
	});
});

// ============================================================================
// EstimateGas Method Tests
// ============================================================================

describe("Contract.estimateGas", () => {
	it("calls eth_estimateGas with correct params", async () => {
		const provider = createMockProvider({
			eth_estimateGas: (params) => {
				const [txParams] = params as [{ to: string; data: string }];
				expect(txParams.to.toLowerCase()).toBe(testAddress.toLowerCase());
				expect(txParams.data).toMatch(/^0xa9059cbb/); // transfer selector
				return "0x5208"; // 21000
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const to = Address.from(testAccount);
		const gas = await contract.estimateGas.transfer(to, 100n);

		expect(provider.request).toHaveBeenCalledTimes(1);
		expect(gas).toBe(21000n);
	});

	it("returns bigint gas value", async () => {
		const provider = createMockProvider({
			eth_estimateGas: () => "0x12345", // 74565
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const to = Address.from(testAccount);
		const gas = await contract.estimateGas.transfer(to, 100n);

		expect(typeof gas).toBe("bigint");
		expect(gas).toBe(74565n);
	});

	it("throws on revert simulation", async () => {
		const provider = createMockProvider({
			eth_estimateGas: () => {
				throw new Error("execution reverted: insufficient balance");
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const to = Address.from(testAccount);
		await expect(contract.estimateGas.transfer(to, 100n)).rejects.toThrow();
	});
});

// ============================================================================
// Events Method Tests
// ============================================================================

describe("Contract.events", () => {
	it("calls eth_getLogs for historical events", async () => {
		const mockLogs = [
			{
				address: testAddress.toLowerCase(),
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					"0x0000000000000000000000000000000000000000000000000000000000000001",
					"0x0000000000000000000000000000000000000000000000000000000000000002",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000064",
				blockNumber: "0x1",
				blockHash:
					"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				transactionHash:
					"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				logIndex: "0x0",
			},
		];

		const provider = createMockProvider({
			eth_getLogs: () => mockLogs,
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const logs: unknown[] = [];
		for await (const log of contract.events.Transfer(
			{},
			{ fromBlock: 0n, toBlock: 100n },
		)) {
			logs.push(log);
		}

		expect(provider.request).toHaveBeenCalled();
		expect(logs.length).toBe(1);
	});

	it("encodes topic filters correctly", async () => {
		let capturedParams: unknown;
		const provider = createMockProvider({
			eth_getLogs: (params) => {
				capturedParams = params;
				return [];
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const from = Address.from(testAccount);
		const logs: unknown[] = [];
		for await (const log of contract.events.Transfer(
			{ from },
			{ fromBlock: 0n, toBlock: 100n },
		)) {
			logs.push(log);
		}

		const [filterParams] = capturedParams as [
			{ address: string; topics: unknown[] },
		];
		expect(filterParams.address.toLowerCase()).toBe(testAddress.toLowerCase());
		// First topic is event selector, second is indexed 'from' address
		expect(filterParams.topics.length).toBeGreaterThan(1);
	});

	it("decodes log data correctly", async () => {
		// Transfer event with from=0x01, to=0x02, value=100
		const mockLogs = [
			{
				address: testAddress.toLowerCase(),
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					"0x000000000000000000000000" + testAccount.slice(2).toLowerCase(),
					"0x0000000000000000000000000000000000000000000000000000000000000002",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000064", // 100
				blockNumber: "0xa",
				blockHash:
					"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				transactionHash:
					"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				logIndex: "0x5",
			},
		];

		const provider = createMockProvider({
			eth_getLogs: () => mockLogs,
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const logs: unknown[] = [];
		for await (const log of contract.events.Transfer(
			{},
			{ fromBlock: 0n, toBlock: 100n },
		)) {
			logs.push(log);
		}

		expect(logs.length).toBe(1);
		const log = logs[0] as {
			eventName: string;
			args: { from: Uint8Array; to: Uint8Array; value: bigint };
			blockNumber: Uint8Array;
			logIndex: number;
		};
		expect(log.eventName).toBe("Transfer");
		expect(log.args.value).toBe(100n);
		expect(log.logIndex).toBe(5);
	});

	it("yields DecodedEventLog objects", async () => {
		const mockLogs = [
			{
				address: testAddress.toLowerCase(),
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					"0x000000000000000000000000" + testAccount.slice(2).toLowerCase(),
					"0x0000000000000000000000000000000000000000000000000000000000000002",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000064",
				blockNumber: "0xa",
				blockHash:
					"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				transactionHash:
					"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				logIndex: "0x0",
			},
		];

		const provider = createMockProvider({
			eth_getLogs: () => mockLogs,
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		for await (const log of contract.events.Transfer(
			{},
			{ fromBlock: 0n, toBlock: 100n },
		)) {
			expect(log).toHaveProperty("eventName");
			expect(log).toHaveProperty("args");
			expect(log).toHaveProperty("blockNumber");
			expect(log).toHaveProperty("blockHash");
			expect(log).toHaveProperty("transactionHash");
			expect(log).toHaveProperty("logIndex");
		}
	});

	it("handles fromBlock/toBlock options", async () => {
		let capturedParams: unknown;
		const provider = createMockProvider({
			eth_getLogs: (params) => {
				capturedParams = params;
				return [];
			},
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const logs: unknown[] = [];
		for await (const log of contract.events.Transfer(
			{},
			{ fromBlock: 1000n, toBlock: 2000n },
		)) {
			logs.push(log);
		}

		const [filterParams] = capturedParams as [
			{ fromBlock: string; toBlock: string },
		];
		expect(filterParams.fromBlock).toBe("0x3e8"); // 1000
		expect(filterParams.toBlock).toBe("0x7d0"); // 2000
	});

	it("runs cleanup on generator break", async () => {
		const mockLogs = Array(10)
			.fill(null)
			.map((_, i) => ({
				address: testAddress.toLowerCase(),
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					"0x0000000000000000000000000000000000000000000000000000000000000001",
					"0x0000000000000000000000000000000000000000000000000000000000000002",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000064",
				blockNumber: `0x${i.toString(16)}`,
				blockHash: `0x${"ab".repeat(32)}`,
				transactionHash: `0x${"cd".repeat(32)}`,
				logIndex: "0x0",
			}));

		const provider = createMockProvider({
			eth_getLogs: () => mockLogs,
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		let count = 0;
		for await (const _log of contract.events.Transfer(
			{},
			{ fromBlock: 0n, toBlock: 100n },
		)) {
			count++;
			if (count >= 3) break; // Break early
		}

		expect(count).toBe(3);
	});

	it("throws ContractEventNotFoundError for nonexistent event", async () => {
		const provider = createMockProvider({});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		// @ts-expect-error - testing invalid event name
		const gen = contract.events.NonexistentEvent({}, { fromBlock: 0n });

		await expect(gen.next()).rejects.toThrow(ContractEventNotFoundError);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge cases", () => {
	it("handles zero address", async () => {
		const provider = createMockProvider({
			eth_call: () =>
				"0x0000000000000000000000000000000000000000000000000000000000000000",
		});

		const contract = Contract({
			address: "0x0000000000000000000000000000000000000000",
			abi: erc20Abi,
			provider,
		});

		const account = Address.from(
			"0x0000000000000000000000000000000000000000",
		);
		const balance = await contract.read.balanceOf(account);

		expect(balance).toBe(0n);
	});

	it("handles max uint256 values", async () => {
		const maxUint256Hex =
			"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

		const provider = createMockProvider({
			eth_call: () => maxUint256Hex,
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const account = Address.from(testAccount);
		const balance = await contract.read.balanceOf(account);

		expect(balance).toBe(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		);
	});

	it("handles empty events response", async () => {
		const provider = createMockProvider({
			eth_getLogs: () => [],
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const logs: unknown[] = [];
		for await (const log of contract.events.Transfer(
			{},
			{ fromBlock: 0n, toBlock: 100n },
		)) {
			logs.push(log);
		}

		expect(logs.length).toBe(0);
	});

	it("handles function with no parameters", async () => {
		// symbol() has no inputs
		const provider = createMockProvider({
			eth_call: () =>
				// Encoded "USDC" string
				"0x" +
				"0000000000000000000000000000000000000000000000000000000000000020" +
				"0000000000000000000000000000000000000000000000000000000000000004" +
				"5553444300000000000000000000000000000000000000000000000000000000",
		});

		const contract = Contract({
			address: testAddress,
			abi: erc20Abi,
			provider,
		});

		const symbol = await contract.read.symbol();

		expect(symbol).toBe("USDC");
	});
});
