/**
 * @fileoverview Address greater-than comparison.
 * @module greaterThan
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Checks if first address is greater than second.
 *
 * @param a - First address
 * @param b - Second address
 * @returns true if a > b
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const a = S.decodeSync(Address.Hex)('0x0000000000000000000000000000000000000002')
 * const b = S.decodeSync(Address.Hex)('0x0000000000000000000000000000000000000001')
 * Address.greaterThan(a, b) // true
 * ```
 *
 * @since 0.1.0
 */
export const greaterThan = (a: AddressType, b: AddressType): boolean =>
	Address.greaterThan(a, b);
