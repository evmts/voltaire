import type { BrandedAccessList } from "./BrandedAccessList.js";
import { gasSavings } from "./gasSavings.js";

/**
 * Check if access list provides net gas savings
 *
 * @param list - Access list to check
 * @returns true if access list saves gas overall
 *
 * @example
 * ```typescript
 * const list = AccessList([{ address, storageKeys: [key1] }]);
 * if (AccessList.hasSavings(list)) { // Static call
 *   // Use the access list in transaction
 * }
 * if (list.hasSavings()) { // Instance call
 *   // Use the access list in transaction
 * }
 * ```
 */
export function hasSavings(list: BrandedAccessList): boolean {
	return gasSavings(list) > 0n;
}
