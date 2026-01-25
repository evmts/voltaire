/**
 * @fileoverview Verifies signature against message hash and public key.
 * @module Signature/verify
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidAlgorithmError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Verifies a signature against a message hash and public key.
 *
 * @param signature - The SignatureType to verify
 * @param messageHash - 32-byte message hash that was signed
 * @param publicKey - Public key to verify against
 * @returns Effect containing true if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const isValid = await Effect.runPromise(
 *   Signature.verify(sig, messageHash, publicKey)
 * )
 * ```
 *
 * @since 0.0.1
 */
export const verify = (
  signature: SignatureType,
  messageHash: Uint8Array,
  publicKey: Uint8Array
): Effect.Effect<boolean, InvalidAlgorithmError> =>
  Effect.try({
    try: () => Signature.verify(signature, messageHash, publicKey),
    catch: (e) => e as InvalidAlgorithmError
  })
