import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import {
	ProviderError,
	ProviderService,
	type ProviderShape,
} from "../Provider/ProviderService.js";
import { DefaultMulticall } from "./DefaultMulticall.js";
import {
	type MulticallCall,
	MulticallError,
	type MulticallResult,
	MulticallService,
} from "./MulticallService.js";

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
				returnData:
					"0x00000000000000000000000000000000000000000000000000000000000000ff",
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
		it.effect("returns empty array for empty calls", () =>
			Effect.gen(function* () {
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
					createEventFilter: () => Effect.succeed("0x1" as any),
					createBlockFilter: () => Effect.succeed("0x1" as any),
					createPendingTransactionFilter: () => Effect.succeed("0x1" as any),
					getFilterChanges: () => Effect.succeed([]),
					getFilterLogs: () => Effect.succeed([]),
					uninstallFilter: () => Effect.succeed(true),
					getChainId: () => Effect.succeed(1),
					getGasPrice: () => Effect.succeed(0n),
					getMaxPriorityFeePerGas: () => Effect.succeed(0n),
					getFeeHistory: () => Effect.succeed({} as any),
					watchBlocks: () => ({}) as any,
					backfillBlocks: () => ({}) as any,
					sendRawTransaction: () => Effect.succeed("0x" as `0x${string}`),
					getUncle: () => Effect.succeed({} as any),
					getProof: () => Effect.succeed({} as any),
					getBlobBaseFee: () => Effect.succeed(0n),
					getTransactionConfirmations: () => Effect.succeed(0n),
				};

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestMulticallLayer = DefaultMulticall.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const multicall = yield* MulticallService;
					return yield* multicall.aggregate3([]);
				}).pipe(Effect.provide(TestMulticallLayer));

				const result = yield* program;
				expect(result).toEqual([]);
			}),
		);

		it.effect("propagates provider errors as MulticallError", () =>
			Effect.gen(function* () {
				const mockProvider: ProviderShape = {
					call: () =>
						Effect.fail(
							new ProviderError({ method: "eth_call" }, "RPC failed"),
						),
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
					createEventFilter: () => Effect.succeed("0x1" as any),
					createBlockFilter: () => Effect.succeed("0x1" as any),
					createPendingTransactionFilter: () => Effect.succeed("0x1" as any),
					getFilterChanges: () => Effect.succeed([]),
					getFilterLogs: () => Effect.succeed([]),
					uninstallFilter: () => Effect.succeed(true),
					getChainId: () => Effect.succeed(1),
					getGasPrice: () => Effect.succeed(0n),
					getMaxPriorityFeePerGas: () => Effect.succeed(0n),
					getFeeHistory: () => Effect.succeed({} as any),
					watchBlocks: () => ({}) as any,
					backfillBlocks: () => ({}) as any,
					sendRawTransaction: () => Effect.succeed("0x" as `0x${string}`),
					getUncle: () => Effect.succeed({} as any),
					getProof: () => Effect.succeed({} as any),
					getBlobBaseFee: () => Effect.succeed(0n),
					getTransactionConfirmations: () => Effect.succeed(0n),
				};

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestMulticallLayer = DefaultMulticall.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const multicall = yield* MulticallService;
					return yield* multicall.aggregate3([
						{
							target: "0x1234567890123456789012345678901234567890",
							callData: "0x1234",
						},
					]);
				}).pipe(Effect.provide(TestMulticallLayer));

				const exit = yield* Effect.exit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("MulticallError");
					expect(exit.cause.error.message).toContain("Multicall3 call failed");
				}
			}),
		);

		it("encodes calls correctly and sends to multicall3 address", async () => {
			let capturedCall: { to?: string; data?: string } | undefined;
			const mockProvider: ProviderShape = {
				call: (tx) => {
					capturedCall = { to: tx.to as string, data: tx.data as string };
					return Effect.fail(
						new ProviderError({}, "Expected: just testing encoding"),
					);
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
				createEventFilter: () => Effect.succeed("0x1" as any),
				createBlockFilter: () => Effect.succeed("0x1" as any),
				createPendingTransactionFilter: () => Effect.succeed("0x1" as any),
				getFilterChanges: () => Effect.succeed([]),
				getFilterLogs: () => Effect.succeed([]),
				uninstallFilter: () => Effect.succeed(true),
				getChainId: () => Effect.succeed(1),
				getGasPrice: () => Effect.succeed(0n),
				getMaxPriorityFeePerGas: () => Effect.succeed(0n),
				getFeeHistory: () => Effect.succeed({} as any),
				watchBlocks: () => ({}) as any,
				backfillBlocks: () => ({}) as any,
				sendRawTransaction: () => Effect.succeed("0x" as `0x${string}`),
				getUncle: () => Effect.succeed({} as any),
				getProof: () => Effect.succeed({} as any),
				getBlobBaseFee: () => Effect.succeed(0n),
				getTransactionConfirmations: () => Effect.succeed(0n),
			};

			const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
			const TestMulticallLayer = DefaultMulticall.pipe(
				Layer.provide(TestProviderLayer),
			);

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

	describe("edge cases", () => {
		const createMockProvider = (
			callFn: ProviderShape["call"],
		): ProviderShape => ({
			call: callFn,
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
			createEventFilter: () => Effect.succeed("0x1" as any),
			createBlockFilter: () => Effect.succeed("0x1" as any),
			createPendingTransactionFilter: () => Effect.succeed("0x1" as any),
			getFilterChanges: () => Effect.succeed([]),
			getFilterLogs: () => Effect.succeed([]),
			uninstallFilter: () => Effect.succeed(true),
			getChainId: () => Effect.succeed(1),
			getGasPrice: () => Effect.succeed(0n),
			getMaxPriorityFeePerGas: () => Effect.succeed(0n),
			getFeeHistory: () => Effect.succeed({} as any),
			sendRawTransaction: () => Effect.succeed("0x" as `0x${string}`),
			getUncle: () => Effect.succeed({} as any),
			getProof: () => Effect.succeed({} as any),
			getBlobBaseFee: () => Effect.succeed(0n),
			getTransactionConfirmations: () => Effect.succeed(0n),
			watchBlocks: () => ({}) as any,
			backfillBlocks: () => ({}) as any,
		});

		it.effect("handles empty call array without RPC call", () =>
			Effect.gen(function* () {
				let callCount = 0;
				const mockProvider = createMockProvider(() => {
					callCount++;
					return Effect.succeed("0x" as const);
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestMulticallLayer = DefaultMulticall.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const multicall = yield* MulticallService;
					return yield* multicall.aggregate3([]);
				}).pipe(Effect.provide(TestMulticallLayer));

				const result = yield* program;
				expect(result).toEqual([]);
				expect(callCount).toBe(0);
			}),
		);

		it.effect("handles all calls failing with allowFailure=true", () =>
			Effect.gen(function* () {
				const mockProvider = createMockProvider(() =>
					Effect.succeed(
						"0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000" as const,
					),
				);

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestMulticallLayer = DefaultMulticall.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const multicall = yield* MulticallService;
					return yield* multicall.aggregate3([
						{
							target: "0x1234567890123456789012345678901234567890",
							callData: "0x1234",
							allowFailure: true,
						},
						{
							target: "0x1234567890123456789012345678901234567890",
							callData: "0x5678",
							allowFailure: true,
						},
					]);
				}).pipe(Effect.provide(TestMulticallLayer));

				const result = yield* program;
				expect(result.length).toBe(2);
				expect(result[0]?.success).toBe(false);
				expect(result[1]?.success).toBe(false);
			}),
		);

		it.effect("handles partial success (some calls fail, some succeed)", () =>
			Effect.gen(function* () {
				const mockProvider = createMockProvider(() =>
					Effect.succeed(
						"0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000" as const,
					),
				);

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestMulticallLayer = DefaultMulticall.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const multicall = yield* MulticallService;
					return yield* multicall.aggregate3([
						{
							target: "0x1234567890123456789012345678901234567890",
							callData: "0x1234",
							allowFailure: true,
						},
						{
							target: "0x1234567890123456789012345678901234567890",
							callData: "0x5678",
							allowFailure: true,
						},
					]);
				}).pipe(Effect.provide(TestMulticallLayer));

				const result = yield* program;
				expect(result.length).toBe(2);
				expect(result[0]?.success).toBe(true);
				expect(result[1]?.success).toBe(false);
			}),
		);

		it.effect("handles multicall contract not deployed (revert)", () =>
			Effect.gen(function* () {
				const mockProvider = createMockProvider(() =>
					Effect.fail(
						new ProviderError(
							{ method: "eth_call" },
							"execution reverted: contract not found",
						),
					),
				);

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestMulticallLayer = DefaultMulticall.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const multicall = yield* MulticallService;
					return yield* multicall.aggregate3([
						{
							target: "0x1234567890123456789012345678901234567890",
							callData: "0x1234",
						},
					]);
				}).pipe(Effect.provide(TestMulticallLayer));

				const exit = yield* Effect.exit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("MulticallError");
					expect(exit.cause.error.message).toContain("Multicall3 call failed");
				}
			}),
		);

		it.effect("handles gas limit exceeded in aggregate call", () =>
			Effect.gen(function* () {
				const mockProvider = createMockProvider(() =>
					Effect.fail(
						new ProviderError(
							{ method: "eth_call" },
							"gas required exceeds allowance",
						),
					),
				);

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestMulticallLayer = DefaultMulticall.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const multicall = yield* MulticallService;
					return yield* multicall.aggregate3([
						{
							target: "0x1234567890123456789012345678901234567890",
							callData: "0x1234",
						},
					]);
				}).pipe(Effect.provide(TestMulticallLayer));

				const exit = yield* Effect.exit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("MulticallError");
					expect(exit.cause.error.message).toContain("gas required exceeds");
				}
			}),
		);

		it.effect("handles very large batch of calls", () =>
			Effect.gen(function* () {
				let capturedData: string | undefined;
				const mockProvider = createMockProvider((tx) => {
					capturedData = tx.data as string;
					return Effect.fail(
						new ProviderError({}, "Expected: testing large batch encoding"),
					);
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestMulticallLayer = DefaultMulticall.pipe(
					Layer.provide(TestProviderLayer),
				);

				const largeBatch: MulticallCall[] = Array.from(
					{ length: 100 },
					(_, i) => ({
						target:
							`0x${(i + 1).toString(16).padStart(40, "0")}` as `0x${string}`,
						callData:
							`0x${(i + 1).toString(16).padStart(8, "0")}` as `0x${string}`,
						allowFailure: true,
					}),
				);

				const program = Effect.gen(function* () {
					const multicall = yield* MulticallService;
					return yield* multicall.aggregate3(largeBatch);
				}).pipe(Effect.provide(TestMulticallLayer));

				yield* Effect.exit(program);
				expect(capturedData).toBeDefined();
				expect(capturedData?.startsWith("0x82ad56cb")).toBe(true);
				expect(capturedData?.length).toBeGreaterThan(1000);
			}),
		);

		it.effect("handles malformed return data", () =>
			Effect.gen(function* () {
				const mockProvider = createMockProvider(() =>
					Effect.succeed("0xdeadbeef" as const),
				);

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestMulticallLayer = DefaultMulticall.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const multicall = yield* MulticallService;
					return yield* multicall.aggregate3([
						{
							target: "0x1234567890123456789012345678901234567890",
							callData: "0x1234",
						},
					]);
				}).pipe(Effect.provide(TestMulticallLayer));

				const exit = yield* Effect.exit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("MulticallError");
					expect(exit.cause.error.message).toContain(
						"Failed to decode multicall result",
					);
				}
			}),
		);
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const { MulticallService, MulticallError, DefaultMulticall } =
				await import("./index.js");
			expect(MulticallService).toBeDefined();
			expect(MulticallError).toBeDefined();
			expect(DefaultMulticall).toBeDefined();
		});
	});
});
