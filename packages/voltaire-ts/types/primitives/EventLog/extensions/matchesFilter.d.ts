/**
 * Check if log matches complete filter criteria
 *
 * @param {import('../EventLogType.js').BrandedEventLog} log
 * @param {import('../EventLogType.js').Filter} filter
 * @returns {boolean}
 *
 * @example
 * ```typescript
 * import { matchesFilter } from './extensions'
 * const matches = matchesFilter(log, {
 *   address: "0x...",
 *   topics: [topic0, null, topic2],
 *   fromBlock: 100n,
 *   toBlock: 200n,
 * })
 * ```
 */
export function matchesFilter(log: import("../EventLogType.js").BrandedEventLog, filter: import("../EventLogType.js").Filter): boolean;
//# sourceMappingURL=matchesFilter.d.ts.map