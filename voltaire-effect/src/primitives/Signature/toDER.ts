/**
 * @fileoverview Converts Signature to DER encoding with Effect error handling.
 * @module Signature/toDER
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidAlgorithmError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Converts an ECDSA Signature to DER encoding.
 *
 * @param signature - The SignatureType to convert
 * @returns Effect containing DER-encoded signature bytes
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const der = await Effect.runPromise(Signature.toDER(sig))
 * ```
 *
 * @since 0.0.1
 */
export const toDER = (
  signature: SignatureType
): Effect.Effect<Uint8Array, InvalidAlgorithmError> =>
  Effect.try({
    try: () => Signature.toDER(signature),
    catch: (e) => e as InvalidAlgorithmError
  })
