import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import {
	ProviderService,
	type ProviderShape,
} from "../Provider/ProviderService.js";
import { TransportError } from "../Transport/TransportService.js";
import {
	DefaultFeeEstimator,
	makeFeeEstimator,
} from "./DefaultFeeEstimator.js";
import {
	FeeEstimationError,
	FeeEstimatorService,
	type FeeValuesEIP1559,
	type FeeValuesLegacy,
} from "./FeeEstimatorService.js";

const createMockProvider = (
	overrides: Partial<ProviderShape> = {},
): ProviderShape => ({
	getBlockNumber: () => Effect.succeed(18000000n),
	getBlock: () =>
		Effect.succeed({
			number: "0x112a880",
			hash: "0x1234",
			parentHash: "0x5678",
			nonce: "0x0",
			sha3Uncles: "0x",
			logsBloom: "0x",
			transactionsRoot: "0x",
			stateRoot: "0x",
			receiptsRoot: "0x",
			miner: "0x",
			difficulty: "0x0",
			totalDifficulty: "0x0",
			extraData: "0x",
			size: "0x0",
			gasLimit: "0x1c9c380",
			gasUsed: "0x0",
			timestamp: "0x0",
			transactions: [],
			uncles: [],
			baseFeePerGas: "0x3b9aca00",
		}),
	getBlockTransactionCount: () => Effect.succeed(0n),
	getBalance: () => Effect.succeed(0n),
	getTransactionCount: () => Effect.succeed(0n),
	getCode: () => Effect.succeed("0x"),
	getStorageAt: () => Effect.succeed("0x"),
	getTransaction: () => Effect.succeed({} as any),
	getTransactionReceipt: () => Effect.succeed({} as any),
	waitForTransactionReceipt: () => Effect.succeed({} as any),
	call: () => Effect.succeed("0x"),
	estimateGas: () => Effect.succeed(21000n),
	createAccessList: () => Effect.succeed({} as any),
	getLogs: () => Effect.succeed([]),
	createEventFilter: () => Effect.succeed("0x1" as any),
	createBlockFilter: () => Effect.succeed("0x1" as any),
	createPendingTransactionFilter: () => Effect.succeed("0x1" as any),
	getFilterChanges: () => Effect.succeed([]),
	getFilterLogs: () => Effect.succeed([]),
	uninstallFilter: () => Effect.succeed(true),
	getChainId: () => Effect.succeed(1),
	getGasPrice: () => Effect.succeed(20000000000n),
	getMaxPriorityFeePerGas: () => Effect.succeed(1500000000n),
	getFeeHistory: () =>
		Effect.succeed({
			oldestBlock: "0x112a880",
			baseFeePerGas: ["0x3b9aca00"],
			gasUsedRatio: [0.5],
		}),
	watchBlocks: () => ({}) as any,
	backfillBlocks: () => ({}) as any,
	sendRawTransaction: () => Effect.succeed("0x" as `0x${string}`),
	getUncle: () => Effect.succeed({} as any),
	getProof: () => Effect.succeed({} as any),
	getBlobBaseFee: () => Effect.succeed(0n),
	getTransactionConfirmations: () => Effect.succeed(0n),
	...overrides,
});

const MULTIPLIER_PRECISION = 100n;
const MULTIPLIER_PRECISION_NUMBER = 100;
const MAX_REASONABLE_GAS_PRICE_WEI = 1_000_000_000_000_000_000n;

const applyBaseFeeMultiplier = (
	baseFee: bigint,
	multiplier: number,
): bigint => {
	const numerator = BigInt(
		Math.round(multiplier * MULTIPLIER_PRECISION_NUMBER),
	);
	return (
		(baseFee * numerator + MULTIPLIER_PRECISION - 1n) / MULTIPLIER_PRECISION
	);
};

