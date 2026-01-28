import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import {
	ProviderService,
	type ProviderShape,
} from "../Provider/ProviderService.js";
import { TransportError } from "../Transport/TransportService.js";
import { DefaultNonceManager } from "./DefaultNonceManager.js";
import { NonceError, NonceManagerService } from "./NonceManagerService.js";

const createMockProvider = (
	overrides: {
		getTransactionCount?: (address: unknown, blockTag?: unknown) => Effect.Effect<bigint, TransportError>;
	} = {},
): ProviderShape => ({
	request: <T>(method: string, params?: unknown[]) => {
		switch (method) {
			case "eth_getTransactionCount":
				if (overrides.getTransactionCount) {
					return overrides.getTransactionCount(params?.[0], params?.[1]).pipe(
						Effect.map((v) => `0x${v.toString(16)}` as T),
					);
				}
				return Effect.succeed("0x5" as T); // default nonce = 5
			case "eth_chainId":
				return Effect.succeed("0x1" as T);
			default:
				return Effect.fail(
					new TransportError({ code: -32601, message: `Unknown method: ${method}` }),
				);
		}
	},
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
			it.effect("returns on-chain nonce when delta is 0", () =>
				Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const result = yield* nonceManager.get(
						"0x1234567890123456789012345678901234567890",
						1,
					);
					expect(result).toBe(10n);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(10n),
							}),
						),
					),
				),
			);

			it.effect("preserves large nonces without precision loss", () =>
				Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const result = yield* nonceManager.get(
						"0x1234567890123456789012345678901234567890",
						1,
					);
					expect(result).toBe(9007199254740993n);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(9007199254740993n),
							}),
						),
					),
				),
			);

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
					return yield* nonceManager.get(
						"0xABCD1234567890123456789012345678901234AB",
						1,
					);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(TestProviderLayer),
				);

				await Effect.runPromise(program);
				expect(capturedAddress).toBe(
					"0xABCD1234567890123456789012345678901234AB",
				);
			});

			it.effect("propagates provider errors", () =>
				Effect.gen(function* () {
					const mockProvider = createMockProvider({
						getTransactionCount: () =>
							Effect.fail(
								new TransportError({ code: -32000, message: "RPC failed" }),
							),
					});

					const TestProviderLayer = Layer.succeed(
						ProviderService,
						mockProvider,
					);

					const program = Effect.gen(function* () {
						const nonceManager = yield* NonceManagerService;
						return yield* nonceManager.get(
							"0x1234567890123456789012345678901234567890",
							1,
						);
					}).pipe(
						Effect.provide(DefaultNonceManager),
						Effect.provide(TestProviderLayer),
					);

					const exit = yield* Effect.exit(program);
					expect(Exit.isFailure(exit)).toBe(true);
					if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
						expect(exit.cause.error._tag).toBe("NonceError");
						expect(exit.cause.error.message).toContain(
							"Failed to get transaction count",
						);
					}
				}),
			);
		});

		describe("consume", () => {
			it.effect("returns current nonce and increments delta", () =>
				Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1234567890123456789012345678901234567890";
					const n1 = yield* nonceManager.consume(addr, 1);
					const n2 = yield* nonceManager.consume(addr, 1);
					const n3 = yield* nonceManager.consume(addr, 1);
					expect([n1, n2, n3]).toEqual([5n, 6n, 7n]);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(5n),
							}),
						),
					),
				),
			);

			it.effect("tracks delta per address", () =>
				Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr1 = "0x1111111111111111111111111111111111111111";
					const addr2 = "0x2222222222222222222222222222222222222222";

					const a1n1 = yield* nonceManager.consume(addr1, 1);
					const a2n1 = yield* nonceManager.consume(addr2, 1);
					const a1n2 = yield* nonceManager.consume(addr1, 1);
					const a2n2 = yield* nonceManager.consume(addr2, 1);

					expect(a1n1).toBe(10n);
					expect(a1n2).toBe(11n);
					expect(a2n1).toBe(10n);
					expect(a2n2).toBe(11n);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(10n),
							}),
						),
					),
				),
			);

			it.effect("tracks delta per chainId", () =>
				Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1111111111111111111111111111111111111111";

					const mainnet1 = yield* nonceManager.consume(addr, 1);
					const optimism1 = yield* nonceManager.consume(addr, 10);
					const mainnet2 = yield* nonceManager.consume(addr, 1);
					const optimism2 = yield* nonceManager.consume(addr, 10);

					expect(mainnet1).toBe(10n);
					expect(mainnet2).toBe(11n);
					expect(optimism1).toBe(10n);
					expect(optimism2).toBe(11n);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(10n),
							}),
						),
					),
				),
			);
		});

		describe("increment", () => {
			it.effect("increments delta without fetching", () =>
				Effect.gen(function* () {
					let fetchCount = 0;
					const mockProvider = createMockProvider({
						getTransactionCount: () => {
							fetchCount++;
							return Effect.succeed(5n);
						},
					});

					const TestProviderLayer = Layer.succeed(
						ProviderService,
						mockProvider,
					);

					const program = Effect.gen(function* () {
						const nonceManager = yield* NonceManagerService;
						const addr = "0x1234567890123456789012345678901234567890";

						yield* nonceManager.increment(addr, 1);
						yield* nonceManager.increment(addr, 1);
						yield* nonceManager.increment(addr, 1);

						const beforeFetch = fetchCount;
						const nonce = yield* nonceManager.get(addr, 1);

						return {
							nonce,
							fetchesBefore: beforeFetch,
							fetchesAfter: fetchCount,
						};
					}).pipe(
						Effect.provide(DefaultNonceManager),
						Effect.provide(TestProviderLayer),
					);

					const result = yield* program;
					expect(result.fetchesBefore).toBe(0);
					expect(result.fetchesAfter).toBe(1);
					expect(result.nonce).toBe(8n);
				}),
			);
		});

		describe("reset", () => {
			it.effect("clears delta for address", () =>
				Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1234567890123456789012345678901234567890";

					yield* nonceManager.consume(addr, 1);
					yield* nonceManager.consume(addr, 1);
					yield* nonceManager.consume(addr, 1);

					yield* nonceManager.reset(addr, 1);

					const result = yield* nonceManager.get(addr, 1);
					expect(result).toBe(5n);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(5n),
							}),
						),
					),
				),
			);

			it.effect("only resets specified address", () =>
				Effect.gen(function* () {
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

					expect(n1).toBe(5n);
					expect(n2).toBe(7n);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(5n),
							}),
						),
					),
				),
			);
		});

		describe("case insensitivity", () => {
			it.effect("treats addresses with different cases as same", () =>
				Effect.gen(function* () {
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

					expect([n1, n2, n3]).toEqual([5n, 6n, 7n]);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(5n),
							}),
						),
					),
				),
			);
		});

		describe("concurrent usage", () => {
			it.effect("handles concurrent consumes correctly", () =>
				Effect.gen(function* () {
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

					expect(
						results.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
					).toEqual([0n, 1n, 2n, 3n, 4n]);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(0n),
							}),
						),
					),
				),
			);

			it.effect("handles high concurrency without race conditions", () =>
				Effect.gen(function* () {
					const nonceManager = yield* NonceManagerService;
					const addr = "0x1234567890123456789012345678901234567890";

					const results = yield* Effect.all(
						Array.from({ length: 100 }, () => nonceManager.consume(addr, 1)),
						{ concurrency: "unbounded" },
					);

					const expected = Array.from({ length: 100 }, (_, i) => BigInt(i));
					expect(
						results.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
					).toEqual(expected);
				}).pipe(
					Effect.provide(DefaultNonceManager),
					Effect.provide(
						Layer.succeed(
							ProviderService,
							createMockProvider({
								getTransactionCount: () => Effect.succeed(0n),
							}),
						),
					),
				),
			);
		});
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const { NonceManagerService, NonceError, DefaultNonceManager } =
				await import("./index.js");
			expect(NonceManagerService).toBeDefined();
			expect(NonceError).toBeDefined();
			expect(DefaultNonceManager).toBeDefined();
		});
	});
});
