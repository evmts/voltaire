/**
 * @fileoverview Ed25519 public key derivation function for Effect-based applications.
 * @module Ed25519/getPublicKey
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import * as Ed25519 from '@tevm/voltaire/Ed25519'
import type { InvalidSecretKeyError } from '@tevm/voltaire/Ed25519'

/**
 * Derives an Ed25519 public key from a secret key.
 *
 * @description
 * Computes the 32-byte Ed25519 public key corresponding to a given secret key.
 * The derivation is cryptographically one-way - the secret key cannot be
 * recovered from the public key.
 *
 * Ed25519 uses a twisted Edwards curve over GF(2^255-19), providing excellent
 * performance and security properties.
 *
 * @param secretKey - The 32-byte secret key (must be exactly 32 bytes)
 * @returns Effect containing the 32-byte public key
 *
 * @example
 * ```typescript
 * import { getPublicKey } from 'voltaire-effect/crypto/Ed25519'
 * import * as Effect from 'effect/Effect'
 *
 * // Generate a public key from a secret key
 * const secretKey = new Uint8Array(32) // Your 32-byte secret key
 * crypto.getRandomValues(secretKey)
 *
 * const publicKey = await Effect.runPromise(getPublicKey(secretKey))
 * console.log(publicKey.length) // 32
 *
 * // Handle potential errors
 * const result = await Effect.runPromise(
 *   getPublicKey(secretKey).pipe(
 *     Effect.catchAll((error) => {
 *       console.error('Invalid secret key:', error)
 *       return Effect.succeed(null)
 *     })
 *   )
 * )
 * ```
 *
 * @throws InvalidSecretKeyError - When the secret key is not exactly 32 bytes
 * @see {@link sign} - Sign a message with the secret key
 * @see {@link verify} - Verify a signature with the public key
 * @see {@link Ed25519Service} - Full service interface
 * @since 0.0.1
 */
export const getPublicKey = (
  secretKey: Uint8Array
): Effect.Effect<Uint8Array, InvalidSecretKeyError> =>
  Effect.try({
    try: () => Ed25519.derivePublicKey(secretKey as any),
    catch: (e) => e as InvalidSecretKeyError
  })