describe("FeeEstimatorService", () => {
	describe("FeeEstimationError", () => {
		it("creates error with message", () => {
			const error = new FeeEstimationError({ message: "test error" });
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("FeeEstimationError");
		});

		it("creates error with cause", () => {
			const cause = new Error("underlying");
			const error = new FeeEstimationError({
				message: "Fee estimation failed",
				cause,
			});
			expect(error.cause).toBe(cause);
		});
	});

	describe("DefaultFeeEstimator", () => {
		describe("estimateFeesPerGas - legacy", () => {
			it("returns gas price for legacy type", async () => {
				const mockProvider = createMockProvider({
					getGasPrice: () => Effect.succeed(25000000000n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					const _provider = yield* ProviderService;
					return yield* feeEstimator.estimateFeesPerGas("legacy");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const result = (await Effect.runPromise(program)) as FeeValuesLegacy;
				expect(result.gasPrice).toBe(25000000000n);
			});

			it("fails when gas price exceeds reasonable bounds", async () => {
				const excessiveGasPrice = MAX_REASONABLE_GAS_PRICE_WEI + 1n;
				const mockProvider = createMockProvider({
					getGasPrice: () => Effect.succeed(excessiveGasPrice),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					return yield* feeEstimator.estimateFeesPerGas("legacy");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const exit = await Effect.runPromiseExit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("FeeEstimationError");
					expect(exit.cause.error.message).toContain(
						"Gas price exceeds maximum reasonable gas price",
					);
				}
			});

			it("propagates provider errors", async () => {
				const mockProvider = createMockProvider({
					getGasPrice: () =>
						Effect.fail(
							new TransportError({
								code: -32000,
								message: "Gas price unavailable",
							}),
						),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					const _provider = yield* ProviderService;
					return yield* feeEstimator.estimateFeesPerGas("legacy");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const exit = await Effect.runPromiseExit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("FeeEstimationError");
					expect(exit.cause.error.message).toContain("Failed to get gas price");
				}
			});
		});

		describe("estimateFeesPerGas - eip1559", () => {
			it("propagates getBlock provider error", async () => {
				const mockProvider = createMockProvider({
					getBlock: () =>
						Effect.fail(
							new TransportError({
								code: -32000,
								message: "Block fetch failed",
							}),
						),
					getMaxPriorityFeePerGas: () => Effect.succeed(1500000000n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					return yield* feeEstimator.estimateFeesPerGas("eip1559");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const exit = await Effect.runPromiseExit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("FeeEstimationError");
					expect(exit.cause.error.message).toContain(
						"Failed to get latest block",
					);
				}
			});

			it("propagates getMaxPriorityFeePerGas provider error", async () => {
				const mockProvider = createMockProvider({
					getMaxPriorityFeePerGas: () =>
						Effect.fail(
							new TransportError({
								code: -32000,
								message: "Priority fee unavailable",
							}),
						),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					return yield* feeEstimator.estimateFeesPerGas("eip1559");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const exit = await Effect.runPromiseExit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("FeeEstimationError");
					expect(exit.cause.error.message).toContain(
						"Failed to get max priority fee",
					);
				}
			});

			it("returns maxFeePerGas and maxPriorityFeePerGas", async () => {
				const mockProvider = createMockProvider({
					getBlock: () =>
						Effect.succeed({
							baseFeePerGas: "0x3b9aca00",
							number: "0x112a880",
							hash: "0x1234",
							parentHash: "0x5678",
							nonce: "0x0",
							sha3Uncles: "0x",
							logsBloom: "0x",
							transactionsRoot: "0x",
							stateRoot: "0x",
							receiptsRoot: "0x",
							miner: "0x",
							difficulty: "0x0",
							totalDifficulty: "0x0",
							extraData: "0x",
							size: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x0",
							timestamp: "0x0",
							transactions: [],
							uncles: [],
						}),
					getMaxPriorityFeePerGas: () => Effect.succeed(1500000000n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					const _provider = yield* ProviderService;
					return yield* feeEstimator.estimateFeesPerGas("eip1559");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const result = (await Effect.runPromise(program)) as FeeValuesEIP1559;
				expect(typeof result.maxFeePerGas).toBe("bigint");
				expect(typeof result.maxPriorityFeePerGas).toBe("bigint");
				expect(result.maxPriorityFeePerGas).toBe(1500000000n);
				expect(result.maxFeePerGas).toBeGreaterThan(
					result.maxPriorityFeePerGas,
				);
			});

			it("applies ceiling rounding to fractional multiplier results", async () => {
				const baseFee = 3n;
				const priorityFee = 1n;

				const mockProvider = createMockProvider({
					getBlock: () =>
						Effect.succeed({
							baseFeePerGas: `0x${baseFee.toString(16)}`,
							number: "0x112a880",
							hash: "0x1234",
							parentHash: "0x5678",
							nonce: "0x0",
							sha3Uncles: "0x",
							logsBloom: "0x",
							transactionsRoot: "0x",
							stateRoot: "0x",
							receiptsRoot: "0x",
							miner: "0x",
							difficulty: "0x0",
							totalDifficulty: "0x0",
							extraData: "0x",
							size: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x0",
							timestamp: "0x0",
							transactions: [],
							uncles: [],
						}),
					getMaxPriorityFeePerGas: () => Effect.succeed(priorityFee),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					return yield* feeEstimator.estimateFeesPerGas("eip1559");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const result = (await Effect.runPromise(program)) as FeeValuesEIP1559;
				expect(result.maxFeePerGas).toBe(5n);
			});

			it("handles zero base fee", async () => {
				const baseFee = 0n;
				const priorityFee = 1000000000n;

				const mockProvider = createMockProvider({
					getBlock: () =>
						Effect.succeed({
							baseFeePerGas: `0x${baseFee.toString(16)}`,
							number: "0x112a880",
							hash: "0x1234",
							parentHash: "0x5678",
							nonce: "0x0",
							sha3Uncles: "0x",
							logsBloom: "0x",
							transactionsRoot: "0x",
							stateRoot: "0x",
							receiptsRoot: "0x",
							miner: "0x",
							difficulty: "0x0",
							totalDifficulty: "0x0",
							extraData: "0x",
							size: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x0",
							timestamp: "0x0",
							transactions: [],
							uncles: [],
						}),
					getMaxPriorityFeePerGas: () => Effect.succeed(priorityFee),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					return yield* feeEstimator.estimateFeesPerGas("eip1559");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const result = (await Effect.runPromise(program)) as FeeValuesEIP1559;
				expect(result.maxFeePerGas).toBe(priorityFee);
				expect(result.maxPriorityFeePerGas).toBe(priorityFee);
			});

			it("applies base fee multiplier", async () => {
				const baseFee = 1000000000n;
				const priorityFee = 100000000n;

				const mockProvider = createMockProvider({
					getBlock: () =>
						Effect.succeed({
							baseFeePerGas: `0x${baseFee.toString(16)}`,
							number: "0x112a880",
							hash: "0x1234",
							parentHash: "0x5678",
							nonce: "0x0",
							sha3Uncles: "0x",
							logsBloom: "0x",
							transactionsRoot: "0x",
							stateRoot: "0x",
							receiptsRoot: "0x",
							miner: "0x",
							difficulty: "0x0",
							totalDifficulty: "0x0",
							extraData: "0x",
							size: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x0",
							timestamp: "0x0",
							transactions: [],
							uncles: [],
						}),
					getMaxPriorityFeePerGas: () => Effect.succeed(priorityFee),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					const _provider = yield* ProviderService;
					return yield* feeEstimator.estimateFeesPerGas("eip1559");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const result = (await Effect.runPromise(program)) as FeeValuesEIP1559;
				const expectedMaxFee =
					applyBaseFeeMultiplier(baseFee, 1.2) + priorityFee;
				expect(result.maxFeePerGas).toBe(expectedMaxFee);
			});

			it("handles large base fee values without precision loss", async () => {
				const baseFee = BigInt(Number.MAX_SAFE_INTEGER) + 2n;
				const priorityFee = 2500000000n;

				const mockProvider = createMockProvider({
					getBlock: () =>
						Effect.succeed({
							baseFeePerGas: `0x${baseFee.toString(16)}`,
							number: "0x112a880",
							hash: "0x1234",
							parentHash: "0x5678",
							nonce: "0x0",
							sha3Uncles: "0x",
							logsBloom: "0x",
							transactionsRoot: "0x",
							stateRoot: "0x",
							receiptsRoot: "0x",
							miner: "0x",
							difficulty: "0x0",
							totalDifficulty: "0x0",
							extraData: "0x",
							size: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x0",
							timestamp: "0x0",
							transactions: [],
							uncles: [],
						}),
					getMaxPriorityFeePerGas: () => Effect.succeed(priorityFee),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					return yield* feeEstimator.estimateFeesPerGas("eip1559");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const result = (await Effect.runPromise(program)) as FeeValuesEIP1559;
				const expectedMaxFee =
					applyBaseFeeMultiplier(baseFee, 1.2) + priorityFee;
				expect(result.maxFeePerGas).toBe(expectedMaxFee);
			});

			it("fails when base fee exceeds reasonable bounds", async () => {
				const baseFee = MAX_REASONABLE_GAS_PRICE_WEI + 1n;
				const priorityFee = 1000000000n;

				const mockProvider = createMockProvider({
					getBlock: () =>
						Effect.succeed({
							baseFeePerGas: `0x${baseFee.toString(16)}`,
							number: "0x112a880",
							hash: "0x1234",
							parentHash: "0x5678",
							nonce: "0x0",
							sha3Uncles: "0x",
							logsBloom: "0x",
							transactionsRoot: "0x",
							stateRoot: "0x",
							receiptsRoot: "0x",
							miner: "0x",
							difficulty: "0x0",
							totalDifficulty: "0x0",
							extraData: "0x",
							size: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x0",
							timestamp: "0x0",
							transactions: [],
							uncles: [],
						}),
					getMaxPriorityFeePerGas: () => Effect.succeed(priorityFee),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					return yield* feeEstimator.estimateFeesPerGas("eip1559");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const exit = await Effect.runPromiseExit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("FeeEstimationError");
					expect(exit.cause.error.message).toContain(
						"Base fee per gas exceeds maximum reasonable gas price",
					);
				}
			});

			it("fails for pre-EIP-1559 chain", async () => {
				const mockProvider = createMockProvider({
					getBlock: () =>
						Effect.succeed({
							number: "0x112a880",
							hash: "0x1234",
							parentHash: "0x5678",
							nonce: "0x0",
							sha3Uncles: "0x",
							logsBloom: "0x",
							transactionsRoot: "0x",
							stateRoot: "0x",
							receiptsRoot: "0x",
							miner: "0x",
							difficulty: "0x0",
							totalDifficulty: "0x0",
							extraData: "0x",
							size: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x0",
							timestamp: "0x0",
							transactions: [],
							uncles: [],
						}),
					getMaxPriorityFeePerGas: () => Effect.succeed(1500000000n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					const _provider = yield* ProviderService;
					return yield* feeEstimator.estimateFeesPerGas("eip1559");
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const exit = await Effect.runPromiseExit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error.message).toContain("pre-EIP-1559");
				}
			});
		});

		describe("getMaxPriorityFeePerGas", () => {
			it("returns priority fee", async () => {
				const mockProvider = createMockProvider({
					getMaxPriorityFeePerGas: () => Effect.succeed(2000000000n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					const _provider = yield* ProviderService;
					return yield* feeEstimator.getMaxPriorityFeePerGas();
				}).pipe(
					Effect.provide(TestFeeEstimatorLayer),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result).toBe(2000000000n);
			});
		});

		describe("baseFeeMultiplier", () => {
			it("has default multiplier of 1.2", async () => {
				const mockProvider = createMockProvider();

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
				const TestFeeEstimatorLayer = DefaultFeeEstimator.pipe(
					Layer.provide(TestProviderLayer),
				);

				const program = Effect.gen(function* () {
					const feeEstimator = yield* FeeEstimatorService;
					return feeEstimator.baseFeeMultiplier;
				}).pipe(Effect.provide(TestFeeEstimatorLayer));

				const result = await Effect.runPromise(program);
				expect(result).toBe(1.2);
			});
		});
	});

	describe("makeFeeEstimator", () => {
		it("creates fee estimator with custom multiplier", async () => {
			const mockProvider = createMockProvider();

			const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
			const CustomFeeEstimator = makeFeeEstimator(1.5);
			const TestFeeEstimatorLayer = CustomFeeEstimator.pipe(
				Layer.provide(TestProviderLayer),
			);

			const program = Effect.gen(function* () {
				const feeEstimator = yield* FeeEstimatorService;
				return feeEstimator.baseFeeMultiplier;
			}).pipe(Effect.provide(TestFeeEstimatorLayer));

			const result = await Effect.runPromise(program);
			expect(result).toBe(1.5);
		});

		it("handles zero multiplier (produces maxFee = priorityFee only)", async () => {
			const baseFee = 1000000000n;
			const priorityFee = 100000000n;

			const mockProvider = createMockProvider({
				getBlock: () =>
					Effect.succeed({
						baseFeePerGas: `0x${baseFee.toString(16)}`,
						number: "0x112a880",
						hash: "0x1234",
						parentHash: "0x5678",
						nonce: "0x0",
						sha3Uncles: "0x",
						logsBloom: "0x",
						transactionsRoot: "0x",
						stateRoot: "0x",
						receiptsRoot: "0x",
						miner: "0x",
						difficulty: "0x0",
						totalDifficulty: "0x0",
						extraData: "0x",
						size: "0x0",
						gasLimit: "0x1c9c380",
						gasUsed: "0x0",
						timestamp: "0x0",
						transactions: [],
						uncles: [],
					}),
				getMaxPriorityFeePerGas: () => Effect.succeed(priorityFee),
			});

			const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
			const ZeroMultiplierEstimator = makeFeeEstimator(0);
			const TestFeeEstimatorLayer = ZeroMultiplierEstimator.pipe(
				Layer.provide(TestProviderLayer),
			);

			const program = Effect.gen(function* () {
				const feeEstimator = yield* FeeEstimatorService;
				return yield* feeEstimator.estimateFeesPerGas("eip1559");
			}).pipe(
				Effect.provide(TestFeeEstimatorLayer),
				Effect.provide(TestProviderLayer),
			);

			const result = (await Effect.runPromise(program)) as FeeValuesEIP1559;
			expect(result.maxFeePerGas).toBe(priorityFee);
		});

		it("applies custom multiplier to fee calculation", async () => {
			const baseFee = 1000000000n;
			const priorityFee = 100000000n;
			const customMultiplier = 2.0;

			const mockProvider = createMockProvider({
				getBlock: () =>
					Effect.succeed({
						baseFeePerGas: `0x${baseFee.toString(16)}`,
						number: "0x112a880",
						hash: "0x1234",
						parentHash: "0x5678",
						nonce: "0x0",
						sha3Uncles: "0x",
						logsBloom: "0x",
						transactionsRoot: "0x",
						stateRoot: "0x",
						receiptsRoot: "0x",
						miner: "0x",
						difficulty: "0x0",
						totalDifficulty: "0x0",
						extraData: "0x",
						size: "0x0",
						gasLimit: "0x1c9c380",
						gasUsed: "0x0",
						timestamp: "0x0",
						transactions: [],
						uncles: [],
					}),
				getMaxPriorityFeePerGas: () => Effect.succeed(priorityFee),
			});

			const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
			const CustomFeeEstimator = makeFeeEstimator(customMultiplier);
			const TestFeeEstimatorLayer = CustomFeeEstimator.pipe(
				Layer.provide(TestProviderLayer),
			);

			const program = Effect.gen(function* () {
				const feeEstimator = yield* FeeEstimatorService;
				const _provider = yield* ProviderService;
				return yield* feeEstimator.estimateFeesPerGas("eip1559");
			}).pipe(
				Effect.provide(TestFeeEstimatorLayer),
				Effect.provide(TestProviderLayer),
			);

			const result = (await Effect.runPromise(program)) as FeeValuesEIP1559;
			const expectedMaxFee =
				applyBaseFeeMultiplier(baseFee, customMultiplier) + priorityFee;
			expect(result.maxFeePerGas).toBe(expectedMaxFee);
		});
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const {
				FeeEstimatorService,
				FeeEstimationError,
				DefaultFeeEstimator,
				makeFeeEstimator,
			} = await import("./index.js");
			expect(FeeEstimatorService).toBeDefined();
			expect(FeeEstimationError).toBeDefined();
			expect(DefaultFeeEstimator).toBeDefined();
			expect(makeFeeEstimator).toBeDefined();
		});
	});
});
