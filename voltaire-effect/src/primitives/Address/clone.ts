/**
 * @fileoverview Effect-based address cloning.
 * @module clone
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Creates a copy of an Address.
 * 
 * @param addr - The address to clone
 * @returns Effect yielding cloned AddressType
 * 
 * @example
 * ```typescript
 * const cloned = Effect.runSync(Address.clone(addr))
 * ```
 * 
 * @since 0.0.1
 */
export const clone = (addr: AddressType): Effect.Effect<AddressType> =>
  Effect.sync(() => Address.clone(addr))
