/**
 * @fileoverview TransactionStream module exports for Effect-native transaction streaming.
 *
 * @module transaction
 * @since 0.2.13
 *
 * @description
 * Effect wrapper for voltaire core's TransactionStream for watching and tracking transactions.
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect';
 * import { TransactionStreamService, TransactionStream, HttpTransport } from 'voltaire-effect';
 *
 * const program = Effect.gen(function* () {
 *   const stream = yield* TransactionStreamService;
 *   yield* Stream.runForEach(
 *     stream.watchConfirmed({ confirmations: 3 }),
 *     (event) => Effect.log(`Confirmed: ${event.transaction.hash}`)
 *   );
 * }).pipe(
 *   Effect.provide(TransactionStream),
 *   Effect.provide(HttpTransport('https://...'))
 * );
 * ```
 */

export { TransactionStream } from "./TransactionStream.js";
export { TransactionStreamError } from "./TransactionStreamError.js";
export {
	TransactionStreamService,
	type TransactionStreamShape,
} from "./TransactionStreamService.js";
