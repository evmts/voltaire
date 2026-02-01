/**
 * Sort logs by block number and log index
 *
 * @template T
 * @param {readonly (T & import('../EventLogType.js').BrandedEventLog)[]} logs
 * @returns {(T & import('../EventLogType.js').BrandedEventLog)[]}
 *
 * @example
 * ```typescript
 * import { sortLogs } from './extensions'
 * const sorted = sortLogs(logs)
 * ```
 */
export function sortLogs<T>(logs: readonly (T & import("../EventLogType.js").BrandedEventLog)[]): (T & import("../EventLogType.js").BrandedEventLog)[];
//# sourceMappingURL=sortLogs.d.ts.map