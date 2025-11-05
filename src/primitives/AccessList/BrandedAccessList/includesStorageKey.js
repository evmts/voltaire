/**
 * Compare two addresses for equality (byte-by-byte)
 *
 * @param {import('../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} a
 * @param {import('../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} b
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
 * Compare two hashes for equality (byte-by-byte)
 *
 * @param {import('../Hash/BrandedHash/BrandedHash.js').BrandedHash} a
 * @param {import('../Hash/BrandedHash/BrandedHash.js').BrandedHash} b
 * @returns {boolean}
 */
function hashEquals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Check if storage key is in access list for given address (EIP-2930)
 *
 * @param {import('./BrandedAccessList.js').BrandedAccessList} list - Access list to search
 * @param {import('../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} address - Address to check
 * @param {import('../Hash/BrandedHash/BrandedHash.js').BrandedHash} storageKey - Storage key to find
 * @returns {boolean} true if storage key is accessible
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key] }]);
 * const isAccessible = AccessList.includesStorageKey(list, address, key); // Static call
 * const isAccessible2 = list.includesStorageKey(address, key); // Instance call
 * ```
 */
export function includesStorageKey(list, address, storageKey) {
	for (const item of list) {
		if (addressEquals(item.address, address)) {
			for (const key of item.storageKeys) {
				if (hashEquals(key, storageKey)) {
					return true;
				}
			}
		}
	}
	return false;
}
