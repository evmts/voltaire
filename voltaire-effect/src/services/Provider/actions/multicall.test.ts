import { BrandedAbi, Hex } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { expectTypeOf } from "vitest";
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
			expect(result).toEqual([1000000000000000000n, 10000000000000000000000n]);
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

			expect(result).toEqual([1000000000000000000n, null]);
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

	describe("batch size", () => {
		it("chunks calls when batchSize is provided", async () => {
			const balance1 =
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType;
			const balance2 =
				"0x00000000000000000000000000000000000000000000021e19e0c9bab2400000" as HexType;
			const balance3 =
				"0x0000000000000000000000000000000000000000000000000000000000000005" as HexType;

			mockProvider.call
				.mockReturnValueOnce(
					Effect.succeed(
						encodeMulticallResult([
							{ success: true, returnData: balance1 },
							{ success: true, returnData: balance2 },
						]),
					),
				)
				.mockReturnValueOnce(
					Effect.succeed(
						encodeMulticallResult([
							{ success: true, returnData: balance3 },
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
					{
						address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
						abi: erc20Abi,
						functionName: "totalSupply",
					},
				],
				batchSize: 2,
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.call).toHaveBeenCalledTimes(2);
			expect(result).toEqual([1000000000000000000n, 10000000000000000000000n, 5n]);
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

			expect(result).toEqual([1000000000000000000n]);
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

	describe("type inference", () => {
		it("infers result tuple types from ABI", () => {
			const program = multicall({
				contracts: [
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "balanceOf",
						args: ["0x1234567890123456789012345678901234567890"],
					},
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "totalSupply",
					},
				] as const,
			});

			type Result = Effect.Success<typeof program>;
			expectTypeOf<Result>().toEqualTypeOf<
				readonly [bigint | null, bigint | null]
			>();
		});
	});

	describe("partial failure handling", () => {
		it("returns null for failed calls with revert data when allowFailure is true", async () => {
			const balance1 =
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType;
			const revertData = "0x08c379a0" as HexType;

			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{ success: true, returnData: balance1 },
						{ success: false, returnData: revertData },
						{ success: true, returnData: balance1 },
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
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "totalSupply",
					},
				],
				allowFailure: true,
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toEqual([1000000000000000000n, null, 1000000000000000000n]);
		});

		it("handles all calls failing with allowFailure true", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{ success: false, returnData: "0x" },
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

			expect(result).toEqual([null, null]);
		});

		it("throws on first failure when allowFailure is false", async () => {
			const balance1 =
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType;

			mockProvider.call.mockReturnValue(
				Effect.succeed(
					encodeMulticallResult([
						{ success: true, returnData: balance1 },
						{ success: false, returnData: "0x" },
						{ success: true, returnData: balance1 },
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
					{
						address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
						abi: erc20Abi,
						functionName: "totalSupply",
					},
				],
				allowFailure: false,
			});

			await expect(
				Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer))),
			).rejects.toThrow("Call 1 failed");
		});
	});

	describe("transport error propagation", () => {
		it("propagates transport errors", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail({
					message: "network error: connection refused",
					code: -32603,
				}),
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

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("propagates timeout errors", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail({
					message: "request timeout",
					code: -32000,
				}),
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

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("propagates rate limit errors", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail({
					message: "rate limit exceeded",
					code: 429,
				}),
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

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("propagates Multicall3 contract not deployed error", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail({
					message: "execution reverted",
					code: -32000,
				}),
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

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});
	});
});
