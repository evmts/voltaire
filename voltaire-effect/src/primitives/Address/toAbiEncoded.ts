/**
 * @fileoverview Effect-based address to ABI-encoded bytes conversion.
 * @module toAbiEncoded
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Converts an Address to ABI-encoded bytes (32-byte left-padded).
 * 
 * @param addr - The address to convert
 * @returns Effect yielding 32-byte Uint8Array
 * 
 * @example
 * ```typescript
 * const encoded = Effect.runSync(Address.toAbiEncoded(addr))
 * // Uint8Array(32) with address in last 20 bytes
 * ```
 * 
 * @since 0.0.1
 */
export const toAbiEncoded = (addr: AddressType): Effect.Effect<Uint8Array> =>
  Effect.sync(() => Address.toAbiEncoded(addr))
