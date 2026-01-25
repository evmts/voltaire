/**
 * @fileoverview Effect-based address to U256 conversion.
 * @module toU256
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Converts an Address to a bigint (U256).
 * 
 * @param addr - The address to convert
 * @returns Effect yielding bigint representation
 * 
 * @example
 * ```typescript
 * const num = Effect.runSync(Address.toU256(addr))
 * ```
 * 
 * @since 0.0.1
 */
export const toU256 = (addr: AddressType): Effect.Effect<bigint> =>
  Effect.sync(() => Address.toU256(addr))
