/**
 * Clone event log with deep copy of arrays
 *
 * @template T
 * @param {T & import('../EventLogType.js').BrandedEventLog} log - Event log
 * @returns {T}
 *
 * @example
 * ```typescript
 * import { clone } from './extensions'
 * const cloned = clone(log)
 * ```
 */
export function clone<T>(log: T & import("../EventLogType.js").BrandedEventLog): T;
//# sourceMappingURL=clone.d.ts.map