/**
 * @fileoverview Tests for TransactionStreamService.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import { describe, expect, it } from "@effect/vitest";
import {
	TransportService,
	type TransportShape,
} from "../services/Transport/index.js";
import { TransactionStream } from "./TransactionStream.js";
import { TransactionStreamError } from "./TransactionStreamError.js";
import { TransactionStreamService } from "./TransactionStreamService.js";

describe("TransactionStreamService", () => {
	describe("TransactionStreamError", () => {
		it("creates error with message", () => {
			const error = new TransactionStreamError("test error");
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("TransactionStreamError");
		});

		it("creates error with cause", () => {
			const cause = new Error("underlying");
			const error = new TransactionStreamError("test error", { cause });
			expect(error.message).toContain("test error");
			expect(error.cause).toBe(cause);
		});

		it("creates error with context", () => {
			const error = new TransactionStreamError("test error", {
				context: { txHash: "0x123", confirmations: 3 },
			});
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("TransactionStreamError");
		});

		it("has correct name property", () => {
			const error = new TransactionStreamError("test");
			expect(error.name).toBe("TransactionStreamError");
		});

		it("is instanceof Error", () => {
			const error = new TransactionStreamError("test");
			expect(error instanceof Error).toBe(true);
		});

		it("preserves cause chain", () => {
			const rootCause = new Error("root");
			const intermediateCause = new Error("intermediate", { cause: rootCause });
			const error = new TransactionStreamError("top level", { cause: intermediateCause });
			expect(error.cause).toBe(intermediateCause);
			expect((error.cause as Error).cause).toBe(rootCause);
		});

		it("has stack trace", () => {
			const error = new TransactionStreamError("test");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("TransactionStreamError");
		});

		it("handles empty message", () => {
			const error = new TransactionStreamError("");
			expect(error.message).toBe("");
			expect(error._tag).toBe("TransactionStreamError");
		});

		it("handles long error messages", () => {
			const longMessage = "x".repeat(10000);
			const error = new TransactionStreamError(longMessage);
			expect(error.message).toBe(longMessage);
		});
	});

	describe("TransactionStream layer", () => {
		it("provides TransactionStreamService from TransportService", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, never> => Effect.succeed("0x1" as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				expect(txStream.watchPending).toBeDefined();
				expect(txStream.watchConfirmed).toBeDefined();
				expect(txStream.track).toBeDefined();
				expect(typeof txStream.watchPending).toBe("function");
				expect(typeof txStream.watchConfirmed).toBe("function");
				expect(typeof txStream.track).toBe("function");
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			await Effect.runPromise(program);
		});

		it("watchPending returns a stream", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, never> => Effect.succeed([] as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				const stream = txStream.watchPending();
				expect(stream).toBeDefined();
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			await Effect.runPromise(program);
		});

		it("watchConfirmed returns a stream", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, never> => Effect.succeed("0x1" as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				const stream = txStream.watchConfirmed({ confirmations: 3 });
				expect(stream).toBeDefined();
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			await Effect.runPromise(program);
		});

		it("track returns a stream", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, never> => Effect.succeed(null as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				const stream = txStream.track(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				);
				expect(stream).toBeDefined();
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			await Effect.runPromise(program);
		});

		it("watchPending with options", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, never> => Effect.succeed([] as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				const stream = txStream.watchPending({
					filter: { to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
				});
				expect(stream).toBeDefined();
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			await Effect.runPromise(program);
		});

		it("watchConfirmed with custom confirmations", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, never> => Effect.succeed("0x1" as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				const stream1 = txStream.watchConfirmed({ confirmations: 1 });
				const stream12 = txStream.watchConfirmed({ confirmations: 12 });
				expect(stream1).toBeDefined();
				expect(stream12).toBeDefined();
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			await Effect.runPromise(program);
		});

		it("track with options", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, never> => Effect.succeed(null as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				const stream = txStream.track(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
					{ confirmations: 6 },
				);
				expect(stream).toBeDefined();
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			await Effect.runPromise(program);
		});

		it("track accepts Uint8Array hash", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, never> => Effect.succeed(null as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				const hashBytes = new Uint8Array(32).fill(0x12);
				const stream = txStream.track(hashBytes);
				expect(stream).toBeDefined();
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			await Effect.runPromise(program);
		});
	});

	describe("error handling", () => {
		it("wraps transport errors as TransactionStreamError", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, Error> => Effect.fail(new Error("RPC connection failed")),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				const stream = txStream.track(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				);
				yield* Stream.runCollect(stream);
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			const result = await Effect.runPromiseExit(program);
			expect(result._tag).toBe("Failure");
		});
	});

	describe("stream lifecycle", () => {
		it("multiple streams can be created from same service", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					_method: string,
					_params?: unknown[],
				): Effect.Effect<T, never> => Effect.succeed("0x1" as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestTransactionStreamLayer = Layer.provide(
				TransactionStream,
				TestTransportLayer,
			);

			const program = Effect.gen(function* () {
				const txStream = yield* TransactionStreamService;
				const stream1 = txStream.watchPending();
				const stream2 = txStream.watchConfirmed();
				const stream3 = txStream.track("0x1234567890123456789012345678901234567890123456789012345678901234");
				expect(stream1).toBeDefined();
				expect(stream2).toBeDefined();
				expect(stream3).toBeDefined();
			}).pipe(Effect.provide(TestTransactionStreamLayer));

			await Effect.runPromise(program);
		});
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const {
				TransactionStream,
				TransactionStreamError,
				TransactionStreamService,
			} = await import("./index.js");
			expect(TransactionStream).toBeDefined();
			expect(TransactionStreamError).toBeDefined();
			expect(TransactionStreamService).toBeDefined();
		});
	});
});
