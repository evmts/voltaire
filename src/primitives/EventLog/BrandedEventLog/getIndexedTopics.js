/**
 * @typedef {import('../../Hash/BrandedHash.js').BrandedHash} BrandedHash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

/**
 * Get indexed topics (topic1-topic3) from log
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {readonly BrandedHash[]} Array of indexed topic hashes
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const indexed1 = EventLog.getIndexedTopics(log);
 * const indexed2 = log.getIndexedTopics();
 * ```
 */
export function getIndexedTopics(log) {
	return log.topics.slice(1);
}
