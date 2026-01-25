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
 * import { BlockStreamService, BlockStream, HttpTransport } from 'voltaire-effect/services';
 *
 * const program = Effect.gen(function* () {
 *   const stream = yield* BlockStreamService;
 *   yield* Stream.runForEach(
 *     stream.watch({ include: 'transactions' }),
 *     (event) => Effect.log(`Event: ${event.type}`)
 *   );
 * }).pipe(
 *   Effect.provide(BlockStream),
 *   Effect.provide(HttpTransport('https://...'))
 * );
 * ```
 */

export { BlockStream } from "./BlockStream.js";
export { BlockStreamError } from "./BlockStreamError.js";
export { BlockStreamService, type BlockStreamShape } from "./BlockStreamService.js";
