/**
 * @fileoverview X25519 ECDH shared secret computation for Effect.
 * @module X25519/computeSecret
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as X25519 from '@tevm/voltaire/X25519'
import type { InvalidSecretKeyError, InvalidPublicKeyError, X25519Error } from '@tevm/voltaire/X25519'

/**
 * Computes shared secret from your secret key and their public key (ECDH).
 *
 * @description
 * Performs X25519 scalar multiplication to compute a shared secret that both
 * parties can derive independently. The shared secret can be used directly
 * or passed through a KDF for deriving encryption keys.
 *
 * Security: computeSecret(alice.secretKey, bob.publicKey) === computeSecret(bob.secretKey, alice.publicKey)
 *
 * @param secretKey - Your 32-byte secret key
 * @param publicKey - Their 32-byte public key
 * @returns Effect containing the 32-byte shared secret
 *
 * @example
 * ```typescript
 * import { computeSecret, generateKeyPair } from 'voltaire-effect/crypto/X25519'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const alice = yield* generateKeyPair()
 *   const bob = yield* generateKeyPair()
 *   const sharedAlice = yield* computeSecret(alice.secretKey, bob.publicKey)
 *   const sharedBob = yield* computeSecret(bob.secretKey, alice.publicKey)
 *   // sharedAlice.equals(sharedBob) === true
 *   return sharedAlice
 * })
 * ```
 *
 * @throws InvalidSecretKeyError if secret key is invalid
 * @throws InvalidPublicKeyError if public key is invalid
 * @throws X25519Error for other cryptographic errors
 * @see {@link generateKeyPair} to generate key pairs
 * @since 0.0.1
 */
export const computeSecret = (
  secretKey: Uint8Array,
  publicKey: Uint8Array
): Effect.Effect<Uint8Array, InvalidSecretKeyError | InvalidPublicKeyError | X25519Error> =>
  Effect.try({
    try: () => X25519.scalarmult(secretKey as any, publicKey as any),
    catch: (e) => e as InvalidSecretKeyError | InvalidPublicKeyError | X25519Error
  })
