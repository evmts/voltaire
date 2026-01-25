/**
 * @fileoverview Effect-based zero address check.
 * @module isZero
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Checks if an Address is the zero address.
 * 
 * @param addr - The address to check
 * @returns Effect yielding boolean
 * 
 * @example
 * ```typescript
 * const isZero = Effect.runSync(Address.isZero(addr))
 * ```
 * 
 * @since 0.0.1
 */
export const isZero = (addr: AddressType): Effect.Effect<boolean> =>
  Effect.sync(() => Address.isZero(addr))
