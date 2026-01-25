/**
 * @fileoverview Effect-based address creation from secp256k1 public key.
 * @module fromPublicKey
 * @since 0.0.1
 */

import { Address, type AddressType, InvalidAddressError } from '@tevm/voltaire/Address'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates an Address from a secp256k1 public key.
 * 
 * @param publicKey - 64-byte uncompressed public key (without 0x04 prefix) or 65-byte with prefix
 * @returns Effect yielding AddressType or failing with InvalidAddressError
 * 
 * @example
 * ```typescript
 * const publicKey = new Uint8Array(64) // 64-byte public key
 * const addr = await Effect.runPromise(Address.fromPublicKey(publicKey))
 * ```
 * 
 * @since 0.0.1
 */
export const fromPublicKey = (publicKey: Uint8Array): Effect.Effect<AddressType, InvalidAddressError> =>
  Effect.try({
    try: () => Address.fromPublicKey(publicKey),
    catch: (e) => {
      if (e instanceof InvalidAddressError) return e
      if (e instanceof ValidationError) {
        return new InvalidAddressError(e.message, { value: publicKey, expected: 'valid public key', cause: e })
      }
      return new InvalidAddressError(
        e instanceof Error ? e.message : String(e),
        { value: publicKey, expected: 'valid public key', cause: e instanceof Error ? e : undefined }
      )
    }
  })
