/**
 * Create PendingTransactionFilter from filter ID
 *
 * @param {import('../FilterId/FilterIdType.js').FilterIdType} filterId - Filter identifier from eth_newPendingTransactionFilter
 * @returns {import('./PendingTransactionFilterType.js').PendingTransactionFilterType}
 * @example
 * ```javascript
 * import * as PendingTransactionFilter from './primitives/PendingTransactionFilter/index.js';
 * import * as FilterId from './primitives/FilterId/index.js';
 * const filter = PendingTransactionFilter.from(FilterId.from("0x1"));
 * ```
 */
export function from(filterId: import("../FilterId/FilterIdType.js").FilterIdType): import("./PendingTransactionFilterType.js").PendingTransactionFilterType;
//# sourceMappingURL=from.d.ts.map