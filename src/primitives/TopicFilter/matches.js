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
export function matches(filter, logTopics) {
	// Check each filter position
	for (let i = 0; i < filter.length; i++) {
		const filterEntry = filter[i];

		// Wildcard - matches anything
		if (filterEntry === null || filterEntry === undefined) {
			continue;
		}

		// If filter has more topics than log, no match
		if (i >= logTopics.length) {
			return false;
		}

		const logTopic = /** @type {import('../Hash/HashType.js').HashType} */ (logTopics[i]);

		if (Array.isArray(filterEntry)) {
			// OR logic - match if any hash in array matches
			let matched = false;
			for (const hash of filterEntry) {
				if (logTopic.length === hash.length) {
					let equal = true;
					for (let j = 0; j < hash.length; j++) {
						if (/** @type {number} */ (logTopic[j]) !== /** @type {number} */ (hash[j])) {
							equal = false;
							break;
						}
					}
					if (equal) {
						matched = true;
						break;
					}
				}
			}
			if (!matched) {
				return false;
			}
		} else {
			// Single hash - must match exactly
			if (logTopic.length !== filterEntry.length) {
				return false;
			}
			for (let j = 0; j < filterEntry.length; j++) {
				if (/** @type {number} */ (logTopic[j]) !== /** @type {number} */ (filterEntry[j])) {
					return false;
				}
			}
		}
	}

	return true;
}
