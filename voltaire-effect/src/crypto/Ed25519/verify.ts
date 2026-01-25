import * as Effect from 'effect/Effect'
import * as Ed25519 from '@tevm/voltaire/Ed25519'
import type { InvalidSignatureError, InvalidPublicKeyError } from '@tevm/voltaire/Ed25519'

/**
 * Verifies an Ed25519 signature against a message and public key.
 *
 * @param signature - The 64-byte Ed25519 signature to verify
 * @param message - The original message bytes
 * @param publicKey - The 32-byte public key
 * @returns Effect containing true if signature is valid, false otherwise
 * @example
 * ```typescript
 * import { verify } from 'voltaire-effect/crypto/Ed25519'
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
): Effect.Effect<boolean, InvalidSignatureError | InvalidPublicKeyError> =>
  Effect.try({
    try: () => Ed25519.verify(signature as any, message, publicKey as any),
    catch: (e) => e as InvalidSignatureError | InvalidPublicKeyError
  })
