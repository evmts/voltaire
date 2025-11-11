import { deduplicate } from "./deduplicate.js";

/**
 * Merge multiple access lists (EIP-2930)
 *
 * Combines multiple access lists and deduplicates.
 *
 * @see https://voltaire.tevm.sh/primitives/accesslist
 * @since 0.0.0
 * @param {...import('../BrandedAccessList.js').BrandedAccessList} accessLists - Access lists to merge
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} Merged and deduplicated access list
 * @throws {never}
 * @example
 * ```javascript
 * import * as AccessList from './primitives/AccessList/index.js';
 * const merged = AccessList.merge(list1, list2, list3);
 * ```
 */
export function merge(...accessLists) {
	const combined = [];
	for (const list of accessLists) {
		combined.push(...list);
	}
	return deduplicate(combined);
}
