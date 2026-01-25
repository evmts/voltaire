/**
 * @fileoverview Converts Signature to tuple format with Effect error handling.
 * @module Signature/toTuple
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidAlgorithmError, InvalidSignatureFormatError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Converts a secp256k1 Signature to tuple format [yParity, r, s].
 *
 * @param signature - The SignatureType to convert
 * @returns Effect containing tuple [yParity, r, s]
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const [yParity, r, s] = await Effect.runPromise(Signature.toTuple(sig))
 * ```
 *
 * @since 0.0.1
 */
export const toTuple = (
  signature: SignatureType
): Effect.Effect<[number, Uint8Array, Uint8Array], InvalidAlgorithmError | InvalidSignatureFormatError> =>
  Effect.try({
    try: () => Signature.toTuple(signature),
    catch: (e) => e as InvalidAlgorithmError | InvalidSignatureFormatError
  })
