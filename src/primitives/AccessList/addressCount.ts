import type { BrandedAccessList } from "./BrandedAccessList.js";

/**
 * Count total addresses in access list
 *
 * @param list - Access list to count
 * @returns Number of unique addresses
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [] }]);
 * const count = AccessList.addressCount(list); // Static call
 * const count2 = list.addressCount(); // Instance call
 * ```
 */
export function addressCount(list: BrandedAccessList): number {
	return list.length;
}
