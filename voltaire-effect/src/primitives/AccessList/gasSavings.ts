/**
 * @module gasSavings
 * @description Calculate gas savings from using access list
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Calculate gas savings from using access list
 *
 * Compares cold access costs vs access list costs.
 *
 * @param list - Access list to calculate savings for
 * @returns Estimated gas savings (can be negative if not beneficial)
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const savings = AccessList.gasSavings(list)
 * if (savings > 0n) {
 *   console.log('Access list saves gas:', savings)
 * }
 * ```
 */
export const gasSavings = (list: BrandedAccessList): bigint =>
  AccessList.gasSavings(list);
