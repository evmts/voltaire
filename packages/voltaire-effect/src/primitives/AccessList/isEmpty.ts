/**
 * @module isEmpty
 * @description Check if access list is empty
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Check if access list is empty
 *
 * @param list - Access list to check
 * @returns true if empty
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * if (AccessList.isEmpty(list)) {
 *   console.log('No access list entries')
 * }
 * ```
 */
export const isEmpty = (list: BrandedAccessList): boolean =>
  AccessList.isEmpty(list);
