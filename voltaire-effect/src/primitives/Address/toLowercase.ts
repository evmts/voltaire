/**
 * @fileoverview Effect-based address to lowercase hex conversion.
 * @module toLowercase
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Converts an Address to lowercase hex string.
 * 
 * @param addr - The address to convert
 * @returns Effect yielding lowercase hex string with "0x" prefix
 * 
 * @example
 * ```typescript
 * const hex = Effect.runSync(Address.toLowercase(addr))
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 * 
 * @since 0.0.1
 */
export const toLowercase = (addr: AddressType): Effect.Effect<string> =>
  Effect.sync(() => Address.toLowercase(addr))
