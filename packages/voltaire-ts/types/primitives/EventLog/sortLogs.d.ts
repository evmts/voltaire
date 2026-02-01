/**
 * @typedef {import('./EventLogType.js').EventLogType} BrandedEventLog
 */
/**
 * Sort logs by block number and log index
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {readonly T[]} logs - Array of event logs
 * @returns {T[]} Sorted array of logs
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const logs = [log3, log1, log2];
 * const sorted = EventLog.sortLogs(logs);
 * ```
 */
export function sortLogs<T extends BrandedEventLog>(logs: readonly T[]): T[];
export type BrandedEventLog = import("./EventLogType.js").EventLogType;
//# sourceMappingURL=sortLogs.d.ts.map