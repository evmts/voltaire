import { gasSavings } from "./gasSavings.js";

/**
 * Check if access list provides net gas savings (EIP-2930)
 *
 * @param {import('./BrandedAccessList.js').BrandedAccessList} list - Access list to check
 * @returns {boolean} true if access list saves gas overall
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
export function hasSavings(list) {
	return gasSavings(list) > 0n;
}
