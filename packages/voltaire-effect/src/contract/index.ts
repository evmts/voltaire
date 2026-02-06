/**
 * @fileoverview Contract event streaming module exports for voltaire-effect.
 *
 * @module contract
 * @since 0.3.0
 *
 * @description
 * Effect wrapper for voltaire core's EventStream for contract event streaming.
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect';
 * import { makeEventStream, HttpTransport } from 'voltaire-effect';
 *
 * const program = Effect.gen(function* () {
 *   const stream = yield* makeEventStream();
 *   yield* Stream.runForEach(
 *     stream.backfill({
 *       address: '0x...',
 *       event: transferEvent,
 *       fromBlock: 18000000n,
 *       toBlock: 18001000n
 *     }),
 *     ({ log }) => Effect.log(`Event: ${log.eventName}`)
 *   );
 * }).pipe(
 *   Effect.provide(HttpTransport('https://...'))
 * );
 * ```
 */

export { EventStream, makeEventStream } from "./EventStream.js";
export { EventStreamError } from "./EventStreamError.js";
export {
	type BackfillStreamOptions,
	EventStreamService,
	type EventStreamShape,
	type WatchStreamOptions,
} from "./EventStreamService.js";
