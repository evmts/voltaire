import type { BrandedAccessList } from "./AccessListType.js";
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
export declare function merge(...accessLists: BrandedAccessList[]): BrandedAccessList;
//# sourceMappingURL=merge.d.ts.map