/**
 * @fileoverview Effect-based address comparison.
 * @module compare
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Compares two addresses.
 * 
 * @param a - First address
 * @param b - Second address
 * @returns Effect yielding -1, 0, or 1
 * 
 * @example
 * ```typescript
 * const cmp = Effect.runSync(Address.compare(addr1, addr2))
 * // -1 if addr1 < addr2, 0 if equal, 1 if addr1 > addr2
 * ```
 * 
 * @since 0.0.1
 */
export const compare = (a: AddressType, b: AddressType): Effect.Effect<number> =>
  Effect.sync(() => Address.compare(a, b))
