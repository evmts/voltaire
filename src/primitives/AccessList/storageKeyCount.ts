import type { BrandedAccessList } from "./BrandedAccessList.js";

/**
 * Count total storage keys across all addresses
 *
 * @param list - Access list to count
 * @returns Total number of storage keys
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key1, key2] }]);
 * const keyCount = AccessList.storageKeyCount(list); // Static call
 * const keyCount2 = list.storageKeyCount(); // Instance call
 * ```
 */
export function storageKeyCount(list: BrandedAccessList): number {
	let count = 0;
	for (const item of list) {
		count += item.storageKeys.length;
	}
	return count;
}
