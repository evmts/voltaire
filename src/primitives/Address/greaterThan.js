import { compare } from "./compare.js";

/**
 * Check if this address is greater than other
 *
 * @param {import('./AddressType.js').AddressType} address - First address
 * @param {import('./AddressType.js').AddressType} other - Address to compare with
 * @returns {boolean} True if address > other
 */
export function greaterThan(address, other) {
	return compare(address, other) > 0;
}
