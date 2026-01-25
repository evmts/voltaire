/**
 * @fileoverview Address equality check.
 * @module equals
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Checks if two addresses are equal.
 *
 * @param a - First address
 * @param b - Second address
 * @returns true if addresses are equal
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const a = S.decodeSync(Address.Hex)('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 * const b = S.decodeSync(Address.Hex)('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 * Address.equals(a, b) // true
 * ```
 *
 * @since 0.1.0
 */
export const equals = (a: AddressType, b: AddressType): boolean =>
	Address.equals(a, b);
