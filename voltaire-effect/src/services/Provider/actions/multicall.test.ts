import { BrandedAbi, Hex } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderService } from "../ProviderService.js";
import { multicall } from "./multicall.js";

type HexType = `0x${string}`;

const erc20Abi = [
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ name: "balance", type: "uint256" }],
	},
	{
		type: "function",
		name: "totalSupply",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "uint256" }],
	},
] as const;

const mockProvider = {
	call: vi.fn(),
	getLogs: vi.fn(),
	getBlockNumber: vi.fn(),
	getBalance: vi.fn(),
	getBlock: vi.fn(),
	getTransaction: vi.fn(),
	getTransactionReceipt: vi.fn(),
	waitForTransactionReceipt: vi.fn(),
	getTransactionCount: vi.fn(),
	getCode: vi.fn(),
	getStorageAt: vi.fn(),
	estimateGas: vi.fn(),
	createAccessList: vi.fn(),
	getChainId: vi.fn(),
	getGasPrice: vi.fn(),
	getMaxPriorityFeePerGas: vi.fn(),
	getFeeHistory: vi.fn(),
	getBlockTransactionCount: vi.fn(),
};

const MockProviderLayer = Layer.succeed(ProviderService, mockProvider as any);

function encodeMulticallResult(
	results: Array<{ success: boolean; returnData: HexType }>,
): HexType {
	const tupleArrayOutputs = [
		{
			name: "returnData",
			type: "tuple[]",
			components: [
				{ name: "success", type: "bool" },
				{ name: "returnData", type: "bytes" },
			],
		},
	] as const;
	const encoded = BrandedAbi.encodeParameters(
		tupleArrayOutputs,
		[results.map((r) => [r.success, Hex.toBytes(r.returnData)])],
	);
	return Hex.fromBytes(encoded) as HexType;
}

describe("multicall", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("basic multicall with 2 calls", () => {
		it("batches two balanceOf calls", async () => {
			const balance1 =
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType;
			const balance2 =
				"0x00000000000000000000000000000000000000000000021e19e0c9bab2400000" as HexType;

			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{ success: true, returnData: balance1 },
						{ success: true, returnData: balance2 },
					]),
				),
			);

			const program = multicall({
				contracts: [
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x1234567890123456789012345678901234567890"],
					},
					{
						address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x0987654321098765432109876543210987654321"],
					},
				],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.call).toHaveBeenCalledTimes(1);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ status: "success", result: 1000000000000000000n });
			expect(result[1]).toEqual({ status: "success", result: 10000000000000000000000n });
		});

		it("calls Multicall3 at correct address", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{
							success: true,
							returnData:
								"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
						},
					]),
				),
			);

			const program = multicall({
				contracts: [
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x1234567890123456789012345678901234567890"],
					},
				],
			});

			await Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer)));

			expect(mockProvider.call).toHaveBeenCalledWith(
				expect.objectContaining({
					to: "0xcA11bde05977b3631167028862bE2a173976CA11",
				}),
				undefined,
			);
		});
	});

	describe("allowFailure modes", () => {
		it("returns failure status when allowFailure is true (default)", async () => {
			const balance1 =
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType;

			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{ success: true, returnData: balance1 },
						{ success: false, returnData: "0x" },
					]),
				),
			);

			const program = multicall({
				contracts: [
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x1234567890123456789012345678901234567890"],
					},
					{
						address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x0987654321098765432109876543210987654321"],
					},
				],
				allowFailure: true,
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result[0]).toEqual({ status: "success", result: 1000000000000000000n });
			expect(result[1]).toEqual({
				status: "failure",
				error: expect.any(Error),
			});
		});

		it("throws when allowFailure is false and call fails", async () => {
			const balance1 =
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType;

			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{ success: true, returnData: balance1 },
						{ success: false, returnData: "0x" },
					]),
				),
			);

			const program = multicall({
				contracts: [
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x1234567890123456789012345678901234567890"],
					},
					{
						address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x0987654321098765432109876543210987654321"],
					},
				],
				allowFailure: false,
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("returns unwrapped results when allowFailure is false", async () => {
			const balance1 =
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType;
			const balance2 =
				"0x00000000000000000000000000000000000000000000021e19e0c9bab2400000" as HexType;

			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{ success: true, returnData: balance1 },
						{ success: true, returnData: balance2 },
					]),
				),
			);

			const program = multicall({
				contracts: [
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x1234567890123456789012345678901234567890"],
					},
					{
						address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x0987654321098765432109876543210987654321"],
					},
				],
				allowFailure: false,
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toEqual([1000000000000000000n, 10000000000000000000000n]);
		});
	});

	describe("single call", () => {
		it("works with single contract call", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{
							success: true,
							returnData:
								"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
						},
					]),
				),
			);

			const program = multicall({
				contracts: [
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "totalSupply",
					},
				],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ status: "success", result: 1000000000000000000n });
		});
	});

	describe("empty array", () => {
		it("returns empty array for empty contracts", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(encodeMulticallResult([])),
			);

			const program = multicall({
				contracts: [],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toEqual([]);
		});
	});

	describe("block tag", () => {
		it("passes block tag to provider.call", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{
							success: true,
							returnData:
								"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
						},
					]),
				),
			);

			const program = multicall({
				contracts: [
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x1234567890123456789012345678901234567890"],
					},
				],
				blockTag: "finalized",
			});

			await Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer)));

			expect(mockProvider.call).toHaveBeenCalledWith(
				expect.any(Object),
				"finalized",
			);
		});
	});
});
