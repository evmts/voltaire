/**
 * @fileoverview Effect-based address to short hex conversion.
 * @module toShortHex
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Converts an Address to shortened hex format (e.g., "0x742d...51e3").
 * 
 * @param addr - The address to convert
 * @returns Effect yielding shortened hex string
 * 
 * @example
 * ```typescript
 * const short = Effect.runSync(Address.toShortHex(addr))
 * // "0x742d...51e3"
 * ```
 * 
 * @since 0.0.1
 */
export const toShortHex = (addr: AddressType): Effect.Effect<string> =>
  Effect.sync(() => Address.toShortHex(addr))
