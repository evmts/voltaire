/**
 * @fileoverview Tests for TransactionStreamService.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import { describe, expect, it } from "vitest";
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
