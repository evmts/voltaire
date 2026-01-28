/**
 * @module sortAddresses
 * @description Sort array of addresses lexicographically
 * @since 0.1.0
 */
import { sortAddresses as voltaireSortAddresses, type AddressType } from "@tevm/voltaire/Address";

/**
 * Sort array of addresses lexicographically
 *
 * @param addresses - Array of addresses to sort
 * @returns New sorted array
 * @example
 * ```typescript
 * const sorted = Address.sortAddresses([addr1, addr2, addr3])
 * ```
 */
export const sortAddresses = (addresses: AddressType[]): AddressType[] =>
  voltaireSortAddresses(addresses);
