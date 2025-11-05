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
 * @param {import('../../Hash/BrandedHash.js').BrandedHash} a
 * @param {import('../../Hash/BrandedHash.js').BrandedHash} b
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
 * Deduplicate access list entries (EIP-2930)
 *
 * Merges duplicate addresses and removes duplicate storage keys.
 *
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to deduplicate
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} Deduplicated access list
 *
 * @example
 * ```typescript
 * const list = AccessList([
 *   { address: addr1, storageKeys: [key1] },
 *   { address: addr1, storageKeys: [key2, key1] },
 * ]);
 * const deduped = AccessList.deduplicate(list); // Static call
 * const deduped2 = list.deduplicate(); // Instance call
 * // Result: [{ address: addr1, storageKeys: [key1, key2] }]
 * ```
 */
export function deduplicate(list) {
	const result = [];

	for (const item of list) {
		// Find existing entry with same address
		const existing = result.find((r) => addressEquals(r.address, item.address));

		if (existing) {
			// Merge storage keys, avoiding duplicates
			const existingKeys = existing.storageKeys;
			for (const newKey of item.storageKeys) {
				const isDuplicate = existingKeys.some((existingKey) =>
					hashEquals(existingKey, newKey),
				);
				if (!isDuplicate) {
					existingKeys.push(newKey);
				}
			}
		} else {
			// Create new entry
			result.push({
				address: item.address,
				storageKeys: [...item.storageKeys],
			});
		}
	}

	return result;
}
