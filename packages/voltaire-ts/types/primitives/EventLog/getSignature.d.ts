/**
 * Get event signature (alias for getTopic0)
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {HashType | undefined} Event signature hash or undefined if no topics
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const sig = EventLog.getSignature(log);
 * ```
 */
export function getSignature<T extends BrandedEventLog>(log: T): HashType | undefined;
export type HashType = import("../Hash/HashType.js").HashType;
export type BrandedEventLog = import("./EventLogType.js").EventLogType;
//# sourceMappingURL=getSignature.d.ts.map