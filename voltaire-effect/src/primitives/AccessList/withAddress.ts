/**
 * @module withAddress
 * @description Add address to access list
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";
import type { AddressType } from "@tevm/voltaire/Address";

/**
 * Add address to access list
 *
 * Creates new entry if address doesn't exist, otherwise returns original list.
 *
 * @param list - Access list to add to
 * @param address - Address to add
 * @returns New access list with address added
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const newList = AccessList.withAddress(list, address)
 * ```
 */
export const withAddress = (
  list: BrandedAccessList,
  address: AddressType,
): BrandedAccessList => AccessList.withAddress(list, address);
