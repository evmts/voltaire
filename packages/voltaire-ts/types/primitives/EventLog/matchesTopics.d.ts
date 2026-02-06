/**
 * Check if log matches topic filter
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log to check
 * @param {readonly (HashType | HashType[] | null)[]} filterTopics - Topic filter array
 * @returns {boolean} True if log matches topic filter
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const matches = EventLog.matchesTopics(log, [topic0, null, topic2]);
 * ```
 */
export function matchesTopics<T extends BrandedEventLog>(log: T, filterTopics: readonly (HashType | HashType[] | null)[]): boolean;
export type HashType = import("../Hash/HashType.js").HashType;
export type BrandedEventLog = import("./EventLogType.js").EventLogType;
//# sourceMappingURL=matchesTopics.d.ts.map