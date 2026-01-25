/**
 * @fileoverview Effect-based address to uppercase hex conversion.
 * @module toUppercase
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Converts an Address to uppercase hex string.
 * 
 * @param addr - The address to convert
 * @returns Effect yielding uppercase hex string with "0x" prefix
 * 
 * @example
 * ```typescript
 * const hex = Effect.runSync(Address.toUppercase(addr))
 * // "0x742D35CC6634C0532925A3B844BC9E7595F251E3"
 * ```
 * 
 * @since 0.0.1
 */
export const toUppercase = (addr: AddressType): Effect.Effect<string> =>
  Effect.sync(() => Address.toUppercase(addr))
