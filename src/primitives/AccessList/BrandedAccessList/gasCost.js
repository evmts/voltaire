import { ADDRESS_COST, STORAGE_KEY_COST } from "./constants.js";

/**
 * Calculate total gas cost for access list (EIP-2930)
 *
 * @param {import('./BrandedAccessList.js').BrandedAccessList} list - Access list to calculate cost for
 * @returns {bigint} Total gas cost in wei
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key1, key2] }]);
 * const cost = AccessList.gasCost(list); // Static call
 * const cost2 = list.gasCost(); // Instance call
 * // cost = ADDRESS_COST + (2 * STORAGE_KEY_COST)
 * ```
 */
export function gasCost(list) {
	let totalCost = 0n;
	for (const item of list) {
		totalCost += ADDRESS_COST;
		totalCost += STORAGE_KEY_COST * BigInt(item.storageKeys.length);
	}
	return totalCost;
}

export { ADDRESS_COST, STORAGE_KEY_COST };
