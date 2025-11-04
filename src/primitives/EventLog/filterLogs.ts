import type { BrandedEventLog, Filter } from "./BrandedEventLog.js";
import { matchesFilter } from "./matchesFilter.js";

/**
 * Filter array of logs by filter criteria
 *
 * @param logs Array of event logs
 * @param filter Filter criteria
 * @returns Filtered array of logs
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
export function filterLogs<T extends BrandedEventLog>(
	logs: readonly T[],
	filter: Filter,
): T[] {
	return logs.filter((log) => matchesFilter(log, filter));
}
