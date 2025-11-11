/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 * @typedef {import('./BrandedEventLog.js').Filter} Filter
 */

import { matchesFilter } from "./matchesFilter.js";

/**
 * Filter array of logs by filter criteria
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {readonly T[]} logs - Array of event logs
 * @param {Filter} filter - Filter criteria
 * @returns {T[]} Filtered array of logs
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const logs = [log1, log2, log3];
 * const filtered = EventLog.filterLogs(logs, {
 *   address: Address.from("0x..."),
 *   topics: [topic0, null],
 * });
 * ```
 */
export function filterLogs(logs, filter) {
	return logs.filter((log) => matchesFilter(log, filter));
}
