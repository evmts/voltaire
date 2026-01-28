/**
 * @module addressCount
 * @description Count total addresses in access list
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Count total addresses in access list
 *
 * @param list - Access list to count
 * @returns Number of addresses
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const count = AccessList.addressCount(list)
 * ```
 */
export const addressCount = (list: BrandedAccessList): number =>
  AccessList.addressCount(list);
