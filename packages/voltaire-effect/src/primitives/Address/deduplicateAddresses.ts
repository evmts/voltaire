/**
 * @module deduplicateAddresses
 * @description Remove duplicate addresses from array
 * @since 0.1.0
 */
import { deduplicateAddresses as voltaireDeduplicateAddresses, type AddressType } from "@tevm/voltaire/Address";

/**
 * Remove duplicate addresses from array
 *
 * @param addresses - Array with potential duplicates
 * @returns New array with duplicates removed
 * @example
 * ```typescript
 * const unique = Address.deduplicateAddresses([addr1, addr1, addr2])
 * // [addr1, addr2]
 * ```
 */
export const deduplicateAddresses = (addresses: AddressType[]): AddressType[] =>
  voltaireDeduplicateAddresses(addresses);
