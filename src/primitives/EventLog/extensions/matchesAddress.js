import { addressEquals } from "./utils.js";

/**
 * Check if log matches address filter
 *
 * @param {import('../EventLogType.js').BrandedEventLog} log
 * @param {import('../../Address/AddressType.js').AddressType | import('../../Address/AddressType.js').AddressType[]} filterAddress
 * @returns {boolean}
 *
 * @example
 * ```typescript
 * import { matchesAddress } from './extensions'
 * const matches = matchesAddress(log, "0x..." as Address)
 * ```
 */
export function matchesAddress(log, filterAddress) {
	if (Array.isArray(filterAddress)) {
		return filterAddress.some((addr) => addressEquals(log.address, addr));
	}
	return addressEquals(log.address, filterAddress);
}
