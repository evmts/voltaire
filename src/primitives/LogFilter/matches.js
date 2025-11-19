import * as TopicFilter from "../TopicFilter/index.js";

/**
 * Check if a log entry matches this filter
 *
 * @param {import('./LogFilterType.js').LogFilterType} filter
 * @param {import('../EventLog/EventLogType.js').EventLogType} log - Log entry to test
 * @returns {boolean}
 * @example
 * ```javascript
 * import * as LogFilter from './primitives/LogFilter/index.js';
 * const matches = LogFilter.matches(filter, log);
 * ```
 */
export function matches(filter, log) {
	// Check address filter
	if (filter.address !== undefined) {
		if (Array.isArray(filter.address)) {
			// OR logic - log address must match any of the filter addresses
			let matched = false;
			for (const filterAddr of filter.address) {
				if (filterAddr.length === log.address.length) {
					let equal = true;
					for (let i = 0; i < filterAddr.length; i++) {
						if (filterAddr[i] !== log.address[i]) {
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
			// Single address - must match exactly
			if (filter.address.length !== log.address.length) {
				return false;
			}
			for (let i = 0; i < filter.address.length; i++) {
				if (filter.address[i] !== log.address[i]) {
					return false;
				}
			}
		}
	}

	// Check block range (if log has blockNumber)
	if (log.blockNumber !== undefined) {
		if (
			filter.fromBlock !== undefined &&
			typeof filter.fromBlock === "bigint"
		) {
			if (log.blockNumber < filter.fromBlock) {
				return false;
			}
		}
		if (filter.toBlock !== undefined && typeof filter.toBlock === "bigint") {
			if (log.blockNumber > filter.toBlock) {
				return false;
			}
		}
	}

	// Check block hash (if specified)
	if (filter.blockhash !== undefined && log.blockHash !== undefined) {
		if (filter.blockhash.length !== log.blockHash.length) {
			return false;
		}
		for (let i = 0; i < filter.blockhash.length; i++) {
			if (filter.blockhash[i] !== log.blockHash[i]) {
				return false;
			}
		}
	}

	// Check topics
	if (filter.topics !== undefined) {
		if (!TopicFilter.matches(filter.topics, log.topics)) {
			return false;
		}
	}

	return true;
}
