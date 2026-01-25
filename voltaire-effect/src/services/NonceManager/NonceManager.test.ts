import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { NonceError, NonceManagerService } from "./NonceManagerService.js";
import { DefaultNonceManager } from "./DefaultNonceManager.js";
import { ProviderService, ProviderError, type ProviderShape } from "../Provider/ProviderService.js";

const createMockProvider = (overrides: Partial<ProviderShape> = {}): ProviderShape => ({
	getBlockNumber: () => Effect.succeed(18000000n),
	getBlock: () => Effect.succeed({} as any),
	getBlockTransactionCount: () => Effect.succeed(0n),
	getBalance: () => Effect.succeed(0n),
	getTransactionCount: () => Effect.succeed(5n),
	getCode: () => Effect.succeed("0x"),
	getStorageAt: () => Effect.succeed("0x"),
	getTransaction: () => Effect.succeed({} as any),
	getTransactionReceipt: () => Effect.succeed({} as any),
	waitForTransactionReceipt: () => Effect.succeed({} as any),
	call: () => Effect.succeed("0x"),
	estimateGas: () => Effect.succeed(21000n),
	createAccessList: () => Effect.succeed({} as any),
	getLogs: () => Effect.succeed([]),
	getChainId: () => Effect.succeed(1),
	getGasPrice: () => Effect.succeed(20000000000n),
	getMaxPriorityFeePerGas: () => Effect.succeed(1500000000n),
	getFeeHistory: () => Effect.succeed({} as any),
	watchBlocks: () => ({} as any),
	backfillBlocks: () => ({} as any),
	...overrides,
});

