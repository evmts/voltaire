import { BrandedBlob as BlobNamespace } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BrandedBlob = BlobNamespace.BrandedBlob

/**
 * Error thrown when blob validation fails.
 * 
 * @since 0.0.1
 */
export class BlobError extends Error {
  /** Error discriminator tag for pattern matching */
  readonly _tag = 'BlobError'
  
  /**
   * Creates a new BlobError.
   * 
   * @param message - Human-readable error message
   * 
   * @since 0.0.1
   */
  constructor(message: string) {
    super(message)
    this.name = 'BlobError'
  }
}

/**
 * Creates a Blob from raw 131072-byte data.
 * Validates that input is exactly blob size (128KB).
 * Never throws - returns Effect with error in channel.
 * 
 * @param value - Exactly 131072 bytes of blob data
 * @returns Effect yielding BrandedBlob or failing with BlobError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * 
 * const blob = await Effect.runPromise(Blob.from(blobBytes))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (value: Uint8Array): Effect.Effect<BrandedBlob, BlobError> =>
  Effect.try({
    try: () => {
      if (!BlobNamespace.isValid(value)) {
        throw new BlobError(`Invalid blob size: expected 131072 bytes, got ${value.length}`)
      }
      return BlobNamespace.from(value)
    },
    catch: (e) => e instanceof BlobError ? e : new BlobError((e as Error).message)
  })
