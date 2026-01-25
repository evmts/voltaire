/**
 * @fileoverview Effect-based private key to public key derivation.
 * @module toPublicKey
 * @since 0.0.1
 */

import { _toPublicKey, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import type { PublicKeyType } from '@tevm/voltaire/PublicKey'
import * as Effect from 'effect/Effect'

/**
 * Derives the public key from a private key.
 * 
 * @param privateKey - The private key to derive from
 * @returns Effect yielding the uncompressed public key (64 bytes)
 * 
 * @example
 * ```typescript
 * const publicKey = Effect.runSync(PrivateKey.toPublicKey(pk))
 * ```
 * 
 * @since 0.0.1
 */
export const toPublicKey = (privateKey: PrivateKeyType): Effect.Effect<PublicKeyType, Error> =>
  Effect.try({
    try: () => _toPublicKey.call(privateKey),
    catch: (e) => e as Error
  })
