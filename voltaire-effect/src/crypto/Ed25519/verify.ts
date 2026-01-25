/**
 * @fileoverview Ed25519 signature verification function for Effect-based applications.
 * @module Ed25519/verify
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import * as Ed25519 from '@tevm/voltaire/Ed25519'
import type { InvalidSignatureError, InvalidPublicKeyError } from '@tevm/voltaire/Ed25519'

/**
 * Verifies an Ed25519 signature against a message and public key.
 *
 * @description
 * Validates that an Ed25519 signature was created by the holder of the private
 * key corresponding to the given public key for the specified message.
 *
 * Verification is fast and constant-time to prevent timing attacks. The function
 * returns false for invalid signatures rather than throwing, but will throw for
 * malformed inputs (wrong sizes).
 *
 * @param signature - The 64-byte Ed25519 signature to verify
 * @param message - The original message bytes (any length)
 * @param publicKey - The 32-byte public key
 * @returns Effect containing true if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * import { verify, sign, getPublicKey } from 'voltaire-effect/crypto/Ed25519'
 * import * as Effect from 'effect/Effect'
 *
 * // Simple verification
 * const isValid = await Effect.runPromise(verify(signature, message, publicKey))
 *
 * // Complete verification workflow
 * const verifyMessage = Effect.gen(function* () {
 *   const isValid = yield* verify(signature, message, publicKey)
 *
 *   if (!isValid) {
 *     console.log('Signature verification failed')
 *     return false
 *   }
 *
 *   console.log('Signature is valid')
 *   return true
 * })
 *
 * // Handle verification errors
 * const safeVerify = verify(signature, message, publicKey).pipe(
 *   Effect.catchAll((error) => {
 *     console.error('Verification error:', error)
 *     return Effect.succeed(false)
 *   })
 * )
 * ```
 *
 * @throws InvalidSignatureError - When the signature is not exactly 64 bytes
 * @throws InvalidPublicKeyError - When the public key is not exactly 32 bytes
 * @see {@link sign} - Create a signature to verify
 * @see {@link getPublicKey} - Derive public key for verification
 * @see {@link Ed25519Service} - Full service interface
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
