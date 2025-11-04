import type { BrandedAccessList } from "./BrandedAccessList.js";

/** Gas cost per address in access list */
export const ADDRESS_COST = 2400n;

/** Gas cost per storage key in access list */
export const STORAGE_KEY_COST = 1900n;

/**
 * Calculate total gas cost for access list
 *
 * @param list - Access list to calculate cost for
 * @returns Total gas cost in wei
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key1, key2] }]);
 * const cost = AccessList.gasCost(list); // Static call
 * const cost2 = list.gasCost(); // Instance call
 * // cost = ADDRESS_COST + (2 * STORAGE_KEY_COST)
 * ```
 */
export function gasCost(list: BrandedAccessList): bigint {
	let totalCost = 0n;
	for (const item of list) {
		totalCost += ADDRESS_COST;
		totalCost += STORAGE_KEY_COST * BigInt(item.storageKeys.length);
	}
	return totalCost;
}
