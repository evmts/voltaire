import type { BrandedAccessList } from "./AccessListType.js";
/** Gas cost for cold account access (without access list) */
export declare const COLD_ACCOUNT_ACCESS_COST = 2600n;
/** Gas cost for cold storage access (without access list) */
export declare const COLD_STORAGE_ACCESS_COST = 2100n;
/** Gas cost for warm storage access */
export declare const WARM_STORAGE_ACCESS_COST = 100n;
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
export declare function gasSavings(list: BrandedAccessList): bigint;
//# sourceMappingURL=gasSavings.d.ts.map