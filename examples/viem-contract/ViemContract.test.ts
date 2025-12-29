/**
 * Viem Contract Abstraction Tests
 *
 * @module examples/viem-contract/ViemContract.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getContract, getFunctionParameters, getEventParameters } from "./getContract.js";
import { readContract } from "./readContract.js";
import { writeContract } from "./writeContract.js";
import { simulateContract } from "./simulateContract.js";
import { estimateContractGas } from "./estimateContractGas.js";
import { watchContractEvent } from "./watchContractEvent.js";
import {
	ContractReadError,
	ContractWriteError,
	ContractSimulateError,
	ContractGasEstimationError,
	AccountNotFoundError,
} from "./errors.js";
import type { Client } from "./ViemContractTypes.js";

// Test ABI - ERC20-like
const erc20Abi = [
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ name: "", type: "uint256" }],
	},
	{
		type: "function",
		name: "symbol",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "string" }],
	},
	{
		type: "function",
		name: "decimals",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "uint8" }],
	},
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
	{
		type: "event",
		name: "Approval",
		inputs: [
			{ name: "owner", type: "address", indexed: true },
			{ name: "spender", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
] as const;

const testAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const testAccount = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Mock client factory
function createMockClient(overrides: Partial<Client> = {}): Client {
	return {
		request: vi.fn(),
		...overrides,
	};
}

describe("getFunctionParameters", () => {
	it("extracts args and options when args array provided", () => {
		const result = getFunctionParameters([["0x123", 100n], { gas: 50000n }]);
		expect(result.args).toEqual(["0x123", 100n]);
		expect(result.options).toEqual({ gas: 50000n });
	});

	it("extracts just options when no args array", () => {
		const result = getFunctionParameters([{ gas: 50000n }]);
		expect(result.args).toEqual([]);
		expect(result.options).toEqual({ gas: 50000n });
	});

	it("handles empty parameters", () => {
		const result = getFunctionParameters([]);
		expect(result.args).toEqual([]);
		expect(result.options).toEqual({});
	});

	it("handles args array without options", () => {
		const result = getFunctionParameters([["0x123", 100n]]);
		expect(result.args).toEqual(["0x123", 100n]);
		expect(result.options).toEqual({});
	});
});

describe("getEventParameters", () => {
	const transferEvent = erc20Abi.find((x) => x.name === "Transfer");

	it("extracts filter args and options when both provided", () => {
		const result = getEventParameters(
			[{ from: "0x123" }, { onLogs: () => {} }],
			transferEvent,
		);
		expect(result.args).toEqual({ from: "0x123" });
		expect(result.options).toHaveProperty("onLogs");
	});

	it("detects filter args by indexed param names", () => {
		const result = getEventParameters([{ from: "0x123" }], transferEvent);
		expect(result.args).toEqual({ from: "0x123" });
	});

	it("treats non-filter object as options", () => {
		const result = getEventParameters([{ onLogs: () => {} }], transferEvent);
		expect(result.args).toBeUndefined();
		expect(result.options).toHaveProperty("onLogs");
	});

	it("handles empty parameters", () => {
		const result = getEventParameters([], transferEvent);
		expect(result.args).toBeUndefined();
		expect(result.options).toEqual({});
	});
});

describe("readContract", () => {
	it("calls eth_call with encoded data and decodes result", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(
				// ABI encoded uint256 value: 1000
				"0x00000000000000000000000000000000000000000000000000000000000003e8",
			),
		});

		const result = await readContract(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [testAccount],
		});

		expect(mockClient.request).toHaveBeenCalledWith({
			method: "eth_call",
			params: [
				expect.objectContaining({
					to: testAddress,
					data: expect.stringMatching(/^0x70a08231/), // balanceOf selector
				}),
				"latest",
			],
		});
		expect(result).toBe(1000n);
	});

	it("unwraps single output value", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(
				"0x00000000000000000000000000000000000000000000000000000000000003e8",
			),
		});

		const result = await readContract(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [testAccount],
		});

		// Should be unwrapped from tuple
		expect(result).toBe(1000n);
	});

	it("wraps errors in ContractReadError", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockRejectedValue(new Error("RPC error")),
		});

		await expect(
			readContract(mockClient, {
				address: testAddress,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [testAccount],
			}),
		).rejects.toThrow(ContractReadError);
	});

	it("supports custom block tag", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(
				"0x00000000000000000000000000000000000000000000000000000000000003e8",
			),
		});

		await readContract(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [testAccount],
			blockTag: "pending",
		});

		expect(mockClient.request).toHaveBeenCalledWith({
			method: "eth_call",
			params: [expect.any(Object), "pending"],
		});
	});
});

describe("writeContract", () => {
	it("calls eth_sendTransaction with encoded data", async () => {
		const mockHash =
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(mockHash),
		});

		const result = await writeContract(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			functionName: "transfer",
			args: [testAccount, 1000n],
			account: testAccount,
		});

		expect(mockClient.request).toHaveBeenCalledWith({
			method: "eth_sendTransaction",
			params: [
				expect.objectContaining({
					from: testAccount,
					to: testAddress,
					data: expect.stringMatching(/^0xa9059cbb/), // transfer selector
				}),
			],
		});
		expect(result).toBe(mockHash);
	});

	it("throws AccountNotFoundError when no account", async () => {
		const mockClient = createMockClient();

		await expect(
			writeContract(mockClient, {
				address: testAddress,
				abi: erc20Abi,
				functionName: "transfer",
				args: [testAccount, 1000n],
			}),
		).rejects.toThrow(AccountNotFoundError);
	});

	it("uses client account if not provided in params", async () => {
		const mockHash =
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(mockHash),
			account: testAccount,
		});

		await writeContract(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			functionName: "transfer",
			args: [testAccount, 1000n],
		});

		expect(mockClient.request).toHaveBeenCalledWith({
			method: "eth_sendTransaction",
			params: [
				expect.objectContaining({
					from: testAccount,
				}),
			],
		});
	});

	it("appends dataSuffix to calldata", async () => {
		const mockHash =
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(mockHash),
		});

		await writeContract(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			functionName: "transfer",
			args: [testAccount, 1000n],
			account: testAccount,
			dataSuffix: "0xdeadbeef",
		});

		expect(mockClient.request).toHaveBeenCalledWith({
			method: "eth_sendTransaction",
			params: [
				expect.objectContaining({
					data: expect.stringMatching(/deadbeef$/),
				}),
			],
		});
	});

	it("wraps errors in ContractWriteError", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockRejectedValue(new Error("RPC error")),
		});

		await expect(
			writeContract(mockClient, {
				address: testAddress,
				abi: erc20Abi,
				functionName: "transfer",
				args: [testAccount, 1000n],
				account: testAccount,
			}),
		).rejects.toThrow(ContractWriteError);
	});
});

describe("simulateContract", () => {
	it("calls eth_call and returns result with request", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(
				// ABI encoded bool: true
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			),
		});

		const { result, request } = await simulateContract(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			functionName: "transfer",
			args: [testAccount, 1000n],
			account: testAccount,
		});

		expect(result).toBe(true);
		expect(request).toEqual({
			abi: expect.any(Array),
			address: testAddress,
			args: [testAccount, 1000n],
			dataSuffix: undefined,
			functionName: "transfer",
			account: testAccount,
		});
	});

	it("minimizes ABI in request to just the called function", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			),
		});

		const { request } = await simulateContract(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			functionName: "transfer",
			args: [testAccount, 1000n],
			account: testAccount,
		});

		expect(request.abi).toHaveLength(1);
		expect(request.abi[0]).toHaveProperty("name", "transfer");
	});

	it("wraps errors in ContractSimulateError", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockRejectedValue(new Error("Revert")),
		});

		await expect(
			simulateContract(mockClient, {
				address: testAddress,
				abi: erc20Abi,
				functionName: "transfer",
				args: [testAccount, 1000n],
				account: testAccount,
			}),
		).rejects.toThrow(ContractSimulateError);
	});
});

describe("estimateContractGas", () => {
	it("calls eth_estimateGas and returns bigint", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue("0x5208"), // 21000
		});

		const gas = await estimateContractGas(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			functionName: "transfer",
			args: [testAccount, 1000n],
			account: testAccount,
		});

		expect(mockClient.request).toHaveBeenCalledWith({
			method: "eth_estimateGas",
			params: [
				expect.objectContaining({
					from: testAccount,
					to: testAddress,
					data: expect.stringMatching(/^0xa9059cbb/),
				}),
			],
		});
		expect(gas).toBe(21000n);
	});

	it("wraps errors in ContractGasEstimationError", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockRejectedValue(new Error("Gas estimation failed")),
		});

		await expect(
			estimateContractGas(mockClient, {
				address: testAddress,
				abi: erc20Abi,
				functionName: "transfer",
				args: [testAccount, 1000n],
				account: testAccount,
			}),
		).rejects.toThrow(ContractGasEstimationError);
	});
});

describe("watchContractEvent", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	it("returns unsubscribe function", () => {
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue("0x1"),
		});

		const unwatch = watchContractEvent(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			eventName: "Transfer",
			onLogs: () => {},
		});

		expect(typeof unwatch).toBe("function");
		unwatch();
	});

	it("polls for logs at specified interval", async () => {
		const mockClient = createMockClient({
			request: vi
				.fn()
				.mockResolvedValueOnce("0x1") // eth_blockNumber
				.mockResolvedValueOnce("0x2") // eth_blockNumber
				.mockResolvedValueOnce([]) // eth_getLogs
				.mockResolvedValue("0x2"), // subsequent calls
		});

		const onLogs = vi.fn();
		const unwatch = watchContractEvent(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			eventName: "Transfer",
			onLogs,
			pollingInterval: 1000,
		});

		// First poll - initialize lastBlock
		await vi.advanceTimersByTimeAsync(0);

		// Second poll - check for new blocks
		await vi.advanceTimersByTimeAsync(1000);

		expect(mockClient.request).toHaveBeenCalledWith({
			method: "eth_blockNumber",
			params: [],
		});

		unwatch();
	});

	it("calls onError when request fails", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockRejectedValue(new Error("Network error")),
		});

		const onError = vi.fn();
		const unwatch = watchContractEvent(mockClient, {
			address: testAddress,
			abi: erc20Abi,
			eventName: "Transfer",
			onLogs: () => {},
			onError,
		});

		await vi.advanceTimersByTimeAsync(0);

		expect(onError).toHaveBeenCalledWith(expect.any(Error));

		unwatch();
	});

	afterEach(() => {
		vi.useRealTimers();
	});
});

describe("getContract", () => {
	it("creates contract with read methods for view functions", () => {
		const mockClient = createMockClient();

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: mockClient,
		});

		expect(contract.read).toBeDefined();
		expect(typeof contract.read.balanceOf).toBe("function");
		expect(typeof contract.read.symbol).toBe("function");
		expect(typeof contract.read.decimals).toBe("function");
	});

	it("creates contract with write methods for state-changing functions", () => {
		const mockClient = createMockClient();

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: mockClient,
		});

		expect(contract.write).toBeDefined();
		expect(typeof contract.write.transfer).toBe("function");
		expect(typeof contract.write.approve).toBe("function");
	});

	it("creates contract with simulate methods", () => {
		const mockClient = createMockClient();

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: mockClient,
		});

		expect(contract.simulate).toBeDefined();
		expect(typeof contract.simulate.transfer).toBe("function");
	});

	it("creates contract with estimateGas methods", () => {
		const mockClient = createMockClient();

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: mockClient,
		});

		expect(contract.estimateGas).toBeDefined();
		expect(typeof contract.estimateGas.transfer).toBe("function");
	});

	it("creates contract with watchEvent methods", () => {
		const mockClient = createMockClient();

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: mockClient,
		});

		expect(contract.watchEvent).toBeDefined();
		expect(typeof contract.watchEvent.Transfer).toBe("function");
		expect(typeof contract.watchEvent.Approval).toBe("function");
	});

	it("exposes address and abi properties", () => {
		const mockClient = createMockClient();

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: mockClient,
		});

		expect(contract.address).toBe(testAddress);
		expect(contract.abi).toBe(erc20Abi);
	});

	it("delegates read calls to readContract", async () => {
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(
				"0x00000000000000000000000000000000000000000000000000000000000003e8",
			),
		});

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: mockClient,
		});

		const result = await contract.read.balanceOf([testAccount]);

		expect(result).toBe(1000n);
		expect(mockClient.request).toHaveBeenCalledWith({
			method: "eth_call",
			params: expect.any(Array),
		});
	});

	it("delegates write calls to writeContract", async () => {
		const mockHash =
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		const mockClient = createMockClient({
			request: vi.fn().mockResolvedValue(mockHash),
		});

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: mockClient,
		});

		const result = await contract.write.transfer([testAccount, 1000n], {
			account: testAccount,
		});

		expect(result).toBe(mockHash);
	});

	it("supports separate public and wallet clients", () => {
		const publicClient = createMockClient();
		const walletClient = createMockClient({
			account: testAccount,
		});

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: {
				public: publicClient,
				wallet: walletClient,
			},
		});

		expect(contract.read).toBeDefined();
		expect(contract.write).toBeDefined();
	});

	it("handles public-only client", () => {
		const publicClient = createMockClient();

		const contract = getContract({
			address: testAddress,
			abi: erc20Abi,
			client: { public: publicClient },
		});

		expect(contract.read).toBeDefined();
		expect(contract.simulate).toBeDefined();
		// write should still exist but will fail without wallet
	});
});
