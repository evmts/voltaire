/**
 * @module keysFor
 * @description Get all storage keys for an address
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";

/**
 * Get all storage keys for an address
 *
 * @param list - Access list to search
 * @param address - Address to get keys for
 * @returns Array of storage keys, or undefined if address not found
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const keys = AccessList.keysFor(list, address)
 * if (keys) {
 *   console.log(`Found ${keys.length} storage keys`)
 * }
 * ```
 */
export const keysFor = (
  list: BrandedAccessList,
  address: AddressType,
): readonly HashType[] | undefined => AccessList.keysFor(list, address);
