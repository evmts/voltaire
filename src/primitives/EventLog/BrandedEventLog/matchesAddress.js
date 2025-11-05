/**
 * @typedef {import('../../Address/index.js').BrandedAddress} BrandedAddress
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { addressEquals } from "./utils.js";

/**
 * Check if log matches address filter
 *
 * @template {BrandedEventLog} T
 * @param {T} log - Event log to check
 * @param {BrandedAddress | BrandedAddress[]} filterAddress - Address or array of addresses to match
 * @returns {boolean} True if log matches address filter
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const matches1 = EventLog.matchesAddress(log, "0x..." as Address);
 * const matches2 = log.matchesAddress("0x..." as Address);
 * ```
 */
export function matchesAddress(log, filterAddress) {
	if (Array.isArray(filterAddress)) {
		return filterAddress.some((addr) => addressEquals(log.address, addr));
	}
	return addressEquals(log.address, filterAddress);
}
