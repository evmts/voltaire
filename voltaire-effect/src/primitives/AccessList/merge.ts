/**
 * @module merge
 * @description Merge multiple access lists
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Merge multiple access lists
 *
 * Combines multiple access lists and deduplicates.
 *
 * @param accessLists - Access lists to merge
 * @returns Merged and deduplicated access list
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const merged = AccessList.merge(list1, list2, list3)
 * ```
 */
export const merge = (
  ...accessLists: BrandedAccessList[]
): BrandedAccessList => AccessList.merge(...accessLists);
