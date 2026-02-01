/**
 * Create a TransactionStream instance
 *
 * @param {TransactionStreamConstructorOptions} options
 * @returns {TransactionStreamInstance}
 *
 * @example
 * ```typescript
 * const stream = TransactionStream({ provider });
 *
 * // Watch pending transactions
 * for await (const event of stream.watchPending({ filter: { to: usdcAddress } })) {
 *   console.log(`Pending: ${event.transaction.hash}`);
 * }
 *
 * // Track specific transaction
 * for await (const event of stream.track(txHash)) {
 *   if (event.type === 'confirmed') {
 *     console.log(`Confirmed!`);
 *     break;
 *   }
 * }
 * ```
 */
export function TransactionStream(options: TransactionStreamConstructorOptions): TransactionStreamInstance;
export type TransactionStreamConstructorOptions = import("./TransactionStreamType.js").TransactionStreamConstructorOptions;
export type TransactionStreamInstance = import("./TransactionStreamType.js").TransactionStream;
export type WatchPendingOptions = import("./TransactionStreamType.js").WatchPendingOptions;
export type WatchConfirmedOptions = import("./TransactionStreamType.js").WatchConfirmedOptions;
export type TrackOptions = import("./TransactionStreamType.js").TrackOptions;
export type PendingTransactionEvent = import("./TransactionStreamType.js").PendingTransactionEvent;
export type ConfirmedTransactionEvent = import("./TransactionStreamType.js").ConfirmedTransactionEvent;
export type TransactionStreamEvent = import("./TransactionStreamType.js").TransactionStreamEvent;
export type PendingTransaction = import("./TransactionStreamType.js").PendingTransaction;
export type ConfirmedTransaction = import("./TransactionStreamType.js").ConfirmedTransaction;
export type TransactionFilter = import("./TransactionStreamType.js").TransactionFilter;
//# sourceMappingURL=TransactionStream.d.ts.map