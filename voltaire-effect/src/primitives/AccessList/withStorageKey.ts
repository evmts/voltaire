/**
 * @module withStorageKey
 * @description Add storage key to access list for address
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";

/**
 * Add storage key to access list for address
 *
 * Adds address if it doesn't exist, then adds storage key if not already present.
 *
 * @param list - Access list to add to
 * @param address - Address to add key for
 * @param storageKey - Storage key to add
 * @returns New access list with storage key added
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const newList = AccessList.withStorageKey(list, address, key)
 * ```
 */
export const withStorageKey = (
  list: BrandedAccessList,
  address: AddressType,
  storageKey: HashType,
): BrandedAccessList => AccessList.withStorageKey(list, address, storageKey);
