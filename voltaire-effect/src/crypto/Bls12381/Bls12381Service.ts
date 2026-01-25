import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'
import type { InvalidScalarError, SignatureError } from '@tevm/voltaire/Bls12381'

/**
 * Shape interface for BLS12-381 cryptographic service operations.
 * @since 0.0.1
 */
export interface Bls12381ServiceShape {
  /**
   * Signs a message using BLS12-381 signature scheme.
   * @param message - The message bytes to sign
   * @param privateKey - The 32-byte private key
   * @returns Effect containing the 96-byte BLS signature
   */
  readonly sign: (
    message: Uint8Array,
    privateKey: Uint8Array
  ) => Effect.Effect<Uint8Array, InvalidScalarError | SignatureError>

  /**
   * Verifies a BLS12-381 signature against a message and public key.
   * @param signature - The 96-byte BLS signature
   * @param message - The original message bytes
   * @param publicKey - The 48-byte public key
   * @returns Effect containing true if signature is valid
   */
  readonly verify: (
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array
  ) => Effect.Effect<boolean, SignatureError>

  /**
   * Aggregates multiple BLS signatures into a single signature.
   * @param signatures - Array of BLS signatures to aggregate
   * @returns Effect containing the aggregated signature
   */
  readonly aggregate: (
    signatures: Uint8Array[]
  ) => Effect.Effect<Uint8Array, SignatureError>
}

/**
 * BLS12-381 cryptographic service for Effect-based applications.
 * Provides pairing-friendly elliptic curve operations for aggregate signatures.
 *
 * @example
 * ```typescript
 * import { Bls12381Service, Bls12381Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const bls = yield* Bls12381Service
 *   const sig = yield* bls.sign(message, privateKey)
 *   return yield* bls.verify(sig, message, publicKey)
 * }).pipe(Effect.provide(Bls12381Live))
 * ```
 * @since 0.0.1
 */
export class Bls12381Service extends Context.Tag('Bls12381Service')<
  Bls12381Service,
  Bls12381ServiceShape
>() {}
