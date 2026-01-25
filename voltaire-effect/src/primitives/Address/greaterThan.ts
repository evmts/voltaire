/**
 * @fileoverview Effect-based address greater-than comparison.
 * @module greaterThan
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Checks if first address is greater than second.
 * 
 * @param a - First address
 * @param b - Second address
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const isGreater = Effect.runSync(Address.greaterThan(addr1, addr2))
 * ```
 * 
 * @since 0.0.1
 */
export const greaterThan = (a: AddressType, b: AddressType): Effect.Effect<boolean> =>
  Effect.sync(() => Address.greaterThan(a, b))
