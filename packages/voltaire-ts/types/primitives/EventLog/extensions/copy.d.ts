/**
 * Copy event log (alias for clone)
 *
 * @template T
 * @param {T & import('../EventLogType.js').BrandedEventLog} log - Event log
 * @returns {T}
 *
 * @example
 * ```typescript
 * import { copy } from './extensions'
 * const copied = copy(log)
 * ```
 */
export function copy<T>(log: T & import("../EventLogType.js").BrandedEventLog): T;
//# sourceMappingURL=copy.d.ts.map