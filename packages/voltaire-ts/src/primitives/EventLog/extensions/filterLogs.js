import { matchesFilter } from "./matchesFilter.js";

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
export function filterLogs(logs, filter) {
	return logs.filter((log) => matchesFilter(log, filter));
}
