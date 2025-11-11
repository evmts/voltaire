/**
 * @typedef {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} BrandedHash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

/**
 * Get indexed topics (topic1-topic3) from log
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {readonly BrandedHash[]} Array of indexed topic hashes
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const indexed = EventLog.getIndexedTopics(log);
 * ```
 */
export function getIndexedTopics(log) {
	return log.topics.slice(1);
}
