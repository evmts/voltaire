/**
 * Check if log matches complete filter
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log to check
 * @param {Filter} filter - Complete filter object
 * @returns {boolean} True if log matches all filter criteria
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * import * as Address from './primitives/Address/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const matches = EventLog.matchesFilter(log, {
 *   address: Address.from("0x..."),
 *   topics: [topic0, null, topic2],
 *   fromBlock: 100n,
 *   toBlock: 200n,
 * });
 * ```
 */
export function matchesFilter<T extends BrandedEventLog>(log: T, filter: Filter): boolean;
export type BrandedEventLog = import("./EventLogType.js").EventLogType;
export type Filter = import("./EventLogType.js").Filter;
//# sourceMappingURL=matchesFilter.d.ts.map