/**
 * @typedef {import('../Hash/index.js').Hash} Hash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { getIndexedTopics } from "./getIndexedTopics.js";

/**
 * Get indexed parameters (alias for getIndexedTopics)
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log
 * @returns {readonly Hash[]} Array of indexed topic hashes
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const indexed1 = EventLog.getIndexed(log);
 * const indexed2 = log.getIndexed();
 * ```
 */
export function getIndexed(log) {
	return getIndexedTopics(log);
}
