/**
 * @fileoverview TransactionStream service definition for Effect-native transaction streaming.
 *
 * @module TransactionStreamService
 * @since 0.2.13
 *
 * @description
 * Provides Effect Stream integration for watching and tracking transactions.
 * Wraps voltaire core's TransactionStream for fiber-safe, composable streaming.
 *
 * @see {@link TransactionStream} - The live implementation layer
 * @see {@link TransportService} - Required dependency
 */

import type {
	ConfirmedTransactionEvent,
	PendingTransactionEvent,
	TrackOptions,
	TransactionStreamEvent,
	WatchConfirmedOptions,
	WatchPendingOptions,
} from "@tevm/voltaire/transaction";
import * as Context from "effect/Context";
import type * as Stream from "effect/Stream";
import type { TransactionStreamError } from "./TransactionStreamError.js";

/**
 * Shape of the TransactionStream service.
 *
 * @since 0.2.13
 */
export type TransactionStreamShape = {
	/**
	 * Watch for pending transactions in the mempool.
	 *
	 * @example
	 * ```typescript
	 * const program = Effect.gen(function* () {
	 *   const stream = yield* TransactionStreamService;
	 *   yield* Stream.runForEach(
	 *     stream.watchPending({ filter: { to: usdcAddress } }),
	 *     (event) => Effect.log(`Pending: ${event.transaction.hash}`)
	 *   );
	 * });
	 * ```
	 */
	readonly watchPending: (
		options?: WatchPendingOptions,
	) => Stream.Stream<PendingTransactionEvent, TransactionStreamError>;

	/**
	 * Watch for confirmed transactions.
	 *
	 * @example
	 * ```typescript
	 * const program = Effect.gen(function* () {
	 *   const stream = yield* TransactionStreamService;
	 *   yield* Stream.runForEach(
	 *     stream.watchConfirmed({ filter: { from: myAddress }, confirmations: 3 }),
	 *     (event) => Effect.log(`Confirmed: ${event.transaction.hash}`)
	 *   );
	 * });
	 * ```
	 */
	readonly watchConfirmed: (
		options?: WatchConfirmedOptions,
	) => Stream.Stream<ConfirmedTransactionEvent, TransactionStreamError>;

	/**
	 * Track a specific transaction through its lifecycle.
	 *
	 * @example
	 * ```typescript
	 * const program = Effect.gen(function* () {
	 *   const stream = yield* TransactionStreamService;
	 *   yield* Stream.runForEach(
	 *     stream.track(txHash, { confirmations: 3 }),
	 *     (event) => {
	 *       if (event.type === 'confirmed') {
	 *         return Effect.log(`Confirmed in block ${event.transaction.blockNumber}`);
	 *       }
	 *       if (event.type === 'dropped') {
	 *         return Effect.log(`Dropped: ${event.reason}`);
	 *       }
	 *       return Effect.log(`Pending...`);
	 *     }
	 *   );
	 * });
	 * ```
	 */
	readonly track: (
		txHash: Uint8Array | string,
		options?: TrackOptions,
	) => Stream.Stream<TransactionStreamEvent, TransactionStreamError>;
};

/**
 * TransactionStream service for Effect-native transaction streaming.
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
 *
 *   yield* Stream.runForEach(
 *     txStream.watchConfirmed({ confirmations: 3 }),
 *     (event) => Effect.log(`Confirmed: ${event.transaction.hash}`)
 *   );
 * }).pipe(
 *   Effect.provide(TransactionStream),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * );
 * ```
 */
export class TransactionStreamService extends Context.Tag(
	"TransactionStreamService",
)<TransactionStreamService, TransactionStreamShape>() {}
