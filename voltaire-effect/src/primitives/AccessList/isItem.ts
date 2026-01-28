/**
 * @module isItem
 * @description Type guard for AccessList Item
 * @since 0.1.0
 */
import { AccessList, type Item } from "@tevm/voltaire/AccessList";

/**
 * Type guard: Check if value is AccessListItem
 *
 * @param value - Value to check
 * @returns true if value is AccessListItem
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * if (AccessList.isItem(value)) {
 *   console.log(value.address, value.storageKeys)
 * }
 * ```
 */
export const isItem = (value: unknown): value is Item => AccessList.isItem(value);
