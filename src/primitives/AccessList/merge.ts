import type { BrandedAccessList, Item } from "./BrandedAccessList.js";
import { deduplicate } from "./deduplicate.js";

/**
 * Merge multiple access lists
 *
 * Combines multiple access lists and deduplicates.
 *
 * @param accessLists - Access lists to merge
 * @returns Merged and deduplicated access list
 *
 * @example
 * ```typescript
 * const merged = AccessList.merge(list1, list2, list3);
 * ```
 */
export function merge(...accessLists: BrandedAccessList[]): BrandedAccessList {
	const combined: Item[] = [];
	for (const list of accessLists) {
		combined.push(...list);
	}
	return deduplicate(combined as BrandedAccessList);
}
