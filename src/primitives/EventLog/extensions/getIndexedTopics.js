/**
 * Get indexed topics (topic1-topic3) from log
 *
 * @param {import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log - Event log
 * @returns {readonly import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash[]}
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
