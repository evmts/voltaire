/**
 * @module storageKeyCount
 * @description Count total storage keys across all addresses
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Count total storage keys across all addresses
 *
 * @param list - Access list to count
 * @returns Total number of storage keys
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const keyCount = AccessList.storageKeyCount(list)
 * ```
 */
export const storageKeyCount = (list: BrandedAccessList): number =>
  AccessList.storageKeyCount(list);
