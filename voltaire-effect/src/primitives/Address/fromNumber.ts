/**
 * @fileoverview Effect-based address creation from number.
 * @module fromNumber
 * @since 0.0.1
 */

import { Address, type AddressType, InvalidAddressError } from '@tevm/voltaire/Address'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates an Address from a number.
 * 
 * @param value - Numeric value to convert to address
 * @returns Effect yielding AddressType or failing with InvalidAddressError
 * 
 * @example
 * ```typescript
 * const addr = await Effect.runPromise(Address.fromNumber(12345))
 * ```
 * 
 * @since 0.0.1
 */
export const fromNumber = (value: number | bigint): Effect.Effect<AddressType, InvalidAddressError> =>
  Effect.try({
    try: () => Address.fromNumber(value),
    catch: (e) => {
      if (e instanceof InvalidAddressError) return e
      if (e instanceof ValidationError) {
        return new InvalidAddressError(e.message, { value, expected: 'valid numeric address', cause: e })
      }
      return new InvalidAddressError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid numeric address', cause: e instanceof Error ? e : undefined }
      )
    }
  })
