/**
 * @fileoverview Tests for EventStreamService.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import { describe, expect, it } from "vitest";
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
