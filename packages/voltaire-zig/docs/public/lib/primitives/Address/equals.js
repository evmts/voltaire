/**
 * Check if two addresses are equal
 *
 * @param {import('./AddressType.js').AddressType} address - First address
 * @param {import('./AddressType.js').AddressType} other - Address to compare with
 * @returns {boolean} True if addresses are identical
 *
 * @example
 * ```ts
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
