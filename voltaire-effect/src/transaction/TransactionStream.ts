/**
 * @fileoverview Live implementation of TransactionStreamService.
 *
 * @module TransactionStream
 * @since 0.2.13
 *
 * @description
 * Provides the live implementation layer for TransactionStreamService.
 * Creates an EIP-1193 provider from TransportService and wraps core TransactionStream.
 */

import {
	type ConfirmedTransactionEvent,
	TransactionStream as CoreTransactionStream,
	type PendingTransactionEvent,
	type TrackOptions,
	type TransactionStreamEvent,
	type WatchConfirmedOptions,
	type WatchPendingOptions,
} from "@tevm/voltaire/transaction";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Runtime from "effect/Runtime";
import * as Stream from "effect/Stream";
import { TransportService } from "../services/Transport/TransportService.js";
import { TransactionStreamError } from "./TransactionStreamError.js";
import { TransactionStreamService } from "./TransactionStreamService.js";

/**
 * Wraps an AsyncGenerator as an Effect Stream.
 */
const fromAsyncGenerator = <T>(
	makeGenerator: () => AsyncGenerator<T>,
): Stream.Stream<T, TransactionStreamError> =>
	Stream.fromAsyncIterable(
		{ [Symbol.asyncIterator]: makeGenerator },
		(error) =>
			new TransactionStreamError(
				error instanceof Error ? error.message : "TransactionStream error",
				{ cause: error instanceof Error ? error : undefined },
			),
	);

/**
 * Live implementation of TransactionStreamService.
 *
 * @since 0.2.13
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect';
 * import { TransactionStreamService, TransactionStream, HttpTransport } from 'voltaire-effect/services';
 *
 * const program = Effect.gen(function* () {
 *   const txStream = yield* TransactionStreamService;
 *   yield* Stream.runForEach(
 *     txStream.watchConfirmed({ confirmations: 3 }),
 *     (event) => Effect.log(`Confirmed: ${event.transaction.hash}`)
 *   );
 * }).pipe(
 *   Effect.provide(TransactionStream),
 *   Effect.provide(HttpTransport('https://...'))
 * );
 * ```
 */
export const TransactionStream: Layer.Layer<
	TransactionStreamService,
	never,
	TransportService
> = Layer.effect(
	TransactionStreamService,
	Effect.gen(function* () {
		const transport = yield* TransportService;
		const runtime = yield* Effect.runtime();
		const runPromise = Runtime.runPromise(runtime);

		const provider = {
			request: async ({
				method,
				params,
			}: {
				method: string;
				params?: unknown[];
			}) => runPromise(transport.request(method, params)),
			on: () => {},
			removeListener: () => {},
		};

		const coreStream = CoreTransactionStream({
			// biome-ignore lint/suspicious/noExplicitAny: EIP-1193 provider type mismatch with core implementation
			provider: provider as any,
		});

		return {
			watchPending: (
				options?: WatchPendingOptions,
			): Stream.Stream<PendingTransactionEvent, TransactionStreamError> =>
				fromAsyncGenerator(() => coreStream.watchPending(options)),

			watchConfirmed: (
				options?: WatchConfirmedOptions,
			): Stream.Stream<ConfirmedTransactionEvent, TransactionStreamError> =>
				fromAsyncGenerator(() => coreStream.watchConfirmed(options)),

			track: (
				txHash: Uint8Array | string,
				options?: TrackOptions,
			): Stream.Stream<TransactionStreamEvent, TransactionStreamError> =>
				fromAsyncGenerator(() =>
					coreStream.track(txHash as `0x${string}`, options),
				),
		};
	}),
);
