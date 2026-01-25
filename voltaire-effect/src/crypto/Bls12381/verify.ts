/**
 * @fileoverview BLS12-381 signature verification function for Effect-based applications.
 * @module Bls12381/verify
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import * as Bls12381 from '@tevm/voltaire/Bls12381'
import type { SignatureError } from '@tevm/voltaire/Bls12381'

/**
 * Verifies a BLS12-381 signature against a message and public key.
 *
 * @description
 * Validates a BLS signature using pairing operations on the BLS12-381 curve.
 * Verification uses bilinear pairings to confirm that the signature was
 * created by the holder of the private key corresponding to the public key.
 *
 * BLS verification is more computationally expensive than Ed25519 or ECDSA
 * but enables powerful features like signature aggregation.
 *
 * @param signature - The 96-byte BLS signature to verify (G2 point)
 * @param message - The original message bytes
 * @param publicKey - The 48-byte public key (G1 point)
 * @returns Effect containing true if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * import { verify, sign } from 'voltaire-effect/crypto/Bls12381'
 * import * as Effect from 'effect/Effect'
 *
 * // Simple verification
 * const isValid = await Effect.runPromise(verify(signature, message, publicKey))
 *
 * // Complete verification workflow
 * const verifyValidator = Effect.gen(function* () {
 *   const isValid = yield* verify(signature, attestation, validatorPubkey)
 *
 *   if (!isValid) {
 *     console.log('Validator signature invalid')
 *     return false
 *   }
 *
 *   console.log('Attestation verified')
 *   return true
 * })
 *
 * // Handle verification errors
 * const safeVerify = verify(signature, message, publicKey).pipe(
 *   Effect.catchAll((error) => {
 *     console.error('BLS verification error:', error)
 *     return Effect.succeed(false)
 *   })
 * )
 * ```
 *
 * @throws SignatureError - When the signature or public key is malformed
 * @see {@link sign} - Create a signature to verify
 * @see {@link aggregate} - Aggregate multiple signatures
 * @see {@link Bls12381Service} - Full service interface
 * @since 0.0.1
 */
export const verify = (
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): Effect.Effect<boolean, SignatureError> =>
  Effect.try({
    try: () => Bls12381.verify(signature, message, publicKey),
    catch: (e) => e as SignatureError
  })
