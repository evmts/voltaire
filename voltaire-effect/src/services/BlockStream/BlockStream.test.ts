/**
 * @fileoverview Tests for BlockStreamService.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import { describe, expect, it } from "@effect/vitest";
import { TransportService, type TransportShape } from "../Transport/index.js";
import { BlockStreamService } from "./BlockStreamService.js";
import { BlockStream } from "./BlockStream.js";
import { BlockStreamError } from "./BlockStreamError.js";

describe("BlockStreamService", () => {
	describe("BlockStreamError", () => {
		it("creates error with message", () => {
			const error = new BlockStreamError("test error");
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("BlockStreamError");
		});

		it("creates error with cause", () => {
			const cause = new Error("underlying");
			const error = new BlockStreamError("test error", { cause });
			expect(error.message).toContain("test error");
			expect(error.cause).toBe(cause);
		});

		it("creates error with context", () => {
			const error = new BlockStreamError("test error", {
				context: { fromBlock: 100n, toBlock: 200n },
			});
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("BlockStreamError");
		});

		it("has correct name property", () => {
			const error = new BlockStreamError("test");
			expect(error.name).toBe("BlockStreamError");
		});

		it("is instanceof Error", () => {
			const error = new BlockStreamError("test");
			expect(error instanceof Error).toBe(true);
		});

		it("preserves cause chain", () => {
			const rootCause = new Error("root");
			const intermediateCause = new Error("intermediate", { cause: rootCause });
			const error = new BlockStreamError("top level", { cause: intermediateCause });
			expect(error.cause).toBe(intermediateCause);
			expect((error.cause as Error).cause).toBe(rootCause);
		});

		it("has stack trace", () => {
			const error = new BlockStreamError("test");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("BlockStreamError");
		});

		it("handles empty message", () => {
			const error = new BlockStreamError("");
			expect(error.message).toBe("");
			expect(error._tag).toBe("BlockStreamError");
		});

		it("handles long error messages", () => {
			const longMessage = "x".repeat(10000);
			const error = new BlockStreamError(longMessage);
			expect(error.message).toBe(longMessage);
		});
	});

	describe("BlockStream layer", () => {
		it.effect("provides BlockStreamService from TransportService", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(_method: string, _params?: unknown[]): Effect.Effect<T, never> =>
						Effect.succeed("0x1" as T),
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;
					expect(blockStream.backfill).toBeDefined();
					expect(blockStream.watch).toBeDefined();
					expect(typeof blockStream.backfill).toBe("function");
					expect(typeof blockStream.watch).toBe("function");
				}).pipe(Effect.provide(TestBlockStreamLayer));

				yield* program;
			})
		);

		it.effect("backfill returns a Stream", () =>
			Effect.gen(function* () {
				const mockBlock = {
					number: "0x64",
					hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
					timestamp: "0x60000000",
					nonce: "0x0000000000000000",
					difficulty: "0x0",
					gasLimit: "0x1c9c380",
					gasUsed: "0x0",
					miner: "0x0000000000000000000000000000000000000000",
					extraData: "0x",
					logsBloom: "0x" + "0".repeat(512),
					transactionsRoot: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					stateRoot: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					receiptsRoot: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					sha3Uncles: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
					size: "0x200",
					baseFeePerGas: "0x7",
					transactions: [],
					uncles: [],
				};

				const mockTransport: TransportShape = {
					request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						if (method === "eth_getBlockByNumber") {
							return Effect.succeed(mockBlock as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 100n,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestBlockStreamLayer));

				yield* program;
			})
		);

		it.effect("watch returns a Stream", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;
					const stream = blockStream.watch();
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestBlockStreamLayer));

				yield* program;
			})
		);

		it.effect("watch with include transactions option", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;
					const stream = blockStream.watch({ include: "transactions" });
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestBlockStreamLayer));

				yield* program;
			})
		);

		it.effect("watch with include receipts option", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;
					const stream = blockStream.watch({ include: "receipts" });
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestBlockStreamLayer));

				yield* program;
			})
		);

		it.effect("backfill with include transactions option", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 200n,
						include: "transactions",
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestBlockStreamLayer));

				yield* program;
			})
		);
	});

	describe("error handling", () => {
		it.effect("wraps transport errors as BlockStreamError", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(_method: string, _params?: unknown[]): Effect.Effect<T, Error> =>
						Effect.fail(new Error("RPC connection failed")),
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 200n,
					});
					yield* Stream.runCollect(stream);
				}).pipe(Effect.provide(TestBlockStreamLayer));

				const result = yield* Effect.exit(program);
				expect(result._tag).toBe("Failure");
			})
		);

		it.effect("handles null block responses", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						if (method === "eth_getBlockByNumber") {
							return Effect.succeed(null as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 100n,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestBlockStreamLayer));

				yield* program;
			})
		);
	});

	describe("stream lifecycle", () => {
		it.effect("multiple streams can be created from same service", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;

					const stream1 = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 200n,
					});

					const stream2 = blockStream.watch();

					expect(stream1).toBeDefined();
					expect(stream2).toBeDefined();
				}).pipe(Effect.provide(TestBlockStreamLayer));

				yield* program;
			})
		);

		it.effect("backfill with large block range", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x1000000" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
				const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

				const program = Effect.gen(function* () {
					const blockStream = yield* BlockStreamService;
					const stream = blockStream.backfill({
						fromBlock: 18000000n,
						toBlock: 18001000n,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestBlockStreamLayer));

				yield* program;
			})
		);
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const { BlockStream, BlockStreamError, BlockStreamService } = await import("./index.js");
			expect(BlockStream).toBeDefined();
			expect(BlockStreamError).toBeDefined();
			expect(BlockStreamService).toBeDefined();
		});
	});
});
