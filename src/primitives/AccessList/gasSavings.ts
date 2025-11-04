import type { BrandedAccessList } from "./BrandedAccessList.js";

/** Gas cost for cold account access (without access list) */
export const COLD_ACCOUNT_ACCESS_COST = 2600n;

/** Gas cost for cold storage access (without access list) */
export const COLD_STORAGE_ACCESS_COST = 2100n;

/** Gas cost for warm storage access */
export const WARM_STORAGE_ACCESS_COST = 100n;

const ADDRESS_COST = 2400n;
const STORAGE_KEY_COST = 1900n;

/**
 * Calculate gas savings from using access list
 *
 * Compares cold access costs vs access list costs.
 *
 * @param list - Access list to calculate savings for
 * @returns Estimated gas savings (can be negative if not beneficial)
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
export function gasSavings(list: BrandedAccessList): bigint {
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
