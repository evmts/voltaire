import { compare } from "./compare.js";

/**
 * Check if this address is less than other
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - First address
 * @param {import('./BrandedAddress.js').BrandedAddress} other - Address to compare with
 * @returns {boolean} True if address < other
 */
export function lessThan(address, other) {
	return compare(address, other) < 0;
}
