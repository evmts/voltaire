/**
 * @fileoverview Gets v (recovery ID) from secp256k1 Signature with Effect error handling.
 * @module Signature/getV
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidAlgorithmError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Gets the v (recovery ID) from a secp256k1 Signature.
 *
 * @param signature - The SignatureType to extract v from
 * @returns Effect containing v value (27 or 28) or undefined
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const v = await Effect.runPromise(Signature.getV(sig))
 * ```
 *
 * @since 0.0.1
 */
export const getV = (
  signature: SignatureType
): Effect.Effect<number | undefined, InvalidAlgorithmError> =>
  Effect.try({
    try: () => Signature.getV(signature),
    catch: (e) => e as InvalidAlgorithmError
  })
