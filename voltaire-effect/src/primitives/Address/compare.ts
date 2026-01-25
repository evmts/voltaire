/**
 * @fileoverview Address comparison.
 * @module compare
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Compares two addresses lexicographically.
 *
 * @param a - First address
 * @param b - Second address
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const a = S.decodeSync(Address.Hex)('0x0000000000000000000000000000000000000001')
 * const b = S.decodeSync(Address.Hex)('0x0000000000000000000000000000000000000002')
 * Address.compare(a, b) // -1
 * ```
 *
 * @since 0.1.0
 */
export const compare = (a: AddressType, b: AddressType): number =>
	Address.compare(a, b);
