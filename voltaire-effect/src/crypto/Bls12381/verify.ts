import * as Effect from 'effect/Effect'
import * as Bls12381 from '@tevm/voltaire/Bls12381'
import type { SignatureError } from '@tevm/voltaire/Bls12381'

/**
 * Verifies a BLS12-381 signature against a message and public key.
 *
 * @param signature - The 96-byte BLS signature to verify
 * @param message - The original message bytes
 * @param publicKey - The 48-byte public key
 * @returns Effect containing true if signature is valid, false otherwise
 * @example
 * ```typescript
 * import { verify } from 'voltaire-effect/crypto/Bls12381'
 * import * as Effect from 'effect/Effect'
 *
 * const isValid = await Effect.runPromise(verify(signature, message, publicKey))
 * ```
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
