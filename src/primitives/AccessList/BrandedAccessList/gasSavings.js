import {
	ADDRESS_COST,
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	STORAGE_KEY_COST,
	WARM_STORAGE_ACCESS_COST,
} from "./constants.js";

/**
 * Calculate gas savings from using access list (EIP-2930)
 *
 * Compares cold access costs vs access list costs.
 *
 * @param {import('./BrandedAccessList.js').BrandedAccessList} list - Access list to calculate savings for
 * @returns {bigint} Estimated gas savings (can be negative if not beneficial)
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key1] }]);
 * const savings = AccessList.gasSavings(list); // Static call
 * const savings2 = list.gasSavings(); // Instance call
 * if (savings > 0n) {
 *   console.log('Access list saves gas:', savings);
 * }
 * ```
 */
export function gasSavings(list) {
	let savings = 0n;
	for (const item of list) {
		// Save on cold account access
		savings += COLD_ACCOUNT_ACCESS_COST - ADDRESS_COST;

		// Save on cold storage access
		for (const _ of item.storageKeys) {
			savings += COLD_STORAGE_ACCESS_COST - STORAGE_KEY_COST;
		}
	}
	return savings;
}

export {
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	WARM_STORAGE_ACCESS_COST,
};
