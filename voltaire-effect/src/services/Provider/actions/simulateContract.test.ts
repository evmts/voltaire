import { Address, Hex } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { ProviderService, type ProviderShape } from "../ProviderService.js";
import { simulateContract } from "./simulateContract.js";

const erc20Abi = [
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ type: "uint256" }],
		stateMutability: "view",
	},
] as const;

const createMockProvider = (
	callResult: `0x${string}`,
): Layer.Layer<ProviderService> => {
	const mockProvider: ProviderShape = {
		getBlockNumber: () => Effect.succeed(123n),
		getBlock: () => Effect.succeed({} as any),
		getBlockTransactionCount: () => Effect.succeed(0n),
		getBalance: () => Effect.succeed(0n),
		getTransactionCount: () => Effect.succeed(0n),
		getCode: () => Effect.succeed("0x" as const),
		getStorageAt: () => Effect.succeed("0x" as const),
		getTransaction: () => Effect.succeed({} as any),
		getTransactionReceipt: () => Effect.succeed({} as any),
		waitForTransactionReceipt: () => Effect.succeed({} as any),
		call: () => Effect.succeed(callResult),
		estimateGas: () => Effect.succeed(21000n),
		createAccessList: () => Effect.succeed({ accessList: [], gasUsed: "0x0" }),
		getLogs: () => Effect.succeed([]),
		getChainId: () => Effect.succeed(1),
		getGasPrice: () => Effect.succeed(1000000000n),
		getMaxPriorityFeePerGas: () => Effect.succeed(1000000000n),
		getFeeHistory: () =>
			Effect.succeed({ oldestBlock: "0x0", baseFeePerGas: [], gasUsedRatio: [] }),
		watchBlocks: () => {
			throw new Error("Not implemented in mock");
		},
		backfillBlocks: () => {
			throw new Error("Not implemented in mock");
		},
	};
	return Layer.succeed(ProviderService, mockProvider);
};

describe("simulateContract", () => {
	it("returns correct result for transfer simulation", async () => {
		const trueResult =
			"0x0000000000000000000000000000000000000000000000000000000000000001" as const;
		const provider = createMockProvider(trueResult);

		const program = simulateContract({
			address: "0x1234567890123456789012345678901234567890",
			abi: erc20Abi,
			functionName: "transfer",
			args: ["0xabcdef0123456789abcdef0123456789abcdef01", 1000n],
		}).pipe(Effect.provide(provider));

		const result = await Effect.runPromise(program);

		expect(result.result).toBe(true);
	});

	it("populates request object correctly", async () => {
		const trueResult =
			"0x0000000000000000000000000000000000000000000000000000000000000001" as const;
		const provider = createMockProvider(trueResult);

		const contractAddress = "0x1234567890123456789012345678901234567890";
		const recipient = "0xabcdef0123456789abcdef0123456789abcdef01";
		const amount = 1000n;

		const program = simulateContract({
			address: contractAddress,
			abi: erc20Abi,
			functionName: "transfer",
			args: [recipient, amount],
			value: 0n,
			gas: 100000n,
		}).pipe(Effect.provide(provider));

		const result = await Effect.runPromise(program);

		expect(Address.toHex(result.request.address).toLowerCase()).toBe(
			contractAddress.toLowerCase(),
		);
		expect(result.request.functionName).toBe("transfer");
		expect(result.request.args).toEqual([recipient, amount]);
		expect(Address.toHex(result.request.to).toLowerCase()).toBe(
			contractAddress.toLowerCase(),
		);
		expect(result.request.data).toBeDefined();
		expect(Hex.isHex(result.request.data)).toBe(true);
		expect(result.request.value).toBe(0n);
		expect(result.request.gas).toBe(100000n);
	});

	it("handles simulation with account override", async () => {
		const trueResult =
			"0x0000000000000000000000000000000000000000000000000000000000000001" as const;

		let capturedRequest: any;
		const mockProvider: ProviderShape = {
			getBlockNumber: () => Effect.succeed(123n),
			getBlock: () => Effect.succeed({} as any),
			getBlockTransactionCount: () => Effect.succeed(0n),
			getBalance: () => Effect.succeed(0n),
			getTransactionCount: () => Effect.succeed(0n),
			getCode: () => Effect.succeed("0x" as const),
			getStorageAt: () => Effect.succeed("0x" as const),
			getTransaction: () => Effect.succeed({} as any),
			getTransactionReceipt: () => Effect.succeed({} as any),
			waitForTransactionReceipt: () => Effect.succeed({} as any),
			call: (request) => {
				capturedRequest = request;
				return Effect.succeed(trueResult);
			},
			estimateGas: () => Effect.succeed(21000n),
			createAccessList: () =>
				Effect.succeed({ accessList: [], gasUsed: "0x0" }),
			getLogs: () => Effect.succeed([]),
			getChainId: () => Effect.succeed(1),
			getGasPrice: () => Effect.succeed(1000000000n),
			getMaxPriorityFeePerGas: () => Effect.succeed(1000000000n),
			getFeeHistory: () =>
				Effect.succeed({
					oldestBlock: "0x0",
					baseFeePerGas: [],
					gasUsedRatio: [],
				}),
			watchBlocks: () => {
				throw new Error("Not implemented in mock");
			},
			backfillBlocks: () => {
				throw new Error("Not implemented in mock");
			},
		};
		const provider = Layer.succeed(ProviderService, mockProvider);

		const senderAddress = "0x9999999999999999999999999999999999999999";

		const program = simulateContract({
			address: "0x1234567890123456789012345678901234567890",
			abi: erc20Abi,
			functionName: "transfer",
			args: ["0xabcdef0123456789abcdef0123456789abcdef01", 1000n],
			account: senderAddress,
		}).pipe(Effect.provide(provider));

		await Effect.runPromise(program);

		expect(capturedRequest.from).toBe(senderAddress);
	});

	it("fails when function not found in ABI", async () => {
		const trueResult =
			"0x0000000000000000000000000000000000000000000000000000000000000001" as const;
		const provider = createMockProvider(trueResult);

		const program = simulateContract({
			address: "0x1234567890123456789012345678901234567890",
			abi: erc20Abi,
			functionName: "nonexistent" as any,
			args: [],
		}).pipe(Effect.provide(provider));

		await expect(Effect.runPromise(program)).rejects.toThrow();
	});

	it("returns false result for failed transfer", async () => {
		const falseResult =
			"0x0000000000000000000000000000000000000000000000000000000000000000" as const;
		const provider = createMockProvider(falseResult);

		const program = simulateContract({
			address: "0x1234567890123456789012345678901234567890",
			abi: erc20Abi,
			functionName: "transfer",
			args: ["0xabcdef0123456789abcdef0123456789abcdef01", 1000n],
		}).pipe(Effect.provide(provider));

		const result = await Effect.runPromise(program);

		expect(result.result).toBe(false);
	});

	it("handles view function simulation", async () => {
		const balanceResult =
			"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as const;
		const provider = createMockProvider(balanceResult);

		const program = simulateContract({
			address: "0x1234567890123456789012345678901234567890",
			abi: erc20Abi,
			functionName: "balanceOf",
			args: ["0xabcdef0123456789abcdef0123456789abcdef01"],
		}).pipe(Effect.provide(provider));

		const result = await Effect.runPromise(program);

		expect(result.result).toBe(1000000000000000000n);
	});
});
