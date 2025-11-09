import { addressEquals } from "./utils.js";

/**
 * Check if log matches address filter
 *
 * @param {import('../BrandedEventLog/BrandedEventLog.js').BrandedEventLog} log
 * @param {import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress | import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress[]} filterAddress
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
