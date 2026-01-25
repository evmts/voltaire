/**
 * @fileoverview Effect-based address less-than comparison.
 * @module lessThan
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Checks if first address is less than second.
 * 
 * @param a - First address
 * @param b - Second address
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const isLess = Effect.runSync(Address.lessThan(addr1, addr2))
 * ```
 * 
 * @since 0.0.1
 */
export const lessThan = (a: AddressType, b: AddressType): Effect.Effect<boolean> =>
  Effect.sync(() => Address.lessThan(a, b))
