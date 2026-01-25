/**
 * @fileoverview Effect-based address creation from hex string.
 * @module fromHex
 * @since 0.0.1
 */

import { Address, type AddressType, InvalidAddressError } from '@tevm/voltaire/Address'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates an Address from a hex string.
 * 
 * @param value - Hex string with "0x" prefix
 * @returns Effect yielding AddressType or failing with InvalidAddressError
 * 
 * @example
 * ```typescript
 * const addr = await Effect.runPromise(
 *   Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * )
 * ```
 * 
 * @since 0.0.1
 */
export const fromHex = (value: string): Effect.Effect<AddressType, InvalidAddressError> =>
  Effect.try({
    try: () => Address.fromHex(value),
    catch: (e) => {
      if (e instanceof InvalidAddressError) return e
      if (e instanceof ValidationError) {
        return new InvalidAddressError(e.message, { value, expected: 'valid hex address', cause: e })
      }
      return new InvalidAddressError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid hex address', cause: e instanceof Error ? e : undefined }
      )
    }
  })
