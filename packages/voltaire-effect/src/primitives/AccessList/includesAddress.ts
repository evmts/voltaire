/**
 * @module includesAddress
 * @description Check if address is in access list
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";
import type { AddressType } from "@tevm/voltaire/Address";

/**
 * Check if address is in access list
 *
 * @param list - Access list to search
 * @param address - Address to find
 * @returns true if address is in access list
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const hasAddress = AccessList.includesAddress(list, address)
 * ```
 */
export const includesAddress = (
  list: BrandedAccessList,
  address: AddressType,
): boolean => AccessList.includesAddress(list, address);
