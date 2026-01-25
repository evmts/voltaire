/**
 * @fileoverview Effect-wrapped fromHex for PublicKey.
 * @module fromHex
 * @since 0.0.1
 */

import { PublicKey, type PublicKeyType } from '@tevm/voltaire/PublicKey'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a PublicKey from a hex string.
 * 
 * @param hex - 128-character hex string (64 bytes uncompressed public key)
 * @returns Effect that succeeds with PublicKeyType or fails with validation error
 * 
 * @example
 * ```typescript
 * const pk = PublicKey.fromHex('0x04...')
 * const result = Effect.runSync(pk)
 * ```
 * 
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<PublicKeyType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => PublicKey.from(hex),
    catch: (e) => e as InvalidFormatError | InvalidLengthError
  })
