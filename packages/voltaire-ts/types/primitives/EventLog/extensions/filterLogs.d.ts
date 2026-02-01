/**
 * Filter array of logs by criteria
 *
 * @template T
 * @param {readonly (T & import('../EventLogType.js').BrandedEventLog)[]} logs
 * @param {import('../EventLogType.js').Filter} filter
 * @returns {(T & import('../EventLogType.js').BrandedEventLog)[]}
 *
 * @example
 * ```typescript
 * import { filterLogs } from './extensions'
 * const filtered = filterLogs(logs, { address: "0x..." })
 * ```
 */
export function filterLogs<T>(logs: readonly (T & import("../EventLogType.js").BrandedEventLog)[], filter: import("../EventLogType.js").Filter): (T & import("../EventLogType.js").BrandedEventLog)[];
//# sourceMappingURL=filterLogs.d.ts.map