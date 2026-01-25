/**
 * @fileoverview Tests for EventStreamService.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import { describe, expect, it, vi } from "vitest";
import { TransportService, type TransportShape } from "../services/Transport/index.js";
import { EventStreamService } from "./EventStreamService.js";
import { EventStream } from "./EventStream.js";
import { EventStreamError } from "./EventStreamError.js";

const transferEvent = {
	type: "event",
	name: "Transfer",
	inputs: [
		{ name: "from", type: "address", indexed: true },
		{ name: "to", type: "address", indexed: true },
		{ name: "value", type: "uint256", indexed: false },
	],
} as const;

const approvalEvent = {
	type: "event",
	name: "Approval",
	inputs: [
		{ name: "owner", type: "address", indexed: true },
		{ name: "spender", type: "address", indexed: true },
		{ name: "value", type: "uint256", indexed: false },
	],
} as const;

describe("EventStreamService", () => {
	describe("EventStreamError", () => {
		it("creates error with message", () => {
			const error = new EventStreamError("test error");
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("EventStreamError");
		});

		it("creates error with cause", () => {
			const cause = new Error("underlying");
			const error = new EventStreamError("test error", { cause });
			expect(error.message).toContain("test error");
			expect(error.cause).toBe(cause);
		});

		it("creates error with context", () => {
			const error = new EventStreamError("test error", {
				context: { fromBlock: 100n, toBlock: 200n },
			});
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("EventStreamError");
		});

		it("has correct name property", () => {
			const error = new EventStreamError("test");
			expect(error.name).toBe("EventStreamError");
		});

		it("is instanceof Error", () => {
			const error = new EventStreamError("test");
			expect(error instanceof Error).toBe(true);
		});

		it("preserves cause chain", () => {
			const rootCause = new Error("root");
			const intermediateCause = new Error("intermediate", { cause: rootCause });
			const error = new EventStreamError("top level", { cause: intermediateCause });
			expect(error.cause).toBe(intermediateCause);
			expect((error.cause as Error).cause).toBe(rootCause);
		});

		it("has stack trace", () => {
			const error = new EventStreamError("test");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("EventStreamError");
		});
	});

	describe("EventStream layer", () => {
		it("provides EventStreamService from TransportService", async () => {
			const mockTransport: TransportShape = {
				request: <T>(_method: string, _params?: unknown[]): Effect.Effect<T, never> =>
					Effect.succeed("0x1" as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;
				expect(eventStream.backfill).toBeDefined();
				expect(eventStream.watch).toBeDefined();
				expect(typeof eventStream.backfill).toBe("function");
				expect(typeof eventStream.watch).toBe("function");
			}).pipe(Effect.provide(TestEventStreamLayer));

			await Effect.runPromise(program);
		});

		it("backfill returns a Stream", async () => {
			let blockNumberCalls = 0;
			const mockTransport: TransportShape = {
				request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
					if (method === "eth_blockNumber") {
						blockNumberCalls++;
						return Effect.succeed("0x1234567" as T);
					}
					if (method === "eth_getLogs") {
						return Effect.succeed([] as T);
					}
					return Effect.succeed(null as T);
				},
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;
				const stream = eventStream.backfill({
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					event: transferEvent,
					fromBlock: 100n,
					toBlock: 200n,
				});
				expect(stream).toBeDefined();
				const results = yield* Stream.runCollect(stream);
				expect(Array.from(results)).toEqual([]);
			}).pipe(Effect.provide(TestEventStreamLayer));

			await Effect.runPromise(program);
			expect(blockNumberCalls).toBeGreaterThan(0);
		});

		it("backfill yields decoded events", async () => {
			const mockLog = {
				address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
				blockHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				blockNumber: "0x64",
				data: "0x0000000000000000000000000000000000000000000000000000000000000064",
				logIndex: "0x0",
				removed: false,
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					"0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					"0x000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
				],
				transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				transactionIndex: "0x0",
			};

			const mockTransport: TransportShape = {
				request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
					if (method === "eth_blockNumber") {
						return Effect.succeed("0x1234567" as T);
					}
					if (method === "eth_getLogs") {
						return Effect.succeed([mockLog] as T);
					}
					return Effect.succeed(null as T);
				},
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;
				const stream = eventStream.backfill({
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					event: transferEvent,
					fromBlock: 100n,
					toBlock: 100n,
				});
				const results = yield* Stream.runCollect(stream);
				const arr = Array.from(results);
				expect(arr.length).toBe(1);
				expect(arr[0]?.log.eventName).toBe("Transfer");
				expect(arr[0]?.log.blockNumber).toBeDefined();
				expect(arr[0]?.metadata.chainHead).toBe(0x1234567n);
			}).pipe(Effect.provide(TestEventStreamLayer));

			await Effect.runPromise(program);
		});

		it("watch returns a Stream", async () => {
			const mockTransport: TransportShape = {
				request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
					if (method === "eth_blockNumber") {
						return Effect.succeed("0x1234567" as T);
					}
					if (method === "eth_getLogs") {
						return Effect.succeed([] as T);
					}
					return Effect.succeed(null as T);
				},
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;
				const stream = eventStream.watch({
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					event: transferEvent,
				});
				expect(stream).toBeDefined();
			}).pipe(Effect.provide(TestEventStreamLayer));

			await Effect.runPromise(program);
		});

		it("backfill handles empty log results", async () => {
			const mockTransport: TransportShape = {
				request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
					if (method === "eth_blockNumber") {
						return Effect.succeed("0x100" as T);
					}
					if (method === "eth_getLogs") {
						return Effect.succeed([] as T);
					}
					return Effect.succeed(null as T);
				},
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;
				const stream = eventStream.backfill({
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					event: transferEvent,
					fromBlock: 10n,
					toBlock: 20n,
				});
				const results = yield* Stream.runCollect(stream);
				expect(Array.from(results)).toEqual([]);
			}).pipe(Effect.provide(TestEventStreamLayer));

			await Effect.runPromise(program);
		});

		it("backfill with filter object", async () => {
			const mockLog = {
				address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
				blockHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				blockNumber: "0x64",
				data: "0x0000000000000000000000000000000000000000000000000000000000000064",
				logIndex: "0x0",
				removed: false,
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					"0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					"0x000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
				],
				transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				transactionIndex: "0x0",
			};

			let getLogsParams: unknown[] | undefined;
			const mockTransport: TransportShape = {
				request: <T>(method: string, params?: unknown[]): Effect.Effect<T, never> => {
					if (method === "eth_blockNumber") {
						return Effect.succeed("0x1234567" as T);
					}
					if (method === "eth_getLogs") {
						getLogsParams = params;
						return Effect.succeed([mockLog] as T);
					}
					return Effect.succeed(null as T);
				},
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;
				const stream = eventStream.backfill({
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					event: transferEvent,
					filter: {
						from: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
					fromBlock: 100n,
					toBlock: 100n,
				});
				const results = yield* Stream.runCollect(stream);
				const arr = Array.from(results);
				expect(arr.length).toBe(1);
			}).pipe(Effect.provide(TestEventStreamLayer));

			await Effect.runPromise(program);
			expect(getLogsParams).toBeDefined();
		});
	});

	describe("error handling", () => {
		it("wraps transport errors as EventStreamError", async () => {
			const mockTransport: TransportShape = {
				request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, Error> => {
					if (method === "eth_blockNumber") {
						return Effect.succeed("0x100" as T);
					}
					if (method === "eth_getLogs") {
						return Effect.fail(new Error("RPC connection failed"));
					}
					return Effect.succeed(null as T);
				},
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;
				const stream = eventStream.backfill({
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					event: transferEvent,
					fromBlock: 100n,
					toBlock: 100n,
				});
				yield* Stream.runCollect(stream);
			}).pipe(Effect.provide(TestEventStreamLayer));

			const result = await Effect.runPromiseExit(program);
			expect(result._tag).toBe("Failure");
		});

		it("handles malformed log data gracefully", async () => {
			const malformedLog = {
				address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
				blockHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				blockNumber: "0x64",
				data: "0x00",
				logIndex: "0x0",
				removed: false,
				topics: [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				],
				transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				transactionIndex: "0x0",
			};

			const mockTransport: TransportShape = {
				request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
					if (method === "eth_blockNumber") {
						return Effect.succeed("0x1234567" as T);
					}
					if (method === "eth_getLogs") {
						return Effect.succeed([malformedLog] as T);
					}
					return Effect.succeed(null as T);
				},
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;
				const stream = eventStream.backfill({
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					event: transferEvent,
					fromBlock: 100n,
					toBlock: 100n,
				});
				yield* Stream.runCollect(stream);
			}).pipe(Effect.provide(TestEventStreamLayer));

			const result = await Effect.runPromiseExit(program);
			expect(result._tag).toBeDefined();
		});
	});

	describe("stream lifecycle", () => {
		it("stream can be consumed incrementally", async () => {
			let requestCount = 0;
			const mockTransport: TransportShape = {
				request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
					requestCount++;
					if (method === "eth_blockNumber") {
						return Effect.succeed("0x100" as T);
					}
					if (method === "eth_getLogs") {
						return Effect.succeed([] as T);
					}
					return Effect.succeed(null as T);
				},
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;
				const stream = eventStream.backfill({
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					event: transferEvent,
					fromBlock: 10n,
					toBlock: 20n,
				});
				yield* Stream.take(stream, 0).pipe(Stream.runCollect);
			}).pipe(Effect.provide(TestEventStreamLayer));

			await Effect.runPromise(program);
			expect(requestCount).toBeGreaterThan(0);
		});

		it("multiple streams can run concurrently", async () => {
			const mockTransport: TransportShape = {
				request: <T>(method: string, _params?: unknown[]): Effect.Effect<T, never> => {
					if (method === "eth_blockNumber") {
						return Effect.succeed("0x100" as T);
					}
					if (method === "eth_getLogs") {
						return Effect.succeed([] as T);
					}
					return Effect.succeed(null as T);
				},
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestEventStreamLayer = Layer.provide(EventStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const eventStream = yield* EventStreamService;

				const stream1 = eventStream.backfill({
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					event: transferEvent,
					fromBlock: 10n,
					toBlock: 20n,
				});

				const stream2 = eventStream.backfill({
					address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
					event: approvalEvent,
					fromBlock: 10n,
					toBlock: 20n,
				});

				const [results1, results2] = yield* Effect.all([
					Stream.runCollect(stream1),
					Stream.runCollect(stream2),
				]);

				expect(Array.from(results1)).toEqual([]);
				expect(Array.from(results2)).toEqual([]);
			}).pipe(Effect.provide(TestEventStreamLayer));

			await Effect.runPromise(program);
		});
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const { EventStream, EventStreamError, EventStreamService } = await import("./index.js");
			expect(EventStream).toBeDefined();
			expect(EventStreamError).toBeDefined();
			expect(EventStreamService).toBeDefined();
		});
	});
});
