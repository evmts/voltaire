import type { BrandedAccessList } from "./BrandedAccessList.js";

/**
 * Check if access list is empty
 *
 * @param list - Access list to check
 * @returns true if empty
 *
 * @example
 * ```typescript
 * const list = AccessList([]);
 * if (AccessList.isEmpty(list)) { // Static call
 *   console.log('No access list entries');
 * }
 * if (list.isEmpty()) { // Instance call
 *   console.log('No access list entries');
 * }
 * ```
 */
export function isEmpty(list: BrandedAccessList): boolean {
	return list.length === 0;
}
