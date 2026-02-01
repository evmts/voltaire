/**
 * @typedef {import('./EventLogType.js').EventLogType} BrandedEventLog
 */
/**
 * Check if log was removed
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {boolean} True if log was removed
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data, removed: true });
 * const removed = EventLog.isRemoved(log);
 * ```
 */
export function isRemoved<T extends BrandedEventLog>(log: T): boolean;
export type BrandedEventLog = import("./EventLogType.js").EventLogType;
//# sourceMappingURL=isRemoved.d.ts.map