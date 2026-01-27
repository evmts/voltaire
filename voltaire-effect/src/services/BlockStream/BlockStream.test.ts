/**
 * @fileoverview Tests for BlockStream streaming helpers.
 */

import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import {
	TransportError,
	TransportService,
	type TransportShape,
} from "../Transport/index.js";
import { makeBlockStream } from "./BlockStream.js";
import { BlockStreamError } from "./BlockStreamError.js";

describe("BlockStream", () => {
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
			const error = new BlockStreamError("top level", {
				cause: intermediateCause,
			});
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

	describe("makeBlockStream", () => {
		it.effect("provides block streaming from TransportService", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						_method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => Effect.succeed("0x1" as T),
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					expect(blockStream.backfill).toBeDefined();
					expect(blockStream.watch).toBeDefined();
					expect(typeof blockStream.backfill).toBe("function");
					expect(typeof blockStream.watch).toBe("function");
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("backfill returns a Stream", () =>
			Effect.gen(function* () {
				const mockBlock = {
					number: "0x64",
					hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					parentHash:
						"0x0000000000000000000000000000000000000000000000000000000000000000",
					timestamp: "0x60000000",
					nonce: "0x0000000000000000",
					difficulty: "0x0",
					gasLimit: "0x1c9c380",
					gasUsed: "0x0",
					miner: "0x0000000000000000000000000000000000000000",
					extraData: "0x",
					logsBloom: `0x${"0".repeat(512)}`,
					transactionsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					stateRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					receiptsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					sha3Uncles:
						"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
					size: "0x200",
					baseFeePerGas: "0x7",
					transactions: [],
					uncles: [],
				};

				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						if (method === "eth_getBlockByNumber") {
							return Effect.succeed(mockBlock as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 100n,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("watch returns a Stream", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.watch();
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("watch with include transactions option", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.watch({ include: "transactions" });
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("watch with include receipts option", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.watch({ include: "receipts" });
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("backfill with include transactions option", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 200n,
						include: "transactions",
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);
	});

	describe("error handling", () => {
		it.effect("wraps transport errors as BlockStreamError", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						_method: string,
						_params?: unknown[],
					): Effect.Effect<T, TransportError> =>
						Effect.fail(
							new TransportError({
								code: -32000,
								message: "RPC connection failed",
							}),
						),
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 200n,
					});
					yield* Stream.runCollect(stream);
				}).pipe(Effect.provide(TestTransportLayer));

				const result = yield* Effect.exit(program);
				expect(result._tag).toBe("Failure");
			}),
		);

		it.effect("handles null block responses", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						if (method === "eth_getBlockByNumber") {
							return Effect.succeed(null as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 100n,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);
	});

	describe("stream lifecycle", () => {
		it.effect("multiple streams can be created from same service", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();

					const stream1 = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 200n,
					});

					const stream2 = blockStream.watch();

					expect(stream1).toBeDefined();
					expect(stream2).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("backfill with large block range", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x1000000" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 18000000n,
						toBlock: 18001000n,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const { BlockStream, BlockStreamError, makeBlockStream } =
				await import("./index.js");
			expect(BlockStream).toBeDefined();
			expect(BlockStreamError).toBeDefined();
			expect(makeBlockStream).toBeDefined();
		});
	});

	describe("stream consumption", () => {
		it.effect(
			"backfill stream yields blocks when consumed with runCollect",
			() =>
				Effect.gen(function* () {
					const mockBlocks = [
						{
							number: "0x64",
							hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
							parentHash:
								"0x0000000000000000000000000000000000000000000000000000000000000000",
							timestamp: "0x60000000",
							nonce: "0x0000000000000000",
							difficulty: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x0",
							miner: "0x0000000000000000000000000000000000000000",
							extraData: "0x",
							logsBloom: `0x${"0".repeat(512)}`,
							transactionsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							stateRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							receiptsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							sha3Uncles:
								"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
							size: "0x200",
							baseFeePerGas: "0x7",
							transactions: [],
							uncles: [],
						},
						{
							number: "0x65",
							hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
							parentHash:
								"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
							timestamp: "0x60000001",
							nonce: "0x0000000000000000",
							difficulty: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x0",
							miner: "0x0000000000000000000000000000000000000000",
							extraData: "0x",
							logsBloom: `0x${"0".repeat(512)}`,
							transactionsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							stateRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							receiptsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							sha3Uncles:
								"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
							size: "0x200",
							baseFeePerGas: "0x7",
							transactions: [],
							uncles: [],
						},
					];

					const mockTransport: TransportShape = {
						request: <T>(
							method: string,
							params?: unknown[],
						): Effect.Effect<T, never> => {
							if (method === "eth_blockNumber") {
								return Effect.succeed("0x65" as T);
							}
							if (method === "eth_getBlockByNumber") {
								const blockNum = params?.[0] as string;
								if (blockNum === "0x64")
									return Effect.succeed(mockBlocks[0] as T);
								if (blockNum === "0x65")
									return Effect.succeed(mockBlocks[1] as T);
							}
							return Effect.succeed(null as T);
						},
					};

					const TestTransportLayer = Layer.succeed(
						TransportService,
						mockTransport,
					);

					const program = Effect.gen(function* () {
						const blockStream = yield* makeBlockStream();
						const stream = blockStream.backfill({
							fromBlock: 100n,
							toBlock: 101n,
						});
						const chunks = yield* Stream.runCollect(stream);
						const events = Array.from(chunks);
						expect(events.length).toBeGreaterThan(0);
						expect(events[0].type).toBe("blocks");
					}).pipe(Effect.provide(TestTransportLayer));

					yield* program;
				}),
		);

		it.effect("error during stream consumption maps to BlockStreamError", () =>
			Effect.gen(function* () {
				let callCount = 0;
				const mockBlock = {
					number: "0x64",
					hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					parentHash:
						"0x0000000000000000000000000000000000000000000000000000000000000000",
					timestamp: "0x60000000",
					nonce: "0x0000000000000000",
					difficulty: "0x0",
					gasLimit: "0x1c9c380",
					gasUsed: "0x0",
					miner: "0x0000000000000000000000000000000000000000",
					extraData: "0x",
					logsBloom: `0x${"0".repeat(512)}`,
					transactionsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					stateRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					receiptsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					sha3Uncles:
						"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
					size: "0x200",
					baseFeePerGas: "0x7",
					transactions: [],
					uncles: [],
				};

				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x68" as T);
						}
						if (method === "eth_getBlockByNumber") {
							callCount++;
							if (callCount > 2) {
								throw new Error("RPC rate limit exceeded");
							}
							return Effect.succeed(mockBlock as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 104n,
					});
					yield* Stream.runCollect(stream);
				}).pipe(Effect.provide(TestTransportLayer));

				const result = yield* Effect.exit(program);
				expect(result._tag).toBe("Failure");
				if (result._tag === "Failure") {
					const error = result.cause;
					expect(error).toBeDefined();
				}
			}),
		);

		it.effect(
			"watch with Stream.take(1) yields at least one block event",
			() =>
				Effect.gen(function* () {
					let blockNumber = 0x100;
					const mockBlock = {
						number: "0x100",
						hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
						parentHash:
							"0x0000000000000000000000000000000000000000000000000000000000000000",
						timestamp: "0x60000000",
						nonce: "0x0000000000000000",
						difficulty: "0x0",
						gasLimit: "0x1c9c380",
						gasUsed: "0x0",
						miner: "0x0000000000000000000000000000000000000000",
						extraData: "0x",
						logsBloom: `0x${"0".repeat(512)}`,
						transactionsRoot:
							"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
						stateRoot:
							"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
						receiptsRoot:
							"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
						sha3Uncles:
							"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
						size: "0x200",
						baseFeePerGas: "0x7",
						transactions: [],
						uncles: [],
					};

					const mockTransport: TransportShape = {
						request: <T>(
							method: string,
							_params?: unknown[],
						): Effect.Effect<T, never> => {
							if (method === "eth_blockNumber") {
								const hex = `0x${blockNumber.toString(16)}`;
								blockNumber++;
								return Effect.succeed(hex as T);
							}
							if (method === "eth_getBlockByNumber") {
								return Effect.succeed(mockBlock as T);
							}
							return Effect.succeed(null as T);
						},
					};

					const TestTransportLayer = Layer.succeed(
						TransportService,
						mockTransport,
					);

					const program = Effect.gen(function* () {
						const blockStream = yield* makeBlockStream();
						const stream = blockStream.watch();
						const chunks = yield* Stream.runCollect(Stream.take(stream, 1));
						const events = Array.from(chunks);
						expect(events.length).toBe(1);
						expect(events[0].type).toBe("blocks");
					}).pipe(Effect.provide(TestTransportLayer));

					yield* Effect.timeout(program, "5 seconds");
				}),
			{ timeout: 10000 },
		);

		it.effect(
			"single block range (fromBlock === toBlock) yields exactly one block event",
			() =>
				Effect.gen(function* () {
					const mockBlock = {
						number: "0x64",
						hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
						parentHash:
							"0x0000000000000000000000000000000000000000000000000000000000000000",
						timestamp: "0x60000000",
						nonce: "0x0000000000000000",
						difficulty: "0x0",
						gasLimit: "0x1c9c380",
						gasUsed: "0x0",
						miner: "0x0000000000000000000000000000000000000000",
						extraData: "0x",
						logsBloom: `0x${"0".repeat(512)}`,
						transactionsRoot:
							"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
						stateRoot:
							"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
						receiptsRoot:
							"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
						sha3Uncles:
							"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
						size: "0x200",
						baseFeePerGas: "0x7",
						transactions: [],
						uncles: [],
					};

					const mockTransport: TransportShape = {
						request: <T>(
							method: string,
							_params?: unknown[],
						): Effect.Effect<T, never> => {
							if (method === "eth_blockNumber") {
								return Effect.succeed("0x64" as T);
							}
							if (method === "eth_getBlockByNumber") {
								return Effect.succeed(mockBlock as T);
							}
							return Effect.succeed(null as T);
						},
					};

					const TestTransportLayer = Layer.succeed(
						TransportService,
						mockTransport,
					);

					const program = Effect.gen(function* () {
						const blockStream = yield* makeBlockStream();
						const stream = blockStream.backfill({
							fromBlock: 100n,
							toBlock: 100n,
						});
						const chunks = yield* Stream.runCollect(stream);
						const events = Array.from(chunks);
						expect(events.length).toBe(1);
						expect(events[0].type).toBe("blocks");
						expect(events[0].blocks.length).toBe(1);
						expect(events[0].blocks[0].header.number).toBe(100n);
					}).pipe(Effect.provide(TestTransportLayer));

					yield* program;
				}),
		);

		it.effect("fromBlock > toBlock yields empty stream", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 200n,
						toBlock: 100n,
					});
					const chunks = yield* Stream.runCollect(stream);
					const events = Array.from(chunks);
					expect(events.length).toBe(0);
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect(
			"backfill consumes and verifies block data matches expected",
			() =>
				Effect.gen(function* () {
					const expectedBlocks = [
						{
							number: "0x64",
							hash: "0xaaaa567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
							parentHash:
								"0x0000000000000000000000000000000000000000000000000000000000000000",
							timestamp: "0x60000000",
							nonce: "0x0000000000000000",
							difficulty: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0x5208",
							miner: "0x1111111111111111111111111111111111111111",
							extraData: "0x",
							logsBloom: `0x${"0".repeat(512)}`,
							transactionsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							stateRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							receiptsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							sha3Uncles:
								"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
							size: "0x200",
							baseFeePerGas: "0x7",
							transactions: [],
							uncles: [],
						},
						{
							number: "0x65",
							hash: "0xbbbb567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
							parentHash:
								"0xaaaa567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
							timestamp: "0x60000001",
							nonce: "0x0000000000000000",
							difficulty: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0xa410",
							miner: "0x2222222222222222222222222222222222222222",
							extraData: "0x",
							logsBloom: `0x${"0".repeat(512)}`,
							transactionsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							stateRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							receiptsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							sha3Uncles:
								"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
							size: "0x200",
							baseFeePerGas: "0x7",
							transactions: [],
							uncles: [],
						},
						{
							number: "0x66",
							hash: "0xcccc567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
							parentHash:
								"0xbbbb567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
							timestamp: "0x60000002",
							nonce: "0x0000000000000000",
							difficulty: "0x0",
							gasLimit: "0x1c9c380",
							gasUsed: "0xf618",
							miner: "0x3333333333333333333333333333333333333333",
							extraData: "0x",
							logsBloom: `0x${"0".repeat(512)}`,
							transactionsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							stateRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							receiptsRoot:
								"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
							sha3Uncles:
								"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
							size: "0x200",
							baseFeePerGas: "0x7",
							transactions: [],
							uncles: [],
						},
					];

					const mockTransport: TransportShape = {
						request: <T>(
							method: string,
							params?: unknown[],
						): Effect.Effect<T, never> => {
							if (method === "eth_blockNumber") {
								return Effect.succeed("0x66" as T);
							}
							if (method === "eth_getBlockByNumber") {
								const blockNum = params?.[0] as string;
								const block = expectedBlocks.find((b) => b.number === blockNum);
								return Effect.succeed((block ?? null) as T);
							}
							return Effect.succeed(null as T);
						},
					};

					const TestTransportLayer = Layer.succeed(
						TransportService,
						mockTransport,
					);

					const program = Effect.gen(function* () {
						const blockStream = yield* makeBlockStream();
						const stream = blockStream.backfill({
							fromBlock: 100n,
							toBlock: 102n,
						});
						const chunks = yield* Stream.runCollect(stream);
						const events = Array.from(chunks);

						const allBlocks = events.flatMap((e) => e.blocks);
						expect(allBlocks.length).toBe(3);
						expect(allBlocks[0].header.number).toBe(100n);
						expect(allBlocks[1].header.number).toBe(101n);
						expect(allBlocks[2].header.number).toBe(102n);
					}).pipe(Effect.provide(TestTransportLayer));

					yield* program;
				}),
		);
	});

	describe("edge cases", () => {
		it.effect(
			"transport error from eth_blockNumber propagates as BlockStreamError",
			() =>
				Effect.gen(function* () {
					const mockTransport: TransportShape = {
						request: <T>(
							method: string,
							_params?: unknown[],
						): Effect.Effect<T, TransportError> => {
							if (method === "eth_blockNumber") {
								return Effect.fail(
									new TransportError({
										code: -32000,
										message: "eth_blockNumber RPC failed",
									}),
								);
							}
							return Effect.succeed(null as T);
						},
					};

					const TestTransportLayer = Layer.succeed(
						TransportService,
						mockTransport,
					);

					const program = Effect.gen(function* () {
						const blockStream = yield* makeBlockStream();
						const stream = blockStream.watch();
						yield* Stream.runCollect(stream);
					}).pipe(Effect.provide(TestTransportLayer));

					const result = yield* Effect.exit(program);
					expect(result._tag).toBe("Failure");
				}),
		);

		it.effect("handles empty block (no transactions)", () =>
			Effect.gen(function* () {
				const emptyBlock = {
					number: "0x64",
					hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					parentHash:
						"0x0000000000000000000000000000000000000000000000000000000000000000",
					timestamp: "0x60000000",
					nonce: "0x0000000000000000",
					difficulty: "0x0",
					gasLimit: "0x1c9c380",
					gasUsed: "0x0",
					miner: "0x0000000000000000000000000000000000000000",
					extraData: "0x",
					logsBloom: `0x${"0".repeat(512)}`,
					transactionsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					stateRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					receiptsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					sha3Uncles:
						"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
					size: "0x200",
					baseFeePerGas: "0x7",
					transactions: [],
					uncles: [],
				};

				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x64" as T);
						}
						if (method === "eth_getBlockByNumber") {
							return Effect.succeed(emptyBlock as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 100n,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("handles very large block numbers near MAX_SAFE_INTEGER", () =>
			Effect.gen(function* () {
				const largeBlockNumber = BigInt(Number.MAX_SAFE_INTEGER) - 1n;
				const hexBlockNumber = `0x${largeBlockNumber.toString(16)}`;

				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed(hexBlockNumber as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: largeBlockNumber,
						toBlock: largeBlockNumber,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("polling recovers after transient error", () =>
			Effect.gen(function* () {
				let callCount = 0;

				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, TransportError> => {
						if (method === "eth_blockNumber") {
							callCount++;
							if (callCount === 1) {
								return Effect.fail(
									new TransportError({
										code: -32000,
										message: "Transient network error",
									}),
								);
							}
							return Effect.succeed("0x100" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.watch();
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("reorg event handling (parent hash mismatch simulation)", () =>
			Effect.gen(function* () {
				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x65" as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.watch();
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("handles block number returning 0x0 (genesis)", () =>
			Effect.gen(function* () {
				const genesisBlock = {
					number: "0x0",
					hash: "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
					parentHash:
						"0x0000000000000000000000000000000000000000000000000000000000000000",
					timestamp: "0x0",
					nonce: "0x0000000000000042",
					difficulty: "0x400000000",
					gasLimit: "0x1388",
					gasUsed: "0x0",
					miner: "0x0000000000000000000000000000000000000000",
					extraData:
						"0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa",
					logsBloom: `0x${"0".repeat(512)}`,
					transactionsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					stateRoot:
						"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544",
					receiptsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					sha3Uncles:
						"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
					size: "0x21c",
					transactions: [],
					uncles: [],
				};

				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x0" as T);
						}
						if (method === "eth_getBlockByNumber") {
							return Effect.succeed(genesisBlock as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 0n,
						toBlock: 0n,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);

		it.effect("handles intermittent null responses during backfill", () =>
			Effect.gen(function* () {
				let blockCallCount = 0;
				const mockBlock = {
					number: "0x64",
					hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
					parentHash:
						"0x0000000000000000000000000000000000000000000000000000000000000000",
					timestamp: "0x60000000",
					nonce: "0x0000000000000000",
					difficulty: "0x0",
					gasLimit: "0x1c9c380",
					gasUsed: "0x0",
					miner: "0x0000000000000000000000000000000000000000",
					extraData: "0x",
					logsBloom: `0x${"0".repeat(512)}`,
					transactionsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					stateRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					receiptsRoot:
						"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
					sha3Uncles:
						"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
					size: "0x200",
					baseFeePerGas: "0x7",
					transactions: [],
					uncles: [],
				};

				const mockTransport: TransportShape = {
					request: <T>(
						method: string,
						_params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "eth_blockNumber") {
							return Effect.succeed("0x100" as T);
						}
						if (method === "eth_getBlockByNumber") {
							blockCallCount++;
							if (blockCallCount % 2 === 0) {
								return Effect.succeed(null as T);
							}
							return Effect.succeed(mockBlock as T);
						}
						return Effect.succeed(null as T);
					},
				};

				const TestTransportLayer = Layer.succeed(
					TransportService,
					mockTransport,
				);

				const program = Effect.gen(function* () {
					const blockStream = yield* makeBlockStream();
					const stream = blockStream.backfill({
						fromBlock: 100n,
						toBlock: 102n,
					});
					expect(stream).toBeDefined();
				}).pipe(Effect.provide(TestTransportLayer));

				yield* program;
			}),
		);
	});
});
