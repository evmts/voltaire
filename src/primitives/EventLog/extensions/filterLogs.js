import { matchesFilter } from "./matchesFilter.js";

/**
 * Filter array of logs by criteria
 *
 * @template T
 * @param {readonly (T & import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog)[]} logs
 * @param {import('../BrandedEventLog/BrandedEventLog.js').Filter} filter
 * @returns {(T & import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog)[]}
 *
 * @example
 * ```typescript
 * import { filterLogs } from './extensions'
 * const filtered = filterLogs(logs, { address: "0x..." })
 * ```
 */
export function filterLogs(logs, filter) {
	return logs.filter((log) => matchesFilter(log, filter));
}
