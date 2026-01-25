/**
 * @fileoverview Gets s component from ECDSA Signature with Effect error handling.
 * @module Signature/getS
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidAlgorithmError } from '@tevm/voltaire/Signature'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Gets the s component from an ECDSA Signature.
 *
 * @param signature - The SignatureType to extract s from
 * @returns Effect containing s component (32 bytes)
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const s = await Effect.runPromise(Signature.getS(sig))
 * ```
 *
 * @since 0.0.1
 */
export const getS = (
  signature: SignatureType
): Effect.Effect<HashType, InvalidAlgorithmError> =>
  Effect.try({
    try: () => Signature.getS(signature),
    catch: (e) => e as InvalidAlgorithmError
  })
