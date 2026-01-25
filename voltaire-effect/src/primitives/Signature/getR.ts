/**
 * @fileoverview Gets r component from ECDSA Signature with Effect error handling.
 * @module Signature/getR
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidAlgorithmError } from '@tevm/voltaire/Signature'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Gets the r component from an ECDSA Signature.
 *
 * @param signature - The SignatureType to extract r from
 * @returns Effect containing r component (32 bytes)
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * const r = await Effect.runPromise(Signature.getR(sig))
 * ```
 *
 * @since 0.0.1
 */
export const getR = (
  signature: SignatureType
): Effect.Effect<HashType, InvalidAlgorithmError> =>
  Effect.try({
    try: () => Signature.getR(signature),
    catch: (e) => e as InvalidAlgorithmError
  })
