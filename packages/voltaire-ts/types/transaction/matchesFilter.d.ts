/**
 * Check if transaction matches filter
 * @param {PendingTransaction} tx
 * @param {TransactionFilter | undefined} filter
 * @returns {boolean}
 */
export function matchesFilter(tx: PendingTransaction, filter: TransactionFilter | undefined): boolean;
export type PendingTransaction = import("./TransactionStreamType.js").PendingTransaction;
export type TransactionFilter = import("./TransactionStreamType.js").TransactionFilter;
//# sourceMappingURL=matchesFilter.d.ts.map