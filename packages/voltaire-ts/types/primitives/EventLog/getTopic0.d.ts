/**
 * @typedef {import('../Hash/HashType.js').HashType} HashType
 * @typedef {import('./EventLogType.js').EventLogType} BrandedEventLog
 */
/**
 * Get topic0 (event signature) from log
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {HashType | undefined} Topic0 hash or undefined if no topics
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const topic0 = EventLog.getTopic0(log);
 * ```
 */
export function getTopic0<T extends BrandedEventLog>(log: T): HashType | undefined;
export type HashType = import("../Hash/HashType.js").HashType;
export type BrandedEventLog = import("./EventLogType.js").EventLogType;
//# sourceMappingURL=getTopic0.d.ts.map