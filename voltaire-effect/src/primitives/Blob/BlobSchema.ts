import { BrandedBlob as BlobNamespace } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type BrandedBlob = BlobNamespace.BrandedBlob

const BlobTypeSchema = S.declare<BrandedBlob>(
  (u): u is BrandedBlob => {
    if (!(u instanceof Uint8Array)) return false
    return BlobNamespace.isValid(u)
  },
  { identifier: 'Blob' }
)

/**
 * Effect Schema for validating EIP-4844 blobs.
 * Validates that input is exactly 131072 bytes (128KB).
 * 
 * @example
 * ```typescript
 * import { BlobSchema } from 'voltaire-effect/primitives/Blob'
 * import * as Schema from 'effect/Schema'
 * 
 * const blob = Schema.decodeSync(BlobSchema)(blobBytes)
 * ```
 * 
 * @since 0.0.1
 */
export const BlobSchema: S.Schema<BrandedBlob, Uint8Array | readonly number[]> = S.transformOrFail(
  S.Union(S.Uint8ArrayFromSelf, S.Array(S.Number)),
  BlobTypeSchema,
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
        // Validate size - Blob.from() pads small data instead of throwing
        if (!BlobNamespace.isValid(arr)) {
          return ParseResult.fail(new ParseResult.Type(ast, bytes, `Invalid blob size: expected 131072 bytes, got ${arr.length}`))
        }
        return ParseResult.succeed(BlobNamespace.from(arr))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, bytes, (e as Error).message))
      }
    },
    encode: (b) => ParseResult.succeed(b as Uint8Array)
  }
).annotations({ identifier: 'BlobSchema' })
