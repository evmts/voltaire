/**
 * @fileoverview Zero address check.
 * @module isZero
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Checks if an Address is the zero address (0x0000...0000).
 *
 * @param addr - The address to check
 * @returns true if the address is zero
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const zero = S.decodeSync(Address.Hex)('0x0000000000000000000000000000000000000000')
 * Address.isZero(zero) // true
 * ```
 *
 * @since 0.1.0
 */
export const isZero = (addr: AddressType): boolean => Address.isZero(addr);
