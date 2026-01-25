/**
 * @fileoverview EventStream service definition for Effect-native event streaming.
 *
 * @module EventStreamService
 * @since 0.3.0
 *
 * @description
 * Provides Effect Stream integration for watching contract events.
 * Wraps voltaire core's EventStream for fiber-safe, composable event streaming.
 *
 * @see {@link EventStream} - The live implementation layer
 * @see {@link TransportService} - Required dependency
 */

import type {
	BackfillOptions,
	EventStreamResult,
	WatchOptions,
	EventStreamConstructorOptions,
} from "@tevm/voltaire/contract";
import type { BrandedAbi } from "@tevm/voltaire";
import * as Context from "effect/Context";
import type * as Stream from "effect/Stream";

type EventType = BrandedAbi.Event.EventType;
import type { EventStreamError } from "./EventStreamError.js";

/**
 * Options for backfill with address and event included
 */
export interface BackfillStreamOptions<TEvent extends EventType>
	extends Omit<EventStreamConstructorOptions<TEvent>, "provider">,
		BackfillOptions {}

/**
 * Options for watch with address and event included
 */
export interface WatchStreamOptions<TEvent extends EventType>
	extends Omit<EventStreamConstructorOptions<TEvent>, "provider">,
		WatchOptions {}

/**
 * Shape of the EventStream service.
 *
 * @since 0.3.0
 */
export type EventStreamShape = {
	/**
	 * Backfill historical events within a block range.
	 *
	 * @example
	 * ```typescript
	 * const program = Effect.gen(function* () {
	 *   const stream = yield* EventStreamService;
	 *   yield* Stream.runForEach(
	 *     stream.backfill({
	 *       address: '0x...',
	 *       event: transferEvent,
	 *       fromBlock: 18000000n,
	 *       toBlock: 18001000n
	 *     }),
	 *     ({ log }) => Effect.log(`Got event: ${log.eventName}`)
	 *   );
	 * });
	 * ```
	 */
	readonly backfill: <TEvent extends EventType>(
		options: BackfillStreamOptions<TEvent>,
	) => Stream.Stream<EventStreamResult<TEvent>, EventStreamError>;

	/**
	 * Watch for new events by polling.
	 *
	 * @example
	 * ```typescript
	 * const program = Effect.gen(function* () {
	 *   const stream = yield* EventStreamService;
	 *   yield* Stream.runForEach(
	 *     stream.watch({
	 *       address: '0x...',
	 *       event: approvalEvent
	 *     }),
	 *     ({ log }) => Effect.log(`New event: ${log.eventName}`)
	 *   );
	 * });
	 * ```
	 */
	readonly watch: <TEvent extends EventType>(
		options: WatchStreamOptions<TEvent>,
	) => Stream.Stream<EventStreamResult<TEvent>, EventStreamError>;
};

/**
 * EventStream service for Effect-native contract event streaming.
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
 *
 *   yield* Stream.runForEach(
 *     eventStream.backfill({
 *       address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *       event: transferEvent,
 *       fromBlock: 18000000n,
 *       toBlock: 18001000n
 *     }),
 *     ({ log }) => Effect.log(`Transfer: ${log.args.value}`)
 *   );
 * }).pipe(
 *   Effect.provide(EventStream),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * );
 * ```
 */
export class EventStreamService extends Context.Tag("EventStreamService")<
	EventStreamService,
	EventStreamShape
>() {}
