import { compare } from "./compare.js";

/**
 * Sort addresses lexicographically
 *
 * @param {import('./AddressType.js').BrandedAddress[]} addresses - Addresses to sort
 * @returns {import('./AddressType.js').BrandedAddress[]} Sorted addresses (new array)
 *
 * @example
 * ```typescript
 * const sorted = Address.sortAddresses([addr3, addr1, addr2]);
 * ```
 */
export function sortAddresses(addresses) {
	return [...addresses].sort(compare);
}
