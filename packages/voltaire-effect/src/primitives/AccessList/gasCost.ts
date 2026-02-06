/**
 * @module gasCost
 * @description Calculate total gas cost for access list
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Calculate total gas cost for access list
 *
 * @param list - Access list to calculate cost for
 * @returns Total gas cost in wei
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const cost = AccessList.gasCost(list)
 * // cost = ADDRESS_COST + (numKeys * STORAGE_KEY_COST)
 * ```
 */
export const gasCost = (list: BrandedAccessList): bigint =>
  AccessList.gasCost(list);
