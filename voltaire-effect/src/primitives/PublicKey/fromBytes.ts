/**
 * @fileoverview Effect-wrapped fromBytes for PublicKey.
 * @module fromBytes
 * @since 0.0.1
 */

import type { PublicKeyType } from '@tevm/voltaire/PublicKey'
import { InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a PublicKey from a 64-byte Uint8Array.
 * 
 * @param bytes - 64-byte Uint8Array (uncompressed public key)
 * @returns Effect that succeeds with PublicKeyType or fails with InvalidLengthError
 * 
 * @example
 * ```typescript
 * const pk = PublicKey.fromBytes(bytes)
 * const result = Effect.runSync(pk)
 * ```
 * 
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<PublicKeyType, InvalidLengthError> =>
  Effect.try({
    try: () => {
      if (bytes.length !== 64) {
        throw new InvalidLengthError(
          `Public key must be 64 bytes, got ${bytes.length}`,
          {
            value: bytes.length,
            expected: '64 bytes',
            code: 'PUBLIC_KEY_INVALID_LENGTH',
            docsPath: '/primitives/public-key/from-bytes#error-handling'
          }
        )
      }
      return bytes as PublicKeyType
    },
    catch: (e) => e as InvalidLengthError
  })
