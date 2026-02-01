/**
 * Check if log matches topic filter
 *
 * @param {import('../EventLogType.js').BrandedEventLog} log
 * @param {readonly (import('../../Hash/HashType.js').HashType | import('../../Hash/HashType.js').HashType[] | null)[]} filterTopics
 * @returns {boolean}
 *
 * @example
 * ```typescript
 * import { matchesTopics } from './extensions'
 * const matches = matchesTopics(log, [topic0, null, topic2])
 * ```
 */
export function matchesTopics(log: import("../EventLogType.js").BrandedEventLog, filterTopics: readonly (import("../../Hash/HashType.js").HashType | import("../../Hash/HashType.js").HashType[] | null)[]): boolean;
//# sourceMappingURL=matchesTopics.d.ts.map