import { BrandedBloomFilter } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Creates a new empty bloom filter.
 * Never throws - returns Effect with error in channel.
 * 
 * @param m - Size of filter in bits
 * @param k - Number of hash functions
 * @returns Effect yielding BloomFilterType or failing with Error
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * 
 * const filter = await Effect.runPromise(BloomFilter.create(2048, 3))
 * ```
 * 
 * @since 0.0.1
 */
export const create = (m: number, k: number): Effect.Effect<BloomFilterType, Error> =>
  Effect.try({
    try: () => BrandedBloomFilter.create(m, k),
    catch: (e) => e as Error
  })
