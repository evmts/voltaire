/**
 * @module deduplicate
 * @description Deduplicate access list entries
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Deduplicate access list entries
 *
 * Merges duplicate addresses and removes duplicate storage keys.
 *
 * @param list - Access list to deduplicate
 * @returns Deduplicated access list
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const deduped = AccessList.deduplicate(list)
 * ```
 */
export const deduplicate = (list: BrandedAccessList): BrandedAccessList =>
  AccessList.deduplicate(list);
