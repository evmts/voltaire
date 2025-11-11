/**
 * @typedef {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} BrandedHash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { getIndexedTopics } from "./getIndexedTopics.js";

/**
 * Get indexed parameters (alias for getIndexedTopics)
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
 * const indexed = EventLog.getIndexed(log);
 * ```
 */
export function getIndexed(log) {
	return getIndexedTopics(log);
}
