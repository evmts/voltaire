import { SIZE } from "./constants.js";

/**
 * Compare two addresses lexicographically
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - First address
 * @param {import('./BrandedAddress.js').BrandedAddress} other - Address to compare with
 * @returns {number} -1 if address < other, 0 if equal, 1 if address > other
 *
 * @example
 * ```typescript
 * const sorted = addresses.sort((a, b) => Address.compare(a, b));
 * ```
 */
export function compare(address, other) {
	for (let i = 0; i < SIZE; i++) {
		const thisByte = address[i] ?? 0;
		const otherByte = other[i] ?? 0;
		if (thisByte < otherByte) return -1;
		if (thisByte > otherByte) return 1;
	}
	return 0;
}
