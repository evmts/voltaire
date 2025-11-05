/**
 * Compare two addresses for equality (byte-by-byte)
 *
 * @param {import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} a
 * @param {import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} b
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
 * Get all storage keys for an address (EIP-2930)
 *
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to search
 * @param {import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} address - Address to get keys for
 * @returns {readonly import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash[] | undefined} Array of storage keys, or undefined if address not found
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key1, key2] }]);
 * const keys = AccessList.keysFor(list, address); // Static call
 * const keys2 = list.keysFor(address); // Instance call
 * if (keys) {
 *   console.log(`Found ${keys.length} storage keys`);
 * }
 * ```
 */
export function keysFor(list, address) {
	for (const item of list) {
		if (addressEquals(item.address, address)) {
			return item.storageKeys;
		}
	}
	return undefined;
}
