/**
 * @module includesStorageKey
 * @description Check if storage key is in access list for given address
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";

/**
 * Check if storage key is in access list for given address
 *
 * @param list - Access list to search
 * @param address - Address to check
 * @param storageKey - Storage key to find
 * @returns true if storage key is accessible
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const isAccessible = AccessList.includesStorageKey(list, address, key)
 * ```
 */
export const includesStorageKey = (
  list: BrandedAccessList,
  address: AddressType,
  storageKey: HashType,
): boolean => AccessList.includesStorageKey(list, address, storageKey);
