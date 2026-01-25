/**
 * @fileoverview Effect-based address creation from ABI-encoded bytes.
 * @module fromAbiEncoded
 * @since 0.0.1
 */

import { Address, type AddressType, InvalidAddressError } from '@tevm/voltaire/Address'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates an Address from ABI-encoded bytes (32-byte left-padded).
 * 
 * @param value - 32-byte ABI-encoded address
 * @returns Effect yielding AddressType or failing with InvalidAddressError
 * 
 * @example
 * ```typescript
 * const abiEncoded = new Uint8Array(32) // 32-byte ABI-encoded address
 * const addr = await Effect.runPromise(Address.fromAbiEncoded(abiEncoded))
 * ```
 * 
 * @since 0.0.1
 */
export const fromAbiEncoded = (value: Uint8Array): Effect.Effect<AddressType, InvalidAddressError> =>
  Effect.try({
    try: () => Address.fromAbiEncoded(value),
    catch: (e) => {
      if (e instanceof InvalidAddressError) return e
      if (e instanceof ValidationError) {
        return new InvalidAddressError(e.message, { value, expected: 'valid ABI-encoded address', cause: e })
      }
      return new InvalidAddressError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid ABI-encoded address', cause: e instanceof Error ? e : undefined }
      )
    }
  })
