import { compare } from "./compare.js";

/**
 * Sort addresses lexicographically
 *
 * @param {import('./AddressType.js').AddressType[]} addresses - Addresses to sort
 * @returns {import('./AddressType.js').AddressType[]} Sorted addresses (new array)
 *
 * @example
 * ```ts
 * const sorted = Address.sortAddresses([addr3, addr1, addr2]);
 * ```
 */
export function sortAddresses(addresses) {
	return [...addresses].sort(compare);
}