describe("NonceManagerService", () => {
	describe("NonceError", () => {
		it("creates error with message and address", () => {
			const error = new NonceError({
				address: "0x1234",
				message: "test error",
			});
			expect(error.message).toBe("test error");
			expect(error.address).toBe("0x1234");
			expect(error._tag).toBe("NonceError");
		});

		it("creates error with cause", () => {
			const cause = new Error("underlying");
			const error = new NonceError({
				address: "0x1234",
				message: "Nonce fetch failed",
				cause,
			});
			expect(error.cause).toBe(cause);
		});
	});

	describe("DefaultNonceManager", () => {
		describe("get", () => {
			it("returns on-chain nonce when delta is 0", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () => Effect.succeed(10n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					return yield* nonceManager.get("0x1234567890123456789012345678901234567890", 1);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result).toBe(10);
			});

			it("normalizes address to lowercase", async () => {
				let capturedAddress: string | undefined;
				const mockProvider = createMockProvider({
					getTransactionCount: (address) => {
						capturedAddress = address as string;
						return Effect.succeed(5n);
					},
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					return yield* nonceManager.get("0xABCD1234567890123456789012345678901234AB", 1);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				await Effect.runPromise(program);
				expect(capturedAddress).toBe("0xABCD1234567890123456789012345678901234AB");
			});

			it("propagates provider errors", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () =>
						Effect.fail(new ProviderError({}, "RPC failed")),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					return yield* nonceManager.get("0x1234567890123456789012345678901234567890", 1);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const exit = await Effect.runPromiseExit(program);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
					expect(exit.cause.error._tag).toBe("NonceError");
					expect(exit.cause.error.message).toContain("Failed to get transaction count");
				}
			});
		});

		describe("consume", () => {
			it("returns current nonce and increments delta", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () => Effect.succeed(5n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1234567890123456789012345678901234567890";
					const n1 = yield* nonceManager.consume(addr, 1);
					const n2 = yield* nonceManager.consume(addr, 1);
					const n3 = yield* nonceManager.consume(addr, 1);
					return [n1, n2, n3];
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result).toEqual([5, 6, 7]);
			});

			it("tracks delta per address", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () => Effect.succeed(10n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr1 = "0x1111111111111111111111111111111111111111";
					const addr2 = "0x2222222222222222222222222222222222222222";

					const a1n1 = yield* nonceManager.consume(addr1, 1);
					const a2n1 = yield* nonceManager.consume(addr2, 1);
					const a1n2 = yield* nonceManager.consume(addr1, 1);
					const a2n2 = yield* nonceManager.consume(addr2, 1);

					return { a1n1, a1n2, a2n1, a2n2 };
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result.a1n1).toBe(10);
				expect(result.a1n2).toBe(11);
				expect(result.a2n1).toBe(10);
				expect(result.a2n2).toBe(11);
			});

			it("tracks delta per chainId", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () => Effect.succeed(10n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1111111111111111111111111111111111111111";

					const mainnet1 = yield* nonceManager.consume(addr, 1);
					const optimism1 = yield* nonceManager.consume(addr, 10);
					const mainnet2 = yield* nonceManager.consume(addr, 1);
					const optimism2 = yield* nonceManager.consume(addr, 10);

					return { mainnet1, mainnet2, optimism1, optimism2 };
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result.mainnet1).toBe(10);
				expect(result.mainnet2).toBe(11);
				expect(result.optimism1).toBe(10);
				expect(result.optimism2).toBe(11);
			});
		});

		describe("increment", () => {
			it("increments delta without fetching", async () => {
				let fetchCount = 0;
				const mockProvider = createMockProvider({
					getTransactionCount: () => {
						fetchCount++;
						return Effect.succeed(5n);
					},
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1234567890123456789012345678901234567890";

					yield* nonceManager.increment(addr, 1);
					yield* nonceManager.increment(addr, 1);
					yield* nonceManager.increment(addr, 1);

					const beforeFetch = fetchCount;
					const nonce = yield* nonceManager.get(addr, 1);

					return { nonce, fetchesBefore: beforeFetch, fetchesAfter: fetchCount };
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result.fetchesBefore).toBe(0);
				expect(result.fetchesAfter).toBe(1);
				expect(result.nonce).toBe(8);
			});
		});

		describe("reset", () => {
			it("clears delta for address", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () => Effect.succeed(5n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1234567890123456789012345678901234567890";

					yield* nonceManager.consume(addr, 1);
					yield* nonceManager.consume(addr, 1);
					yield* nonceManager.consume(addr, 1);

					yield* nonceManager.reset(addr, 1);

					return yield* nonceManager.get(addr, 1);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result).toBe(5);
			});

			it("only resets specified address", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () => Effect.succeed(5n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr1 = "0x1111111111111111111111111111111111111111";
					const addr2 = "0x2222222222222222222222222222222222222222";

					yield* nonceManager.consume(addr1, 1);
					yield* nonceManager.consume(addr1, 1);
					yield* nonceManager.consume(addr2, 1);
					yield* nonceManager.consume(addr2, 1);

					yield* nonceManager.reset(addr1, 1);

					const n1 = yield* nonceManager.get(addr1, 1);
					const n2 = yield* nonceManager.get(addr2, 1);

					return { n1, n2 };
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result.n1).toBe(5);
				expect(result.n2).toBe(7);
			});
		});

		describe("case insensitivity", () => {
			it("treats addresses with different cases as same", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () => Effect.succeed(5n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;

					const n1 = yield* nonceManager.consume(
						"0xabcd1234567890123456789012345678901234ab",
						1,
					);
					const n2 = yield* nonceManager.consume(
						"0xABCD1234567890123456789012345678901234AB",
						1,
					);
					const n3 = yield* nonceManager.consume(
						"0xAbCd1234567890123456789012345678901234Ab",
						1,
					);

					return [n1, n2, n3];
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result).toEqual([5, 6, 7]);
			});
		});

		describe("concurrent usage", () => {
			it("handles concurrent consumes correctly", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () => Effect.succeed(0n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1234567890123456789012345678901234567890";

					const results = yield* Effect.all(
						[
							nonceManager.consume(addr, 1),
							nonceManager.consume(addr, 1),
							nonceManager.consume(addr, 1),
							nonceManager.consume(addr, 1),
							nonceManager.consume(addr, 1),
						],
						{ concurrency: 5 },
					);

					return results.sort((a, b) => a - b);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				expect(result).toEqual([0, 1, 2, 3, 4]);
			});

			it("handles high concurrency without race conditions", async () => {
				const mockProvider = createMockProvider({
					getTransactionCount: () => Effect.succeed(0n),
				});

				const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);

				const program = Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1234567890123456789012345678901234567890";

					const results = yield* Effect.all(
						Array.from({ length: 100 }, () => nonceManager.consume(addr, 1)),
						{ concurrency: "unbounded" },
					);

					return results.sort((a, b) => a - b);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				const result = await Effect.runPromise(program);
				const expected = Array.from({ length: 100 }, (_, i) => i);
				expect(result).toEqual(expected);
			});
		});
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const { NonceManagerService, NonceError, DefaultNonceManager } = await import(
				"./index.js"
			);
			expect(NonceManagerService).toBeDefined();
			expect(NonceError).toBeDefined();
			expect(DefaultNonceManager).toBeDefined();
		});
	});
});
