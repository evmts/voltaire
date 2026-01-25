import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import {
	type MulticallCall,
	MulticallError,
	type MulticallResult,
	MulticallService,
} from "./MulticallService.js";
import { DefaultMulticall } from "./DefaultMulticall.js";
import { ProviderService, ProviderError, type ProviderShape } from "../Provider/ProviderService.js";

describe("MulticallService", () => {
	describe("MulticallError", () => {
		it("creates error with message", () => {
			const error = new MulticallError({ message: "test error" });
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("MulticallError");
		});

		it("creates error with failed calls", () => {
			const error = new MulticallError({
				message: "Some calls failed",
				failedCalls: [0, 2, 4],
			});
			expect(error.failedCalls).toEqual([0, 2, 4]);
		});

		it("creates error with cause", () => {
			const cause = new Error("underlying");
			const error = new MulticallError({
				message: "Multicall failed",
				cause,
			});
			expect(error.cause).toBe(cause);
		});
	});

	describe("MulticallCall interface", () => {
		it("accepts minimal call", () => {
			const call: MulticallCall = {
				target: "0x1234567890123456789012345678901234567890",
				callData: "0x1234",
			};
			expect(call.target).toBe("0x1234567890123456789012345678901234567890");
			expect(call.callData).toBe("0x1234");
			expect(call.allowFailure).toBeUndefined();
		});

		it("accepts call with allowFailure", () => {
			const call: MulticallCall = {
				target: "0x1234567890123456789012345678901234567890",
				callData: "0x1234",
				allowFailure: true,
			};
			expect(call.allowFailure).toBe(true);
		});
	});

	describe("MulticallResult interface", () => {
		it("represents successful result", () => {
			const result: MulticallResult = {
				success: true,
				returnData: "0x00000000000000000000000000000000000000000000000000000000000000ff",
			};
			expect(result.success).toBe(true);
		});

		it("represents failed result", () => {
			const result: MulticallResult = {
				success: false,
				returnData: "0x",
			};
			expect(result.success).toBe(false);
		});
	});

	describe("DefaultMulticall layer", () => {
		it("returns empty array for empty calls", async () => {
			const mockProvider: ProviderShape = {
				call: () => Effect.succeed("0x" as const),
				getBlockNumber: () => Effect.succeed(0n),
				getBlock: () => Effect.succeed({} as any),
				getBlockTransactionCount: () => Effect.succeed(0n),
				getBalance: () => Effect.succeed(0n),
				getTransactionCount: () => Effect.succeed(0n),
				getCode: () => Effect.succeed("0x"),
				getStorageAt: () => Effect.succeed("0x"),
				getTransaction: () => Effect.succeed({} as any),
				getTransactionReceipt: () => Effect.succeed({} as any),
				waitForTransactionReceipt: () => Effect.succeed({} as any),
				estimateGas: () => Effect.succeed(0n),
				createAccessList: () => Effect.succeed({} as any),
				getLogs: () => Effect.succeed([]),
				getChainId: () => Effect.succeed(1),
				getGasPrice: () => Effect.succeed(0n),
				getMaxPriorityFeePerGas: () => Effect.succeed(0n),
				getFeeHistory: () => Effect.succeed({} as any),
				watchBlocks: () => ({} as any),
				backfillBlocks: () => ({} as any),
			};

			const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
			const TestMulticallLayer = DefaultMulticall.pipe(Layer.provide(TestProviderLayer));

			const program = Effect.gen(function* () {
				const multicall = yield* MulticallService;
				return yield* multicall.aggregate3([]);
			}).pipe(Effect.provide(TestMulticallLayer));

			const result = await Effect.runPromise(program);
			expect(result).toEqual([]);
		});

		it("propagates provider errors as MulticallError", async () => {
			const mockProvider: ProviderShape = {
				call: () =>
					Effect.fail(new ProviderError({ method: "eth_call" }, "RPC failed")),
				getBlockNumber: () => Effect.succeed(0n),
				getBlock: () => Effect.succeed({} as any),
				getBlockTransactionCount: () => Effect.succeed(0n),
				getBalance: () => Effect.succeed(0n),
				getTransactionCount: () => Effect.succeed(0n),
				getCode: () => Effect.succeed("0x"),
				getStorageAt: () => Effect.succeed("0x"),
				getTransaction: () => Effect.succeed({} as any),
				getTransactionReceipt: () => Effect.succeed({} as any),
				waitForTransactionReceipt: () => Effect.succeed({} as any),
				estimateGas: () => Effect.succeed(0n),
				createAccessList: () => Effect.succeed({} as any),
				getLogs: () => Effect.succeed([]),
				getChainId: () => Effect.succeed(1),
				getGasPrice: () => Effect.succeed(0n),
				getMaxPriorityFeePerGas: () => Effect.succeed(0n),
				getFeeHistory: () => Effect.succeed({} as any),
				watchBlocks: () => ({} as any),
				backfillBlocks: () => ({} as any),
			};

			const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
			const TestMulticallLayer = DefaultMulticall.pipe(Layer.provide(TestProviderLayer));

			const program = Effect.gen(function* () {
				const multicall = yield* MulticallService;
				return yield* multicall.aggregate3([
					{
						target: "0x1234567890123456789012345678901234567890",
						callData: "0x1234",
					},
				]);
			}).pipe(Effect.provide(TestMulticallLayer));

			const exit = await Effect.runPromiseExit(program);
			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
				expect(exit.cause.error._tag).toBe("MulticallError");
				expect(exit.cause.error.message).toContain("Multicall3 call failed");
			}
		});

		it("encodes calls correctly and sends to multicall3 address", async () => {
			let capturedCall: { to?: string; data?: string } | undefined;
			const mockProvider: ProviderShape = {
				call: (tx) => {
					capturedCall = { to: tx.to as string, data: tx.data as string };
					return Effect.fail(new ProviderError({}, "Expected: just testing encoding"));
				},
				getBlockNumber: () => Effect.succeed(0n),
				getBlock: () => Effect.succeed({} as any),
				getBlockTransactionCount: () => Effect.succeed(0n),
				getBalance: () => Effect.succeed(0n),
				getTransactionCount: () => Effect.succeed(0n),
				getCode: () => Effect.succeed("0x"),
				getStorageAt: () => Effect.succeed("0x"),
				getTransaction: () => Effect.succeed({} as any),
				getTransactionReceipt: () => Effect.succeed({} as any),
				waitForTransactionReceipt: () => Effect.succeed({} as any),
				estimateGas: () => Effect.succeed(0n),
				createAccessList: () => Effect.succeed({} as any),
				getLogs: () => Effect.succeed([]),
				getChainId: () => Effect.succeed(1),
				getGasPrice: () => Effect.succeed(0n),
				getMaxPriorityFeePerGas: () => Effect.succeed(0n),
				getFeeHistory: () => Effect.succeed({} as any),
				watchBlocks: () => ({} as any),
				backfillBlocks: () => ({} as any),
			};

			const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
			const TestMulticallLayer = DefaultMulticall.pipe(Layer.provide(TestProviderLayer));

			const program = Effect.gen(function* () {
				const multicall = yield* MulticallService;
				return yield* multicall.aggregate3([
					{
						target: "0x1234567890123456789012345678901234567890",
						callData: "0xabcd",
					},
				]);
			}).pipe(Effect.provide(TestMulticallLayer));

			await Effect.runPromiseExit(program);
			expect(capturedCall?.to?.toLowerCase()).toBe(
				"0xca11bde05977b3631167028862be2a173976ca11",
			);
			expect(capturedCall?.data?.startsWith("0x82ad56cb")).toBe(true);
		});
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const { MulticallService, MulticallError, DefaultMulticall } = await import(
				"./index.js"
			);
			expect(MulticallService).toBeDefined();
			expect(MulticallError).toBeDefined();
			expect(DefaultMulticall).toBeDefined();
		});
	});
});
