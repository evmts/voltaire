/**
 * @fileoverview BlockStream module exports for Effect-native block streaming.
 *
 * @module BlockStream
 * @since 0.2.12
 *
 * @description
 * Effect wrapper for voltaire core's BlockStream with reorg support.
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect';
 * import { makeBlockStream, HttpTransport } from 'voltaire-effect/services';
 *
 * const program = Effect.gen(function* () {
 *   const stream = yield* makeBlockStream();
 *   yield* Stream.runForEach(
 *     stream.watch({ include: 'transactions' }),
 *     (event) => Effect.log(`Event: ${event.type}`)
 *   );
 * }).pipe(
 *   Effect.provide(HttpTransport('https://...'))
 * );
 * ```
 */

export { BlockStream, makeBlockStream } from "./BlockStream.js";
export { BlockStreamError } from "./BlockStreamError.js";
export {
	BlockStreamService,
	type BlockStreamShape,
} from "./BlockStreamService.js";
