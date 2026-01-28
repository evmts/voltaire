/**
 * @module hasSavings
 * @description Check if access list provides net gas savings
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Check if access list provides net gas savings
 *
 * @param list - Access list to check
 * @returns true if access list saves gas overall
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * if (AccessList.hasSavings(list)) {
 *   // Use the access list in transaction
 * }
 * ```
 */
export const hasSavings = (list: BrandedAccessList): boolean =>
  AccessList.hasSavings(list);
