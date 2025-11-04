/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 * @typedef {import('./BrandedEventLog.js').Filter} Filter
 */

import { matchesAddress } from "./matchesAddress.js";
import { matchesTopics } from "./matchesTopics.js";
import { hashEquals } from "./utils.js";

/**
 * Check if log matches complete filter
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log to check
 * @param {Filter} filter - Complete filter object
 * @returns {boolean} True if log matches all filter criteria
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const matches1 = EventLog.matchesFilter(log, {
 *   address: "0x..." as Address,
 *   topics: [topic0, null, topic2],
 *   fromBlock: 100n,
 *   toBlock: 200n,
 * });
 * const matches2 = log.matchesFilter({ address: "0x..." as Address });
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
