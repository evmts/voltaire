import { getIndexedTopics } from "./getIndexedTopics.js";

/**
 * Get indexed parameters (alias for getIndexedTopics)
 *
 * @param {import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log - Event log
 * @returns {readonly import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash[]}
 *
 * @example
 * ```typescript
 * import { getIndexed } from './extensions'
 * const indexed = getIndexed(log)
 * ```
 */
export function getIndexed(log) {
	return getIndexedTopics(log);
}
