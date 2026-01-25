/**
 * @fileoverview Effect-based address creation from base64 string.
 * @module fromBase64
 * @since 0.0.1
 */

import { Address, type AddressType, InvalidAddressError } from '@tevm/voltaire/Address'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates an Address from a base64-encoded string.
 * 
 * @param value - Base64-encoded 20-byte address
 * @returns Effect yielding AddressType or failing with InvalidAddressError
 * 
 * @example
 * ```typescript
 * const addr = await Effect.runPromise(Address.fromBase64('dC01zGY0wFMpJaO4RLyeeV8lHuM='))
 * ```
 * 
 * @since 0.0.1
 */
export const fromBase64 = (value: string): Effect.Effect<AddressType, InvalidAddressError> =>
  Effect.try({
    try: () => Address.fromBase64(value),
    catch: (e) => {
      if (e instanceof InvalidAddressError) return e
      if (e instanceof ValidationError) {
        return new InvalidAddressError(e.message, { value, expected: 'valid base64 address', cause: e })
      }
      return new InvalidAddressError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid base64 address', cause: e instanceof Error ? e : undefined }
      )
    }
  })
