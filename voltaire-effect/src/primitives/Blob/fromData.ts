import { BrandedBlob as BlobNamespace } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BrandedBlob = BlobNamespace.BrandedBlob

/**
 * Creates a Blob from arbitrary data, with padding.
 * Encodes data into blob format with proper field element boundaries.
 * Never throws - returns Effect with error in channel.
 * 
 * @param data - Arbitrary data to encode into blob format
 * @returns Effect yielding BrandedBlob or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * 
 * const blob = await Effect.runPromise(Blob.fromData(myData))
 * ```
 * 
 * @since 0.0.1
 */
export const fromData = (data: Uint8Array): Effect.Effect<BrandedBlob, Error> =>
  Effect.try({
    try: () => BlobNamespace.fromData(data),
    catch: (e) => e as Error
  })
