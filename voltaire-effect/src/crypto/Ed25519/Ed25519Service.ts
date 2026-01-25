import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import type { InvalidSecretKeyError, InvalidSignatureError, InvalidPublicKeyError, Ed25519Error } from '@tevm/voltaire/Ed25519'

/**
 * Shape interface for Ed25519 cryptographic service operations.
 * @since 0.0.1
 */
export interface Ed25519ServiceShape {
  /**
   * Signs a message using Ed25519 signature scheme.
   * @param message - The message bytes to sign
   * @param secretKey - The 32-byte secret key
   * @returns Effect containing the 64-byte signature
   */
  readonly sign: (
    message: Uint8Array,
    secretKey: Uint8Array
  ) => Effect.Effect<Uint8Array, InvalidSecretKeyError | Ed25519Error>

  /**
   * Verifies an Ed25519 signature against a message and public key.
   * @param signature - The 64-byte signature
   * @param message - The original message bytes
   * @param publicKey - The 32-byte public key
   * @returns Effect containing true if signature is valid
   */
  readonly verify: (
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array
  ) => Effect.Effect<boolean, InvalidSignatureError | InvalidPublicKeyError>

  /**
   * Derives a public key from a secret key.
   * @param secretKey - The 32-byte secret key
   * @returns Effect containing the 32-byte public key
   */
  readonly getPublicKey: (
    secretKey: Uint8Array
  ) => Effect.Effect<Uint8Array, InvalidSecretKeyError>
}

/**
 * Ed25519 cryptographic service for Effect-based applications.
 * Provides fast elliptic curve signatures used in many blockchain protocols.
 *
 * @example
 * ```typescript
 * import { Ed25519Service, Ed25519Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const ed = yield* Ed25519Service
 *   const sig = yield* ed.sign(message, secretKey)
 *   return yield* ed.verify(sig, message, publicKey)
 * }).pipe(Effect.provide(Ed25519Live))
 * ```
 * @since 0.0.1
 */
export class Ed25519Service extends Context.Tag('Ed25519Service')<
  Ed25519Service,
  Ed25519ServiceShape
>() {}
