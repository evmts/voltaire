/**
 * Get indexed topics (topic1-topic3) from log
 *
 * @param {import('../EventLogType.js').BrandedEventLog} log - Event log
 * @returns {readonly import('../../Hash/HashType.js').HashType[]}
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
