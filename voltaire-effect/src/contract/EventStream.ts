/**
 * @fileoverview Live implementation of EventStreamService.
 *
 * @module EventStream
 * @since 0.3.0
 *
 * @description
 * Provides the live implementation layer for EventStreamService.
 * Creates an EIP-1193 provider from TransportService and wraps core EventStream.
 */

import type { BrandedAbi } from "@tevm/voltaire";
import {
	type BackfillOptions,
	EventStream as CoreEventStream,
	type EventStreamResult,
	type WatchOptions,
} from "@tevm/voltaire/contract";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Runtime from "effect/Runtime";

type EventType = BrandedAbi.Event.EventType;

import * as Stream from "effect/Stream";
import { TransportService } from "../services/Transport/TransportService.js";
import { EventStreamError } from "./EventStreamError.js";
import {
	type BackfillStreamOptions,
	EventStreamService,
	type WatchStreamOptions,
} from "./EventStreamService.js";

/**
 * Wraps an AsyncGenerator as an Effect Stream.
 */
const fromAsyncGenerator = <T>(
	makeGenerator: () => AsyncGenerator<T>,
): Stream.Stream<T, EventStreamError> =>
	Stream.fromAsyncIterable(
		{ [Symbol.asyncIterator]: makeGenerator },
		(error) =>
			new EventStreamError(
				error instanceof Error ? error.message : "EventStream error",
				{ cause: error instanceof Error ? error : undefined },
			),
	);

/**
 * Live implementation of EventStreamService.
 *
 * @since 0.3.0
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect';
 * import { EventStreamService, EventStream, HttpTransport } from 'voltaire-effect/contract';
 *
 * const program = Effect.gen(function* () {
 *   const eventStream = yield* EventStreamService;
 *   yield* Stream.runForEach(
 *     eventStream.backfill({
 *       address: '0x...',
 *       event: transferEvent,
 *       fromBlock: 18000000n,
 *       toBlock: 18001000n
 *     }),
 *     ({ log }) => Effect.log(`Event: ${log.eventName}`)
 *   );
 * }).pipe(
 *   Effect.provide(EventStream),
 *   Effect.provide(HttpTransport('https://...'))
 * );
 * ```
 */
export const EventStream: Layer.Layer<
	EventStreamService,
	never,
	TransportService
> = Layer.effect(
	EventStreamService,
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

		return {
			backfill: <TEvent extends EventType>(
				options: BackfillStreamOptions<TEvent>,
			): Stream.Stream<EventStreamResult<TEvent>, EventStreamError> => {
				const { address, event, filter, ...backfillOptions } = options;
				const coreStream = CoreEventStream({
					provider: provider as any,
					address,
					event,
					filter,
				});
				return fromAsyncGenerator(() =>
					coreStream.backfill(backfillOptions as BackfillOptions),
				);
			},

			watch: <TEvent extends EventType>(
				options: WatchStreamOptions<TEvent>,
			): Stream.Stream<EventStreamResult<TEvent>, EventStreamError> => {
				const { address, event, filter, ...watchOptions } = options;
				const coreStream = CoreEventStream({
					provider: provider as any,
					address,
					event,
					filter,
				});
				return fromAsyncGenerator(() =>
					coreStream.watch(watchOptions as WatchOptions),
				);
			},
		};
	}),
);
