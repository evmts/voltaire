/**
 * @typedef {import('../../Address/index.js').BrandedAddress} BrandedAddress
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { addressEquals } from "./utils.js";

/**
 * Check if log matches address filter
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @template {BrandedEventLog} T
 * @param {T} log - Event log to check
 * @param {BrandedAddress | BrandedAddress[]} filterAddress - Address or array of addresses to match
 * @returns {boolean} True if log matches address filter
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * import * as Address from './primitives/Address/index.js';
 * const log = EventLog.create({ address, topics, data });
 * const matches = EventLog.matchesAddress(log, Address.from("0x..."));
 * ```
 */
export function matchesAddress(log, filterAddress) {
	if (Array.isArray(filterAddress)) {
		return filterAddress.some((addr) => addressEquals(log.address, addr));
	}
	return addressEquals(log.address, filterAddress);
}
