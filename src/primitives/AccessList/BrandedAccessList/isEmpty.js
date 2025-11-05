/**
 * Check if access list is empty (EIP-2930)
 *
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to check
 * @returns {boolean} true if empty
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
export function isEmpty(list) {
	return list.length === 0;
}
