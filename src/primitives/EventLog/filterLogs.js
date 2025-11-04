/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 * @typedef {import('./BrandedEventLog.js').Filter} Filter
 */

import { matchesFilter } from "./matchesFilter.js";

/**
 * Filter array of logs by filter criteria
 *
 * @template {BrandedEventLog} T
 * @param {readonly T[]} logs - Array of event logs
 * @param {Filter} filter - Filter criteria
 * @returns {T[]} Filtered array of logs
 *
 * @example
 * ```typescript
 * const logs = [log1, log2, log3];
 * const filtered = EventLog.filterLogs(logs, {
 *   address: "0x..." as Address,
 *   topics: [topic0, null],
 * });
 * ```
 */
export function filterLogs(logs, filter) {
	return logs.filter((log) => matchesFilter(log, filter));
}
