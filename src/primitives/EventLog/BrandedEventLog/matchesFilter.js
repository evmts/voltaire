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
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log to check
 * @param {Filter} filter - Complete filter object
 * @returns {boolean} True if log matches all filter criteria
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * import * as Address from './primitives/Address/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const matches = EventLog.matchesFilter(log, {
 *   address: Address.from("0x..."),
 *   topics: [topic0, null, topic2],
 *   fromBlock: 100n,
 *   toBlock: 200n,
 * });
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
