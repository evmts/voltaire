/**
 * @fileoverview Creates Signature from Ed25519 bytes with Effect error handling.
 * @module Signature/fromEd25519
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidSignatureLengthError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Creates an Ed25519 Signature from raw signature bytes.
 *
 * @param signature - The 64-byte Ed25519 signature
 * @returns Effect containing the SignatureType on success
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const sig = await Effect.runPromise(
 *   Signature.fromEd25519(signatureBytes)
 * )
 * ```
 *
 * @since 0.0.1
 */
export const fromEd25519 = (
  signature: Uint8Array
): Effect.Effect<SignatureType, InvalidSignatureLengthError> =>
  Effect.try({
    try: () => Signature.fromEd25519(signature),
    catch: (e) => e as InvalidSignatureLengthError
  })
