/**
 * @module is
 * @description Type guard for AccessList
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Type guard: Check if value is AccessList
 *
 * @param value - Value to check
 * @returns true if value is AccessList
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * if (AccessList.is(value)) {
 *   const cost = AccessList.gasCost(value)
 * }
 * ```
 */
export const is = (value: unknown): value is BrandedAccessList =>
  AccessList.is(value);
