import * as TopicFilter from "../TopicFilter/index.js";

/**
 * Check if log filter is empty (no filtering criteria)
 *
 * @param {import('./LogFilterType.js').LogFilterType} filter
 * @returns {boolean}
 * @example
 * ```javascript
 * import * as LogFilter from './primitives/LogFilter/index.js';
 * const empty = LogFilter.isEmpty(filter); // true if no criteria
 * ```
 */
export function isEmpty(filter) {
	if (filter.address !== undefined) {
		return false;
	}
	if (filter.fromBlock !== undefined) {
		return false;
	}
	if (filter.toBlock !== undefined) {
		return false;
	}
	if (filter.blockhash !== undefined) {
		return false;
	}
	if (filter.topics !== undefined && !TopicFilter.isEmpty(filter.topics)) {
		return false;
	}
	return true;
}
