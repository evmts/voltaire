import type { BrandedAccessList } from "./AccessListType.js";
/** Gas cost per address in access list */
export declare const ADDRESS_COST = 2400n;
/** Gas cost per storage key in access list */
export declare const STORAGE_KEY_COST = 1900n;
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
export declare function gasCost(list: BrandedAccessList): bigint;
//# sourceMappingURL=gasCost.d.ts.map