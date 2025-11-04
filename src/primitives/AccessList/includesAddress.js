/**
 * Compare two addresses for equality (byte-by-byte)
 *
 * @param {import('../Address/BrandedAddress.js').BrandedAddress} a
 * @param {import('../Address/BrandedAddress.js').BrandedAddress} b
 * @returns {boolean}
 */
function addressEquals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Check if address is in access list (EIP-2930)
 *
 * @param {import('./BrandedAccessList.js').BrandedAccessList} list - Access list to search
 * @param {import('../Address/BrandedAddress.js').BrandedAddress} address - Address to find
 * @returns {boolean} true if address is in access list
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [] }]);
 * const hasAddress = AccessList.includesAddress(list, address); // Static call
 * const hasAddress2 = list.includesAddress(address); // Instance call
 * ```
 */
export function includesAddress(list, address) {
	for (const item of list) {
		if (addressEquals(item.address, address)) {
			return true;
		}
	}
	return false;
}
