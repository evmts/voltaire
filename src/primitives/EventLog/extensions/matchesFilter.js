import { matchesAddress } from "./matchesAddress.js";
import { matchesTopics } from "./matchesTopics.js";
import { hashEquals } from "./utils.js";

/**
 * Check if log matches complete filter criteria
 *
 * @param {import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log
 * @param {import('../BrandedEventLog/BrandedEventLog.js').Filter} filter
 * @returns {boolean}
 *
 * @example
 * ```typescript
 * import { matchesFilter } from './extensions'
 * const matches = matchesFilter(log, {
 *   address: "0x...",
 *   topics: [topic0, null, topic2],
 *   fromBlock: 100n,
 *   toBlock: 200n,
 * })
 * ```
 */
export function matchesFilter(log, filter) {
	// Check address filter
	if (filter.address !== undefined) {
		if (!matchesAddress(log, filter.address)) {
			return false;
		}
	}

	// Check topics filter
	if (filter.topics !== undefined) {
		if (!matchesTopics(log, filter.topics)) {
			return false;
		}
	}

	// Check block number range
	if (log.blockNumber !== undefined) {
		if (filter.fromBlock !== undefined && log.blockNumber < filter.fromBlock) {
			return false;
		}
		if (filter.toBlock !== undefined && log.blockNumber > filter.toBlock) {
			return false;
		}
	}

	// Check block hash
	if (filter.blockHash !== undefined && log.blockHash !== undefined) {
		if (!hashEquals(log.blockHash, filter.blockHash)) {
			return false;
		}
	}

	return true;
}
