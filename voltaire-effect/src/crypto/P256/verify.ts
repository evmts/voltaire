/**
 * @fileoverview P-256 signature verification function for Effect-based applications.
 * @module P256/verify
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import * as P256 from '@tevm/voltaire/P256'
import type { HashType } from '@tevm/voltaire/Hash'
import type { P256SignatureType } from '@tevm/voltaire/P256'
import type { InvalidPublicKeyError } from '@tevm/voltaire/P256'

/**
 * Verifies a P-256 signature against a message hash and public key.
 *
 * @description
 * Validates that a P-256 ECDSA signature was created by the holder of the
 * private key corresponding to the given public key. P-256 verification is
 * commonly used in:
 *
 * - WebAuthn/FIDO2 passkey authentication
 * - TLS certificate verification
 * - EIP-7212 secp256r1 precompile on Ethereum
 *
 * @param signature - The P-256 signature to verify (r, s, v components)
 * @param messageHash - The 32-byte message hash (pre-hashed with SHA-256)
 * @param publicKey - The 65-byte uncompressed or 33-byte compressed public key
 * @returns Effect containing true if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * import { verify, sign } from 'voltaire-effect/crypto/P256'
 * import * as Effect from 'effect/Effect'
 *
 * // Simple verification
 * const isValid = await Effect.runPromise(verify(signature, messageHash, publicKey))
 *
 * // Complete verification workflow
 * const verifyWebAuthn = Effect.gen(function* () {
 *   const isValid = yield* verify(signature, messageHash, publicKey)
 *
 *   if (!isValid) {
 *     console.log('WebAuthn signature verification failed')
 *     return false
 *   }
 *
 *   console.log('Passkey authentication successful')
 *   return true
 * })
 *
 * // Handle verification errors
 * const safeVerify = verify(signature, messageHash, publicKey).pipe(
 *   Effect.catchAll((error) => {
 *     console.error('Verification error:', error)
 *     return Effect.succeed(false)
 *   })
 * )
 * ```
 *
 * @throws InvalidPublicKeyError - When the public key format is invalid
 * @see {@link sign} - Create a signature to verify
 * @see {@link P256Service} - Full service interface
 * @since 0.0.1
 */
export const verify = (
  signature: P256SignatureType,
  messageHash: HashType | Uint8Array,
  publicKey: Uint8Array
): Effect.Effect<boolean, InvalidPublicKeyError> =>
  Effect.try({
    try: () => P256.verify(signature, messageHash as any, publicKey as any),
    catch: (e) => e as InvalidPublicKeyError
  })
