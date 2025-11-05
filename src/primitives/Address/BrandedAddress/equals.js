/**
 * Check if two addresses are equal
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - First address
 * @param {import('./BrandedAddress.js').BrandedAddress} other - Address to compare with
 * @returns {boolean} True if addresses are identical
 *
 * @example
 * ```typescript
 * if (Address.equals(addr1, addr2)) {
 *   console.log("Addresses match");
 * }
 * ```
 */
export function equals(address, other) {
	if (address.length !== other.length) return false;
	for (let i = 0; i < address.length; i++) {
		if (address[i] !== other[i]) return false;
	}
	return true;
}
