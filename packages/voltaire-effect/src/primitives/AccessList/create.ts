/**
 * @module create
 * @description Create empty access list
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Create empty access list
 *
 * @returns Empty access list
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const list = AccessList.create()
 * ```
 */
export const create = (): BrandedAccessList => AccessList.create();
