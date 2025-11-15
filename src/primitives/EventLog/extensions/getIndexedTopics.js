/**
 * Get indexed topics (topic1-topic3) from log
 *
 * @param {import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log - Event log
 * @returns {readonly import('../../Hash/HashType/HashType.js').HashType[]}
 *
 * @example
 * ```typescript
 * import { getIndexedTopics } from './extensions'
 * const indexed = getIndexedTopics(log)
 * ```
 */
export function getIndexedTopics(log) {
	return log.topics.slice(1);
}
