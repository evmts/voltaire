/**
 * @fileoverview Effect-based address equality check.
 * @module equals
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Checks if two addresses are equal.
 * 
 * @param a - First address
 * @param b - Second address
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const areEqual = Effect.runSync(Address.equals(addr1, addr2))
 * ```
 * 
 * @since 0.0.1
 */
export const equals = (a: AddressType, b: AddressType): Effect.Effect<boolean> =>
  Effect.sync(() => Address.equals(a, b))
