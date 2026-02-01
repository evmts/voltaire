/**
 * @typedef {import('../Hash/HashType.js').HashType} HashType
 * @typedef {import('./EventLogType.js').EventLogType} BrandedEventLog
 */
/**
 * Get indexed topics (topic1-topic3) from log
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {readonly HashType[]} Array of indexed topic hashes
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const indexed = EventLog.getIndexedTopics(log);
 * ```
 */
export function getIndexedTopics<T extends BrandedEventLog>(log: T): readonly HashType[];
export type HashType = import("../Hash/HashType.js").HashType;
export type BrandedEventLog = import("./EventLogType.js").EventLogType;
//# sourceMappingURL=getIndexedTopics.d.ts.map