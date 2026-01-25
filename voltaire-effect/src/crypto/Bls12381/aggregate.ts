import * as Effect from 'effect/Effect'
import * as Bls12381 from '@tevm/voltaire/Bls12381'
import type { SignatureError } from '@tevm/voltaire/Bls12381'

/**
 * Aggregates multiple BLS12-381 signatures into a single signature.
 * Aggregated signatures can be verified against multiple public keys efficiently.
 *
 * @param signatures - Array of 96-byte BLS signatures to aggregate
 * @returns Effect containing the aggregated 96-byte signature
 * @example
 * ```typescript
 * import { aggregate } from 'voltaire-effect/crypto/Bls12381'
 * import * as Effect from 'effect/Effect'
 *
 * const aggregatedSig = await Effect.runPromise(aggregate([sig1, sig2, sig3]))
 * ```
 * @since 0.0.1
 */
export const aggregate = (
  signatures: Uint8Array[]
): Effect.Effect<Uint8Array, SignatureError> =>
  Effect.try({
    try: () => Bls12381.aggregate(signatures),
    catch: (e) => e as SignatureError
  })
