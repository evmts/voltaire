import { deduplicate } from "./deduplicate.js";

/**
 * Merge multiple access lists (EIP-2930)
 *
 * Combines multiple access lists and deduplicates.
 *
 * @param {...import('../BrandedAccessList.js').BrandedAccessList} accessLists - Access lists to merge
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} Merged and deduplicated access list
 *
 * @example
 * ```typescript
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
