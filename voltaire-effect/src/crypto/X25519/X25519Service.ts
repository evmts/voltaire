import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import type { InvalidSecretKeyError, InvalidPublicKeyError, X25519Error } from '@tevm/voltaire/X25519'

/**
 * Shape interface for X25519 key exchange service operations.
 * @since 0.0.1
 */
export interface X25519ServiceShape {
  /**
   * Generates a random X25519 keypair.
   * @returns Effect containing object with secretKey and publicKey (32 bytes each)
   */
  readonly generateKeyPair: () => Effect.Effect<
    { secretKey: Uint8Array; publicKey: Uint8Array },
    never
  >

  /**
   * Derives a public key from a secret key.
   * @param secretKey - The 32-byte secret key
   * @returns Effect containing the 32-byte public key
   */
  readonly getPublicKey: (
    secretKey: Uint8Array
  ) => Effect.Effect<Uint8Array, InvalidSecretKeyError>

  /**
   * Computes shared secret from your secret key and their public key (ECDH).
   * @param secretKey - Your 32-byte secret key
   * @param publicKey - Their 32-byte public key
   * @returns Effect containing the 32-byte shared secret
   */
  readonly computeSecret: (
    secretKey: Uint8Array,
    publicKey: Uint8Array
  ) => Effect.Effect<Uint8Array, InvalidSecretKeyError | InvalidPublicKeyError | X25519Error>
}

/**
 * X25519 key exchange service for Effect-based applications.
 * Provides Curve25519 ECDH for secure shared secret generation.
 *
 * @example
 * ```typescript
 * import { X25519Service, X25519Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const x = yield* X25519Service
 *   const alice = yield* x.generateKeyPair()
 *   const bob = yield* x.generateKeyPair()
 *   const sharedAlice = yield* x.computeSecret(alice.secretKey, bob.publicKey)
 *   const sharedBob = yield* x.computeSecret(bob.secretKey, alice.publicKey)
 *   // sharedAlice === sharedBob
 * }).pipe(Effect.provide(X25519Live))
 * ```
 * @since 0.0.1
 */
export class X25519Service extends Context.Tag('X25519Service')<
  X25519Service,
  X25519ServiceShape
>() {}
