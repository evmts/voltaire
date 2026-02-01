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
import {
	TransactionStreamService,
	type TransactionStreamShape,
} from "./TransactionStreamService.js";

/**
 * Wraps an AsyncGenerator as an Effect Stream with cleanup on interruption.
 */
const fromAsyncGeneratorWithCleanup = <T>(
	makeGenerator: () => AsyncGenerator<T>,
	cleanup: () => void,
): Stream.Stream<T, TransactionStreamError> =>
	Stream.acquireRelease(
		Effect.sync(() => makeGenerator()),
		() => Effect.sync(cleanup),
	).pipe(
		Stream.flatMap((generator) =>
			Stream.fromAsyncIterable(
				{ [Symbol.asyncIterator]: () => generator },
				(error) =>
					new TransactionStreamError(
						error instanceof Error ? error.message : "TransactionStream error",
						{ cause: error instanceof Error ? error : undefined },
					),
			),
		),
	);

/**
 * Build a TransactionStream directly from TransportService without a service layer.
 */
export const makeTransactionStream = (): Effect.Effect<
	TransactionStreamShape,
	never,
	TransportService
> =>
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

		const cleanup = () => {
			(coreStream as unknown as { destroy?: () => void }).destroy?.();
		};

		return {
			watchPending: (
				options?: WatchPendingOptions,
			): Stream.Stream<PendingTransactionEvent, TransactionStreamError> =>
				fromAsyncGeneratorWithCleanup(
					() => coreStream.watchPending(options),
					cleanup,
				),

			watchConfirmed: (
				options?: WatchConfirmedOptions,
			): Stream.Stream<ConfirmedTransactionEvent, TransactionStreamError> =>
				fromAsyncGeneratorWithCleanup(
					() => coreStream.watchConfirmed(options),
					cleanup,
				),

			track: (
				txHash: Uint8Array | string,
				options?: TrackOptions,
			): Stream.Stream<TransactionStreamEvent, TransactionStreamError> =>
				fromAsyncGeneratorWithCleanup(
					() => coreStream.track(txHash as `0x${string}`, options),
					cleanup,
				),
		};
	});

/**
 * Live implementation of TransactionStreamService.
 *
 * @since 0.2.13
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect';
 * import { makeTransactionStream, HttpTransport } from 'voltaire-effect/services';
 *
 * const program = Effect.gen(function* () {
 *   const txStream = yield* makeTransactionStream();
 *   yield* Stream.runForEach(
 *     txStream.watchConfirmed({ confirmations: 3 }),
 *     (event) => Effect.log(`Confirmed: ${event.transaction.hash}`)
 *   );
 * }).pipe(
 *   Effect.provide(HttpTransport('https://...'))
 * );
 * ```
 */
export const TransactionStream: Layer.Layer<
	TransactionStreamService,
	never,
	TransportService
> = Layer.effect(TransactionStreamService, makeTransactionStream());
