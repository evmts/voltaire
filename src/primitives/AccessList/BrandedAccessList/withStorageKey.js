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
 * Compare two hashes for equality (byte-by-byte)
 *
 * @param {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} a
 * @param {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} b
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
 * Add storage key to access list for address (EIP-2930)
 *
 * Adds address if it doesn't exist, then adds storage key if not already present.
 *
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to add to
 * @param {import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} address - Address to add key for
 * @param {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} storageKey - Storage key to add
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} New access list with storage key added
 *
 * @example
 * ```typescript
 * const list = AccessList([]);
 * const newList = AccessList.withStorageKey(list, address, key); // Static call
 * const newList2 = list.withStorageKey(address, key); // Instance call
 * ```
 */
export function withStorageKey(list, address, storageKey) {
	const result = [];
	let found = false;

	for (const item of list) {
		if (addressEquals(item.address, address)) {
			found = true;
			// Check if key already exists
			const hasKey = item.storageKeys.some((k) => hashEquals(k, storageKey));
			if (hasKey) {
				result.push(item);
			} else {
				result.push({
					address: item.address,
					storageKeys: [...item.storageKeys, storageKey],
				});
			}
		} else {
			result.push(item);
		}
	}

	// If address not found, add new entry
	if (!found) {
		result.push({ address, storageKeys: [storageKey] });
	}

	return result;
}
