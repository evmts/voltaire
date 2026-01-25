/**
 * @fileoverview X25519 public key derivation for Effect.
 * @module X25519/getPublicKey
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as X25519 from '@tevm/voltaire/X25519'
import type { InvalidSecretKeyError } from '@tevm/voltaire/X25519'

/**
 * Derives an X25519 public key from a secret key.
 *
 * @description
 * Computes the public key by performing scalar multiplication of the secret
 * key with Curve25519's base point. The secret key is clamped before use.
 *
 * @param secretKey - The 32-byte secret key
 * @returns Effect containing the 32-byte public key
 *
 * @example
 * ```typescript
 * import { getPublicKey } from 'voltaire-effect/crypto/X25519'
 * import * as Effect from 'effect/Effect'
 *
 * const publicKey = await Effect.runPromise(getPublicKey(secretKey))
 * console.log(publicKey.length) // 32
 * ```
 *
 * @throws InvalidSecretKeyError if secret key is invalid (wrong length)
 * @see {@link generateKeyPair} to generate both keys at once
 * @since 0.0.1
 */
export const getPublicKey = (
  secretKey: Uint8Array
): Effect.Effect<Uint8Array, InvalidSecretKeyError> =>
  Effect.try({
    try: () => X25519.derivePublicKey(secretKey as any),
    catch: (e) => e as InvalidSecretKeyError
  })
