/**
 * Check if a topic array matches this filter
 *
 * Uses AND logic across positions and OR logic within arrays:
 * - All non-null filter positions must match the corresponding log topic
 * - Array entries match if ANY of the hashes match (OR)
 * - null entries always match (wildcard)
 *
 * @param {import('./TopicFilterType.js').TopicFilterType} filter
 * @param {readonly import('../Hash/HashType.js').HashType[]} logTopics - Topics from a log entry
 * @returns {boolean}
 * @example
 * ```javascript
 * import * as TopicFilter from './primitives/TopicFilter/index.js';
 * const matches = TopicFilter.matches(filter, log.topics);
 * ```
 */
export function matches(filter: import("./TopicFilterType.js").TopicFilterType, logTopics: readonly import("../Hash/HashType.js").HashType[]): boolean;
//# sourceMappingURL=matches.d.ts.map