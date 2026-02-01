import { compare } from "./compare.js";

/**
 * Check if this address is less than other
 *
 * @param {import('./AddressType.js').AddressType} address - First address
 * @param {import('./AddressType.js').AddressType} other - Address to compare with
 * @returns {boolean} True if address < other
 */
export function lessThan(address, other) {
	return compare(address, other) < 0;
}
