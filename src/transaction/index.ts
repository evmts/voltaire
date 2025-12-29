/**
 * TransactionStream - Watch and track transactions
 *
 * Provides real-time transaction monitoring for pending, confirmed, and dropped transactions.
 *
 * @module transaction
 *
 * @example
 * ```typescript
 * import { TransactionStream } from '@tevm/voltaire/TransactionStream';
 *
 * const stream = TransactionStream({ provider });
 *
 * // Watch pending transactions to USDC
 * for await (const event of stream.watchPending({
 *   filter: { to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
 * })) {
 *   console.log(`Pending tx: ${event.transaction.hash}`);
 * }
 *
 * // Watch confirmed transactions from my wallet
 * for await (const event of stream.watchConfirmed({
 *   filter: { from: myAddress },
 *   confirmations: 3
 * })) {
 *   console.log(`Confirmed: ${event.transaction.receipt.status}`);
 * }
 *
 * // Track a specific transaction through its lifecycle
 * for await (const event of stream.track(txHash)) {
 *   if (event.type === 'pending') {
 *     console.log('Transaction in mempool');
 *   } else if (event.type === 'confirmed') {
 *     console.log(`Confirmed in block ${event.transaction.blockNumber}`);
 *     break;
 *   } else if (event.type === 'dropped') {
 *     console.log(`Dropped: ${event.reason}`);
 *     break;
 *   }
 * }
 * ```
 */

export type {
	TransactionState,
	PendingTransaction,
	ConfirmedTransaction,
	TransactionFilter,
	RetryOptions,
	WatchPendingOptions,
	WatchConfirmedOptions,
	TrackOptions,
	TransactionStreamMetadata,
	PendingTransactionEvent,
	ConfirmedTransactionEvent,
	DroppedTransactionEvent,
	TransactionStreamEvent,
	TransactionStream as TransactionStreamInstance,
	TransactionStreamConstructorOptions,
	TransactionStreamFactory,
} from "./TransactionStreamType.js";

export { TransactionStream } from "./TransactionStream.js";

export {
	TransactionStreamAbortedError,
	TransactionTimeoutError,
	TransactionDroppedError,
} from "./errors.js";
