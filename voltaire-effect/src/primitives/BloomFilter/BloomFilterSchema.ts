import { BrandedBloomFilter } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type BloomFilterType = BrandedBloomFilter.BloomFilterType

const BloomFilterTypeSchema = Schema.declare<BloomFilterType>(
  (u): u is BloomFilterType => {
    if (typeof u !== 'object' || u === null) return false
    if (!(u instanceof Uint8Array)) return false
    return 'k' in u && 'm' in u
  },
  { identifier: 'BloomFilter' }
)

/**
 * Effect Schema for validating bloom filter structures.
 * Validates byte array with k and m parameters.
 * 
 * @example
 * ```typescript
 * import { BloomFilterSchema } from 'voltaire-effect/primitives/BloomFilter'
 * import * as Schema from 'effect/Schema'
 * 
 * const filter = Schema.decodeSync(BloomFilterSchema)(filterData)
 * ```
 * 
 * @since 0.0.1
 */
export const BloomFilterSchema: Schema.Schema<BloomFilterType, BloomFilterType, never> = Schema.transformOrFail(
  BloomFilterTypeSchema,
  BloomFilterTypeSchema,
  {
    strict: true,
    decode: (t, _options, _ast) => ParseResult.succeed(t),
    encode: (t) => ParseResult.succeed(t)
  }
).annotations({ identifier: 'BloomFilterSchema' })
