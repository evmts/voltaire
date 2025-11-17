/**
 * Count total addresses in access list (EIP-2930)
 *
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to count
 * @returns {number} Number of unique addresses
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [] }]);
 * const count = AccessList.addressCount(list); // Static call
 * const count2 = list.addressCount(); // Instance call
 * ```
 */
export function addressCount(list) {
	return list.length;
}
