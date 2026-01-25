/**
 * @fileoverview Effect-based address creation from secp256k1 private key.
 * @module fromPrivateKey
 * @since 0.0.1
 */

import { Address, type AddressType, InvalidAddressError } from '@tevm/voltaire/Address'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates an Address from a secp256k1 private key.
 * 
 * @param privateKey - 32-byte private key
 * @returns Effect yielding AddressType or failing with InvalidAddressError
 * 
 * @example
 * ```typescript
 * const privateKey = new Uint8Array(32) // 32-byte private key
 * const addr = await Effect.runPromise(Address.fromPrivateKey(privateKey))
 * ```
 * 
 * @since 0.0.1
 */
export const fromPrivateKey = (privateKey: Uint8Array): Effect.Effect<AddressType, InvalidAddressError> =>
  Effect.try({
    try: () => Address.fromPrivateKey(privateKey),
    catch: (e) => {
      if (e instanceof InvalidAddressError) return e
      if (e instanceof ValidationError) {
        return new InvalidAddressError(e.message, { value: privateKey, expected: 'valid private key', cause: e })
      }
      return new InvalidAddressError(
        e instanceof Error ? e.message : String(e),
        { value: privateKey, expected: 'valid private key', cause: e instanceof Error ? e : undefined }
      )
    }
  })
